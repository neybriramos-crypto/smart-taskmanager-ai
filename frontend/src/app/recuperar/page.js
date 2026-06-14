'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function Recuperar() {
    const [email, setEmail]     = useState('');
    const [enviado, setEnviado] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: conectar con endpoint de recuperación de contraseña
        setEnviado(true);
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <div style={styles.logo}>
                    <div style={styles.logoBadge}>✦</div>
                    <span style={styles.logoText}>Smart Tasks <span style={{ color: 'var(--accent)', fontWeight: 700 }}>AI</span></span>
                </div>

                {!enviado ? (
                    <>
                        <h1 style={styles.titulo}>Recuperar contraseña</h1>
                        <p style={styles.subtitulo}>
                            Ingresa tu correo y te enviaremos instrucciones para restablecer tu contraseña.
                        </p>

                        <form onSubmit={handleSubmit} style={styles.form}>
                            <div style={styles.campo}>
                                <label style={styles.label}>Correo electrónico</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="tu@correo.com"
                                    required
                                    style={styles.input}
                                />
                            </div>
                            <button type="submit" style={styles.boton}>
                                Enviar instrucciones
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ fontSize: 40, marginBottom: 16 }}>📧</div>
                        <h2 style={{ color: 'var(--text)', marginBottom: 10 }}>Correo enviado</h2>
                        <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>
                            Si existe una cuenta con <strong style={{ color: 'var(--text)' }}>{email}</strong>,
                            recibirás un correo con las instrucciones.
                        </p>
                    </div>
                )}

                <p style={styles.footer}>
                    <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                        ← Volver al login
                    </Link>
                </p>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    },
    card: {
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)', padding: '40px 36px', width: '100%', maxWidth: 420,
    },
    logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, justifyContent: 'center' },
    logoBadge: {
        width: 34, height: 34, borderRadius: 8, background: 'var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff',
    },
    logoText: { fontSize: 18, fontWeight: 600, color: 'var(--text)' },
    titulo:    { fontSize: 22, fontWeight: 700, color: 'var(--text)', textAlign: 'center', marginBottom: 6 },
    subtitulo: { fontSize: 13, color: 'var(--muted)', textAlign: 'center', marginBottom: 28, lineHeight: 1.6 },
    form:  { display: 'flex', flexDirection: 'column' },
    campo: { marginBottom: 20 },
    label: { display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6, fontWeight: 500 },
    input: {
        width: '100%', padding: '10px 14px', fontSize: 14,
        borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
        background: 'var(--bg)', color: 'var(--text)', outline: 'none',
    },
    boton: {
        width: '100%', padding: '12px 0', borderRadius: 'var(--radius-md)',
        background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
    },
    footer: { marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--muted)' },
};