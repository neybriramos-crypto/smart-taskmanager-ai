"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function DashboardPage() {
  const router = useRouter();

  // Inicialización segura del usuario leyendo el localStorage directamente al nacer el componente
  const [usuario, setUsuario] = useState(() => {
    if (typeof window !== "undefined") {
      const usuarioGuardado = localStorage.getItem("usuario");
      return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
    }
    return null;
  });

  // Estados de la aplicación
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Control del estado del Modal de Creación
  const [modalAbierto, setModalAbierto] = useState(false);

  // Estados para los campos del formulario de la nueva tarea
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [prioridad, setPrioridad] = useState("baja");
  const [fechaLimite, setFechaLimite] = useState("");
  const [guardandoTarea, setGuardandoTarea] = useState(false);

  // ==========================================
  // NUEVOS ESTADOS PARA EDITAR Y ELIMINAR
  // ==========================================
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [tareaAEditar, setTareaAEditar] = useState(null); // Almacena el objeto completo de la tarea a modificar
  const [editandoTarea, setEditandoTarea] = useState(false);

  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [tareaAEliminar, setTareaAEliminar] = useState(null); // Almacena el objeto de la tarea a borrar
  const [eliminandoTarea, setEliminandoTarea] = useState(false);
  const [generandoMap, setGenerandoMap] = useState({});

  // Función reutilizable para cargar las tareas
  const cargarTareas = async (token) => {
    try {
      const response = await axios.get("http://localhost:5000/api/tareas", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTareas(response.data);
    } catch (err) {
      console.error("Error al cargar tareas:", err);
      setError("No se pudieron cargar las tareas. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Este efecto corre ÚNICAMENTE una vez cuando el componente se monta en el navegador
  useEffect(() => {
    const token = localStorage.getItem("token");
    const usuarioGuardado = localStorage.getItem("usuario");

    if (!token || !usuarioGuardado) {
      router.push("/login");
      return;
    }

    const timer = setTimeout(() => {
      cargarTareas(token);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Manejar el envío del formulario de Creación al Backend
  const handleCrearTarea = async (e) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    setGuardandoTarea(true);
    const token = localStorage.getItem("token");

    try {
      await axios.post(
        "http://localhost:5000/api/tareas",
        {
          titulo,
          descripcion,
          prioridad,
          fecha_limite: fechaLimite || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setTitulo("");
      setDescripcion("");
      setPrioridad("baja");
      setFechaLimite("");
      setModalAbierto(false);

      if (token) cargarTareas(token);
    } catch (err) {
      console.error("Error al crear la tarea:", err);
      alert("Hubo un error al intentar guardar la tarea. Verifica el backend.");
    } finally {
      setGuardandoTarea(false);
    }
  };

  // ==========================================
  // FUNCIONES PARA MANEJAR LA EDICIÓN (PUT)
  // ==========================================
  const abrirModalEditar = (tarea) => {
    setTareaAEditar(tarea);
    // Formatear fecha (YYYY-MM-DD) para que el input type="date" la reconozca correctamente
    const fechaFormateada = tarea.fecha_limite 
      ? new Date(tarea.fecha_limite).toISOString().split('T')[0] 
      : "";
    
    // Cargamos los estados de edición con los valores actuales de la tarea
    setTitulo(tarea.titulo);
    setDescripcion(tarea.descripcion || "");
    setPrioridad(tarea.prioridad);
    setFechaLimite(fechaFormateada);
    setModalEditarAbierto(true);
  };

  const handleEditarTarea = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !tareaAEditar) return;

    setEditandoTarea(true);
    const token = localStorage.getItem("token");

    try {
      await axios.put(
        `http://localhost:5000/api/tareas/${tareaAEditar.id}`,
        {
          titulo,
          descripcion,
          prioridad,
          fecha_limite: fechaLimite || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Limpiar estados y cerrar modal
      setTitulo("");
      setDescripcion("");
      setPrioridad("baja");
      setFechaLimite("");
      setTareaAEditar(null);
      setModalEditarAbierto(false);

      // Refrescar la lista de tareas
      if (token) cargarTareas(token);
    } catch (err) {
      console.error("Error al editar la tarea:", err);
      alert("No se pudo actualizar la tarea. Verifica la ruta en tu backend.");
    } finally {
      setEditandoTarea(false);
    }
  };

  // ==========================================
  // FUNCIONES PARA MANEJAR LA ELIMINACIÓN (DELETE)
  // ==========================================
  const abrirModalEliminar = (tarea) => {
    setTareaAEliminar(tarea);
    setModalEliminarAbierto(true);
  };

  const handleEliminarTarea = async () => {
    if (!tareaAEliminar) return;

    setEliminandoTarea(true);
    const token = localStorage.getItem("token");

    try {
      await axios.delete(`http://localhost:5000/api/tareas/${tareaAEliminar.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setModalEliminarAbierto(false);
      setTareaAEliminar(null);

      // Refrescar la lista de tareas
      if (token) cargarTareas(token);
    } catch (err) {
      console.error("Error al eliminar la tarea:", err);
      alert("No se pudo eliminar la tarea. Verifica tu backend.");
    } finally {
      setEliminandoTarea(false);
    }
  };

  const setGeneratingState = (id, value) => {
    setGenerandoMap((prev) => ({ ...prev, [id]: value }));
  };

  const handleGenerarSubtareas = async (tarea) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert('Necesitas iniciar sesión para usar esta función');
      return;
    }

    setGeneratingState(tarea.id, true);
    try {
      await axios.post(
        `http://localhost:5000/api/tareas/${tarea.id}/generar-subtareas`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert('Subtareas generadas correctamente');
      cargarTareas(token);
    } catch (err) {
      console.error('Error al generar subtareas:', err);
      alert('No se pudieron generar las subtareas.');
    } finally {
      setGeneratingState(tarea.id, false);
    }
  };

  const handleCerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    router.push("/login");
  };

  // Función auxiliar para cerrar cualquier modal y limpiar los campos compartidos de los formularios
  const cerrarModalesYLimpiar = () => {
    setModalAbierto(false);
    setModalEditarAbierto(false);
    setModalEliminarAbierto(false);
    setTitulo("");
    setDescripcion("");
    setPrioridad("baja");
    setFechaLimite("");
    setTareaAEditar(null);
    setTareaAEliminar(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 font-medium animate-pulse">Cargando tu espacio de trabajo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Barra de Navegación Superior */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 text-white p-2 rounded-xl font-bold text-lg tracking-wider">
            ST
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Smart Task Manager <span className="text-blue-600 font-extrabold">AI</span>
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-slate-600 font-medium hidden sm:inline">
            Hola, <strong className="text-slate-900">{usuario?.nombre}</strong>
          </span>
          <button
            onClick={handleCerrarSesion}
            className="text-sm px-4 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 font-medium rounded-xl transition-all"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Encabezado del Tablero */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Mis Tareas Inteligentes
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Gestiona y optimiza tus actividades diarias de manera eficiente.
            </p>
          </div>
          <button 
            onClick={() => setModalAbierto(true)}
            className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-medium px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition-all text-sm"
          >
            + Nueva Tarea
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg">
            {error}
          </div>
        )}

        {/* Listado / Grid de Tareas */}
        {tareas.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-xl mx-auto shadow-sm mt-8">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-bold text-slate-900">¿Qué haremos hoy?</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
              Aún no tienes tareas creadas en tu tablero. Haz clic en Nueva Tarea para empezar a organizar tu día.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tareas.map((tarea) => (
              <div
                key={tarea.id}
                className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider ${
                        tarea.prioridad === "alta"
                          ? "bg-red-50 text-red-700"
                          : tarea.prioridad === "media"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {tarea.prioridad}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {tarea.estado || "pendiente"}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1">
                    {tarea.titulo}
                  </h4>
                  <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                    {tarea.descripcion || "Sin descripción proporcionada."}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-2 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <div>
                    📅 Límite: {tarea.fecha_limite ? new Date(tarea.fecha_limite).toLocaleDateString() : "Flexible"}
                  </div>
                  <div className="flex space-x-2">
                    {/* ENLACE DE BOTONES CLÁSICOS ASOCIADOS A LAS NUEVAS FUNCIONES */}
                    <button 
                      onClick={() => abrirModalEditar(tarea)}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleGenerarSubtareas(tarea)}
                      disabled={generandoMap[tarea.id]}
                      className="text-emerald-600 hover:underline font-semibold"
                    >
                      {generandoMap[tarea.id] ? 'Generando...' : 'Generar subtareas'}
                    </button>
                    <button 
                      onClick={() => abrirModalEliminar(tarea)}
                      className="text-red-500 hover:underline font-semibold"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* =======================================================
          1. VENTANA MODAL EMERGENTE PARA NUEVA TAREA
          ======================================================= */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 flex flex-col overflow-hidden transform scale-100 transition-all">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Agregar Nueva Tarea</h3>
              <button onClick={cerrarModalesYLimpiar} className="text-slate-400 hover:text-slate-600 text-xl font-medium p-1">✕</button>
            </div>

            <form onSubmit={handleCrearTarea} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Título de la tarea *</label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Estudiar para la evaluación de PHP"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Descripción</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Añade detalles específicos sobre esta actividad..."
                  rows="3"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Prioridad</label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Fecha Límite</label>
                  <input
                    type="date"
                    value={fechaLimite}
                    onChange={(e) => setFechaLimite(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 mt-6">
                <button type="button" onClick={cerrarModalesYLimpiar} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 font-medium rounded-xl transition-all">Cancelar</button>
                <button type="submit" disabled={guardandoTarea || !titulo.trim()} className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl shadow-md transition-all">
                  {guardandoTarea ? "Guardando..." : "Guardar Tarea"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================
          2. NUEVO MODAL: EDITAR TAREA EXISTENTE (PUT)
          ======================================================= */}
      {modalEditarAbierto && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 flex flex-col overflow-hidden transform scale-100 transition-all">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Modificar Tarea</h3>
              <button onClick={cerrarModalesYLimpiar} className="text-slate-400 hover:text-slate-600 text-xl font-medium p-1">✕</button>
            </div>

            <form onSubmit={handleEditarTarea} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Título de la tarea *</label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Descripción</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Prioridad</label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Fecha Límite</label>
                  <input
                    type="date"
                    value={fechaLimite}
                    onChange={(e) => setFechaLimite(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 mt-6">
                <button type="button" onClick={cerrarModalesYLimpiar} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 font-medium rounded-xl transition-all">Cancelar</button>
                <button type="submit" disabled={editandoTarea || !titulo.trim()} className="px-5 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 text-white font-medium rounded-xl shadow-md transition-all">
                  {editandoTarea ? "Actualizando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================
          3. NUEVO MODAL: CONFIRMACIÓN DE ELIMINACIÓN (DELETE)
          ======================================================= */}
      {modalEliminarAbierto && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-100 overflow-hidden transform scale-100 transition-all p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <span className="text-red-600 font-bold text-xl">⚠️</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">¿Eliminar esta tarea?</h3>
            <p className="text-slate-500 text-sm mb-6">
              ¿Estás seguro de que deseas eliminar <strong>{tareaAEliminar?.titulo}</strong>? Esta acción no se puede deshacer.
            </p>

            <div className="flex items-center justify-center space-x-3">
              <button
                type="button"
                onClick={cerrarModalesYLimpiar}
                className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 font-medium rounded-xl transition-all border border-slate-200"
              >
                No, cancelar
              </button>
              <button
                type="button"
                onClick={handleEliminarTarea}
                disabled={eliminandoTarea}
                className="px-5 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-xl shadow-md transition-all"
              >
                {eliminandoTarea ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}