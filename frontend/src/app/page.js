'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/sidebar';
import ChatFlotante from '../components/chatFlotante';
import { api } from '../hooks/useApi';
import { useSocket } from '../hooks/useSocket';

const PRIORIDAD_C = {
    alta:  { bg:'#F43F5E18', text:'#F43F5E', dot:'#F43F5E' },
    media: { bg:'#F59E0B18', text:'#F59E0B', dot:'#F59E0B' },
    baja:  { bg:'#6366F118', text:'#A5B4FC', dot:'#6366F1' },
};
const ESTADOS = { pendiente:'Pendiente', en_progreso:'En progreso', completada:'Completada' };
const TAREA_VACIA = { titulo:'', descripcion:'', prioridad:'media', estado:'pendiente', fecha_limite:'' };

// ── Modal de Notificación con Temporizador — FUERA del componente principal ──
function NotificationModal({ isOpen, mensaje, tipo = 'success', duracion = 3500, onClose }) {
    const [progreso, setProgreso] = useState(100);

    useEffect(() => {
        if (!isOpen) return;
        setProgreso(100);

        const intervaloTiempo = 10;
        const decremento = (intervaloTiempo / duracion) * 100;

        const timerProgreso = setInterval(() => {
            setProgreso((prev) => {
                if (prev <= 0) {
                    clearInterval(timerProgreso);
                    return 0;
                }
                return prev - decremento;
            });
        }, intervaloTiempo);

        const temporizadorCierre = setTimeout(() => {
            onClose();
        }, duracion);

        return () => {
            clearTimeout(temporizadorCierre);
            clearInterval(timerProgreso);
        };
    }, [isOpen, duracion, onClose]);

    if (!isOpen) return null;

    const estilosTipo = {
        success: { border: '#10B98130', text: '#10B981', bg: '#10B98115', icono: '✓' },
        error: { border: '#F43F5E30', text: '#F43F5E', bg: '#F43F5E15', icono: '✕' },
        info: { border: '#6366F130', text: '#A5B4FC', bg: '#6366F118', icono: '✦' }
    };

    const c = estilosTipo[tipo] || estilosTipo.info;

    return (
        <div style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 400,
            background: 'var(--surface)',
            border: `1px solid ${c.border}`,
            padding: '14px 18px',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            minWidth: 300,
            maxWidth: 420,
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
            overflow: 'hidden'
        }}>
            <div style={{
                background: c.bg,
                color: c.text,
                width: 26,
                height: 26,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: 13
            }}>
                {c.icono}
            </div>
            
            <div style={{ flex: 1, fontSize: 13, color: 'var(--text)', fontWeight: 500, paddingRight: 8 }}>
                {mensaje}
            </div>

            <button onClick={onClose} style={{
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                fontSize: 14,
                padding: 2
            }}>✕</button>
            
            {/* Barra de progreso inferior */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: 3,
                width: '100%',
                background: 'rgba(255,255,255,0.03)'
            }}>
                <div style={{
                    height: '100%',
                    width: `${progreso}%`,
                    background: c.text,
                    transition: 'width 10ms linear'
                }} />
            </div>
        </div>
    );
}

