const { GoogleGenAI } = require("@google/genai");

// Validar que la variable de entorno esté presente y sea no vacía
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let ai = null;
const MODEL_NAME = "gemini-2.5-flash";

if (!GEMINI_API_KEY) {
    console.warn('Advertencia: falta la variable de entorno GEMINI_API_KEY. Las funciones de IA estarán deshabilitadas.');
} else {
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

function requireAI() {
    if (!ai) {
        const err = new Error('GEMINI_API_KEY no está configurado. Configura la variable de entorno GEMINI_API_KEY para usar las funciones de IA.');
        err.code = 'NO_AI';
        throw err;
    }
}

/**
 * Detecta si un error de Gemini corresponde a sobrecarga temporal del servicio
 * (503 / UNAVAILABLE), que normalmente se resuelve reintentando.
 */
function esErrorSobrecarga(error) {
    const status = error?.status || error?.response?.status;
    const mensaje = (error?.message || '').toLowerCase();
    return status === 503 || mensaje.includes('overloaded') || mensaje.includes('unavailable');
}

/**
 * Envuelve una llamada a la API de Gemini con reintentos automáticos
 * y backoff incremental cuando el servicio responde con sobrecarga (503).
 */
async function llamarConReintento(fn, intentos = 3, delayMs = 1000) {
    let ultimoError;
    for (let i = 0; i < intentos; i++) {
        try {
            return await fn();
        } catch (error) {
            ultimoError = error;
            if (esErrorSobrecarga(error) && i < intentos - 1) {
                const espera = delayMs * (i + 1);
                console.warn(`[iaService] Gemini sobrecargado, reintentando en ${espera}ms (intento ${i + 1}/${intentos})...`);
                await new Promise(resolve => setTimeout(resolve, espera));
                continue;
            }
            throw error;
        }
    }
    throw ultimoError;
}

/**
 * Limpia y parsea de forma segura el JSON devuelto por Gemini,
 * eliminando bloques de código markdown si la IA los incluye.
 */
function parsearJSON(texto) {
    const limpio = texto.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    try {
        return JSON.parse(limpio);
    } catch (e) {
        // Intento de rescate si hay texto extra alrededor del JSON
        const match = limpio.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
        if (match) return JSON.parse(match[1]);
        throw new Error('No se pudo parsear el JSON estructurado por la IA');
    }
}

const iaService = {
    /**
     * Generar Subtareas (JSON)
     */
    generarSubtareas: async (titulo, descripcion) => {
        try {
            requireAI();
            const prompt = `Eres un experto en gestión del tiempo y productividad. 
            Desglosa la siguiente tarea en exactamente 3 subtareas cortas, claras y accionables.
            
            Tarea principal: "${titulo}"
            Descripción: "${descripcion || 'Sin descripción proporcionada.'}"
            
            Responde ÚNICAMENTE con un arreglo JSON de strings, sin texto adicional ni introducciones:
            ["Subtarea 1", "Subtarea 2", "Subtarea 3"]`;

            const response = await llamarConReintento(() =>
                ai.models.generateContent({
                    model: MODEL_NAME,
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json"
                    }
                })
            );

            return parsearJSON(response.text);
        } catch (error) {
            console.error("Error en iaService.generarSubtareas:", error);
            throw error;
        }
    },

    /**
     * Priorizar Tareas (JSON) 
     */
    priorizarTareas: async (tareas) => {
        try {
            requireAI();
            const lista = tareas.map(t => `- ID ${t.id}: ${t.titulo} (${t.prioridad || 'baja'})`).join('\n');
            const prompt = `Ordena estas tareas de mayor a menor prioridad lógica y estima los minutos requeridos para completarlas.
            Lista de tareas:
            ${lista}
            
            Responde SOLO con este formato JSON válido, sin decoraciones markdown ni texto extra:
            [{"id": 1, "titulo": "...", "estimado_minutos": 30}]`;

            const response = await llamarConReintento(() =>
                ai.models.generateContent({
                    model: MODEL_NAME,
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json"
                    }
                })
            );

            return parsearJSON(response.text);
        } catch (error) {
            console.error("Error en iaService.priorizarTareas:", error);
            throw error;
        }
    },

    /**
     * Chat del Asistente
     */
    responderChat: async (mensajes, contextoTareas) => {
        try {
            requireAI();
            // Mapeo del historial al formato estructural esperado por el nuevo cliente de Google
            const contents = mensajes.map(m => ({
                role: m.rol === 'usuario' ? 'user' : 'model',
                parts: [{ text: m.contenido }]
            }));

            const response = await llamarConReintento(() =>
                ai.models.generateContent({
                    model: MODEL_NAME,
                    contents: contents,
                    config: {
                        systemInstruction: `Eres un asistente de productividad integrado en Smart Task Manager. 
                        Sé conciso, práctico y amigable. Responde siempre en español.
                        Contexto actual de las tareas del usuario: ${contextoTareas}`
                    }
                })
            );

            return response.text;
        } catch (error) {
            console.error("Error en iaService.responderChat:", error);
            throw error;
        }
    },

    /**
     * Análisis Completo de Productividad (Markdown)
     */
    analizarProductividad: async (stats, tareas) => {
        try {
            requireAI();
            const altasPendientes = tareas
                .filter(t => t.prioridad === 'alta' && t.estado !== 'completada')
                .map(t => t.titulo).join(', ') || 'ninguna';

            const vencidas = tareas
                .filter(t => t.fecha_limite && new Date(t.fecha_limite) < new Date() && t.estado !== 'completada')
                .map(t => t.titulo).join(', ') || 'ninguna';

            const prompt = `Eres un coach de productividad experto. Analiza este estado de trabajo y da recomendaciones concretas en español.

            ESTADÍSTICAS:
            - Total de tareas: ${stats.total}
            - Completadas: ${stats.completadas} (${stats.total ? Math.round(stats.completadas / stats.total * 100) : 0}%)
            - En progreso: ${stats.enProgreso || 0}
            - Pendientes: ${stats.pendientes}
            - Tareas de alta prioridad pendientes: ${altasPendientes}
            - Tareas vencidas: ${vencidas}

            Proporciona un informe bien formateado estructurado estrictamente en Markdown con:
            1. **Evaluación general** del progreso (2-3 oraciones)
            2. **Riesgos identificados** (lista de 2-3 puntos)
            3. **Recomendaciones concretas** para las próximas 24 horas (lista de 3-4 acciones específicas)
            4. **Estimación** de cuánto tiempo necesitas para ponerte al día.
            
            Sé directo, práctico y motivador.`;

            const response = await llamarConReintento(() =>
                ai.models.generateContent({
                    model: MODEL_NAME,
                    contents: prompt,
                })
            );

            return response.text;
        } catch (error) {
            console.error("Error en iaService.analizarProductividad:", error);
            throw error;
        }
    }
};

module.exports = iaService;