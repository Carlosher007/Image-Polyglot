// Adapter para OCR con Ollama
import { isOllamaAvailable, describeImageWithOllama } from '../utils/ollama';

export async function recognizeText(
  imageBlob: Blob,
  lang: string = 'eng'
): Promise<string> {
  console.log('[OCR Logic] Iniciando reconocimiento de texto');

  try {
    // Verificar disponibilidad de Ollama
    if (!(await isOllamaAvailable())) {
      throw new Error('Ollama no está disponible');
    }

    console.log('[OCR Logic] Usando Ollama para reconocimiento de texto');
    console.log(
      `[OCR Logic] Procesando imagen de tipo ${imageBlob.type} con tamaño ${imageBlob.size} bytes`
    );

    // Convertir el blob a base64
    const imageDataUrl = await blobToBase64(imageBlob);
    console.log('[OCR Logic] Imagen convertida a Base64 correctamente');

    // Prompt específico para OCR
    const ocrPrompt =
      'Extrae todo el texto visible en esta imagen. Devuelve SOLO el texto, sin explicaciones adicionales, sin formateo y sin comentarios. Si no hay texto, responde "No hay texto visible".';

    // Usar Ollama para el reconocimiento de texto
    const recognizedText = await describeImageWithOllama(
      imageDataUrl,
      ocrPrompt,
      'minicpm-v:latest'
    );

    if (!recognizedText || recognizedText.trim() === '') {
      throw new Error('No se obtuvo respuesta del OCR');
    }

    console.log(
      `[OCR Logic] Texto reconocido exitosamente: ${recognizedText.substring(
        0,
        100
      )}...`
    );
    return recognizedText.trim();
  } catch (error) {
    console.error('[OCR Logic] Error en OCR:', error);
    throw new Error(
      `No se pudo reconocer el texto de la imagen: ${
        error instanceof Error ? error.message : 'Error desconocido'
      }`
    );
  }
}

// Función auxiliar para convertir un Blob a base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const result = reader.result as string;

        if (!result) {
          reject(new Error('No se pudo leer el blob'));
          return;
        }

        // Verificar que tenga el formato correcto de data URL
        if (!result.startsWith('data:')) {
          reject(new Error('Resultado no es una data URL válida'));
          return;
        }

        // Limpiar y validar el base64
        const dataUrlParts = result.split(';base64,');
        if (dataUrlParts.length !== 2) {
          reject(new Error('Formato de data URL inválido'));
          return;
        }

        const mimeType = dataUrlParts[0];
        let base64Data = dataUrlParts[1];

        // Limpiar datos base64: remover espacios, saltos de línea y caracteres inválidos
        base64Data = base64Data
          .replace(/\s/g, '')
          .replace(/[^A-Za-z0-9+/=]/g, '');

        // Verificar padding correcto
        const remainder = base64Data.length % 4;
        if (remainder !== 0) {
          base64Data += '='.repeat(4 - remainder);
        }

        // Verificar que solo contenga caracteres base64 válidos
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Regex.test(base64Data)) {
          reject(new Error('Datos base64 contienen caracteres inválidos'));
          return;
        }

        // Reconstruir la data URL limpia
        const cleanDataUrl = `${mimeType};base64,${base64Data}`;

        console.log(
          `[OCR Logic] Data URL generada correctamente (${cleanDataUrl.length} caracteres)`
        );
        resolve(cleanDataUrl);
      } catch (error) {
        console.error(
          '[OCR Logic] Error procesando resultado del FileReader:',
          error
        );
        reject(
          new Error(
            `Error al procesar blob: ${
              error instanceof Error ? error.message : 'Error desconocido'
            }`
          )
        );
      }
    };

    reader.onerror = () => {
      console.error('[OCR Logic] Error del FileReader:', reader.error);
      reject(new Error('Error al leer el archivo de imagen'));
    };

    // Leer el blob como data URL
    reader.readAsDataURL(blob);
  });
}
