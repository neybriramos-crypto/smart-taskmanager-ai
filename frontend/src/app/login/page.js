'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../hooks/useApi';

export default function Login() {
    const router = useRouter();
    const [form,     setForm]     = useState({ email:'', password:'' });
    const [error,    setError]    = useState('');
    const [cargando, setCargando] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setCargando(true);
        try {
            // 1. Hacemos la petición de Login
            const { data } = await api.login(form.email, form.password);
            
            // 2. Guardamos los datos de la sesión de forma segura
            localStorage.setItem('token',   data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));

            // 3. VERIFICACIÓN DE INVITACIÓN PENDIENTE:
            const invitacionPendiente = localStorage.getItem('token_invitacion_pendiente');
            
            if (invitacionPendiente) {
                localStorage.removeItem('token_invitacion_pendiente'); // Limpiamos el almacenamiento temporal
                router.push(`/invitacion/${invitacionPendiente}`);    // Lo mandamos directo a procesar su link
            } else {
                router.push('/'); // Flujo normal si no venía de una invitación
            }

        } catch (err) {
            setError(err.response?.data?.error || 'Error al iniciar sesión');
        } finally { 
            setCargando(false); 
        }
    };

    return (
        <div style={s.page}>
            <div style={s.card}>
                <div style={s.logo}>
                    <div style={s.logoBadge}>✦</div>
                    <span style={s.logoText}>Smart Tasks <span style={{ color:'var(--accent)', fontWeight:700 }}>AI</span></span>
                </div>
                <h1 style={s.titulo}>Bienvenido de vuelta</h1>
                <p style={s.subtitulo}>Ingresa a tu espacio de trabajo</p>

                {error && <div style={s.error}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    <div>
                        <label style={s.label}>Correo electrónico</label>
                        <input type="email" value={form.email}
                            onChange={e => setForm(p => ({ ...p, email:e.target.value }))}
                            placeholder="tu@correo.com" required style={s.input}/>
                    </div>
                    <div>
                        <label style={s.label}>Contraseña</label>
                        <input type="password" value={form.password}
                            onChange={e => setForm(p => ({ ...p, password:e.target.value }))}
                            placeholder="••••••••" required style={s.input}/>
                    </div>
                    <div style={{ textAlign:'right' }}>
                        <Link href="/recuperar" style={{ fontSize:12, color:'var(--muted)' }}>
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>
                    <button type="submit" disabled={cargando} style={s.boton}>
                        {cargando ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>

                <p style={s.footer}>
                    ¿No tienes cuenta?{' '}
                    <Link href="/registro" style={{ color:'var(--accent)', fontWeight:600 }}>Regístrate gratis</Link>
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
    error:     { background:'#F43F5E15', border:'1px solid #F43F5E40', borderRadius:8, color:'var(--danger)', fontSize:13, padding:'10px 14px', marginBottom:8 },
    label:     { display:'block', fontSize:12, color:'var(--muted)', marginBottom:6, fontWeight:500 },
    input:     { width:'100%', padding:'10px 14px', fontSize:14, borderRadius:8, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text)' },
    boton:     { width:'100%', padding:'12px 0', borderRadius:10, background:'var(--accent)', color:'#fff', fontSize:14, fontWeight:700, border:'none', cursor:'pointer', marginTop:4 },
    footer:    { marginTop:24, textAlign:'center', fontSize:13, color:'var(--muted)' },
};