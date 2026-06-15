'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../hooks/useApi';

export default function Registro() {
    const router = useRouter();
    const [form,     setForm]     = useState({ nombre:'', email:'', password:'', confirmar:'' });
    const [error,    setError]    = useState('');
    const [exito,    setExito]    = useState(false);
    const [cargando, setCargando] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirmar) return setError('Las contraseñas no coinciden');
        if (form.password.length < 6)         return setError('Mínimo 6 caracteres');
        setCargando(true);
        try {
            await api.registro(form.nombre, form.email, form.password);
            setExito(true);
            setTimeout(() => router.push('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al registrarse');
        } finally { setCargando(false); }
    };

    if (exito) return (
        <div style={s.page}>
            <div style={{ ...s.card, textAlign:'center' }}>
                <div style={{ fontSize:40, marginBottom:16 }}>✅</div>
                <h2 style={{ color:'var(--success)', marginBottom:8 }}>¡Cuenta creada!</h2>
                <p style={{ color:'var(--muted)', fontSize:13 }}>Redirigiendo al login...</p>
            </div>
        </div>
    );

    return (
        <div style={s.page}>
            <div style={s.card}>
                <div style={s.logo}>
                    <div style={s.logoBadge}>✦</div>
                    <span style={s.logoText}>Smart Tasks <span style={{ color:'var(--accent)', fontWeight:700 }}>AI</span></span>
                </div>
                <h1 style={s.titulo}>Crea tu cuenta</h1>
                <p style={s.subtitulo}>Empieza a gestionar tus tareas con IA</p>

                {error && <div style={s.error}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {[
                        { key:'nombre',    label:'Nombre completo',      type:'text',     ph:'Tu nombre'    },
                        { key:'email',     label:'Correo electrónico',   type:'email',    ph:'tu@correo.com'},
                        { key:'password',  label:'Contraseña',           type:'password', ph:'••••••••'     },
                        { key:'confirmar', label:'Confirmar contraseña', type:'password', ph:'••••••••'     },
                    ].map(({ key, label, type, ph }) => (
                        <div key={key}>
                            <label style={s.label}>{label}</label>
                            <input type={type} value={form[key]}
                                onChange={e => setForm(p => ({ ...p, [key]:e.target.value }))}
                                placeholder={ph} required style={s.input}/>
                        </div>
                    ))}
                    <button type="submit" disabled={cargando} style={{ ...s.boton, marginTop:4 }}>
                        {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
                    </button>
                </form>

                <p style={s.footer}>
                    ¿Ya tienes cuenta?{' '}
                    <Link href="/login" style={{ color:'var(--accent)', fontWeight:600 }}>Inicia sesión</Link>
                </p>
            </div>
        </div>
    );
}

const s = {
    page:      { minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
    card:      { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:18, padding:'40px 36px', width:'100%', maxWidth:420 },
    logo:      { display:'flex', alignItems:'center', gap:10, marginBottom:28, justifyContent:'center' },
    logoBadge: { width:34, height:34, borderRadius:8, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:'#fff' },
    logoText:  { fontSize:18, fontWeight:600, color:'var(--text)' },
    titulo:    { fontSize:22, fontWeight:700, textAlign:'center', marginBottom:6 },
    subtitulo: { fontSize:13, color:'var(--muted)', textAlign:'center', marginBottom:24 },
    error:     { background:'#F43F5E15', border:'1px solid #F43F5E40', borderRadius:8, color:'var(--danger)', fontSize:13, padding:'10px 14px' },
    label:     { display:'block', fontSize:12, color:'var(--muted)', marginBottom:6, fontWeight:500 },
    input:     { width:'100%', padding:'10px 14px', fontSize:14, borderRadius:8, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text)' },
    boton:     { width:'100%', padding:'12px 0', borderRadius:10, background:'var(--accent)', color:'#fff', fontSize:14, fontWeight:700, border:'none', cursor:'pointer' },
    footer:    { marginTop:24, textAlign:'center', fontSize:13, color:'var(--muted)' },
};