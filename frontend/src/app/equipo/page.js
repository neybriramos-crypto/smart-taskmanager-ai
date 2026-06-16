'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/sidebar';
import ChatFlotante from '../../components/chatFlotante';
import ModalConfirmacion from '../../components/ModalConfirmacion';
import { api } from '../../hooks/useApi';
import { useSocket, unirseEquipo } from '../../hooks/useSocket';

const ROL_C = {
    admin:  { bg:'#6366F118', text:'#A5B4FC', label:'Admin'  },
    editor: { bg:'#10B98118', text:'#6EE7B7', label:'Editor' },
    lector: { bg:'#1E243380', text:'#8B92A5', label:'Lector' },
};

function Modal({ titulo, onClose, children }) {
    return (
        <div style={mo.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={mo.box}>
                <div style={mo.hdr}>
                    <h2 style={mo.titulo}>{titulo}</h2>
                    <button onClick={onClose} style={mo.close}>✕</button>
                </div>
                {children}
            </div>
        </div>
    );
}

export default function Equipo() {
    const router = useRouter();
    const [usuario,    setUsuario]    = useState(null);
    const [equipos,    setEquipos]    = useState([]);
    const [equipoSel,  setEquipoSel]  = useState(null);
    const [vista,      setVista]      = useState('lista');
    const [cargando,   setCargando]   = useState(false);
    const [guardando,  setGuardando]  = useState(false);

    // Estado para notificaciones personalizadas (Reemplazo de alert)
    const [notificacion, setNotificacion] = useState({ msg: '', tipo: 'success' });

    // Modales
    const [modalEquipo,  setModalEquipo]  = useState(false);
    const [modalInvitar, setModalInvitar] = useState(false);
    const [modalTarea,   setModalTarea]   = useState(false);
    const [modalRol,     setModalRol]     = useState(null);
    const [linkInvitacion, setLinkInvitacion] = useState('');

    // Modal confirmación expulsión
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [miembroAExpulsar, setMiembroAExpulsar] = useState(null);

    const [formEquipo,  setFormEquipo]  = useState({ nombre:'', descripcion:'' });
    const [formInvitar, setFormInvitar] = useState({ email:'', rol:'editor' });
    const [formTarea,   setFormTarea]   = useState({ titulo:'', descripcion:'', prioridad:'media', fecha_limite:'', asignado_a:'' });
    const [msgInvitar,  setMsgInvitar]  = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const u     = localStorage.getItem('usuario');
        if (!token || !u) { router.push('/login'); return; }
        setUsuario(JSON.parse(u));
        cargarEquipos();
    }, []);

    useSocket(usuario?.id, {
        onEquipoCreado:      () => cargarEquipos(),
        onRolCambiado:       ({ miembro_id, rol }) =>
            setEquipoSel(e => e ? ({ ...e, miembros: e.miembros.map(m => m.id === miembro_id ? { ...m, rol } : m) }) : e),
        onMiembroEliminado:  ({ miembro_id }) =>
            setEquipoSel(e => e ? ({ ...e, miembros: e.miembros.filter(m => m.id !== miembro_id) }) : e),
    });

    // Función auxiliar para lanzar notificaciones en pantalla
    const mostrarMsg = (msg, tipo = 'success') => {
        setNotificacion({ msg, tipo });
        setTimeout(() => setNotificacion({ msg: '', tipo: 'success' }), 3000);
    };

    const cargarEquipos = async () => {
        try { const { data } = await api.misEquipos(); setEquipos(data); } catch {}
    };

    const verDetalle = async (id) => {
        setCargando(true);
        try {
            const { data } = await api.detalleEquipo(id);
            setEquipoSel(data);
            setVista('detalle');
            unirseEquipo(id);
        } catch { 
            mostrarMsg('Error al cargar el equipo', 'error'); 
        } finally { 
            setCargando(false); 
        }
    };

    const crearEquipo = async () => {
        if (!formEquipo.nombre.trim()) return;
        setGuardando(true);
        try {
            const { data } = await api.crearEquipo(formEquipo);
            setModalEquipo(false);
            setFormEquipo({ nombre:'', descripcion:'' });
            await cargarEquipos();
            verDetalle(data.equipo.id);
            mostrarMsg('¡Equipo creado con éxito!');
        } catch (e) { 
            mostrarMsg(e.response?.data?.error || 'Error al crear equipo', 'error'); 
        } finally { 
            setGuardando(false); 
        }
    };

    const invitarMiembro = async () => {
        if (!formInvitar.email.trim()) return;
        setGuardando(true);
        setMsgInvitar('');
        try {
            const { data } = await api.invitarMiembro(equipoSel.id, formInvitar);
            if (data.token) {
                const link = `${window.location.origin}/invitacion/${data.token}`;
                setLinkInvitacion(link);
            }
            setMsgInvitar(data.mensaje);
            setFormInvitar({ email:'', rol:'editor' });
            verDetalle(equipoSel.id);
        } catch (e) { 
            setMsgInvitar(e.response?.data?.error || 'Error'); 
        } finally { 
            setGuardando(false); 
        }
    };

    const copiarLink = () => {
        navigator.clipboard.writeText(linkInvitacion);
        mostrarMsg('¡Link copiado al portapapeles!');
    };

    const cambiarRol = async (miembro_id, rol) => {
        try {
            await api.cambiarRol(equipoSel.id, miembro_id, rol);
            setEquipoSel(e => ({ ...e, miembros: e.miembros.map(m => m.id === miembro_id ? { ...m, rol } : m) }));
            setModalRol(null);
            mostrarMsg('Rol actualizado correctamente');
        } catch (e) { 
            mostrarMsg(e.response?.data?.error || 'Error al cambiar rol', 'error'); 
        }
    };

    // Acción original (ya no usada directamente desde el botón)
    const expulsarMiembro = async (miembro_id) => {
        try {
            await api.eliminarMiembro(equipoSel.id, miembro_id);
            setEquipoSel(e => ({ ...e, miembros: e.miembros.filter(m => m.id !== miembro_id) }));
            mostrarMsg('Miembro expulsado del equipo', 'error');
        } catch (e) { 
            mostrarMsg(e.response?.data?.error || 'Error al expulsar miembro', 'error'); 
        }
    };

    // Abrir modal de confirmación
    const manejarClickExpulsar = (miembro) => {
        setMiembroAExpulsar(miembro);
        setIsModalOpen(true);
    };

    // Confirmar expulsión desde modal
    const confirmarExpulsion = async () => {
        if (!miembroAExpulsar) return;
        try {
            await api.eliminarMiembro(equipoSel.id, miembroAExpulsar.id);
            setEquipoSel(e => ({ ...e, miembros: e.miembros.filter(m => m.id !== miembroAExpulsar.id) }));
            mostrarMsg('Miembro expulsado del equipo', 'error');
        } catch (e) {
            mostrarMsg(e.response?.data?.error || 'Error al expulsar miembro', 'error');
        } finally {
            setIsModalOpen(false);
            setMiembroAExpulsar(null);
        }
    };

    const crearTareaEquipo = async () => {
        if (!formTarea.titulo.trim()) return;
        setGuardando(true);
        try {
            await api.crearTarea({ ...formTarea, equipo_id: equipoSel.id });
            setModalTarea(false);
            setFormTarea({ titulo:'', descripcion:'', prioridad:'media', fecha_limite:'', asignado_a:'' });
            verDetalle(equipoSel.id);
            mostrarMsg('Tarea creada correctamente');
        } catch (e) { 
            mostrarMsg(e.response?.data?.error || 'Error al crear la tarea', 'error'); 
        } finally { 
            setGuardando(false); 
        }
    };

    const esAdmin  = equipoSel?.mi_rol === 'admin';
    const esEditor = esAdmin || equipoSel?.mi_rol === 'editor';

    const PRIORIDAD_C = {
        alta: { dot:'#F43F5E' }, media: { dot:'#F59E0B' }, baja: { dot:'#6366F1' },
    };

    return (
        <div style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--text)' }}>
            <Sidebar usuario={usuario}/>
            <main style={{ marginLeft:220, padding:'28px 32px' }}>

                {/* ── Lista de equipos ── */}
                {vista === 'lista' && (
                    <>
                        <div style={hdr.row}>
                            <div>
                                <h1 style={hdr.h1}>Equipos</h1>
                                <p style={hdr.sub}>Colabora en tiempo real con tu equipo</p>
                            </div>
                            <button onClick={() => setModalEquipo(true)} style={b.pri}>+ Crear equipo</button>
                        </div>

                        {equipos.length === 0 ? (
                            <div style={empty}>
                                <div style={{ fontSize:40, marginBottom:12 }}>◈</div>
                                <p style={{ color:'var(--muted)', marginBottom:16 }}>No perteneces a ningún equipo todavía.</p>
                                <button onClick={() => setModalEquipo(true)} style={b.pri}>Crear mi primer equipo</button>
                            </div>
                        ) : (
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16, marginTop:24 }}>
                                {equipos.map(eq => (
                                    <div key={eq.id} onClick={() => verDetalle(eq.id)} style={card.equipo}>
                                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                                            <div style={{ width:38, height:38, borderRadius:10, background:'var(--accent-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>◈</div>
                                            <span style={rolBadge(ROL_C[eq.mi_rol])}>{ROL_C[eq.mi_rol]?.label}</span>
                                        </div>
                                        <h3 style={{ fontSize:15, fontWeight:700, margin:'0 0 5px' }}>{eq.nombre}</h3>
                                        <p style={{ fontSize:12, color:'var(--muted)', marginBottom:14, lineHeight:1.5 }}>{eq.descripcion || 'Sin descripción'}</p>
                                        <div style={{ fontSize:11, color:'var(--muted)', display:'flex', gap:14 }}>
                                            <span>{eq.miembros?.length || 0} miembros</span>
                                            <span>{eq.tareas_count || 0} tareas</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ── Detalle del equipo ── */}
                {vista === 'detalle' && equipoSel && (
                    <>
                        <div style={hdr.row}>
                            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                                <button onClick={() => setVista('lista')} style={b.ghost}>← Volver</button>
                                <div>
                                    <h1 style={hdr.h1}>{equipoSel.nombre}</h1>
                                    <p style={hdr.sub}>
                                        {equipoSel.descripcion || 'Sin descripción'} · Tu rol:{' '}
                                        <strong style={{ color:'var(--accent)' }}>{ROL_C[equipoSel.mi_rol]?.label}</strong>
                                    </p>
                                </div>
                            </div>
                            <div style={{ display:'flex', gap:8 }}>
                                {esAdmin  && <button onClick={() => { setModalInvitar(true); setLinkInvitacion(''); setMsgInvitar(''); }} style={b.sec}>+ Invitar</button>}
                                {esEditor && <button onClick={() => setModalTarea(true)} style={b.pri}>+ Tarea</button>}
                            </div>
                        </div>

                        {/* Link de invitación activo */}
                        {linkInvitacion && (
                            <div style={{ background:'#10B98115', border:'1px solid #10B98140', borderRadius:10, padding:'14px 18px', marginTop:16, display:'flex', alignItems:'center', gap:12 }}>
                                <div style={{ flex:1 }}>
                                    <div style={{ fontSize:12, fontWeight:600, color:'var(--success)', marginBottom:4 }}>Link de invitación generado</div>
                                    <div style={{ fontSize:11, color:'var(--muted)', wordBreak:'break-all' }}>{linkInvitacion}</div>
                                </div>
                                <button onClick={copiarLink} style={{ ...b.sec, whiteSpace:'nowrap', fontSize:12 }}>Copiar link</button>
                            </div>
                        )}

                        <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:20, marginTop:24 }}>
                            {/* Tareas */}
                            <div>
                                <p style={sec.titulo}>Tareas del equipo</p>
                                {(!equipoSel.tareas || equipoSel.tareas.length === 0) ? (
                                    <div style={{ textAlign:'center', padding:'40px 0', color:'var(--muted)' }}>
                                        <p style={{ fontSize:13 }}>No hay tareas en este equipo.</p>
                                        {esEditor && <button onClick={() => setModalTarea(true)} style={{ ...b.pri, marginTop:12, fontSize:12 }}>+ Crear primera tarea</button>}
                                    </div>
                                ) : (
                                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                                        {equipoSel.tareas.map(t => {
                                            const pc = PRIORIDAD_C[t.prioridad] || PRIORIDAD_C.baja;
                                            return (
                                                <div key={t.id} style={card.tareaEq}>
                                                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                                                        <div style={{ flex:1 }}>
                                                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                                                                <span style={{ width:6, height:6, borderRadius:'50%', background:pc.dot, flexShrink:0 }}/>
                                                                <h4 style={{ margin:0, fontSize:13, fontWeight:600 }}>{t.titulo}</h4>
                                                            </div>
                                                            <p style={{ margin:'0 0 6px', fontSize:12, color:'var(--muted)' }}>{t.descripcion || 'Sin descripción'}</p>
                                                            <div style={{ display:'flex', gap:10, fontSize:11, color:'var(--muted)' }}>
                                                                <span>Por: {t.creador_nombre}</span>
                                                                {t.asignado_nombre && <span>→ {t.asignado_nombre}</span>}
                                                                {t.fecha_limite && <span>{new Date(t.fecha_limite).toLocaleDateString('es-MX')}</span>}
                                                            </div>
                                                        </div>
                                                        <span style={{ fontSize:10, padding:'3px 8px', borderRadius:20, background:'var(--bg)', border:'1px solid var(--border)', color:'var(--muted)', flexShrink:0, marginLeft:10 }}>
                                                            {t.estado?.replace('_',' ')}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Miembros */}
                            <div>
                                <p style={sec.titulo}>Miembros ({equipoSel.miembros?.length || 0})</p>
                                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                                    {(equipoSel.miembros || []).map(mb => (
                                        <div key={mb.id} style={card.miembro}>
                                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                                <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0 }}>
                                                    {mb.nombre[0].toUpperCase()}
                                                </div>
                                                <div style={{ flex:1, minWidth:0 }}>
                                                    <div style={{ fontSize:13, fontWeight:600 }}>{mb.nombre}</div>
                                                    <div style={{ fontSize:11, color:'var(--muted)' }}>{mb.email}</div>
                                                </div>
                                                <span style={rolBadge(ROL_C[mb.rol])}>{ROL_C[mb.rol]?.label}</span>
                                            </div>
                                            {esAdmin && mb.id !== usuario?.id && (
                                                <div style={{ display:'flex', gap:6, marginTop:8, paddingTop:8, borderTop:'1px solid var(--border)' }}>
                                                    <button onClick={() => setModalRol(mb)} style={{ ...b.mini, flex:1 }}>Cambiar rol</button>
                                                    <button onClick={() => manejarClickExpulsar(mb)} style={{ ...b.mini, flex:1, color:'var(--danger)' }}>Expulsar</button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Invitaciones pendientes */}
                                {esAdmin && equipoSel.invitaciones?.length > 0 && (
                                    <div style={{ marginTop:16 }}>
                                        <p style={{ ...sec.titulo, color:'var(--warning)' }}>Invitaciones pendientes</p>
                                        {equipoSel.invitaciones.map(inv => (
                                            <div key={inv.id} style={{ fontSize:12, color:'var(--muted)', padding:'8px 10px', background:'var(--bg)', borderRadius:8, border:'1px solid var(--border)', marginBottom:6 }}>
                                                📧 {inv.email} · <span style={{ color:'var(--warning)' }}>{inv.rol}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </main>

            <ChatFlotante/>

            {/* Notification Toast Component */}
            {notificacion.msg && (
                <div style={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    background: notificacion.tipo === 'error' ? '#F43F5E' : '#10B981',
                    color: '#fff',
                    padding: '12px 20px',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.3s ease'
                }}>
                    <span>{notificacion.tipo === 'error' ? '✕' : '✓'}</span>
                    {notificacion.msg}
                </div>
            )}

            {/* Modal crear equipo */}
            {modalEquipo && (
                <Modal titulo="Crear equipo" onClose={() => setModalEquipo(false)}>
                    <div style={campo}>
                        <label style={lbl}>Nombre del equipo *</label>
                        <input value={formEquipo.nombre} onChange={e => setFormEquipo(p => ({ ...p, nombre:e.target.value }))}
                            placeholder="Ej: Frontend Team" style={inp} autoFocus/>
                    </div>
                    <div style={campo}>
                        <label style={lbl}>Descripción</label>
                        <textarea rows={2} value={formEquipo.descripcion} onChange={e => setFormEquipo(p => ({ ...p, descripcion:e.target.value }))}
                            placeholder="¿En qué trabaja este equipo?" style={{ ...inp, resize:'vertical' }}/>
                    </div>
                    <div style={{ display:'flex', gap:10 }}>
                        <button onClick={() => setModalEquipo(false)} style={{ ...b.sec, flex:1 }}>Cancelar</button>
                        <button onClick={crearEquipo} disabled={guardando} style={{ ...b.pri, flex:1 }}>
                            {guardando ? 'Creando...' : 'Crear equipo'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Modal invitar miembro */}
            {modalInvitar && (
                <Modal titulo="Invitar al equipo" onClose={() => { setModalInvitar(false); setMsgInvitar(''); }}>
                    {msgInvitar && (
                        <div style={{ padding:'10px 14px', borderRadius:8, fontSize:12, lineHeight:1.5, wordBreak:'break-all',
                            background: msgInvitar.toLowerCase().includes('error') ? '#F43F5E15' : '#10B98115',
                            border: `1px solid ${msgInvitar.toLowerCase().includes('error') ? '#F43F5E40' : '#10B98140'}`,
                            color: msgInvitar.toLowerCase().includes('error') ? 'var(--danger)' : 'var(--success)' }}>
                            {msgInvitar}
                        </div>
                    )}
                    {linkInvitacion && (
                        <div style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:8, padding:'12px 14px' }}>
                            <div style={{ fontSize:11, color:'var(--muted)', marginBottom:6 }}>Comparte este link con el invitado:</div>
                            <div style={{ fontSize:11, color:'var(--accent)', wordBreak:'break-all', marginBottom:8 }}>{linkInvitacion}</div>
                            <button onClick={copiarLink} style={{ ...b.pri, fontSize:11, padding:'6px 14px' }}>📋 Copiar link</button>
                        </div>
                    )}
                    <div style={campo}>
                        <label style={lbl}>Email del usuario</label>
                        <input type="email" value={formInvitar.email} onChange={e => setFormInvitar(p => ({ ...p, email:e.target.value }))}
                            placeholder="usuario@email.com" style={inp} autoFocus/>
                    </div>
                    <div style={campo}>
                        <label style={lbl}>Rol</label>
                        <div style={{ display:'flex', gap:8 }}>
                            {[{v:'editor',titulo:'Editor',desc:'Puede crear y editar tareas'},{v:'lector',titulo:'Lector',desc:'Solo puede visualizar'}].map(({ v, titulo, desc }) => (
                                <button key={v} onClick={() => setFormInvitar(p => ({ ...p, rol:v }))}
                                    style={{ flex:1, padding:'10px 8px', borderRadius:8, fontSize:11, cursor:'pointer', textAlign:'left',
                                        border:`1px solid ${formInvitar.rol===v ? 'var(--accent)':'var(--border)'}`,
                                        background: formInvitar.rol===v ? 'var(--accent-dim)':'transparent',
                                        color: formInvitar.rol===v ? 'var(--accent)':'var(--muted)' }}>
                                    <div style={{ fontWeight:600, marginBottom:2 }}>{titulo}</div>
                                    <div style={{ fontSize:10 }}>{desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ display:'flex', gap:10 }}>
                        <button onClick={() => { setModalInvitar(false); setMsgInvitar(''); }} style={{ ...b.sec, flex:1 }}>Cerrar</button>
                        <button onClick={invitarMiembro} disabled={guardando} style={{ ...b.pri, flex:1 }}>
                            {guardando ? 'Invitando...' : 'Enviar invitación'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Modal crear tarea */}
            {modalTarea && (
                <Modal titulo="Nueva tarea de equipo" onClose={() => setModalTarea(false)}>
                    <div style={campo}>
                        <label style={lbl}>Título *</label>
                        <input value={formTarea.titulo} onChange={e => setFormTarea(p => ({ ...p, titulo:e.target.value }))}
                            placeholder="Ej: Revisar PR de autenticación" style={inp} autoFocus/>
                    </div>
                    <div style={campo}>
                        <label style={lbl}>Descripción</label>
                        <textarea rows={2} value={formTarea.descripcion} onChange={e => setFormTarea(p => ({ ...p, descripcion:e.target.value }))}
                            style={{ ...inp, resize:'vertical' }}/>
                    </div>
                    <div style={campo}>
                        <label style={lbl}>Asignar a</label>
                        <select value={formTarea.asignado_a} onChange={e => setFormTarea(p => ({ ...p, asignado_a:e.target.value }))} style={inp}>
                            <option value="">Sin asignar</option>
                            {(equipoSel?.miembros||[]).map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                        </select>
                    </div>
                    <div style={campo}>
                        <label style={lbl}>Prioridad</label>
                        <div style={{ display:'flex', gap:8 }}>
                            {['baja','media','alta'].map(p => (
                                <button key={p} onClick={() => setFormTarea(prev => ({ ...prev, prioridad:p }))}
                                    style={{ flex:1, padding:'8px 0', borderRadius:8, fontSize:12, fontWeight:600,
                                        cursor:'pointer', textTransform:'capitalize',
                                        border:`1px solid ${formTarea.prioridad===p ? 'var(--accent)':'var(--border)'}`,
                                        background: formTarea.prioridad===p ? 'var(--accent-dim)':'transparent',
                                        color: formTarea.prioridad===p ? 'var(--accent)':'var(--muted)' }}>{p}</button>
                            ))}
                        </div>
                    </div>
                    <div style={campo}>
                        <label style={lbl}>Fecha límite</label>
                        <input type="date" value={formTarea.fecha_limite} onChange={e => setFormTarea(p => ({ ...p, fecha_limite:e.target.value }))} style={inp}/>
                    </div>
                    <div style={{ display:'flex', gap:10 }}>
                        <button onClick={() => setModalTarea(false)} style={{ ...b.sec, flex:1 }}>Cancelar</button>
                        <button onClick={crearTareaEquipo} disabled={guardando} style={{ ...b.pri, flex:1 }}>
                            {guardando ? 'Creando...' : 'Crear tarea'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Modal cambiar rol */}
            {modalRol && (
                <Modal titulo={`Rol de ${modalRol.nombre}`} onClose={() => setModalRol(null)}>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {[{v:'admin',l:'Admin',d:'Control total'},{v:'editor',l:'Editor',d:'Crear y editar tareas'},{v:'lector',l:'Lector',d:'Solo visualización'}].map(({ v, l, d }) => (
                            <button key={v} onClick={() => cambiarRol(modalRol.id, v)}
                                style={{ padding:'12px 14px', borderRadius:8, cursor:'pointer', textAlign:'left',
                                    display:'flex', justifyContent:'space-between', alignItems:'center',
                                    border:`1px solid ${modalRol.rol===v ? 'var(--accent)':'var(--border)'}`,
                                    background: modalRol.rol===v ? 'var(--accent-dim)':'transparent' }}>
                                <div>
                                    <div style={{ fontSize:13, fontWeight:600, color: modalRol.rol===v ? 'var(--accent)':'var(--text)' }}>{l}</div>
                                    <div style={{ fontSize:11, color:'var(--muted)' }}>{d}</div>
                                </div>
                                {modalRol.rol === v && <span style={{ color:'var(--accent)' }}>✓</span>}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setModalRol(null)} style={{ ...b.sec, width:'100%', marginTop:4 }}>Cancelar</button>
                </Modal>
            )}

            {/* Modal confirmación expulsión */}
            {isModalOpen && (
                <ModalConfirmacion
                    isOpen={isModalOpen}
                    mensaje={`¿Expulsar a ${miembroAExpulsar?.nombre}?`}
                    onConfirmar={confirmarExpulsion}
                    onCancelar={() => { setIsModalOpen(false); setMiembroAExpulsar(null); }}
                />
            )}
        </div>
    );
}

const hdr  = { row:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }, h1:{ margin:0, fontSize:22, fontWeight:700 }, sub:{ margin:'4px 0 0', fontSize:13, color:'var(--muted)' } };
const sec  = { titulo:{ fontSize:11, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:12 } };
const b    = { pri:{ background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, padding:'9px 16px', fontSize:13, fontWeight:600, cursor:'pointer' }, sec:{ background:'transparent', color:'var(--muted)', border:'1px solid var(--border)', borderRadius:8, padding:'9px 16px', fontSize:13, cursor:'pointer' }, ghost:{ background:'transparent', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:13 }, mini:{ background:'transparent', border:'1px solid var(--border)', borderRadius:6, padding:'5px 10px', fontSize:11, cursor:'pointer', color:'var(--muted)' } };
const card = { equipo:{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'18px 20px', cursor:'pointer' }, tareaEq:{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px' }, miembro:{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px' } };
const empty    = { textAlign:'center', padding:'60px 0' };
const rolBadge = c => ({ fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:20, background:c?.bg, color:c?.text });
const campo    = { display:'flex', flexDirection:'column', gap:6 };
const lbl      = { fontSize:12, color:'var(--muted)', fontWeight:500 };
const inp      = { padding:'10px 14px', fontSize:13, borderRadius:8, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text)', width:'100%' };
const mo       = { overlay:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300 }, box:{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:28, width:'100%', maxWidth:460, display:'flex', flexDirection:'column', gap:14, maxHeight:'90vh', overflowY:'auto' }, hdr:{ display:'flex', justifyContent:'space-between', alignItems:'center' }, titulo:{ margin:0, fontSize:17, fontWeight:700 }, close:{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:18 } };