// Intento de carga robusta del SDK de Gemini (si está instalado)
const db = require("../config/db");
const Tarea = require('../models/tareaModel');

let ai = null;
try {
    const ga = require('@google/generative-ai');
    const GoogleGenAI = ga.GoogleGenerativeAI || ga.GoogleGenAI || ga.default || ga;
    if (typeof GoogleGenAI === 'function') {
        try {
            try {
                // Intentar constructor que recibe string (versión antigua)
                ai = new GoogleGenAI(process.env.GEMINI_API_KEY);
            } catch (c1) {
                // Intentar constructor que recibe opciones en objeto
                ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            }
        } catch (initErr) {
            console.warn('No se pudo instanciar GoogleGenAI:', initErr.message);
            ai = null;
        }
    } else {
        console.warn('El paquete @google/generative-ai no exporta un constructor esperado. IA deshabilitada.');
    }
} catch (err) {
    console.warn('No se pudo cargar @google/generative-ai, IA deshabilitada:', err.message);
}

if (ai) {
    console.log('Integración de Gemini (IA) habilitada.');
} else {
    console.log('Integración de Gemini (IA) no habilitada — se usará el fallback heurístico.');
}

const tareaController = {
    crearTarea: async (req, res) => {
        const { titulo, descripcion, prioridad, fecha_limite } = req.body;
        const usuario_id = req.usuario.id;

        if (!titulo) {
            return res.status(400).json({ error: 'El título de la tarea es obligatorio' });
        }

        try {
            const nuevaTareaId = await Tarea.create(usuario_id, titulo, descripcion, prioridad, fecha_limite);
            res.status(201).json({
                mensaje: 'Tarea creada con éxito',
                tareaId: nuevaTareaId
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Hubo un error al crear la tarea' });
        }
    },

    obtenerTareas: async (req, res) => {
        const usuario_id = req.usuario.id;

        try {
            const tareas = await Tarea.findAllByUsuario(usuario_id);
            res.json(tareas);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Hubo un error al obtener las tareas' });
        }
    },

    actualizarTarea: async (req, res) => {
        const { id } = req.params;
        const usuario_id = req.usuario.id;

        try {
            const actualizado = await Tarea.update(id, usuario_id, req.body);
            if (!actualizado) {
                return res.status(404).json({ error: 'Tarea no encontrada o no tienes permisos para editarla' });
            }
            res.json({ mensaje: 'Tarea actualizada con éxito' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Hubo un error al actualizar la tarea' });
        }
    },

    eliminarTarea: async (req, res) => {
        const { id } = req.params;
        const usuario_id = req.usuario.id;

        try {
            const eliminado = await Tarea.delete(id, usuario_id);
            if (!eliminado) {
                return res.status(404).json({ error: 'Tarea no encontrada o no tienes permisos para eliminarla' });
            }
            res.json({ mensaje: 'Tarea estructura eliminada con éxito' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Hubo un error al eliminar la tarea' });
        }
    },

    // ==========================================================
    // MÉTODOS INTEGRADOS PARA INTELIGENCIA ARTIFICIAL (GEMINI)
    // ==========================================================
    generarSubtareasIA: async (req, res) => {
        const tareaId = req.params.id;

        try {
            // Buscar la tarea y validar que pertenezca al usuario autenticado
            const [tareas] = await db.query(
                "SELECT titulo, descripcion FROM tareas WHERE id = ? AND usuario_id = ?", 
                [tareaId, req.usuario.id]
            );
            
            if (tareas.length === 0) {
                return res.status(404).json({ error: "Tarea no encontrada o no autorizada" });
            }

            const { titulo, descripcion } = tareas[0];
            let listaSubtareas = null;

            if (ai) {
                // Configurar el modelo actualizado a gemini-2.5-flash
                const model = ai.getGenerativeModel({ 
                    model: "gemini-2.5-flash",
                    generationConfig: { responseMimeType: "application/json" }
                });

                const prompt = `
                    Actúa como un experto en productividad. Desglosa la siguiente tarea en exactamente 3 o 4 subtareas accionables, cortas y claras.
                    Tarea Principal: "${titulo}"
                    Descripción: "${descripcion || 'Sin descripción'}"

                    Debes responder ÚNICAMENTE con un arreglo JSON con el siguiente formato, sin agregar texto extra ni markdown:
                    [
                        "Subtarea corta 1",
                        "Subtarea corta 2",
                        "Subtarea corta 3"
                    ]
                `;

                const resultado = await model.generateContent(prompt);
                let respuestaTexto = resultado.response.text().trim();

                // Limpieza preventiva por si el modelo incluye bloques markdown de código
                if (respuestaTexto.startsWith("```")) {
                    respuestaTexto = respuestaTexto.replace(/^```json\s*/, "").replace(/```$/, "").trim();
                }

                // Parseo con extractor de contingencia por si la respuesta trae caracteres basura externos
                try {
                    listaSubtareas = JSON.parse(respuestaTexto);
                } catch (parseError) {
                    const coincidenciaJson = respuestaTexto.match(/\[\s*[\s\S]*?\s*\]/);
                    if (coincidenciaJson) {
                        listaSubtareas = JSON.parse(coincidenciaJson[0]);
                    } else {
                        throw parseError; 
                    }
                }
            } else {
                // Fallback simple cuando el SDK de Google no está disponible
                const heuristico = (titulo, descripcion) => {
                    const base = titulo || descripcion || 'Tarea';
                    return [
                        `Revisar: ${base} (análisis rápido)`,
                        `Implementar: ${base} (acción principal)`,
                        `Probar: ${base} (verificar resultados)`
                    ];
                };
                listaSubtareas = heuristico(titulo, descripcion);
            }

            // Guardar en la base de datos de forma paralela
            const queries = listaSubtareas.map(textoSubtarea => {
                return db.query("INSERT INTO subtareas (tarea_id, texto) VALUES (?, ?)", [tareaId, textoSubtarea]);
            });
            
            await Promise.all(queries);

            res.status(201).json({ 
                mensaje: "Subtareas generadas con éxito por la IA", 
                subtareas: listaSubtareas 
            });

        } catch (error) {
            console.error("Error en el asistente de IA:", error);
            res.status(500).json({ error: "Error interno al procesar las subtareas con IA" });
        }
    },

    obtenerSubtareas: async (req, res) => {
        try {
            const [subtareas] = await db.query(
                "SELECT id, texto, completada FROM subtareas WHERE tarea_id = ? ORDER BY creado_en ASC",
                [req.params.id]
            );
            res.json(subtareas);
        } catch (error) {
            console.error("Error al obtener subtareas:", error);
            res.status(500).json({ error: "Error al obtener las subtareas" });
        }
    },

    conmutarSubtarea: async (req, res) => {
        const { completada } = req.body; 
        const { subtareaId } = req.params;
        
        try {
            await db.query(
                "UPDATE subtareas SET completada = ? WHERE id = ?",
                [completada ? 1 : 0, subtareaId]
            );
            res.json({ mensaje: "Estado de la subtarea actualizado" });
        } catch (error) {
            console.error("Error al actualizar subtarea:", error);
            res.status(500).json({ error: "Error al actualizar la subtarea" });
        }
    },

    // Priorizar tareas con IA: recibe un arreglo de tareas (id, titulo, descripcion, prioridad opcional)
    priorizarTareasIA: async (req, res) => {
        const { tareas } = req.body;
        if (!Array.isArray(tareas) || tareas.length === 0) {
            return res.status(400).json({ error: 'Proporciona un arreglo de tareas a priorizar' });
        }

        try {
            let resultadoPrioridad = null;

            if (ai) {
                const model = ai.getGenerativeModel({
                    model: 'gemini-2.5-flash',
                    generationConfig: { responseMimeType: 'application/json' }
                });

                // Construir prompt con las tareas
                const lista = tareas.map(t => `- ${t.titulo}${t.descripcion ? ': ' + t.descripcion : ''}`).join('\n');
                const prompt = `Actúa como un asistente inteligente de productividad. Tienes la siguiente lista de tareas pendientes:\n${lista}\n\nDevuélvelas ordenadas por prioridad lógica (de mayor a menor) en JSON con este formato:\n[{"id": "<id>", "titulo": "<titulo>", "estimado_minutos": 30}, ...]\nNo agregues texto adicional.`;

                const r = await model.generateContent(prompt);
                let text = r.response.text().trim();

                if (text.startsWith("```")) {
                    text = text.replace(/^```json\s*/, "").replace(/```$/, "").trim();
                }

                try {
                    resultadoPrioridad = JSON.parse(text);
                } catch (parseError) {
                    const coincidenciaJson = text.match(/\[\s*[\s\S]*?\s*\]/);
                    if (coincidenciaJson) {
                        resultadoPrioridad = JSON.parse(coincidenciaJson[0]);
                    } else {
                        throw parseError;
                    }
                }
            } else {
                // Fallback heurístico: ordenar por campo prioridad (mayor primero), si no, por longitud de descripción
                const mapPrior = { alta: 3, media: 2, baja: 1 };
                const sorted = tareas.slice().sort((a, b) => {
                    const pa = (a.prioridad && mapPrior[a.prioridad.toLowerCase()]) || 0;
                    const pb = (b.prioridad && mapPrior[b.prioridad.toLowerCase()]) || 0;
                    if (pb !== pa) return pb - pa;
                    return (b.descripcion || '').length - (a.descripcion || '').length;
                });

                resultadoPrioridad = sorted.map(t => ({
                    id: t.id || null,
                    titulo: t.titulo,
                    estimado_minutos: (t.prioridad && mapPrior[t.prioridad.toLowerCase()] ? mapPrior[t.prioridad.toLowerCase()] * 30 : 30)
                }));
            }

            res.json({ orden: resultadoPrioridad });
        } catch (error) {
            console.error('Error al priorizar tareas con IA:', error);
            res.status(500).json({ error: 'Error al priorizar tareas' });
        }
    }
};

// Exportación limpia de todo el controlador unificado
module.exports = tareaController;