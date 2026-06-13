'use client';
import { useState, useEffect, useRef } from 'react';

// ─── Paleta y tokens de diseño ───────────────────────────────────────────────
// Fondo:   #0D0F14  (casi negro azulado)
// Surface: #151922  (tarjetas)
// Border:  #1E2433
// Accent:  #6366F1  (índigo eléctrico — único riesgo estético)
// Texto:   #E8EAF0 / #8B92A5
// Éxito:   #10B981  Alta prioridad: #F43F5E  Media: #F59E0B  Baja: #6366F1

const COLORS = {
  bg: '#0D0F14',
  surface: '#151922',
  surfaceHover: '#1A2030',
  border: '#1E2433',
  borderHover: '#2D3A55',
  accent: '#6366F1',
  accentDim: '#6366F120',
  text: '#E8EAF0',
  muted: '#8B92A5',
  success: '#10B981',
  danger: '#F43F5E',
  warning: '#F59E0B',
  low: '#6366F1',
};

const PRIORIDAD_COLORS = {
  alta:  { bg: '#F43F5E18', text: '#F43F5E', dot: '#F43F5E' },
  media: { bg: '#F59E0B18', text: '#F59E0B', dot: '#F59E0B' },
  baja:  { bg: '#6366F118', text: '#A5B4FC', dot: '#6366F1' },
};

const ESTADO_LABELS = {
  pendiente:    'Pendiente',
  en_progreso:  'En progreso',
  completada:   'Completada',
};

// ─── Datos de demo (reemplaza con fetch real) ────────────────────────────────
const DEMO_TAREAS = [
  {
    id: 1,
    titulo: 'Rediseño del sistema de autenticación',
    descripcion: 'Migrar de JWT estático a refresh tokens con rotación automática.',
    prioridad: 'alta',
    estado: 'en_progreso',
    fecha_limite: '2025-07-15',
    subtareas: [
      { id: 1, texto: 'Revisar flujo actual de JWT', completada: 1 },
      { id: 2, texto: 'Implementar refresh token endpoint', completada: 0 },
      { id: 3, texto: 'Actualizar middleware de auth', completada: 0 },
    ],
  },
  {
    id: 2,
    titulo: 'Integrar Socket.io para tiempo real',
    descripcion: 'Permitir que varios usuarios vean cambios de tareas en vivo sin recargar.',
    prioridad: 'alta',
    estado: 'pendiente',
    fecha_limite: '2025-07-20',
    subtareas: [],
  },
  {
    id: 3,
    titulo: 'Panel de métricas de productividad',
    descripcion: 'Dashboard con gráficas de tareas completadas por semana.',
    prioridad: 'media',
    estado: 'pendiente',
    fecha_limite: '2025-08-01',
    subtareas: [
      { id: 4, texto: 'Diseñar esquema de datos de métricas', completada: 0 },
      { id: 5, texto: 'Crear endpoint /api/metricas', completada: 0 },
    ],
  },
  {
    id: 4,
    titulo: 'Notificaciones por email',
    descripcion: 'Enviar alertas cuando una tarea se acerca a su fecha límite.',
    prioridad: 'baja',
    estado: 'pendiente',
    fecha_limite: '2025-08-10',
    subtareas: [],
  },
  {
    id: 5,
    titulo: 'Modo colaborativo por equipos',
    descripcion: 'Asignar tareas a miembros del equipo con permisos granulares.',
    prioridad: 'media',
    estado: 'completada',
    fecha_limite: '2025-06-30',
    subtareas: [
      { id: 6, texto: 'Modelo de datos de equipos', completada: 1 },
      { id: 7, texto: 'API de membresías', completada: 1 },
      { id: 8, texto: 'UI de invitación de miembros', completada: 1 },
    ],
  },
];

