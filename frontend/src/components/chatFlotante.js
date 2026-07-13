'use client';
import { useState, useRef, useEffect } from 'react';
import { api } from '../../src/hooks/useApi';

export default function ChatFlotante() {
    const [abierto,     setAbierto]     = useState(false);
    const [mensajes,    setMensajes]    = useState([{ rol:'ia', contenido:'¡Hola! Soy tu asistente IA. Puedo ayudarte a priorizar tareas, analizar tu carga de trabajo o generar ideas. ¿En qué te ayudo?' }]);
    const [input,       setInput]       = useState('');
    const [cargando,    setCargando]    = useState(false);
    const [histCargado, setHistCargado] = useState(false);
    const endRef = useRef(null);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [mensajes]);

    useEffect(() => {
        if (abierto && !histCargado) {
            api.historialChat()
                .then(r => { if (r.data.length > 0) setMensajes(r.data.map(m => ({ rol:m.rol, contenido:m.contenido }))); setHistCargado(true); })
                .catch(() => setHistCargado(true));
        }
    }, [abierto, histCargado]);

    const enviar = async () => {
        if (!input.trim() || cargando) return;
        const msg = input.trim();
        setInput('');
        setMensajes(p => [...p, { rol:'usuario', contenido:msg }]);
        setCargando(true);
        try {
            const { data } = await api.enviarMensaje(msg);
            setMensajes(p => [...p, { rol:'ia', contenido:data.respuesta }]);
        } catch {
            setMensajes(p => [...p, { rol:'ia', contenido:'Error al conectar con el asistente.' }]);
        } finally { setCargando(false); }
    };

    const limpiar = async () => {
        await api.limpiarChat().catch(() => {});
        setMensajes([{ rol:'ia', contenido:'Chat reiniciado. ¿En qué te ayudo?' }]);
    };

    return (
        <>
            <button onClick={() => setAbierto(o => !o)} style={s.fab}>{abierto ? '✕' : '✦'}</button>
            {abierto && (
                <div style={s.panel}>
                    <div style={s.hdr}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={s.iaAvt}>✦</div>
                            <div>
                                <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>Asistente IA</div>
                                <div style={{ fontSize:10, color:'var(--success)', display:'flex', alignItems:'center', gap:4 }}>
                                    <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--success)', display:'inline-block' }}/>Activo
                                </div>
                            </div>
                        </div>
                        <button onClick={limpiar} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:16 }}>↺</button>
                    </div>
                    <div style={s.msgs}>
                        {mensajes.map((m, i) => (
                            <div key={i} style={{ display:'flex', justifyContent: m.rol==='usuario' ? 'flex-end' : 'flex-start' }}>
                                <div style={{ ...s.bbl, ...(m.rol==='usuario' ? s.bblU : s.bblIA) }}>{m.contenido}</div>
                            </div>
                        ))}
                        {cargando && (
                            <div style={{ display:'flex', justifyContent:'flex-start' }}>
                                <div style={{ ...s.bbl, ...s.bblIA, color:'var(--muted)' }}>Pensando...</div>
                            </div>
                        )}
                        <div ref={endRef}/>
                    </div>
                    <div style={{ padding:'0 12px 8px', display:'flex', gap:5, flexWrap:'wrap' }}>
                        {['¿Qué debo hacer hoy?','Prioriza mis tareas','¿Cuánto me falta?'].map(sg => (
                            <button key={sg} onClick={() => setInput(sg)} style={s.chip}>{sg}</button>
                        ))}
                    </div>
                    <div style={s.iRow}>
                        <input value={input} onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key==='Enter' && enviar()}
                            placeholder="Escribe tu pregunta..." style={s.inp}/>
                        <button onClick={enviar} disabled={cargando || !input.trim()} style={s.send}>↑</button>
                    </div>
                </div>
            )}
        </>
    );
}

const s = {
    fab:   { position:'fixed', bottom:28, right:28, width:50, height:50, borderRadius:'50%', background:'var(--accent)', border:'none', cursor:'pointer', fontSize:20, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(99,102,241,0.4)', zIndex:200 },
    panel: { position:'fixed', bottom:88, right:28, width:350, height:470, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, display:'flex', flexDirection:'column', zIndex:200, overflow:'hidden', boxShadow:'0 8px 40px rgba(0,0,0,0.5)' },
    hdr:   { padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' },
    iaAvt: { width:28, height:28, borderRadius:'50%', background:'var(--accent-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'var(--accent)' },
    msgs:  { flex:1, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:8 },
    bbl:   { maxWidth:'83%', padding:'8px 12px', fontSize:12, lineHeight:1.5,
             borderTopLeftRadius:12, borderTopRightRadius:12, borderBottomLeftRadius:12, borderBottomRightRadius:12 },
    bblU:  { background:'var(--accent)', color:'#fff', borderBottomRightRadius:3 },
    bblIA: { background:'var(--bg)', border:'1px solid var(--border)', color:'var(--text)', borderBottomLeftRadius:3 },
    chip:  { fontSize:10, padding:'4px 9px', borderRadius:20, background:'var(--bg)', border:'1px solid var(--border)', color:'var(--muted)', cursor:'pointer' },
    iRow:  { padding:'10px 12px', borderTop:'1px solid var(--border)', display:'flex', gap:8 },
    inp:   { flex:1, padding:'8px 12px', borderRadius:8, fontSize:12, background:'var(--bg)', border:'1px solid var(--border)', color:'var(--text)' },
    send:  { padding:'8px 14px', borderRadius:8, background:'var(--accent)', border:'none', color:'#fff', cursor:'pointer', fontSize:14 },
};