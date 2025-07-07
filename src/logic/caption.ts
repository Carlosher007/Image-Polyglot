// Adapter para generación de caption con Ollama
import { isOllamaAvailable, describeImageWithOllama } from '../utils/ollama';

export async function generateCaption(
  imageData: Blob,
  targetLang: string = 'es'
): Promise<ImageProcessResult> {
  try {
    const startTime = performance.now();
    console.log('[Caption Logic] Iniciando generación de descripción');

    // Verificar si Ollama está disponible
    const ollamaAvailable = await isOllamaAvailable();

    if (!ollamaAvailable) {
      throw new Error(
        'Ollama no está disponible. Se requiere Ollama para generar descripciones.'
      );
    }

    console.log('[Caption Logic] Usando Ollama para generar descripción');

    // Convertir Blob a Base64
    const base64Image = await blobToBase64(imageData);

    // Crear un prompt específico según el idioma
    const prompt =
      targetLang === 'es'
        ? 'Describe esta imagen en detalle. Incluye los elementos principales, colores, acciones y contexto visible.'
        : 'Describe this image in detail. Include the main elements, colors, actions, and visible context.';

    // Generar descripción con Ollama
    const captionText = await describeImageWithOllama(base64Image, prompt);
    const durationMs = performance.now() - startTime;

    console.log(
      `[Caption Logic] Descripción generada con Ollama en ${durationMs.toFixed(
        2
      )}ms`
    );
    console.log(
      `[Caption Logic] Descripción: ${captionText.substring(0, 100)}...`
    );

    return {
      originalText: captionText,
      durationMs,
      backend: 'ollama',
    };
  } catch (error) {
    console.error('Error en Caption:', error);
    throw new Error(
      `No se pudo generar una descripción de la imagen: ${
        error instanceof Error ? error.message : 'Error desconocido'
      }`
    );
  }
}

// Función para convertir un Blob a Base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Quitar el prefijo "data:image/jpeg;base64," si existe
      const base64 = base64String.includes('base64,')
        ? base64String.split('base64,')[1]
        : base64String;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
