import { generateCaption } from '../logic/caption';

// Configuración del worker
self.onmessage = async (e: MessageEvent) => {
  try {
    console.log('[Caption Worker] Mensaje recibido:', e.data);
    const { imageBlob, targetLang } = e.data;

    if (!imageBlob) {
      throw new Error('No se recibió ninguna imagen para procesar');
    }

    // Notificar inicio
    self.postMessage({
      type: 'progress',
      payload: {
        progress: 0,
        status: 'Iniciando generación de descripción...',
      },
    });
    console.log('[Caption Worker] Iniciando procesamiento de imagen', {
      blobSize: imageBlob.size,
      blobType: imageBlob.type,
      targetLang,
    });

    // Procesar imagen con el idioma especificado
    const result = await generateCaption(imageBlob, targetLang || 'es');
    console.log('[Caption Worker] Procesamiento completado:', result);

    // Enviar resultado
    self.postMessage({
      type: 'success',
      payload: result,
    });
  } catch (error) {
    // Manejar error
    console.error('[Caption Worker] Error:', error);
    self.postMessage({
      type: 'error',
      payload: {
        message:
          error instanceof Error
            ? error.message
            : 'Error desconocido al generar descripción',
      },
    });
  }
};

// Exportar tipo para TypeScript
export type CaptionWorker = Worker;
