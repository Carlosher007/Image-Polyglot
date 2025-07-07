// Adapter para traducción con Ollama
import { isOllamaAvailable, translateWithOllama } from '../utils/ollama';

export interface TranslateResult {
  translatedText: string;
  durationMs: number;
  backend: 'ollama';
  detectedSourceLang?: string;
  actualTargetLang?: string;
}

// Adapter para traducción usando Ollama
export async function translateText(
  text: string,
  targetLang: string
): Promise<TranslateResult> {
  try {
    const startTime = performance.now();
    console.log(`[Translate] Iniciando traducción al idioma: ${targetLang}`);
    console.log(`[Translate] Texto a traducir: "${text.substring(0, 50)}..."`);

    // Si no hay texto, devolver resultado vacío
    if (!text || text.trim() === '') {
      console.log('[Translate] Texto vacío, retornando resultado vacío');
      return {
        translatedText: '',
        durationMs: 0,
        backend: 'ollama',
      };
    }

    // Verificar si Ollama está disponible
    const ollamaAvailable = await isOllamaAvailable();

    // Si Ollama no está disponible, mostrar error
    if (!ollamaAvailable) {
      console.error('[Translate] Ollama no disponible');
      throw new Error(
        'Ollama no está disponible para traducción. Por favor, asegúrate de que Ollama esté en ejecución.'
      );
    }

    // Usar Ollama para traducción
    console.log('[Translate] Usando Ollama para traducción');
    const translateResult = await translateWithOllama(text, targetLang);
    const durationMs = performance.now() - startTime;

    console.log(
      `[Translate] Traducción completada en ${durationMs.toFixed(2)}ms`
    );
    console.log(
      `[Translate] Texto traducido: "${translateResult.translatedText.substring(
        0,
        50
      )}..."`
    );
    console.log(
      `[Translate] Idioma detectado: ${translateResult.detectedSourceLang}, Idioma destino: ${translateResult.actualTargetLang}`
    );

    return {
      translatedText: translateResult.translatedText,
      durationMs,
      backend: 'ollama',
      detectedSourceLang: translateResult.detectedSourceLang,
      actualTargetLang: translateResult.actualTargetLang,
    };
  } catch (error) {
    console.error('Error en traducción:', error);
    throw new Error(
      `No se pudo traducir el texto: ${
        error instanceof Error ? error.message : 'Error desconocido'
      }`
    );
  }
}
