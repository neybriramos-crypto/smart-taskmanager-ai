 'use client';
import axios from 'axios';

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

function getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
}

function handleAuthError() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
}

const apiClient = axios.create({ baseURL: BASE });

apiClient.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
        };
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
            handleAuthError();
        }
        return Promise.reject(error);
    }
);

export const api = {
    // Auth
    login:    (email, password)     => apiClient.post('/api/auth/login',    { email, password }),
    registro: (nombre, email, pass) => apiClient.post('/api/auth/registro', { nombre, email, password: pass }),
    perfil:   ()                    => apiClient.get('/api/auth/perfil'),
    recuperarPassword: (email)      => apiClient.post('/api/auth/recuperar', { email }),
    resetPassword:     (email, codigo, password) => apiClient.post('/api/auth/reset-password', { email, codigo, nuevaPassword: password }),

    // Tareas
    obtenerTareas:   ()      => apiClient.get('/api/tareas'),
    crearTarea:      (data)  => apiClient.post('/api/tareas',      data),
    actualizarTarea: (id, d) => apiClient.put(`/api/tareas/${id}`, d),
    eliminarTarea:   (id)    => apiClient.delete(`/api/tareas/${id}`),

    // Subtareas
    obtenerSubtareas:   (tid)      => apiClient.get(`/api/tareas/${tid}/subtareas`),
    generarSubtareasIA: (tid)      => apiClient.post(`/api/tareas/${tid}/subtareas-ia`, {}),
    toggleSubtarea:     (sid, est) => apiClient.put(`/api/tareas/subtareas/${sid}/toggle`, { completada: est }),
    priorizarIA:        (tareas)   => apiClient.post('/api/tareas/priorizar-ia', { tareas }),

    // Chat IA
    enviarMensaje: (mensaje) => apiClient.post('/api/chat',             { mensaje }),
    historialChat: ()        => apiClient.get('/api/chat/historial'),
    limpiarChat:   ()        => apiClient.delete('/api/chat/historial'),
    
    // Análisis IA — agregar al objeto api
analisisCompleto: () => fetch(`${BASE}/api/analisis`, { headers: { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) } }).then(r => r.json()),
priorizarTareas:  () => fetch(`${BASE}/api/priorizar`, { headers: { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) } }).then(r => r.json()),

    // Equipos
    misEquipos:        ()              => apiClient.get('/api/equipos'),
    crearEquipo:       (data)          => apiClient.post('/api/equipos',         data),
    detalleEquipo:     (id)            => apiClient.get(`/api/equipos/${id}`),
    actualizarEquipo:  (id, data)      => apiClient.put(`/api/equipos/${id}`,    data),
    eliminarEquipo:    (id)            => apiClient.delete(`/api/equipos/${id}`),
    invitarMiembro:    (id, data)      => apiClient.post(`/api/equipos/${id}/invitar`,     data),
    aceptarInvitacion: (token)         => apiClient.post(`/api/equipos/invitacion/${token}/aceptar`, {},),
    cambiarRol:        (eid, mid, rol) => apiClient.put(`/api/equipos/${eid}/miembros/${mid}/rol`, { rol }),
    eliminarMiembro:   (eid, mid)      => apiClient.delete(`/api/equipos/${eid}/miembros/${mid}`),

    // Configuración
    obtenerConfig:    ()     => apiClient.get('/api/config'),
    actualizarConfig: (data) => apiClient.put('/api/config',       data),
    actualizarPerfil: (data) => apiClient.put('/api/config/perfil', data),
    cambiarPassword:  (data) => apiClient.put('/api/config/password', data),
    eliminarCuenta:   (pass) => apiClient.delete('/api/config/cuenta', { data: { password: pass } }),
};