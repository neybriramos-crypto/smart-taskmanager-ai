'use client';
import { useEffect, useState } from 'react';

export default function NotificationModal({ 
    isOpen, 
    mensaje, 
    tipo = 'success', // 'success' | 'error' | 'info'
    duracion = 3000, 
    onClose 
}) {
    const [progreso, setProgreso] = useState(100);

    useEffect(() => {
        if (!isOpen) return;

        // Resetear la barra de progreso
        setProgreso(100);

        // Intervalo para animar suavemente la barra de progreso
        const intervaloTiempo = 10; // ms
        const decremento = (intervaloTiempo / duracion) * 100;

        const timerProgreso = setInterval(() => {
            setProgreso((prev) => {
                if (prev <= 0) {
                    clearInterval(timerProgreso);
                    return 0;
                }
                return prev - decremento;
            });
        }, intervaloTiempo);

        // Temporizador principal para cerrar el modal
        const temporizadorCierre = setTimeout(() => {
            onClose();
        }, duracion);

        // Limpieza de hilos al desmontar o cerrar
        return () => {
            clearTimeout(temporizadorCierre);
            clearInterval(timerProgreso);
        };
    }, [isOpen, duracion, onClose]);

    if (!isOpen) return null;

    // Configuración de colores según el tipo de alerta (Combinando con tu Dark Mode)
    const estilosTipo = {
        success: {
            borde: 'border-emerald-500/30',
            iconoBg: 'bg-emerald-500/20 text-emerald-400',
            barra: 'bg-emerald-500',
            icono: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            )
        },
        error: {
            borde: 'border-rose-500/30',
            iconoBg: 'bg-rose-500/20 text-rose-400',
            barra: 'bg-rose-500',
            icono: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" />
                </svg>
            )
        },
        info: {
            borde: 'border-violet-500/30',
            iconoBg: 'bg-violet-500/20 text-violet-400',
            barra: 'bg-violet-500',
            icono: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        }
    };

    const config = estilosTipo[tipo] || estilosTipo.info;

    return (
        <div className="fixed bottom-5 right-5 z-50 animate-fade-in-up">
            <div className={`relative bg-slate-900/95 backdrop-blur-md border ${config.borde} text-slate-100 p-4 rounded-xl shadow-2xl flex items-center gap-4 min-w-[320px] max-w-md overflow-hidden`}>
                
                {/* Icono del Estado */}
                <div className={`p-2 rounded-lg ${config.iconoBg}`}>
                    {config.icono}
                </div>

                {/* Contenido / Mensaje */}
                <div className="flex-1 pr-2">
                    <p className="text-sm font-medium tracking-wide">{mensaje}</p>
                </div>

                {/* Botón de Cierre Manual Rápido */}
                <button 
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-200 transition-colors duration-150 p-1 rounded-md hover:bg-slate-800"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" />
                    </svg>
                </button>

                {/* Barra de Progreso Inferior Retráctil */}
                <div className="absolute bottom-0 left-0 h-[3px] bg-slate-800 w-full">
                    <div 
                        className={`h-full ${config.barra} transition-all linear`}
                        style={{ width: `${progreso}%`, transitionDuration: '10ms' }}
                    />
                </div>
            </div>
        </div>
    );
}