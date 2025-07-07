import { recognizeHandwriting } from '../logic/handwriting';

// Configuración del worker
self.onmessage = async (e: MessageEvent) => {
  try {
    const { imageBlob } = e.data;

    // Notificar inicio
    self.postMessage({ type: 'progress', payload: { progress: 0 } });

    // Procesar imagen
    const result = await recognizeHandwriting(imageBlob);

    // Enviar resultado
    self.postMessage({
      type: 'result',
      payload: result,
    });
  } catch (error) {
    // Manejar error
    self.postMessage({
      type: 'error',
      payload: {
        message:
          error instanceof Error
            ? error.message
            : 'Error desconocido al reconocer escritura',
      },
    });
  }
};

// Exportar tipo para TypeScript
export type HandwritingWorker = Worker;