//Modal de formulario
function FormModal({ modo, formTarea, setFormTarea, onConfirm, onCancel, guardando }) {
    const esEditar = modo === 'editar';
    return (
        <div style={mo.overlay} onClick={e => e.target === e.currentTarget && onCancel()}>
            <div style={mo.box}>
                <div style={mo.hdr}>
                    <h2 style={mo.titulo}>{esEditar ? 'Editar tarea' : 'Nueva tarea'}</h2>
                    <button onClick={onCancel} style={mo.close}>✕</button>
                </div>

                <div style={mo.campo}>
                    <label style={mo.label}>Título *</label>
                    <input
                        autoFocus
                        value={formTarea.titulo}
                        onChange={e => setFormTarea(p => ({ ...p, titulo: e.target.value }))}
                        placeholder="Ej: Implementar OAuth"
                        style={mo.input}
                    />
                </div>

                <div style={mo.campo}>
                    <label style={mo.label}>Descripción</label>
                    <textarea
                        rows={3}
                        value={formTarea.descripcion}
                        onChange={e => setFormTarea(p => ({ ...p, descripcion: e.target.value }))}
                        placeholder="Contexto adicional..."
                        style={{ ...mo.input, resize:'vertical' }}
                    />
                </div>

                {esEditar && (
                    <div style={mo.campo}>
                        <label style={mo.label}>Estado</label>
                        <select
                            value={formTarea.estado}
                            onChange={e => setFormTarea(p => ({ ...p, estado: e.target.value }))}
                            style={mo.input}
                        >
                            <option value="pendiente">Pendiente</option>
                            <option value="en_progreso">En progreso</option>
                            <option value="completada">Completada</option>
                        </select>
                    </div>
                )}

                <div style={mo.campo}>
                    <label style={mo.label}>Prioridad</label>
                    <div style={{ display:'flex', gap:8 }}>
                        {['baja','media','alta'].map(p => {
                            const c   = PRIORIDAD_C[p];
                            const sel = formTarea.prioridad === p;
                            return (
                                <button key={p}
                                    onClick={() => setFormTarea(prev => ({ ...prev, prioridad: p }))}
                                    style={{ flex:1, padding:'8px 0', borderRadius:8, fontSize:12,
                                        fontWeight:600, cursor:'pointer', textTransform:'capitalize',
                                        border:`1px solid ${sel ? c.dot : 'var(--border)'}`,
                                        background: sel ? c.bg : 'transparent',
                                        color: sel ? c.text : 'var(--muted)' }}>
                                    {p}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div style={mo.campo}>
                    <label style={mo.label}>Fecha límite</label>
                    <input
                        type="date"
                        value={formTarea.fecha_limite}
                        onChange={e => setFormTarea(p => ({ ...p, fecha_limite: e.target.value }))}
                        style={mo.input}
                    />
                </div>

                <div style={{ display:'flex', gap:10 }}>
                    <button onClick={onCancel} style={mo.btnSec}>Cancelar</button>
                    <button onClick={onConfirm} disabled={guardando} style={mo.btnPri}>
                        {guardando ? 'Guardando...' : esEditar ? 'Guardar cambios' : 'Crear tarea'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Modal confirmar eliminar — FUERA del componente principal ─────────────────
function ModalEliminar({ tarea, onConfirm, onCancel, guardando }) {
    return (
        <div style={mo.overlay} onClick={e => e.target === e.currentTarget && onCancel()}>
            <div style={{ ...mo.box, maxWidth:400 }}>
                <div style={{ textAlign:'center', padding:'8px 0 16px' }}>
                    <div style={{ fontSize:36, marginBottom:12 }}></div>
                    <h2 style={{ fontSize:17, fontWeight:700, marginBottom:8 }}>¿Eliminar tarea?</h2>
                    <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.6 }}>
                        Se eliminará <strong style={{ color:'var(--text)' }}>"{tarea.titulo}"</strong> y todas sus subtareas. Esta acción no se puede deshacer.
                    </p>
                </div>
                <div style={{ display:'flex', gap:10 }}>
                    <button onClick={onCancel} style={mo.btnSec}>Cancelar</button>
                    <button onClick={onConfirm} disabled={guardando}
                        style={{ ...mo.btnPri, background:'var(--danger)' }}>
                        {guardando ? 'Eliminando...' : 'Sí, eliminar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

//Componente principal
export default function Dashboard() {
    const router = useRouter();
    const [usuario,    setUsuario]    = useState(null);
    const [tareas,     setTareas]     = useState([]);
    const [filtro,     setFiltro]     = useState('todas');
    const [cargandoIA, setCIA]        = useState({});
    const [modalNueva,  setModalNueva]  = useState(false);
    const [modalEditar, setModalEditar] = useState(null);
    const [modalElim,   setModalElim]   = useState(null);
    const [formTarea,   setFormTarea]   = useState(TAREA_VACIA);
    const [guardando,   setGuardando]   = useState(false);
    
    // Estado unificado para el Modal de Notificación
    const [alerta, setAlerta] = useState({ isOpen: false, mensaje: '', tipo: 'success' });

    const mostrarNotificacion = (mensaje, tipo = 'success') => {
        setAlerta({ isOpen: true, mensaje, tipo });
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        const u     = localStorage.getItem('usuario');
        if (!token || !u) { router.push('/login'); return; }
        try { setUsuario(JSON.parse(u)); } catch { router.push('/login'); return; }
        cargarTareas();
    }, []);

    useSocket(usuario?.id, {
        onTareaCreada:        t  => setTareas(p => [{ ...t, subtareas:[] }, ...p]),
        onTareaActualizada:   t  => setTareas(p => p.map(x => x.id === t.id ? { ...x, ...t } : x)),
        onTareaEliminada:     ({ id }) => setTareas(p => p.filter(x => x.id !== id)),
        onSubtareasGeneradas: ({ tareaId, subtareas }) =>
            setTareas(p => p.map(x => x.id === tareaId ? { ...x, subtareas } : x)),
    });

    const cargarTareas = useCallback(async () => {
        try {
            const { data: lista } = await api.obtenerTareas();
            const con = await Promise.all(lista.map(async t => {
                try { const { data: subs } = await api.obtenerSubtareas(t.id); return { ...t, subtareas: subs }; }
                catch { return { ...t, subtareas: [] }; }
            }));
            setTareas(con);
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('usuario');
                router.push('/login');
                return;
            }
            console.error('Error al cargar tareas:', err.response?.data || err.message);
            mostrarNotificacion('Error al sincronizar las tareas con el servidor', 'error');
            setTareas([]);
        }
    }, []);

    const stats = {
        total:       tareas.length,
        completadas: tareas.filter(t => t.estado === 'completada').length,
        enProgreso:  tareas.filter(t => t.estado === 'en_progreso').length,
        pendientes:  tareas.filter(t => t.estado === 'pendiente').length,
    };
    const progreso = stats.total ? Math.round((stats.completadas / stats.total) * 100) : 0;
    const tareasFiltradas = filtro === 'todas' ? tareas : tareas.filter(t => t.estado === filtro);

    const crearTarea = async () => {
        if (!formTarea.titulo.trim()) return;
        setGuardando(true);
        try {
            await api.crearTarea(formTarea);
            setModalNueva(false);
            setFormTarea(TAREA_VACIA);
            cargarTareas();
            mostrarNotificacion('¡Tarea creada correctamente!', 'success');
        } catch (e) { 
            mostrarNotificacion(e.response?.data?.error || 'Error al crear la tarea', 'error'); 
        }
        finally { setGuardando(false); }
    };

    const abrirEditar = (tarea) => {
        setFormTarea({
            titulo:       tarea.titulo,
            descripcion:  tarea.descripcion || '',
            prioridad:    tarea.prioridad,
            estado:       tarea.estado,
            fecha_limite: tarea.fecha_limite ? tarea.fecha_limite.split('T')[0] : '',
        });
        setModalEditar(tarea);
    };

    const guardarEdicion = async () => {
        if (!formTarea.titulo.trim()) return;
        setGuardando(true);
        try {
            await api.actualizarTarea(modalEditar.id, formTarea);
            setTareas(p => p.map(t => t.id === modalEditar.id ? { ...t, ...formTarea } : t));
            setModalEditar(null);
            mostrarNotificacion('Cambios guardados con éxito', 'success');
        } catch (e) { 
            mostrarNotificacion(e.response?.data?.error || 'Error al guardar los cambios', 'error'); 
        }
        finally { setGuardando(false); }
    };

    const eliminarTarea = async () => {
        if (!modalElim) return;
        setGuardando(true);
        try {
            await api.eliminarTarea(modalElim.id);
            setTareas(p => p.filter(t => t.id !== modalElim.id));
            setModalElim(null);
            mostrarNotificacion('Tarea eliminada de forma permanente', 'success');
        } catch (e) { 
            mostrarNotificacion(e.response?.data?.error || 'Error al eliminar la tarea', 'error'); 
        }
        finally { setGuardando(false); }
    };

    const generarSubtareas = async (tareaId) => {
        setCIA(p => ({ ...p, [tareaId]: true }));
        try {
            const { data } = await api.generarSubtareasIA(tareaId);
            setTareas(p => p.map(t => t.id === tareaId
                ? { ...t, subtareas: data.subtareas.map((tx, i) => ({ id:`ia-${i}`, texto:tx, completada:0 })) }
                : t));
            mostrarNotificacion('Subtareas desglosadas por la IA con éxito', 'success');
        } catch { 
            mostrarNotificacion('No se pudo generar el desglose con IA', 'error'); 
        }
        finally { setCIA(p => ({ ...p, [tareaId]: false })); }
    };

    const toggleSub = async (tareaId, subId, estado) => {
        setTareas(p => p.map(t => t.id === tareaId
            ? { ...t, subtareas: t.subtareas.map(s => s.id === subId ? { ...s, completada: estado ? 1 : 0 } : s) }
            : t));
        try { await api.toggleSubtarea(subId, estado); } catch {}
    };

    return (
        <div style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--text)' }}>
            <Sidebar usuario={usuario} progreso={progreso} total={stats.total} completadas={stats.completadas}/>

            <main style={{ marginLeft:220, padding:'28px 32px', minHeight:'100vh' }}>
                <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
                    <div>
                        <h1 style={{ margin:0, fontSize:22, fontWeight:700 }}>Mis Tareas</h1>
                        <p style={{ margin:'4px 0 0', fontSize:13, color:'var(--muted)' }}>
                            {new Date().toLocaleDateString('es-MX', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                        </p>
                    </div>
                    <button onClick={() => { setFormTarea(TAREA_VACIA); setModalNueva(true); }} style={btn.pri}>
                        + Nueva tarea
                    </button>
                </header>

                {/* Stats */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:28 }}>
                    {[
                        { label:'Total',       value:stats.total,       color:'var(--muted)'   },
                        { label:'Pendientes',  value:stats.pendientes,  color:'var(--warning)' },
                        { label:'En progreso', value:stats.enProgreso,  color:'var(--accent)'  },
                        { label:'Completadas', value:stats.completadas, color:'var(--success)'  },
                    ].map(({ label, value, color }) => (
                        <div key={label} style={card.stat}>
                            <div style={card.statLabel}>{label}</div>
                            <div style={{ fontSize:28, fontWeight:700, color }}>{value}</div>
                        </div>
                    ))}
                </div>

                {/* Filtros */}
                <div style={{ display:'flex', gap:8, marginBottom:20 }}>
                    {[
                        { k:'todas',       label:'Todas'       },
                        { k:'pendiente',   label:'Pendientes'  },
                        { k:'en_progreso', label:'En progreso' },
                        { k:'completada',  label:'Completadas' },
                    ].map(({ k, label }) => (
                        <button key={k} onClick={() => setFiltro(k)}
                            style={{ ...btn.filtro, ...(filtro === k ? btn.filtroAct : {}) }}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Grid de tareas */}
                {tareasFiltradas.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'60px 0', color:'var(--muted)' }}>
                        <div style={{ fontSize:40, marginBottom:12 }}>✦</div>
                        <p>No hay tareas {filtro !== 'todas' ? `con estado "${ESTADOS[filtro] || filtro}"` : 'aún'}.</p>
                        <button onClick={() => { setFormTarea(TAREA_VACIA); setModalNueva(true); }}
                            style={{ ...btn.pri, marginTop:16 }}>
                            + Crear primera tarea
                        </button>
                    </div>
                ) : (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
                        {tareasFiltradas.map(tarea => {
                            const p       = PRIORIDAD_C[tarea.prioridad] || PRIORIDAD_C.baja;
                            const st      = tarea.subtareas || [];
                            const hechas  = st.filter(s => s.completada).length;
                            const subProg = st.length ? Math.round((hechas / st.length) * 100) : 0;
                            const vencida = tarea.fecha_limite
                                && new Date(tarea.fecha_limite) < new Date()
                                && tarea.estado !== 'completada';

                            return (
                                <div key={tarea.id} style={{ ...card.tarea,
                                    opacity: tarea.estado === 'completada' ? 0.7 : 1,
                                    borderColor: vencida ? '#F43F5E30' : 'var(--border)' }}>

                                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                                        <span style={{ fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:20,
                                            background:p.bg, color:p.text, textTransform:'uppercase',
                                            letterSpacing:'0.5px', display:'flex', alignItems:'center', gap:4 }}>
                                            <span style={{ width:5, height:5, borderRadius:'50%', background:p.dot, display:'inline-block' }}/>
                                            {tarea.prioridad}
                                        </span>
                                        <span style={{ fontSize:10, color:'var(--muted)', padding:'3px 8px',
                                            background:'var(--bg)', borderRadius:20, border:'1px solid var(--border)' }}>
                                            {ESTADOS[tarea.estado]}
                                        </span>
                                    </div>

                                    <h3 style={{ margin:'0 0 5px', fontSize:14, fontWeight:600, lineHeight:1.3 }}>
                                        {tarea.titulo}
                                    </h3>
                                    <p style={{ margin:'0 0 12px', fontSize:12, color:'var(--muted)', lineHeight:1.5 }}>
                                        {tarea.descripcion || 'Sin descripción.'}
                                    </p>

                                    {st.length > 0 && (
                                        <div style={{ borderTop:'1px solid var(--border)', paddingTop:10, marginBottom:10 }}>
                                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                                                <span style={{ fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>
                                                    Desglose IA
                                                </span>
                                                <span style={{ fontSize:10, color:'var(--muted)' }}>{hechas}/{st.length}</span>
                                            </div>
                                            <div style={{ height:3, background:'var(--border)', borderRadius:2, marginBottom:8 }}>
                                                <div style={{ height:'100%', width:`${subProg}%`, background:'var(--success)', borderRadius:2 }}/>
                                            </div>
                                            {st.map((sub, index) => {
                                                const textoSub = typeof sub === 'string'
                                                    ? sub
                                                    : (typeof sub?.texto === 'string' ? sub.texto : String(sub?.texto ?? sub));
                                                const key = typeof sub === 'string' ? `${tarea.id}-sub-${index}` : sub.id;

                                                return (
                                                    <label key={key} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', marginBottom:5 }}>
                                                        <input type="checkbox" checked={!!sub.completada}
                                                            onChange={() => toggleSub(tarea.id, sub.id, !sub.completada)}
                                                            style={{ accentColor:'var(--accent)', width:14, height:14 }}/>
                                                        <span style={{ fontSize:12,
                                                            color: sub.completada ? 'var(--muted)' : 'var(--text)',
                                                            textDecoration: sub.completada ? 'line-through' : 'none' }}>
                                                            {textoSub}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                                        paddingTop:10, borderTop:'1px solid var(--border)', marginTop:'auto' }}>
                                        <span style={{ fontSize:11, color: vencida ? 'var(--danger)' : 'var(--muted)' }}>
                                            {vencida ? '⚠ ' : ''}
                                            {tarea.fecha_limite
                                                ? new Date(tarea.fecha_limite).toLocaleDateString('es-MX', { day:'numeric', month:'short' })
                                                : 'Sin fecha'}
                                        </span>
                                        <div style={{ display:'flex', gap:10 }}>
                                            <button onClick={() => generarSubtareas(tarea.id)} disabled={!!cargandoIA[tarea.id]}
                                                style={{ fontSize:11, color: cargandoIA[tarea.id] ? 'var(--muted)' : 'var(--accent)',
                                                    background:'transparent', border:'none', cursor:'pointer', fontWeight:600, padding:0 }}>
                                                {cargandoIA[tarea.id] ? '⟳ IA...' : '✦ IA'}
                                            </button>
                                            <button onClick={() => abrirEditar(tarea)}
                                                style={{ fontSize:11, color:'var(--muted)', background:'transparent', border:'none', cursor:'pointer' }}>
                                                Editar
                                            </button>
                                            <button onClick={() => setModalElim(tarea)}
                                                style={{ fontSize:11, color:'var(--danger)', background:'transparent', border:'none', cursor:'pointer' }}>
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            <ChatFlotante/>

            {modalNueva && (
                <FormModal
                    modo="crear"
                    formTarea={formTarea}
                    setFormTarea={setFormTarea}
                    onConfirm={crearTarea}
                    onCancel={() => { setModalNueva(false); setFormTarea(TAREA_VACIA); }}
                    guardando={guardando}
                />
            )}

            {modalEditar && (
                <FormModal
                    modo="editar"
                    formTarea={formTarea}
                    setFormTarea={setFormTarea}
                    onConfirm={guardarEdicion}
                    onCancel={() => setModalEditar(null)}
                    guardando={guardando}
                />
            )}

            {modalElim && (
                <ModalEliminar
                    tarea={modalElim}
                    onConfirm={eliminarTarea}
                    onCancel={() => setModalElim(null)}
                    guardando={guardando}
                />
            )}

            {/* Renderizado de la alerta autocerrable al fondo del DOM */}
            <NotificationModal
                isOpen={alerta.isOpen}
                mensaje={alerta.mensaje}
                tipo={alerta.tipo}
                onClose={() => setAlerta(p => ({ ...p, isOpen: false }))}
            />
        </div>
    );
}

const btn = {
    pri:       { background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, padding:'9px 18px', fontSize:13, fontWeight:600, cursor:'pointer' },
    filtro:    { padding:'7px 14px', borderRadius:20, fontSize:12, fontWeight:500, border:'1px solid var(--border)', background:'transparent', color:'var(--muted)', cursor:'pointer' },
    filtroAct: { border:'1px solid var(--accent)', background:'var(--accent-dim)', color:'var(--accent)' },
};
const card = {
    stat:      { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 20px' },
    statLabel: { fontSize:11, color:'var(--muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' },
    tarea:     { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'18px 20px', display:'flex', flexDirection:'column' },
};
const mo = {
    overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300 },
    box:     { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:28, width:'100%', maxWidth:460, display:'flex', flexDirection:'column', gap:14 },
    hdr:     { display:'flex', justifyContent:'space-between', alignItems:'center' },
    titulo:  { margin:0, fontSize:17, fontWeight:700 },
    close:   { background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:18 },
    campo:   { display:'flex', flexDirection:'column', gap:6 },
    label:   { fontSize:12, color:'var(--muted)', fontWeight:500 },
    input:   { padding:'10px 14px', fontSize:13, borderRadius:8, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text)', width:'100%' },
    btnSec:  { flex:1, padding:'10px 0', borderRadius:8, fontSize:13, background:'transparent', border:'1px solid var(--border)', color:'var(--muted)', cursor:'pointer' },
    btnPri:  { flex:1, padding:'10px 0', borderRadius:8, fontSize:13, fontWeight:600, background:'var(--accent)', border:'none', color:'#fff', cursor:'pointer' },
};