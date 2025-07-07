import { extractKeywords } from '../logic/keywords';

// Configuración del worker
self.onmessage = async (e: MessageEvent) => {
  try {
    console.log('[Keywords Worker] Mensaje recibido:', e.data);
    const { imageBlob, targetLang } = e.data;

    if (!imageBlob) {
      throw new Error('No se recibió ninguna imagen para procesar');
    }

    // Notificar inicio
    self.postMessage({
      type: 'progress',
      payload: {
        progress: 0,
        status: 'Iniciando extracción de palabras clave...',
      },
    });
    console.log('[Keywords Worker] Iniciando procesamiento de imagen', {
      blobSize: imageBlob.size,
      blobType: imageBlob.type,
      targetLang,
    });

    // Actualizamos el mensaje de progreso para indicar el idioma objetivo
    self.postMessage({
      type: 'progress',
      payload: {
        progress: 30,
        status: `Extrayendo palabras clave en ${
          targetLang === 'es' ? 'español' : 'inglés'
        }...`,
      },
    });

    // Procesar imagen
    const result = await extractKeywords(imageBlob, targetLang || 'es');
    console.log('[Keywords Worker] Procesamiento completado:', result);

    // Enviar resultado
    self.postMessage({
      type: 'success',
      payload: {
        ...result,
        targetLang: targetLang || 'es', // Incluimos el idioma objetivo en la respuesta
      },
    });
  } catch (error) {
    // Manejar error
    console.error('[Keywords Worker] Error:', error);
    self.postMessage({
      type: 'error',
      payload: {
        message:
          error instanceof Error
            ? error.message
            : 'Error desconocido en la extracción de palabras clave',
      },
    });
  }
};

// Exportar tipo para TypeScript
export type KeywordsWorker = Worker;
