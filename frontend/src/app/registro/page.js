'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../hooks/useAPI';

export default function Registro() {
    const router = useRouter();
    const [form, setForm]         = useState({ nombre: '', email: '', password: '', confirmar: '' });
    const [error, setError]       = useState('');
    const [exito, setExito]       = useState(false);
    const [cargando, setCargando] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirmar) {
            return setError('Las contraseñas no coinciden');
        }
        if (form.password.length < 6) {
            return setError('La contraseña debe tener al menos 6 caracteres');
        }

        setCargando(true);
        try {
            await api.registro(form.nombre, form.email, form.password);
            setExito(true);
            setTimeout(() => router.push('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al registrarse');
        } finally {
            setCargando(false);
        }
    };

    if (exito) {
        return (
            <div style={styles.page}>
                <div style={{ ...styles.card, textAlign: 'center' }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
                    <h2 style={{ color: 'var(--success)', marginBottom: 8 }}>¡Cuenta creada!</h2>
                    <p style={{ color: 'var(--muted)', fontSize: 13 }}>Redirigiendo al login...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <div style={styles.logo}>
                    <div style={styles.logoBadge}>✦</div>
                    <span style={styles.logoText}>Smart Tasks <span style={{ color: 'var(--accent)', fontWeight: 700 }}>AI</span></span>
                </div>

                <h1 style={styles.titulo}>Crea tu cuenta</h1>
                <p style={styles.subtitulo}>Empieza a gestionar tus tareas con IA</p>

                {error && <div style={styles.errorBanner}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    {[
                        { key: 'nombre',    label: 'Nombre completo',      type: 'text',     placeholder: 'Tu nombre' },
                        { key: 'email',     label: 'Correo electrónico',   type: 'email',    placeholder: 'tu@correo.com' },
                        { key: 'password',  label: 'Contraseña',           type: 'password', placeholder: '••••••••' },
                        { key: 'confirmar', label: 'Confirmar contraseña', type: 'password', placeholder: '••••••••' },
                    ].map(({ key, label, type, placeholder }) => (
                        <div key={key} style={styles.campo}>
                            <label style={styles.label}>{label}</label>
                            <input
                                type={type}
                                value={form[key]}
                                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                                placeholder={placeholder}
                                required
                                style={styles.input}
                            />
                        </div>
                    ))}

                    <button type="submit" disabled={cargando} style={{ ...styles.boton, marginTop: 8 }}>
                        {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
                    </button>
                </form>

                <p style={styles.footer}>
                    ¿Ya tienes cuenta?{' '}
                    <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                        Inicia sesión
                    </Link>
                </p>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '40px 36px',
        width: '100%',
        maxWidth: 420,
    },
    logo: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 28,
        justifyContent: 'center',
    },
    logoBadge: {
        width: 34,
        height: 34,
        borderRadius: 8,
        background: 'var(--accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        color: '#fff',
    },
    logoText: { fontSize: 18, fontWeight: 600, color: 'var(--text)' },
    titulo: { fontSize: 22, fontWeight: 700, color: 'var(--text)', textAlign: 'center', marginBottom: 6 },
    subtitulo: { fontSize: 13, color: 'var(--muted)', textAlign: 'center', marginBottom: 28 },
    errorBanner: {
        background: '#F43F5E15',
        border: '1px solid #F43F5E40',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--danger)',
        fontSize: 13,
        padding: '10px 14px',
        marginBottom: 18,
    },
    form: { display: 'flex', flexDirection: 'column' },
    campo: { marginBottom: 14 },
    label: { display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6, fontWeight: 500 },
    input: {
        width: '100%',
        padding: '10px 14px',
        fontSize: 14,
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
        background: 'var(--bg)',
        color: 'var(--text)',
        outline: 'none',
    },
    boton: {
        width: '100%',
        padding: '12px 0',
        borderRadius: 'var(--radius-md)',
        background: 'var(--accent)',
        color: '#fff',
        fontSize: 14,
        fontWeight: 700,
        border: 'none',
        cursor: 'pointer',
    },
    footer: { marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--muted)' },
};