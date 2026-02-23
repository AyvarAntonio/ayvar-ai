import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {

  constructor(private http: HttpClient) {
    this.loadQuotaState();
  }

  private cache = new Map<string, {response: string, timestamp: number}>();
  private lastRequestTime = Date.now();
  private requestCount = 0;
  private quotaExceeded = false;
  private quotaResetTime = 0;

  private localResponses = new Map([
    // Saludos
    ['hola', '¡Hola! ¿En qué puedo ayudarte? ⚡'],
    ['buenos días', '¡Buenos días! ¿Cómo estás? ⚡'],
    ['buenas tardes', '¡Buenas tardes! ¿En qué puedo ayudarte? ⚡'],
    ['buenas noches', '¡Buenas noches! ¿Qué necesitas? ⚡'],
    
    // Identidad
    ['quién eres', 'Soy Ayvar, tu asistente personal con IA. Estoy aquí para ayudarte de forma rápida. 🤖'],
    ['quien eres', 'Soy Ayvar, tu asistente personal con IA. Estoy aquí para ayudarte de forma rápida. 🤖'],
    ['qué eres', 'Soy Ayvar, un asistente de IA creado para ayudarte con tus preguntas y tareas. ✨'],
    ['que eres', 'Soy Ayvar, un asistente de IA creado para ayudarte con tus preguntas y tareas. ✨'],
    
    // Agradecimientos
    ['gracias', '¡De nada! Me alegra poder ayudar. ¿Necesitas algo más? 😊'],
    ['muchas gracias', '¡Por nada! Estoy aquí para lo que necesites. 😊'],
    ['thank you', 'You\'re welcome! Happy to help! 😊'],
    
    // Despedidas
    ['adiós', '¡Hasta luego! Que tengas un excelente día. 👋'],
    ['adios', '¡Hasta luego! Que tengas un excelente día. 👋'],
    ['bye', '¡Bye! Come back soon! 👋'],
    ['hasta luego', '¡Hasta pronto! Cuídate mucho. 👋'],
    
    // Capacidades
    ['qué puedes hacer', 'Puedo responder preguntas, ayudarte con tareas, explicar conceptos, dar consejos, y mucho más. ¿Qué necesitas? ✨'],
    ['que puedes hacer', 'Puedo responder preguntas, ayudarte con tareas, explicar conceptos, dar consejos, y mucho más. ¿Qué necesitas? ✨'],
    ['capacidades', 'Mis capacidades incluyen: responder preguntas, ayudar con tareas de escritura, explicar conceptos complejos, dar ideas creativas, y mantener conversaciones naturales. ¿Qué te gustaría explorar? 🚀'],
    
    // Estado
    ['cómo estás', '¡Estoy muy bien, listo para ayudarte! ¿Y tú? 😊'],
    ['como estas', '¡Estoy muy bien, listo para ayudarte! ¿Y tú? 😊'],
    ['qué tal', '¡Todo bien! Aquí listo para ayudarte. ¿Qué necesitas? 😊'],
    ['que tal', '¡Todo bien! Aquí listo para ayudarte. ¿Qué necesitas? 😊'],
    
    // Preguntas comunes
    ['qué hora es', 'No tengo acceso a la hora actual, pero puedes verla en tu dispositivo. ⏰'],
    ['que hora es', 'No tengo acceso a la hora actual, pero puedes verla en tu dispositivo. ⏰'],
    ['qué día es hoy', 'No tengo acceso al calendario, pero puedes ver la fecha en tu dispositivo. 📅'],
    ['que dia es hoy', 'No tengo acceso al calendario, pero puedes ver la fecha en tu dispositivo. 📅'],
    
    // Ayuda
    ['ayuda', 'Claro, ¿en qué necesitas ayuda? Puedo asistirte con preguntas, tareas, explicaciones, y más. 🤝'],
    ['help', 'Sure, how can I help you? I can answer questions, help with tasks, explain things, and more. 🤝'],
    
    // Consejos rápidos
    ['consejo', 'Un buen consejo: Siempre confía en ti mismo y nunca dejes de aprender. 🌟'],
    ['tip', 'Here\'s a tip: Stay curious and keep learning every day! 🌟'],
    
    // Frases motivacionales
    ['motivación', '¡Tú puedes lograr todo lo que te propongas! El éxito es la suma de pequeños esfuerzos repetidos día tras día. 💪'],
    ['motivation', 'You can achieve anything you set your mind to! Success is the sum of small efforts repeated day after day. 💪'],
    
    // Relaciones
    ['le gusto a alguien', '¡Excelente pregunta! Aquí hay algunos consejos:\n\n1. Observa las señales: contacto visual, sonrisas, buscar tu compañía\n2. Comunícate abiertamente pero con respeto\n3. Sé auténtico, no finjas ser quien no eres\n4. Construye una conexión genuina basada en intereses comunes\n5. Da el primer paso cuando sientas que es el momento adecuado\n\n¿Quieres que profundice en algún aspecto específico? 💕'],
    ['gusta a alguien', '¡Excelente pregunta! Aquí hay algunos consejos:\n\n1. Observa las señales: contacto visual, sonrisas, buscar tu compañía\n2. Comunícate abiertamente pero con respeto\n3. Sé auténtico, no finjas ser quien no eres\n4. Construye una conexión genuina basada en intereses comunes\n5. Da el primer paso cuando sientas que es el momento adecuado\n\n¿Quieres que profundice en algún aspecto específico? 💕']
  ]);

  sendMessageFast(prompt: string): Observable<string> {
    return new Observable(observer => {
      // 1. Verificar cuota
      if (this.quotaExceeded && Date.now() < this.quotaResetTime) {
        const waitTime = Math.ceil((this.quotaResetTime - Date.now()) / 1000);
        console.log(`⏳ Cuota excedida. Usando respuestas locales por ${waitTime}s`);
        
        const localResponse = this.findBestLocalResponse(prompt);
        if (localResponse) {
          observer.next(localResponse + `\n\n[Modo offline: La cuota se restablecerá en ${waitTime} segundos]`);
        } else {
          observer.next(`⏰ Límite de peticiones alcanzado. La cuota se restablecerá en ${waitTime} segundos. Por favor espera.`);
        }
        observer.complete();
        return;
      }

      // 2. Normalizar prompt
      const normalizedPrompt = prompt.toLowerCase().trim();
      
      // 3. Verificar respuestas locales exactas
      if (this.localResponses.has(normalizedPrompt)) {
        console.log('⚡ Respuesta local instantánea');
        observer.next(this.localResponses.get(normalizedPrompt)!);
        observer.complete();
        return;
      }

      // 4. Verificar caché
      const cached = this.cache.get(normalizedPrompt);
      if (cached && Date.now() - cached.timestamp < 3600000) {
        console.log('⚡ Respuesta desde caché');
        observer.next(cached.response);
        observer.complete();
        return;
      }

      // 5. Control de ratio
      const now = Date.now();
      if (now - this.lastRequestTime < 2000) {
        console.log('⏳ Respetando límite de ratio...');
        setTimeout(() => {
          this.executeRequest(prompt, normalizedPrompt, observer);
        }, 2000);
      } else {
        this.executeRequest(prompt, normalizedPrompt, observer);
      }
    });
  }

  private executeRequest(prompt: string, normalizedPrompt: string, observer: any) {
    this.lastRequestTime = Date.now();
    this.requestCount++;
    

    console.log('⏳ Enviando a Netlify Function...');

    this.http.post<any>('/.netlify/functions/chat', {
      message: prompt
    }).subscribe({
     next: (data: any) => {
  console.log("RESPUESTA CRUDA:", data);

  const text = data?.text || "Sin respuesta válida";

  observer.next(text);
  observer.complete();
},
      error: (error) => {
        console.error('❌ Error:', error);

        if (error.status === 429) {
          this.quotaExceeded = true;
          this.quotaResetTime = Date.now() + 24 * 60 * 60 * 1000;
          this.saveQuotaState();
          
          const localResponse = this.findBestLocalResponse(prompt);
          if (localResponse) {
            observer.next(localResponse + '\n\n[Límite alcanzado. Usando respuestas locales por hoy.]');
          } else {
            observer.next('⏰ Límite de peticiones diarias alcanzado. Vuelve mañana.');
          }
        } else {
          observer.next(this.findBestLocalResponse(prompt) || 'Error al obtener respuesta. Intenta de nuevo.');
        }

        observer.complete();
      }
    });
  }

  private findBestLocalResponse(prompt: string): string | null {
    const lower = prompt.toLowerCase();
    
    // Relaciones y amor
    if (lower.includes('gusta') || lower.includes('amor') || lower.includes('quiero') || lower.includes('relación')) {
      return `Aquí tienes algunos consejos sobre relaciones:

✨ **Señales de que le gustas a alguien:**
• Contacto visual frecuente y sonrisas
• Busca excusas para estar cerca de ti
• Recuerda detalles sobre ti
• Se pone nervioso/a a tu alrededor

💬 **Cómo actuar:**
1. Sé auténtico y natural
2. Inicia conversaciones sobre intereses comunes
3. Escucha activamente y muestra interés genuino
4. Respeta los tiempos y espacios
5. Cuando sientas confianza, sé honesto sobre tus sentimientos

¿Quieres que profundice en algún aspecto específico? 💕`;
    }
    
    // Filosofía y preguntas profundas
    if (lower.includes('sentido de la vida') || lower.includes('existencia')) {
      return `El sentido de la vida es una pregunta profunda que ha acompañado a la humanidad siempre. 

Algunas perspectivas:

🌟 **Filosófica**: El sentido lo construimos nosotros mismos a través de nuestras experiencias, relaciones y propósito personal.

🔬 **Científica**: Desde la biología, nuestro "propósito" sería perpetuar la vida y contribuir al ecosistema.

💫 **Espiritual**: Muchas tradiciones hablan de crecimiento personal, conexión con los demás y trascendencia.

🎯 **Práctica**: El sentido puede estar en las pequeñas cosas: disfrutar el presente, ayudar a otros, aprender algo nuevo, amar y ser amado.

¿Qué aspecto te gustaría explorar más?`;
    }
    
    // Tecnología
    if (lower.includes('programación') || lower.includes('programar') || lower.includes('código')) {
      return `¡Claro! La programación es fascinante. 

**Para empezar a programar:**
1. Elige un lenguaje: Python es ideal para principiantes
2. Practica diariamente, aunque sea 30 minutos
3. Construye proyectos pequeños
4. Usa recursos como freeCodeCamp, Codecademy
5. Únete a comunidades de desarrolladores

**Conceptos básicos:**
• Variables y tipos de datos
• Estructuras de control (if, loops)
• Funciones
• Arrays y objetos

¿Sobre qué tema específico te gustaría aprender? 💻`;
    }
    
    // Por defecto, respuestas generales
    if (lower.includes('hola') || lower.includes('buenos')) {
      return '¡Hola! ¿En qué puedo ayudarte hoy?';
    }
    
    if (lower.includes('gracias')) {
      return '¡De nada! Estoy aquí para ayudar.';
    }
    
    return null;
  }

  continueConversation(context: string, lastPrompt: string): Observable<string> {
    if (this.quotaExceeded && Date.now() < this.quotaResetTime) {
      return of('⏰ Límite de peticiones diarias alcanzado. Vuelve mañana para continuar esta conversación.');
    }
    
    const fullPrompt = `Basado en nuestra conversación anterior: ${context}. 
    Ahora el usuario dice: "${lastPrompt}". 
    Por favor continúa con una respuesta completa y natural.`;
    
    return this.sendMessageFast(fullPrompt);
  }

  private saveQuotaState() {
    localStorage.setItem('gemini_quota', JSON.stringify({
      quotaExceeded: this.quotaExceeded,
      quotaResetTime: this.quotaResetTime
    }));
  }

  private loadQuotaState() {
    const saved = localStorage.getItem('gemini_quota');
    if (saved) {
      const state = JSON.parse(saved);
      this.quotaExceeded = state.quotaExceeded;
      this.quotaResetTime = state.quotaResetTime;

      if (Date.now() > this.quotaResetTime) {
        this.quotaExceeded = false;
        this.quotaResetTime = 0;
      }
    }
  }

  clearCache() {
    this.cache.clear();
  }
}