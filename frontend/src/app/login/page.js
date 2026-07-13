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
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setCargando(true);
        try {
            //Hacemos la petición de Login
            const { data } = await api.login(form.email, form.password);
            
            //Guardamos los datos de la sesión de forma segura
            localStorage.setItem('token',   data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));

            //VERIFICACIÓN DE INVITACIÓN PENDIENTE:
            const invitacionPendiente = localStorage.getItem('token_invitacion_pendiente');
            
            if (invitacionPendiente) {
                localStorage.removeItem('token_invitacion_pendiente');
                router.push(`/invitacion/${invitacionPendiente}`);
            } else {
                router.push('/');
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
                        <div style={s.inputWrap}>
                            <input type={showPassword ? 'text' : 'password'} value={form.password}
                                onChange={e => setForm(p => ({ ...p, password:e.target.value }))}
                                placeholder="••••••••" required style={{ ...s.input, paddingRight:42 }}/>
                            <button type="button" onClick={() => setShowPassword(v => !v)} style={s.toggleBtn} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                                {showPassword ? (
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 3l18 18" />
                                        <path d="M10.6 10.6A2 2 0 0 0 13.4 13.4" />
                                        <path d="M9.88 5.08A10.94 10.94 0 0 1 12 5c4.1 0 7.6 2.5 9 6a11.2 11.2 0 0 1-2.6 3.6" />
                                        <path d="M6.61 6.61A10.94 10.94 0 0 0 3 11c1.4 3.5 4.9 6 9 6a10.1 10.1 0 0 0 3.4-.6" />
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
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
    inputWrap: { position:'relative' },
    toggleBtn: { position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', cursor:'pointer', fontSize:16, color:'var(--muted)' },
    boton:     { width:'100%', padding:'12px 0', borderRadius:10, background:'var(--accent)', color:'#fff', fontSize:14, fontWeight:700, border:'none', cursor:'pointer', marginTop:4 },
    footer:    { marginTop:24, textAlign:'center', fontSize:13, color:'var(--muted)' },
};