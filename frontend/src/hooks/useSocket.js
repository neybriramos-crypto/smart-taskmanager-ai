'use client';
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let socketInstancia = null;

export function useSocket(usuario_id, handlers = {}) {
    const ref = useRef(handlers);
    useEffect(() => { ref.current = handlers; });

    useEffect(() => {
        if (!usuario_id) return;
        if (!socketInstancia) {
            socketInstancia = io(
                process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000',
                { withCredentials: true, transports: ['websocket'] }
            );
        }
        const s = socketInstancia;
        s.emit('unirse_usuario', usuario_id);

        const eventos = {
            'tarea:creada':             d => ref.current.onTareaCreada?.(d),
            'tarea:actualizada':        d => ref.current.onTareaActualizada?.(d),
            'tarea:eliminada':          d => ref.current.onTareaEliminada?.(d),
            'subtareas:generadas':      d => ref.current.onSubtareasGeneradas?.(d),
            'equipo:creado':            d => ref.current.onEquipoCreado?.(d),
            'equipo:invitacion':        d => ref.current.onInvitacion?.(d),
            'equipo:rol_cambiado':      d => ref.current.onRolCambiado?.(d),
            'equipo:miembro_eliminado': d => ref.current.onMiembroEliminado?.(d),
        };
        Object.entries(eventos).forEach(([e, fn]) => s.on(e, fn));
        return () => Object.entries(eventos).forEach(([e, fn]) => s.off(e, fn));
    }, [usuario_id]);
}

export function unirseEquipo(equipo_id) {
    socketInstancia?.emit('unirse_equipo', equipo_id);
}