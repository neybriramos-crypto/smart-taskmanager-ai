'use client';
import './globals.css';
import { useEffect } from 'react';

export default function RootLayout({ children }) {
    useEffect(() => {
        // Leer tema guardado y aplicarlo al body
        const tema = localStorage.getItem('tema') || 'oscuro';
        document.documentElement.setAttribute('data-theme', tema);
    }, []);

    return (
        <html lang="es">
            <body>{children}</body>
        </html>
    );
}