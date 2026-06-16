'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '../../../hooks/useApi';

export default function ProcesarInvitacion() {
    const router = useRouter();
    const params = useParams();
    const tokenInvitacion = params.token;
    const [estado, setEstado] = useState('Verificando invitación...');

    useEffect(() => {
        if (!tokenInvitacion) return;

        const validarYUnir = async () => {
            const tokenUsuario = localStorage.getItem('token');

            // CASO 1: No está logueado
            if (!tokenUsuario) {
                setEstado('No has iniciado sesión. Guardando invitación y redirigiéndote...');
                localStorage.setItem('token_invitacion_pendiente', tokenInvitacion);
                
                setTimeout(() => {
                    router.push('/login');
                }, 1500);
                return;
            }

            // CASO 2: Ya está logueado, procesamos la unión en el backend
            try {
                setEstado('Uniéndote al equipo en tiempo real...');
                await api.aceptarInvitacion(tokenInvitacion); 
                
                setEstado('¡Te has unido con éxito! Redirigiéndote...');
                setTimeout(() => {
                    router.push('/equipo');
                }, 1500);

            } catch (error) {
                setEstado(error.response?.data?.error || 'El enlace de invitación expiró o no es válido.');
            }
        };

        validarYUnir();
    }, [tokenInvitacion, router]);

    return (
        <div style={{ minHeight: '100vh', background: '#0B0F19', color: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
            <div style={{ background: '#111827', border: '1px solid #1F2937', padding: 32, borderRadius: 16, textAlign: 'center', maxWidth: 400, width: '100%', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>✉️</div>
                <h2 style={{ margin: '0 0 12px 0', fontSize: 18, fontWeight: 700 }}>Invitación a Equipo</h2>
                <p style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1.5, margin: 0 }}>{estado}</p>
            </div>
        </div>
    );
}