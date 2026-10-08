const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const reply = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });

export async function handler(event) {
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Método no permitido.' });

  let payload;
  try { payload = JSON.parse(event.body || '{}'); }
  catch { return reply(400, { error: 'La solicitud no es válida.' }); }

  const { message, history = [], mode = 'general', style = 'balanced' } = payload || {};
  if (typeof message !== 'string' || !message.trim() || message.length > 12000) {
    return reply(400, { error: 'Escribe un mensaje de entre 1 y 12 000 caracteres.' });
  }
  if (!process.env.GEMINI_API_KEY) return reply(503, { error: 'El servicio no está disponible en este momento.' });

  const modes = {
    general: 'Ayuda con preguntas, ideas y tareas de forma natural y útil.',
    create: 'Prioriza la creatividad, la escritura y las ideas originales, adaptándote a la intención del usuario.',
    code: 'Ayuda a programar y depurar. Da ejemplos de código claros, explica las decisiones y pregunta por el contexto necesario.',
    learn: 'Enseña paso a paso, con ejemplos sencillos y preguntas útiles para entender el nivel del usuario.',
  };
  const styles = {
    balanced: 'Da respuestas claras con el detalle adecuado a la pregunta.',
    concise: 'Sé breve y directo, conservando la información esencial.',
    detailed: 'Desarrolla las respuestas con explicaciones, ejemplos y pasos cuando sea útil.',
  };
  const turns = (Array.isArray(history) ? history : []).slice(-20)
    .filter(turn => turn && ['user', 'ai'].includes(turn.role) && typeof turn.content === 'string' && turn.content.trim())
    .map(turn => ({ role: turn.role === 'ai' ? 'model' : 'user', parts: [{ text: turn.content.slice(0, 16000) }] }));
  // Gemini exige que el usuario hable primero, incluso después de recortar el historial xd
  while (turns.length && turns[0].role !== 'user') turns.shift();
  turns.push({ role: 'user', parts: [{ text: message.trim() }] });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(55000),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: `Eres Ayvar, un asistente de inteligencia artificial cercano, capaz y honesto. Responde en el idioma del usuario, en español por defecto. Usa el contexto de la conversación para mantener continuidad. No finjas acciones, acceso a internet ni capacidades que no tienes. Usa Markdown para estructurar respuestas y bloques de código con su lenguaje. ${modes[mode] || modes.general} ${styles[style] || styles.balanced}` }] },
          contents: turns,
        }),
      },
    );
    if (!response.ok) {
      return reply(response.status === 429 ? 429 : 502, {
        error: response.status === 429
          ? 'Ayvar está recibiendo muchas solicitudes. Espera un momento y vuelve a intentarlo.'
          : 'No se pudo conectar con la IA. Inténtalo de nuevo en un momento.',
      });
    }
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts
      ?.filter(part => !part.thought && typeof part.text === 'string').map(part => part.text).join('') || '';
    if (!text.trim()) return reply(502, { error: 'No se obtuvo una respuesta. Prueba reformulando tu mensaje.' });
    return reply(200, { text });
  } catch (error) {
    const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    return reply(timedOut ? 504 : 502, {
      error: timedOut ? 'La respuesta está tardando demasiado. Vuelve a intentarlo.' : 'La conexión con la IA se interrumpió. Inténtalo otra vez.',
    });
  }
}
