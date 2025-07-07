import { recognizeText } from '../logic/ocr';

// Configuración del worker
self.onmessage = async (e) => {
  console.log('[OCR Worker] Mensaje recibido:', e.data);

  const { imageBlob, lang } = e.data;

  try {
    console.log('[OCR Worker] Iniciando procesamiento de imagen', {
      blobSize: imageBlob.size,
      blobType: imageBlob.type,
      lang,
    });

    // Enviar progreso inicial
    self.postMessage({ type: 'progress', payload: { progress: 0 } });

    // Reconocer texto usando Ollama
    const recognizedText = await recognizeText(imageBlob, lang);

    // Enviar progreso final
    self.postMessage({ type: 'progress', payload: { progress: 100 } });

    // Enviar resultado exitoso
    self.postMessage({
      type: 'success',
      payload: {
        text: recognizedText,
        backend: 'ollama',
      },
    });
  } catch (error) {
    console.error('[OCR Worker] Error:', error);
    self.postMessage({
      type: 'error',
      payload: {
        message:
          error instanceof Error
            ? error.message
            : 'Error desconocido en OCR worker',
      },
    });
  }
};

// Exportar tipo para TypeScript
export type OcrWorker = Worker;
