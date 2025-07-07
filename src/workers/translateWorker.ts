import { translateText } from '../logic/translate';

// Configuración del worker
self.onmessage = async (e: MessageEvent) => {
  try {
    const { text, targetLang } = e.data;
    console.log('[TranslateWorker] Recibida solicitud de traducción:', {
      textLength: text.length,
      textPreview: text.substring(0, 50) + '...',
      targetLang,
    });

    // Notificar inicio
    self.postMessage({
      type: 'progress',
      payload: {
        progress: 0,
        status: `Iniciando traducción con detección automática...`,
      },
    });

    console.log('[TranslateWorker] Llamando a translateText...');

    // Traducir texto
    const result = await translateText(text, targetLang);
    console.log('[TranslateWorker] Traducción completada:', {
      translatedTextLength: result.translatedText.length,
      translatedTextPreview: result.translatedText.substring(0, 50) + '...',
      durationMs: result.durationMs,
      backend: result.backend,
    });

    // Notificar progreso
    self.postMessage({
      type: 'progress',
      payload: {
        progress: 50,
        status: `Traducción de ${
          result.detectedSourceLang === 'es'
            ? 'español'
            : result.detectedSourceLang === 'en'
            ? 'inglés'
            : 'idioma desconocido'
        } 
                 a ${
                   result.actualTargetLang === 'es'
                     ? 'español'
                     : result.actualTargetLang === 'en'
                     ? 'inglés'
                     : result.actualTargetLang
                 } 
                 completada en ${result.durationMs.toFixed(2)}ms.`,
      },
    });

    // Pequeña pausa para asegurar que los mensajes de progreso se muestren
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Enviar resultado
    console.log('[TranslateWorker] Enviando resultado de traducción');
    self.postMessage({
      type: 'success',
      payload: result,
    });
  } catch (error) {
    // Manejar error
    console.error('[TranslateWorker] Error en traducción:', error);
    self.postMessage({
      type: 'error',
      payload: {
        message:
          error instanceof Error
            ? error.message
            : 'Error desconocido en la traducción',
      },
    });
  }
};

// Exportar tipo para TypeScript
export type TranslateWorker = Worker;
