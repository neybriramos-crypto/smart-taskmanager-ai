'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../hooks/useApi';

export default function RecuperarPassword() {
    const router = useRouter();
    const [paso, setPaso] = useState(1);
    const [form, setForm] = useState({ email:'', codigo:'', password:'' });
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [cargando, setCargando] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const enviarEmail = async () => {
        setError('');
        if (!form.email.trim()) return setError('Escribe un correo válido');
        setCargando(true);
        try {
            await api.recuperarPassword(form.email);
            setExito('Código enviado. Revisa tu correo.');
            setPaso(2);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al enviar el código');
        } finally {
            setCargando(false);
        }
    };

    const validatePassword = (password) => {
        if (password.length < 9) return 'Debe tener más de 8 caracteres.';
        if (!/[A-Z]/.test(password)) return 'Debe incluir al menos una mayúscula.';
        if (!/[a-z]/.test(password)) return 'Debe incluir al menos una minúscula.';
        if (!/\d/.test(password)) return 'Debe incluir al menos un número.';
        if (!/[.!$#%*]/.test(password)) return 'Debe incluir al menos uno de estos caracteres especiales: . ! $ # % *';
        if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[.!$#%*])[A-Za-z\d.!$#%*]{9,}$/.test(password)) {
            return 'Solo se permiten letras, números y estos caracteres especiales: . ! $ # % *';
        }
        return '';
    };

    const cambiarPassword = async () => {
        setError('');
        if (!form.codigo.trim() || !form.password.trim()) return setError('Completa todos los campos');
        const passwordError = validatePassword(form.password);
        if (passwordError) return setError(passwordError);
        setCargando(true);
        try {
            await api.resetPassword(form.email, form.codigo, form.password);
            setExito('Contraseña actualizada con éxito. Redirigiendo al login...');
            setTimeout(() => router.push('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al restablecer la contraseña');
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
                <h1 style={s.titulo}>{paso === 1 ? 'Recuperar acceso' : 'Ingresa el código y nueva clave'}</h1>
                <p style={s.subtitulo}>{paso === 1 ? 'Te enviaremos un código de verificación a tu correo.' : 'Usa el código que recibiste para restablecer tu contraseña.'}</p>

                {error && <div style={s.error}>{error}</div>}
                {exito && <div style={s.success}>{exito}</div>}

                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    <div>
                        <label style={s.label}>Email</label>
                        <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email:e.target.value }))} placeholder="tu@correo.com" style={s.input} />
                    </div>
                    {paso === 2 && (
                        <>
                            <div>
                                <label style={s.label}>Código de recuperación</label>
                                <input type="text" value={form.codigo} onChange={e => setForm(p => ({ ...p, codigo:e.target.value }))} placeholder="123456" style={s.input} />
                            </div>
                            <div>
                                <label style={s.label}>Nueva contraseña</label>
                                <div style={s.inputWrap}>
                                    <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm(p => ({ ...p, password:e.target.value }))} placeholder="••••••••" style={{ ...s.input, paddingRight:42 }} />
                                    <button type="button" onClick={() => setShowPassword(v => !v)} style={s.toggleBtn} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{showPassword ? (
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
                                    )}</button>
                                </div>
                                <div style={s.helper}>Debe tener más de 8 caracteres, mayúscula, minúscula, número y uno de estos caracteres especiales: . ! $ # % *</div>
                            </div>
                        </>
                    )}
                    <button onClick={paso === 1 ? enviarEmail : cambiarPassword} disabled={cargando} style={s.boton}>
                        {cargando ? 'Procesando...' : paso === 1 ? 'Enviar código' : 'Restablecer contraseña'}
                    </button>
                </div>

                <p style={s.footer}>
                    ¿Recuerdas tu contraseña?{' '}
                    <Link href="/login" style={{ color:'var(--accent)', fontWeight:600 }}>Volver al login</Link>
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
    success:   { background:'#10B98115', border:'1px solid #10B98140', borderRadius:8, color:'var(--success)', fontSize:13, padding:'10px 14px' },
    label:     { display:'block', fontSize:12, color:'var(--muted)', marginBottom:6, fontWeight:500 },
    helper:    { fontSize:12, color:'var(--muted)', marginTop:6, lineHeight:1.4 },
    inputWrap: { position:'relative' },
    toggleBtn: { position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', cursor:'pointer', fontSize:16, color:'var(--muted)' },
    input:     { width:'100%', padding:'10px 14px', fontSize:14, borderRadius:8, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text)' },
    boton:     { width:'100%', padding:'12px 0', borderRadius:10, background:'var(--accent)', color:'#fff', fontSize:14, fontWeight:700, border:'none', cursor:'pointer' },
    footer:    { marginTop:24, textAlign:'center', fontSize:13, color:'var(--muted)' },
};
