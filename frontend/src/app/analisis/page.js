'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/sidebar';
import ChatFlotante from '../../components/chatFlotante';
import { api } from '../../hooks/useApi';

export default function Analisis() {
    const router = useRouter();
    const [usuario,       setUsuario]       = useState(null);
    const [tareas,        setTareas]        = useState([]);
    const [analisis,      setAnalisis]      = useState('');
    const [ordenIA,       setOrdenIA]       = useState(null);
    const [cargando,      setCargando]      = useState(false);
    const [cargandoOrden, setCargandoOrden] = useState(false);
    const [stats,         setStats]         = useState({ total:0, completadas:0, enProgreso:0, pendientes:0 });

    useEffect(() => {
        const token = localStorage.getItem('token');
        const u     = localStorage.getItem('usuario');
        if (!token || !u) { router.push('/login'); return; }
        setUsuario(JSON.parse(u));
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const { data } = await api.obtenerTareas();
            setTareas(data);
            setStats({
                total:       data.length,
                completadas: data.filter(t => t.estado === 'completada').length,
                enProgreso:  data.filter(t => t.estado === 'en_progreso').length,
                pendientes:  data.filter(t => t.estado === 'pendiente').length,
            });
        } catch {}
    };

    const generarAnalisis = async () => {
        setCargando(true);
        setAnalisis('');
        try {
            // Llamar al endpoint de análisis del backend
            const res = await fetch('http://localhost:5000/api/analisis', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setAnalisis(data.analisis);
            setStats(data.stats);
            setTareas(data.tareas);
        } catch (e) {
            setAnalisis(`Error: ${e.message}`);
        } finally { setCargando(false); }
    };

    const priorizarConIA = async () => {
        setCargandoOrden(true);
        try {
            const res = await fetch('http://localhost:5000/api/priorizar', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setOrdenIA(data.orden);
        } catch (e) {
            alert(`Error al priorizar: ${e.message}`);
        } finally { setCargandoOrden(false); }
    };

    const progreso    = stats.total ? Math.round((stats.completadas / stats.total) * 100) : 0;
    const vencidas    = tareas.filter(t => t.fecha_limite && new Date(t.fecha_limite) < new Date() && t.estado !== 'completada');
    const altasPend   = tareas.filter(t => t.prioridad === 'alta' && t.estado !== 'completada');

    return (
        <div style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--text)' }}>
            <Sidebar usuario={usuario} progreso={progreso} total={stats.total} completadas={stats.completadas}/>

            <main style={{ marginLeft:220, padding:'28px 32px' }}>
                <header style={{ marginBottom:28 }}>
                    <h1 style={{ margin:0, fontSize:22, fontWeight:700 }}>Análisis IA</h1>
                    <p style={{ margin:'4px 0 0', fontSize:13, color:'var(--muted)' }}>La IA analiza tu carga de trabajo y te da recomendaciones</p>
                </header>

                {/* Métricas */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:24 }}>
                    {[
                        { label:'Total',       value:stats.total,       color:'var(--muted)'   },
                        { label:'Completadas', value:stats.completadas, color:'var(--success)' },
                        { label:'En progreso', value:stats.enProgreso,  color:'var(--accent)'  },
                        { label:'Pendientes',  value:stats.pendientes,  color:'var(--warning)' },
                        { label:'Vencidas',    value:vencidas.length,   color:'var(--danger)'  },
                    ].map(({ label, value, color }) => (
                        <div key={label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 18px' }}>
                            <div style={{ fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>{label}</div>
                            <div style={{ fontSize:26, fontWeight:700, color }}>{value}</div>
                        </div>
                    ))}
                </div>

                {/* Barra de progreso */}
                <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'20px 24px', marginBottom:20 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                        <span style={{ fontSize:14, fontWeight:600 }}>Progreso general</span>
                        <span style={{ fontSize:14, fontWeight:700, color:'var(--accent)' }}>{progreso}%</span>
                    </div>
                    <div style={{ height:8, background:'var(--border)', borderRadius:4 }}>
                        <div style={{ height:'100%', width:`${progreso}%`, borderRadius:4, transition:'width 0.5s',
                            background: progreso >= 75 ? 'var(--success)' : progreso >= 40 ? 'var(--accent)' : 'var(--warning)' }}/>
                    </div>
                    <div style={{ display:'flex', gap:20, marginTop:10, fontSize:11, color:'var(--muted)' }}>
                        <span style={{ color:'var(--success)' }}>■ {stats.completadas} completadas</span>
                        <span style={{ color:'var(--accent)' }}>■ {stats.enProgreso} en progreso</span>
                        <span style={{ color:'var(--warning)' }}>■ {stats.pendientes} pendientes</span>
                    </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
                    {/* Alertas */}
                    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'20px 24px' }}>
                        <p style={secTit}>Alertas</p>
                        {altasPend.length === 0 && vencidas.length === 0 ? (
                            <p style={{ fontSize:13, color:'var(--success)' }}>✅ Sin alertas activas. ¡Todo en orden!</p>
                        ) : (
                            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                                {vencidas.map(t => (
                                    <div key={t.id} style={{ padding:'10px 12px', borderRadius:8, background:'#F43F5E10', border:'1px solid #F43F5E25', fontSize:12 }}>
                                        <span style={{ color:'var(--danger)', fontWeight:600 }}>⚠ Vencida: </span>
                                        <span>{t.titulo}</span>
                                    </div>
                                ))}
                                {altasPend.map(t => (
                                    <div key={t.id} style={{ padding:'10px 12px', borderRadius:8, background:'#F59E0B10', border:'1px solid #F59E0B25', fontSize:12 }}>
                                        <span style={{ color:'var(--warning)', fontWeight:600 }}>🔴 Alta prioridad: </span>
                                        <span>{t.titulo}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Orden sugerido por IA */}
                    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'20px 24px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                            <p style={{ ...secTit, marginBottom:0 }}>Orden sugerido por IA</p>
                            <button onClick={priorizarConIA} disabled={cargandoOrden}
                                style={{ fontSize:11, padding:'6px 12px', borderRadius:8, background:'var(--accent-dim)', border:'1px solid var(--accent)', color:'var(--accent)', cursor:'pointer', fontWeight:600 }}>
                                {cargandoOrden ? '⟳ Analizando...' : '✦ Priorizar'}
                            </button>
                        </div>
                        {!ordenIA ? (
                            <p style={{ fontSize:12, color:'var(--muted)', lineHeight:1.6 }}>
                                Haz clic en "Priorizar" para que la IA ordene tus tareas pendientes por importancia lógica.
                            </p>
                        ) : ordenIA.length === 0 ? (
                            <p style={{ fontSize:12, color:'var(--success)' }}>✅ No hay tareas pendientes que priorizar.</p>
                        ) : (
                            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                                {ordenIA.slice(0,6).map((t, i) => (
                                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, background:'var(--bg)', border:'1px solid var(--border)' }}>
                                        <span style={{ fontSize:11, fontWeight:700, color:'var(--accent)', width:18, textAlign:'center', flexShrink:0 }}>#{i+1}</span>
                                        <div style={{ flex:1, minWidth:0 }}>
                                            <div style={{ fontSize:12, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.titulo}</div>
                                            {t.estimado_minutos && <div style={{ fontSize:10, color:'var(--muted)' }}>~{t.estimado_minutos} min</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Análisis IA */}
                <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'20px 24px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                        <div>
                            <p style={{ ...secTit, marginBottom:2 }}>Análisis detallado con IA</p>
                            <p style={{ fontSize:12, color:'var(--muted)', margin:0 }}>Evaluación completa de tu productividad con recomendaciones específicas</p>
                        </div>
                        <button onClick={generarAnalisis} disabled={cargando}
                            style={{ padding:'9px 18px', borderRadius:8, background:'var(--accent)', border:'none', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                            {cargando ? '⟳ Analizando...' : '✦ Generar análisis'}
                        </button>
                    </div>

                    {!analisis && !cargando && (
                        <div style={{ textAlign:'center', padding:'32px 0', color:'var(--muted)' }}>
                            <div style={{ fontSize:32, marginBottom:10 }}>⌘</div>
                            <p style={{ fontSize:13 }}>Haz clic en "Generar análisis" para recibir un diagnóstico completo de tu productividad.</p>
                        </div>
                    )}
                    {cargando && (
                        <div style={{ textAlign:'center', padding:'32px 0', color:'var(--muted)' }}>
                            <div style={{ fontSize:24, marginBottom:10, animation:'spin 1s linear infinite' }}>✦</div>
                            <p style={{ fontSize:13 }}>La IA está analizando tus tareas...</p>
                        </div>
                    )}
                    {analisis && (
                        <div style={{ fontSize:13, lineHeight:1.9, color:'var(--text)', background:'var(--bg)', borderRadius:10, padding:'18px 20px', border:'1px solid var(--border)', whiteSpace:'pre-wrap' }}>
                            {analisis}
                        </div>
                    )}
                </div>
            </main>

            <ChatFlotante/>
        </div>
    );
}

const secTit = { fontSize:11, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:12 };