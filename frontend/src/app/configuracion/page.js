'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/sidebar';
import { api } from '../../hooks/useApi';

export default function Configuracion() {
    const router = useRouter();
    const [usuario, setUsuario] = useState(null);
    const [config, setConfig] = useState(null);
    const [tab, setTab] = useState('perfil');
    const [guardando, setGuardando] = useState(false);
    const [msg, setMsg] = useState({ texto: '', tipo: '' });

    // Forms
    const [formPerfil, setFormPerfil] = useState({ nombre: '', avatar: '' });
    const [formPass, setFormPass] = useState({ password_actual: '', password_nueva: '', confirmar: '' });
    const [formConfig, setFormConfig] = useState({ tema: 'oscuro', notif_email: 1, notif_vencimiento: 1, notif_equipo: 1 });
    const [passElim, setPassElim] = useState('');
    const [confirmElim, setConfirmElim] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const u = localStorage.getItem('usuario');
        if (!token || !u) { router.push('/login'); return; }
        setUsuario(JSON.parse(u));
        cargarConfig();
    }, []);

    const cargarConfig = async () => {
        try {
            const { data } = await api.obtenerConfig();
            setConfig(data);
            setFormPerfil({ nombre: data.usuario?.nombre || '', avatar: data.usuario?.avatar || '' });
            setFormConfig({
                tema: data.tema || 'oscuro',
                notif_email: data.notif_email ?? 1,
                notif_vencimiento: data.notif_vencimiento ?? 1,
                notif_equipo: data.notif_equipo ?? 1,
            });
        } catch {}
    };

    const notificar = (texto, tipo = 'exito') => {
        setMsg({ texto, tipo });
        setTimeout(() => setMsg({ texto: '', tipo: '' }), 3000);
    };

    // Función única y corregida para guardar configuraciones
    const guardarConfig = async (esTema = false) => {
        setGuardando(true);
        try {
            await api.actualizarConfig(formConfig);
            // Solo aplicar cambios de tema al DOM si se guarda desde Apariencia
            if (esTema) {
                localStorage.setItem('tema', formConfig.tema);
                document.documentElement.setAttribute('data-theme', formConfig.tema);
            }
            notificar('Configuración guardada correctamente');
        } catch (e) {
            notificar(e.response?.data?.error || 'Error al guardar', 'error');
        } finally {
            setGuardando(false);
        }
    };

    const guardarPerfil = async () => {
        if (!formPerfil.nombre) return notificar('Nombre requerido', 'error');
        setGuardando(true);
        try {
            const { data } = await api.actualizarPerfil(formPerfil);
            // actualizar usuario local si la API devuelve el usuario
            if (data) setUsuario(u => ({ ...(u || {}), ...data }));
            notificar('Perfil actualizado correctamente');
        } catch (e) {
            notificar(e.response?.data?.error || 'Error al actualizar perfil', 'error');
        } finally {
            setGuardando(false);
        }
    };

    const guardarPassword = async () => {
        if (!formPass.password_actual || !formPass.password_nueva) return notificar('Completa los campos', 'error');
        if (formPass.password_nueva.length < 6) return notificar('La nueva contraseña debe tener al menos 6 caracteres', 'error');
        if (formPass.password_nueva !== formPass.confirmar) return notificar('Las contraseñas no coinciden', 'error');
        setGuardando(true);
        try {
            await api.cambiarPassword({ password_actual: formPass.password_actual, password_nueva: formPass.password_nueva });
            setFormPass({ password_actual: '', password_nueva: '', confirmar: '' });
            notificar('Contraseña actualizada correctamente');
        } catch (e) {
            notificar(e.response?.data?.error || 'Error al cambiar contraseña', 'error');
        } finally {
            setGuardando(false);
        }
    };

    const eliminarCuenta = async () => {
        if (!passElim) return notificar('Ingresa tu contraseña para confirmar', 'error');
        setGuardando(true);
        try {
            await api.eliminarCuenta(passElim);
            localStorage.clear();
            router.push('/login');
        } catch (e) { notificar(e.response?.data?.error || 'Error', 'error'); }
        finally { setGuardando(false); }
    };

    const TABS = [
        { k:'perfil',    icon:'◎', label:'Perfil'          },
        { k:'seguridad', icon:'⊕', label:'Seguridad'       },
        { k:'notif',     icon:'◈', label:'Notificaciones'  },
        { k:'apariencia',icon:'▦', label:'Apariencia'      },
        { k:'cuenta',    icon:'⚠', label:'Cuenta'          },
    ];
    
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
            <Sidebar usuario={usuario} />
            <main style={{ marginLeft: 220, padding: '28px 32px' }}>

                {/* Notificación flash */}
                {msg.texto && (
                    <div style={{ padding:'12px 16px', borderRadius:8, marginBottom:20, fontSize:13,
                        background: msg.tipo === 'error' ? '#F43F5E15' : '#10B98115',
                        border:     `1px solid ${msg.tipo === 'error' ? '#F43F5E40' : '#10B98140'}`,
                        color:      msg.tipo === 'error' ? 'var(--danger)' : 'var(--success)' }}>
                        {msg.tipo === 'error' ? '⚠ ' : '✓ '}{msg.texto}
                    </div>
                )}

                <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:20 }}>
                    {/* Sidebar de tabs */}
                    <nav style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:8, height:'fit-content' }}>
                        {TABS.map(({ k, icon, label }) => (
                            <button key={k} onClick={() => setTab(k)}
                                style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight: tab===k ? 600 : 400, marginBottom:2, textAlign:'left',
                                    background: tab===k ? 'var(--accent-dim)' : 'transparent',
                                    color:      tab===k ? 'var(--accent)'     : 'var(--muted)' }}>
                                <span style={{ fontSize:14 }}>{icon}</span>{label}
                            </button>
                        ))}
                    </nav>

                    {/* Contenido */}
                    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'24px 28px', display:'flex', flexDirection:'column', gap:20 }}>

                        {/* ── Perfil ── */}
                        {tab === 'perfil' && (
                            <>
                                <SectionTitle icon="◎" title="Información de perfil"/>
                                {/* Avatar preview */}
                                <div style={{ display:'flex', alignItems:'center', gap:16, padding:'16px', background:'var(--bg)', borderRadius:10, border:'1px solid var(--border)' }}>
                                    <div style={{ width:60, height:60, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700, color:'#fff', flexShrink:0 }}>
                                        {formPerfil.nombre?.[0]?.toUpperCase() || usuario?.nombre?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <div style={{ fontSize:15, fontWeight:600 }}>{usuario?.nombre}</div>
                                        <div style={{ fontSize:12, color:'var(--muted)' }}>{config?.usuario?.email}</div>
                                    </div>
                                </div>
                                <Campo label="Nombre completo">
                                    <input value={formPerfil.nombre} onChange={e => setFormPerfil(p => ({ ...p, nombre:e.target.value }))} placeholder="Tu nombre" style={inp}/>
                                </Campo>
                                <Campo label="URL de avatar (opcional)">
                                    <input value={formPerfil.avatar} onChange={e => setFormPerfil(p => ({ ...p, avatar:e.target.value }))} placeholder="https://..." style={inp}/>
                                </Campo>
                                <button onClick={guardarPerfil} disabled={guardando} style={b.pri}>
                                    {guardando ? 'Guardando...' : 'Guardar cambios'}
                                </button>
                            </>
                        )}

                        {/* ── Seguridad ── */}
                        {tab === 'seguridad' && (
                            <>
                                <SectionTitle icon="⊕" title="Cambiar contraseña"/>
                                <Campo label="Contraseña actual">
                                    <input type="password" value={formPass.password_actual} onChange={e => setFormPass(p => ({ ...p, password_actual:e.target.value }))} placeholder="••••••••" style={inp}/>
                                </Campo>
                                <Campo label="Nueva contraseña">
                                    <input type="password" value={formPass.password_nueva} onChange={e => setFormPass(p => ({ ...p, password_nueva:e.target.value }))} placeholder="Mínimo 6 caracteres" style={inp}/>
                                </Campo>
                                <Campo label="Confirmar nueva contraseña">
                                    <input type="password" value={formPass.confirmar} onChange={e => setFormPass(p => ({ ...p, confirmar:e.target.value }))} placeholder="••••••••" style={inp}/>
                                </Campo>
                                <button onClick={guardarPassword} disabled={guardando} style={b.pri}>
                                    {guardando ? 'Actualizando...' : 'Cambiar contraseña'}
                                </button>
                            </>
                        )}

                        {/* ── Notificaciones ── */}
                        {tab === 'notif' && (
                            <>
                                <SectionTitle icon="◈" title="Preferencias de notificaciones"/>
                                {[
                                    { k:'notif_email',       label:'Notificaciones por email',              desc:'Recibir resúmenes y alertas por correo electrónico' },
                                    { k:'notif_vencimiento', label:'Alertas de vencimiento',                desc:'Avisar cuando una tarea se acerca a su fecha límite' },
                                    { k:'notif_equipo',      label:'Actividad del equipo',                  desc:'Notificar cambios en tareas de equipo y nuevos miembros' },
                                ].map(({ k, label, desc }) => (
                                    <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px', background:'var(--bg)', borderRadius:10, border:'1px solid var(--border)' }}>
                                        <div>
                                            <div style={{ fontSize:13, fontWeight:600, marginBottom:2 }}>{label}</div>
                                            <div style={{ fontSize:12, color:'var(--muted)' }}>{desc}</div>
                                        </div>
                                        <div onClick={() => setFormConfig(p => ({ ...p, [k]: p[k] ? 0 : 1 }))}
                                            style={{ width:44, height:24, borderRadius:12, cursor:'pointer', position:'relative', transition:'background 0.2s',
                                                background: formConfig[k] ? 'var(--accent)' : 'var(--border)' }}>
                                            <div style={{ position:'absolute', top:3, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left 0.2s',
                                                left: formConfig[k] ? 23 : 3 }}/>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => guardarConfig(false)} disabled={guardando} style={b.pri}>
    {guardando ? 'Guardando...' : 'Guardar preferencias'}
</button>
                            </>
                        )}

                        {/* ── Apariencia ── */}
                        {tab === 'apariencia' && (
                            <>
                                <SectionTitle icon="▦" title="Tema de la interfaz"/>
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                                    {[
                                        { v:'oscuro', label:'Oscuro', emoji:'🌙', desc:'Fondo negro azulado' },
                                        { v:'claro',  label:'Claro',  emoji:'☀️', desc:'Fondo blanco limpio' },
                                    ].map(({ v, label, emoji, desc }) => (
                                        <button key={v} onClick={() => setFormConfig(p => ({ ...p, tema:v }))}
                                            style={{ padding:'20px 16px', borderRadius:12, cursor:'pointer', textAlign:'center',
                                                border:`2px solid ${formConfig.tema===v ? 'var(--accent)':'var(--border)'}`,
                                                background: formConfig.tema===v ? 'var(--accent-dim)':'var(--bg)' }}>
                                            <div style={{ fontSize:28, marginBottom:8 }}>{emoji}</div>
                                            <div style={{ fontSize:13, fontWeight:600, color: formConfig.tema===v ? 'var(--accent)':'var(--text)', marginBottom:4 }}>{label}</div>
                                            <div style={{ fontSize:11, color:'var(--muted)' }}>{desc}</div>
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => guardarConfig(true)} disabled={guardando} style={b.pri}>
    {guardando ? 'Aplicando...' : 'Aplicar tema'}
</button>
                            </>
                        )}

                        {/* ── Cuenta / Eliminar ── */}
                        {tab === 'cuenta' && (
                            <>
                                <SectionTitle icon="⚠" title="Zona de peligro"/>
                                <div style={{ background:'#F43F5E08', border:'1px solid #F43F5E30', borderRadius:12, padding:'20px 24px' }}>
                                    <h3 style={{ fontSize:15, fontWeight:700, color:'var(--danger)', marginBottom:8 }}>Eliminar cuenta permanentemente</h3>
                                    <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.6, marginBottom:16 }}>
                                        Esta acción eliminará tu cuenta, todas tus tareas, subtareas e historial de chat de forma permanente. No se puede deshacer.
                                    </p>

                                    {!confirmElim ? (
                                        <button onClick={() => setConfirmElim(true)}
                                            style={{ padding:'10px 20px', borderRadius:8, background:'transparent', border:'1px solid var(--danger)', color:'var(--danger)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                                            Quiero eliminar mi cuenta
                                        </button>
                                    ) : (
                                        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                                            <p style={{ fontSize:13, fontWeight:600, color:'var(--danger)' }}>
                                                ¿Estás completamente seguro? Escribe tu contraseña para confirmar:
                                            </p>
                                            <input type="password" value={passElim}
                                                onChange={e => setPassElim(e.target.value)}
                                                placeholder="Tu contraseña actual" style={inp}/>
                                            <div style={{ display:'flex', gap:10 }}>
                                                <button onClick={() => { setConfirmElim(false); setPassElim(''); }}
                                                    style={{ flex:1, padding:'10px 0', borderRadius:8, background:'transparent', border:'1px solid var(--border)', color:'var(--muted)', fontSize:13, cursor:'pointer' }}>
                                                    Cancelar
                                                </button>
                                                <button onClick={eliminarCuenta} disabled={guardando}
                                                    style={{ flex:1, padding:'10px 0', borderRadius:8, background:'var(--danger)', border:'none', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                                                    {guardando ? 'Eliminando...' : 'Eliminar definitivamente'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function SectionTitle({ icon, title }) {
    return (
        <div style={{ display:'flex', alignItems:'center', gap:8, paddingBottom:14, borderBottom:'1px solid var(--border)' }}>
            <span style={{ fontSize:16, color:'var(--accent)' }}>{icon}</span>
            <h2 style={{ margin:0, fontSize:16, fontWeight:700 }}>{title}</h2>
        </div>
    );
}
function Campo({ label, children }) {
    return (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <label style={{ fontSize:12, color:'var(--muted)', fontWeight:500 }}>{label}</label>
            {children}
        </div>
    );
}

const inp = { padding:'10px 14px', fontSize:13, borderRadius:8, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text)', width:'100%' };
const b   = {
    pri: { padding:'11px 22px', borderRadius:8, background:'var(--accent)', border:'none', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', alignSelf:'flex-start' },
};