// ─── Componente principal ────────────────────────────────────────────────────
export default function Dashboard() {
  const [tareas, setTareas] = useState(DEMO_TAREAS);
  const [filtro, setFiltro] = useState('todas');
  const [cargandoIA, setCargandoIA] = useState({});
  const [chatAbierto, setChatAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([
    { rol: 'ia', texto: '¡Hola! Soy tu asistente de productividad. Puedo ayudarte a priorizar tareas, generar subtareas o analizar tu carga de trabajo. ¿En qué te ayudo?' },
  ]);
  const [inputChat, setInputChat] = useState('');
  const [cargandoChat, setCargandoChat] = useState(false);
  const [modalNueva, setModalNueva] = useState(false);
  const [nuevaTarea, setNuevaTarea] = useState({ titulo: '', descripcion: '', prioridad: 'media', fecha_limite: '' });
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : '');

  const tareasFiltradas = tareas.filter(t =>
    filtro === 'todas' ? true : t.estado === filtro
  );

  const stats = {
    total:      tareas.length,
    completadas: tareas.filter(t => t.estado === 'completada').length,
    enProgreso:  tareas.filter(t => t.estado === 'en_progreso').length,
    pendientes:  tareas.filter(t => t.estado === 'pendiente').length,
  };

  const progreso = Math.round((stats.completadas / stats.total) * 100);

  // ── Generar subtareas IA ───────────────────────────────────────────────────
  const generarSubtareas = async (tareaId) => {
    setCargandoIA(p => ({ ...p, [tareaId]: true }));
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:5000/api/tareas/${tareaId}/subtareas-ia`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        setTareas(prev =>
          prev.map(t =>
            t.id === tareaId
              ? { ...t, subtareas: data.subtareas.map((s, i) => ({ id: `ia-${i}`, texto: s, completada: 0 })) }
              : t
          )
        );
      }
    } catch (err) {
      // fallback demo
      setTareas(prev =>
        prev.map(t =>
          t.id === tareaId
            ? { ...t, subtareas: [
                { id: 'ia-1', texto: 'Analizar requisitos', completada: 0 },
                { id: 'ia-2', texto: 'Implementar solución', completada: 0 },
                { id: 'ia-3', texto: 'Revisar y documentar', completada: 0 },
              ]}
            : t
        )
      );
    } finally {
      setCargandoIA(p => ({ ...p, [tareaId]: false }));
    }
  };

  // ── Toggle subtarea ────────────────────────────────────────────────────────
  const toggleSubtarea = async (tareaId, subId, nuevoEstado) => {
    setTareas(prev =>
      prev.map(t =>
        t.id === tareaId
          ? { ...t, subtareas: t.subtareas.map(s => s.id === subId ? { ...s, completada: nuevoEstado ? 1 : 0 } : s) }
          : t
      )
    );
    try {
      const token = getToken();
      await fetch(`http://localhost:5000/api/tareas/subtareas/${subId}/toggle`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ completada: nuevoEstado }),
      });
    } catch { /* optimistic update ya aplicado */ }
  };

  // ── Chat IA ────────────────────────────────────────────────────────────────
  const enviarMensaje = async () => {
    if (!inputChat.trim() || cargandoChat) return;
    const msg = inputChat.trim();
    setInputChat('');
    setMensajes(prev => [...prev, { rol: 'usuario', texto: msg }]);
    setCargandoChat(true);

    try {
      const contexto = `El usuario tiene ${tareas.length} tareas: ${tareas.map(t => `"${t.titulo}" (${t.prioridad}, ${t.estado})`).join(', ')}.`;
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: `Eres un asistente de productividad inteligente integrado en Smart Task Manager. Eres conciso, práctico y amigable. Contexto actual del usuario: ${contexto}`,
          messages: [
            ...mensajes.filter(m => m.rol !== 'ia' || mensajes.indexOf(m) > 0).map(m => ({
              role: m.rol === 'usuario' ? 'user' : 'assistant',
              content: m.texto,
            })),
            { role: 'user', content: msg },
          ],
        }),
      });
      const data = await res.json();
      const respuesta = data.content?.[0]?.text || 'No pude procesar tu consulta.';
      setMensajes(prev => [...prev, { rol: 'ia', texto: respuesta }]);
    } catch {
      setMensajes(prev => [...prev, { rol: 'ia', texto: 'Error de conexión. Verifica que la API esté configurada correctamente.' }]);
    } finally {
      setCargandoChat(false);
    }
  };

  // ── Crear tarea ────────────────────────────────────────────────────────────
  const crearTarea = async () => {
    if (!nuevaTarea.titulo.trim()) return;
    const id = Date.now();
    setTareas(prev => [...prev, { ...nuevaTarea, id, estado: 'pendiente', subtareas: [] }]);
    setNuevaTarea({ titulo: '', descripcion: '', prioridad: 'media', fecha_limite: '' });
    setModalNueva(false);
    // TODO: fetch POST al backend
  };

  // ── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, color: COLORS.text, fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, width: 220, height: '100vh',
        background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`,
        display: 'flex', flexDirection: 'column', padding: '24px 16px', zIndex: 100,
      }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✦</div>
            <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px' }}>Smart Tasks</span>
          </div>
          <span style={{ fontSize: 11, color: COLORS.muted, marginLeft: 42 }}>AI</span>
        </div>

        {/* Nav */}
        {[
          { icon: '▦', label: 'Dashboard', active: true },
          { icon: '◈', label: 'Mis tareas' },
          { icon: '◉', label: 'Equipo' },
          { icon: '⌘', label: 'Análisis IA' },
          { icon: '◎', label: 'Configuración' },
        ].map(({ icon, label, active }) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
            borderRadius: 8, marginBottom: 2, cursor: 'pointer',
            background: active ? COLORS.accentDim : 'transparent',
            color: active ? COLORS.accent : COLORS.muted,
            fontSize: 13, fontWeight: active ? 600 : 400,
            transition: 'background 0.15s',
          }}>
            <span style={{ fontSize: 14 }}>{icon}</span>
            {label}
          </div>
        ))}

        {/* Progreso global */}
        <div style={{ marginTop: 'auto', padding: '16px 12px', background: COLORS.bg, borderRadius: 10, border: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>Progreso semanal</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>{progreso}%</div>
          <div style={{ height: 4, background: COLORS.border, borderRadius: 2 }}>
            <div style={{ height: '100%', width: `${progreso}%`, background: COLORS.accent, borderRadius: 2, transition: 'width 0.4s' }} />
          </div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 6 }}>{stats.completadas} de {stats.total} tareas</div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ marginLeft: 220, padding: '28px 32px', minHeight: '100vh' }}>

        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>Mis Tareas</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: COLORS.muted }}>Lunes, 9 de junio 2025</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Avatar */}
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: COLORS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>N</div>
            <button
              onClick={() => setModalNueva(true)}
              style={{
                background: COLORS.accent, color: '#fff', border: 'none', borderRadius: 8,
                padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              + Nueva tarea
            </button>
          </div>
        </header>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Total', value: stats.total, color: COLORS.muted },
            { label: 'Pendientes', value: stats.pendientes, color: COLORS.warning },
            { label: 'En progreso', value: stats.enProgreso, color: COLORS.accent },
            { label: 'Completadas', value: stats.completadas, color: COLORS.success },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: COLORS.surface, border: `1px solid ${COLORS.border}`,
              borderRadius: 12, padding: '16px 20px',
            }}>
              <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { key: 'todas', label: 'Todas' },
            { key: 'pendiente', label: 'Pendientes' },
            { key: 'en_progreso', label: 'En progreso' },
            { key: 'completada', label: 'Completadas' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFiltro(key)}
              style={{
                padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                border: `1px solid ${filtro === key ? COLORS.accent : COLORS.border}`,
                background: filtro === key ? COLORS.accentDim : 'transparent',
                color: filtro === key ? COLORS.accent : COLORS.muted,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Grid de tareas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {tareasFiltradas.map(tarea => {
            const p = PRIORIDAD_COLORS[tarea.prioridad] || PRIORIDAD_COLORS.baja;
            const subtareasTotal = tarea.subtareas.length;
            const subtareasHechas = tarea.subtareas.filter(s => s.completada).length;
            const subProg = subtareasTotal > 0 ? Math.round((subtareasHechas / subtareasTotal) * 100) : 0;
            const vencida = tarea.fecha_limite && new Date(tarea.fecha_limite) < new Date() && tarea.estado !== 'completada';

            return (
              <div key={tarea.id} style={{
                background: COLORS.surface,
                border: `1px solid ${tarea.estado === 'completada' ? COLORS.border : vencida ? '#F43F5E30' : COLORS.border}`,
                borderRadius: 14, padding: '18px 20px',
                display: 'flex', flexDirection: 'column', gap: 12,
                opacity: tarea.estado === 'completada' ? 0.65 : 1,
                transition: 'border-color 0.2s',
              }}>
                {/* Header tarjeta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                    background: p.bg, color: p.text, textTransform: 'uppercase', letterSpacing: '0.5px',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: p.dot, display: 'inline-block' }} />
                    {tarea.prioridad}
                  </span>
                  <span style={{
                    fontSize: 10, color: COLORS.muted, padding: '3px 8px',
                    background: COLORS.bg, borderRadius: 20, border: `1px solid ${COLORS.border}`,
                  }}>
                    {ESTADO_LABELS[tarea.estado]}
                  </span>
                </div>

                {/* Título y descripción */}
                <div>
                  <h3 style={{ margin: '0 0 5px', fontSize: 14, fontWeight: 600, lineHeight: 1.3, color: COLORS.text }}>
                    {tarea.titulo}
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: COLORS.muted, lineHeight: 1.5 }}>
                    {tarea.descripcion || 'Sin descripción.'}
                  </p>
                </div>

                {/* Subtareas */}
                {subtareasTotal > 0 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Desglose IA</span>
                      <span style={{ fontSize: 10, color: COLORS.muted }}>{subtareasHechas}/{subtareasTotal}</span>
                    </div>
                    <div style={{ height: 3, background: COLORS.border, borderRadius: 2, marginBottom: 8 }}>
                      <div style={{ height: '100%', width: `${subProg}%`, background: COLORS.success, borderRadius: 2 }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {tarea.subtareas.map(sub => (
                        <label key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={!!sub.completada}
                            onChange={() => toggleSubtarea(tarea.id, sub.id, !sub.completada)}
                            style={{ accentColor: COLORS.accent, width: 14, height: 14 }}
                          />
                          <span style={{
                            fontSize: 12, color: sub.completada ? COLORS.muted : COLORS.text,
                            textDecoration: sub.completada ? 'line-through' : 'none',
                          }}>
                            {sub.texto}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: `1px solid ${COLORS.border}` }}>
                  <span style={{ fontSize: 11, color: vencida ? COLORS.danger : COLORS.muted }}>
                    {vencida ? '⚠ ' : ''}
                    {tarea.fecha_limite ? new Date(tarea.fecha_limite).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : 'Sin fecha'}
                  </span>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => generarSubtareas(tarea.id)}
                      disabled={!!cargandoIA[tarea.id]}
                      style={{
                        fontSize: 11, color: cargandoIA[tarea.id] ? COLORS.muted : COLORS.accent,
                        background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0,
                      }}
                    >
                      {cargandoIA[tarea.id] ? '⟳ IA...' : '✦ Generar IA'}
                    </button>
                    <button style={{ fontSize: 11, color: COLORS.muted, background: 'transparent', border: 'none', cursor: 'pointer' }}>Editar</button>
                    <button style={{ fontSize: 11, color: COLORS.danger, background: 'transparent', border: 'none', cursor: 'pointer' }}>Eliminar</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ── Chat IA flotante ── */}
      <>
        {/* Botón */}
        <button
          onClick={() => setChatAbierto(o => !o)}
          style={{
            position: 'fixed', bottom: 28, right: 28, width: 52, height: 52,
            borderRadius: '50%', background: COLORS.accent, border: 'none',
            cursor: 'pointer', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 24px ${COLORS.accent}50`, zIndex: 200, color: '#fff',
            transition: 'transform 0.2s',
          }}
          title="Asistente IA"
        >
          {chatAbierto ? '✕' : '✦'}
        </button>

        {/* Panel */}
        {chatAbierto && (
          <div style={{
            position: 'fixed', bottom: 90, right: 28, width: 360, height: 480,
            background: COLORS.surface, border: `1px solid ${COLORS.border}`,
            borderRadius: 16, display: 'flex', flexDirection: 'column',
            zIndex: 200, overflow: 'hidden',
            boxShadow: `0 8px 40px rgba(0,0,0,0.5)`,
          }}>
            {/* Header chat */}
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: COLORS.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: COLORS.accent }}>✦</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Asistente IA</div>
                <div style={{ fontSize: 11, color: COLORS.success, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.success, display: 'inline-block' }} />
                  Activo · Gemini 2.5 Flash
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {mensajes.map((m, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: m.rol === 'usuario' ? 'flex-end' : 'flex-start',
                }}>
                  <div style={{
                    maxWidth: '82%', padding: '9px 13px', borderRadius: m.rol === 'usuario' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: m.rol === 'usuario' ? COLORS.accent : COLORS.bg,
                    border: m.rol === 'ia' ? `1px solid ${COLORS.border}` : 'none',
                    fontSize: 12, lineHeight: 1.5, color: COLORS.text,
                  }}>
                    {m.texto}
                  </div>
                </div>
              ))}
              {cargandoChat && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: '9px 13px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '14px 14px 14px 4px', fontSize: 12, color: COLORS.muted }}>
                    IA pensando...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Sugerencias rápidas */}
            <div style={{ padding: '0 12px 8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['¿Qué debo hacer hoy?', 'Prioriza mis tareas', '¿Cuánto me falta?'].map(s => (
                <button
                  key={s}
                  onClick={() => { setInputChat(s); }}
                  style={{
                    fontSize: 11, padding: '4px 10px', borderRadius: 20,
                    background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                    color: COLORS.muted, cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input */}
            <div style={{ padding: '10px 12px', borderTop: `1px solid ${COLORS.border}`, display: 'flex', gap: 8 }}>
              <input
                value={inputChat}
                onChange={e => setInputChat(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && enviarMensaje()}
                placeholder="Pregunta sobre tus tareas..."
                style={{
                  flex: 1, background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                  borderRadius: 8, padding: '8px 12px', fontSize: 12, color: COLORS.text,
                  outline: 'none',
                }}
              />
              <button
                onClick={enviarMensaje}
                disabled={cargandoChat || !inputChat.trim()}
                style={{
                  background: COLORS.accent, border: 'none', borderRadius: 8,
                  padding: '8px 14px', cursor: 'pointer', fontSize: 14, color: '#fff',
                  opacity: cargandoChat || !inputChat.trim() ? 0.5 : 1,
                }}
              >
                ↑
              </button>
            </div>
          </div>
        )}
      </>

      {/* ── Modal nueva tarea ── */}
      {modalNueva && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
        }} onClick={e => e.target === e.currentTarget && setModalNueva(false)}>
          <div style={{
            background: COLORS.surface, border: `1px solid ${COLORS.border}`,
            borderRadius: 16, padding: 28, width: 440, display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Nueva tarea</h2>

            {[
              { label: 'Título *', key: 'titulo', type: 'text', placeholder: 'Ej: Implementar autenticación OAuth' },
              { label: 'Descripción', key: 'descripcion', type: 'textarea', placeholder: 'Contexto adicional...' },
              { label: 'Fecha límite', key: 'fecha_limite', type: 'date' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label style={{ fontSize: 12, color: COLORS.muted, display: 'block', marginBottom: 6 }}>{label}</label>
                {type === 'textarea' ? (
                  <textarea
                    rows={3}
                    value={nuevaTarea[key]}
                    onChange={e => setNuevaTarea(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ width: '100%', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '9px 12px', color: COLORS.text, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                  />
                ) : (
                  <input
                    type={type}
                    value={nuevaTarea[key]}
                    onChange={e => setNuevaTarea(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ width: '100%', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '9px 12px', color: COLORS.text, fontSize: 13, boxSizing: 'border-box' }}
                  />
                )}
              </div>
            ))}

            <div>
              <label style={{ fontSize: 12, color: COLORS.muted, display: 'block', marginBottom: 6 }}>Prioridad</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['baja', 'media', 'alta'].map(p => (
                  <button
                    key={p}
                    onClick={() => setNuevaTarea(prev => ({ ...prev, prioridad: p }))}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', textTransform: 'capitalize',
                      border: `1px solid ${nuevaTarea.prioridad === p ? PRIORIDAD_COLORS[p].dot : COLORS.border}`,
                      background: nuevaTarea.prioridad === p ? PRIORIDAD_COLORS[p].bg : 'transparent',
                      color: nuevaTarea.prioridad === p ? PRIORIDAD_COLORS[p].text : COLORS.muted,
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                onClick={() => setModalNueva(false)}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 13, background: 'transparent', border: `1px solid ${COLORS.border}`, color: COLORS.muted, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={crearTarea}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, background: COLORS.accent, border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                Crear tarea
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}