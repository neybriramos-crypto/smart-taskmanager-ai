'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../hooks/useAPI';

export default function Login() {
    const router = useRouter();
    const [form, setForm]       = useState({ email: '', password: '' });
    const [error, setError]     = useState('');
    const [cargando, setCargando] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setCargando(true);
        try {
            const { data } = await api.login(form.email, form.password);
            localStorage.setItem('token',   data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));
            router.push('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Error al iniciar sesión');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                {/* Logo */}
                <div style={styles.logo}>
                    <div style={styles.logoBadge}>✦</div>
                    <span style={styles.logoText}>Smart Tasks <span style={{ color: 'var(--accent)', fontWeight: 700 }}>AI</span></span>
                </div>

                <h1 style={styles.titulo}>Bienvenido de vuelta</h1>
                <p style={styles.subtitulo}>Ingresa a tu espacio de trabajo</p>

                {error && <div style={styles.errorBanner}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.campo}>
                        <label style={styles.label}>Correo electrónico</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                            placeholder="tu@correo.com"
                            required
                            style={styles.input}
                        />
                    </div>
                    <div style={styles.campo}>
                        <label style={styles.label}>Contraseña</label>
                        <input
                            type="password"
                            value={form.password}
                            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                            placeholder="••••••••"
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={{ textAlign: 'right', marginBottom: 20 }}>
                        <Link href="/recuperar" style={{ fontSize: 12, color: 'var(--muted)' }}>
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>

                    <button type="submit" disabled={cargando} style={styles.boton}>
                        {cargando ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>

                <p style={styles.footer}>
                    ¿No tienes cuenta?{' '}
                    <Link href="/registro" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                        Regístrate gratis
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
    logoText: {
        fontSize: 18,
        fontWeight: 600,
        color: 'var(--text)',
    },
    titulo: {
        fontSize: 22,
        fontWeight: 700,
        color: 'var(--text)',
        textAlign: 'center',
        marginBottom: 6,
    },
    subtitulo: {
        fontSize: 13,
        color: 'var(--muted)',
        textAlign: 'center',
        marginBottom: 28,
    },
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
    campo: { marginBottom: 16 },
    label: {
        display: 'block',
        fontSize: 12,
        color: 'var(--muted)',
        marginBottom: 6,
        fontWeight: 500,
    },
    input: {
        width: '100%',
        padding: '10px 14px',
        fontSize: 14,
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
        background: 'var(--bg)',
        color: 'var(--text)',
        outline: 'none',
        transition: 'border-color 0.15s',
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
        transition: 'background 0.15s',
    },
    footer: {
        marginTop: 24,
        textAlign: 'center',
        fontSize: 13,
        color: 'var(--muted)',
    },
};