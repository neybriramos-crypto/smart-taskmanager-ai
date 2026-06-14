// ─── Servicio centralizado de Gemini IA ──────────────────────
// Todas las llamadas a Gemini pasan por aquí.
// Si la clave no está configurada o falla, se usa un fallback heurístico.

let geminiModel = null;

try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel = client.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
    });
    console.log('✅ Gemini IA habilitado');
} catch (err) {
    console.warn('⚠️  Gemini no disponible, se usará fallback heurístico:', err.message);
}

// ── Helper: parsear JSON de la respuesta ─────────────────────
function parsearJSON(texto) {
    let limpio = texto.trim().replace(/^```json\s*/i, '').replace(/```$/,'').trim();
    try {
        return JSON.parse(limpio);
    } catch {
        const match = limpio.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
        if (match) return JSON.parse(match[1]);
        throw new Error('No se pudo parsear la respuesta JSON de Gemini');
    }
}

// ── 1. Generar subtareas para una tarea ──────────────────────
async function generarSubtareas(titulo, descripcion) {
    if (!geminiModel) {
        return [
            `Analizar los requisitos de: ${titulo}`,
            `Implementar la solución principal`,
            `Revisar y documentar los cambios`,
        ];
    }

    const prompt = `
Actúa como un experto en productividad y gestión de proyectos.
Desglosa la siguiente tarea en exactamente 3 o 4 subtareas accionables, cortas y claras.

Tarea: "${titulo}"
Descripción: "${descripcion || 'Sin descripción'}"

Responde ÚNICAMENTE con un arreglo JSON de strings, sin texto adicional:
["Subtarea 1", "Subtarea 2", "Subtarea 3"]
    `.trim();

    const resultado = await geminiModel.generateContent(prompt);
    return parsearJSON(resultado.response.text());
}

// ── 2. Priorizar lista de tareas ──────────────────────────────
async function priorizarTareas(tareas) {
    if (!geminiModel) {
        const mapa = { alta: 3, media: 2, baja: 1 };
        return tareas
            .slice()
            .sort((a, b) => (mapa[b.prioridad] || 0) - (mapa[a.prioridad] || 0))
            .map(t => ({ id: t.id, titulo: t.titulo, estimado_minutos: 30 }));
    }

    const lista = tareas
        .map(t => `- ID ${t.id}: ${t.titulo}${t.descripcion ? ' — ' + t.descripcion : ''}`)
        .join('\n');

    const prompt = `
Actúa como un asistente de productividad. Tienes esta lista de tareas:
${lista}

Ordénalas de mayor a menor prioridad lógica y estima el tiempo en minutos.
Responde ÚNICAMENTE con este JSON (sin texto extra):
[{"id": "<id>", "titulo": "<titulo>", "estimado_minutos": 30}]
    `.trim();

    const resultado = await geminiModel.generateContent(prompt);
    return parsearJSON(resultado.response.text());
}

// ── 3. Responder en el chat del asistente ─────────────────────
async function responderChat(mensajes, contextoTareas) {
    // mensajes = [{ rol: 'usuario'|'ia', contenido: '...' }]
    if (!geminiModel) {
        return 'El asistente IA no está disponible en este momento. Verifica tu GEMINI_API_KEY en el .env.';
    }

    // Reconstruimos el historial en formato Gemini
    const modeloChat = geminiModel.startChat({
        history: mensajes.slice(0, -1).map(m => ({
            role:  m.rol === 'usuario' ? 'user' : 'model',
            parts: [{ text: m.contenido }],
        })),
        generationConfig: { responseMimeType: 'text/plain' },
    });

    const sistema = `
Eres un asistente de productividad inteligente integrado en Smart Task Manager.
Sé conciso, práctico y amigable. Responde siempre en español.

Contexto actual del usuario:
${contextoTareas}
    `.trim();

    const ultimoMensaje = mensajes[mensajes.length - 1];
    const respuesta = await modeloChat.sendMessage(
        `[Sistema: ${sistema}]\n\nUsuario: ${ultimoMensaje.contenido}`
    );

    return respuesta.response.text();
}

module.exports = { generarSubtareas, priorizarTareas, responderChat };