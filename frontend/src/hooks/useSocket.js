'use client';
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let socketInstancia = null;

export function useSocket(usuario_id, { onTareaCreada, onTareaActualizada, onTareaEliminada, onSubtareasGeneradas } = {}) {
    const handlersRef = useRef({ onTareaCreada, onTareaActualizada, onTareaEliminada, onSubtareasGeneradas });

    // Mantener handlers actualizados sin reconectar el socket
    useEffect(() => {
        handlersRef.current = { onTareaCreada, onTareaActualizada, onTareaEliminada, onSubtareasGeneradas };
    });

    useEffect(() => {
        if (!usuario_id) return;

        // Singleton: reutilizar conexión si ya existe
        if (!socketInstancia) {
            socketInstancia = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000', {
                withCredentials: true,
                transports: ['websocket'],
            });
        }

        const socket = socketInstancia;

        socket.emit('unirse', usuario_id);

        const handlers = {
            'tarea:creada':       (data) => handlersRef.current.onTareaCreada?.(data),
            'tarea:actualizada':  (data) => handlersRef.current.onTareaActualizada?.(data),
            'tarea:eliminada':    (data) => handlersRef.current.onTareaEliminada?.(data),
            'subtareas:generadas':(data) => handlersRef.current.onSubtareasGeneradas?.(data),
        };

        Object.entries(handlers).forEach(([evento, fn]) => socket.on(evento, fn));

        return () => {
            Object.entries(handlers).forEach(([evento, fn]) => socket.off(evento, fn));
        };
    }, [usuario_id]);
}