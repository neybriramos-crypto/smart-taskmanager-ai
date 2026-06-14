'use client';
import axios from 'axios';

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

function getToken() {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('token') || '';
}

function headers() {
    return { Authorization: `Bearer ${getToken()}` };
}

export const api = {
    // ── Auth ──────────────────────────────────────────────────
    login:    (email, password)     => axios.post(`${BASE}/api/auth/login`,    { email, password }),
    registro: (nombre, email, pass) => axios.post(`${BASE}/api/auth/registro`, { nombre, email, password: pass }),
    perfil:   ()                    => axios.get(`${BASE}/api/auth/perfil`,     { headers: headers() }),

    // ── Tareas ────────────────────────────────────────────────
    obtenerTareas:  ()      => axios.get(`${BASE}/api/tareas`,     { headers: headers() }),
    crearTarea:     (data)  => axios.post(`${BASE}/api/tareas`,    data, { headers: headers() }),
    actualizarTarea:(id, d) => axios.put(`${BASE}/api/tareas/${id}`, d, { headers: headers() }),
    eliminarTarea:  (id)    => axios.delete(`${BASE}/api/tareas/${id}`, { headers: headers() }),

    // ── Subtareas ─────────────────────────────────────────────
    obtenerSubtareas:  (tareaId)           => axios.get(`${BASE}/api/tareas/${tareaId}/subtareas`, { headers: headers() }),
    generarSubtareasIA:(tareaId)           => axios.post(`${BASE}/api/tareas/${tareaId}/subtareas-ia`, {}, { headers: headers() }),
    toggleSubtarea:    (subtareaId, estado)=> axios.put(`${BASE}/api/tareas/subtareas/${subtareaId}/toggle`, { completada: estado }, { headers: headers() }),
    priorizarIA:       (tareas)            => axios.post(`${BASE}/api/tareas/priorizar-ia`, { tareas }, { headers: headers() }),

    // ── Chat IA ───────────────────────────────────────────────
    enviarMensajeChat:  (mensaje)  => axios.post(`${BASE}/api/chat`,           { mensaje }, { headers: headers() }),
    obtenerHistorialChat:()        => axios.get(`${BASE}/api/chat/historial`,  { headers: headers() }),
    limpiarHistorialChat:()        => axios.delete(`${BASE}/api/chat/historial`, { headers: headers() }),
};