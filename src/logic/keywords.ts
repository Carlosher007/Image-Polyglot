import { isOllamaAvailable, describeImageWithOllama } from '../utils/ollama';
import { translateText } from './translate';

export async function extractKeywords(
  imageData: Blob,
  targetLang: string = 'es'
): Promise<ImageProcessResult> {
  try {
    const startTime = performance.now();
    console.log('[Keywords Logic] Iniciando extracción de palabras clave');
    console.log(`[Keywords Logic] Idioma objetivo: ${targetLang}`);

    // Verificar si Ollama está disponible
    const ollamaAvailable = await isOllamaAvailable();

    if (!ollamaAvailable) {
      throw new Error(
        'Ollama no está disponible. Se requiere Ollama para extraer palabras clave.'
      );
    }

    // Convertir Blob a Base64
    const base64Image = await blobToBase64(imageData);

    // Crear un prompt específico para extraer palabras clave
    // Primero extraemos palabras clave con un prompt neutral que favorece el idioma de la imagen
    const prompt =
      'Analiza esta imagen y extrae exactamente 5 palabras clave o conceptos principales que representen su contenido. Separa cada palabra clave con comas y responde SOLO con las palabras clave, sin frases ni explicaciones adicionales.';

    // Generar palabras clave con Ollama (estas estarán en el idioma de la imagen)
    const keywordsText = await describeImageWithOllama(base64Image, prompt);

    // Detectar el idioma de las palabras clave generadas
    const isSpanishKeywords =
      /[ñáéíóúü]/i.test(keywordsText) ||
      /\b(la|el|de|los|las|en|con|por|para|una|uno|un)\b/i.test(keywordsText);

    const isEnglishKeywords =
      /\b(the|and|or|of|in|on|at|by|for|with|about|from)\b/i.test(keywordsText);

    const detectedKeywordsLang = isSpanishKeywords
      ? 'es'
      : isEnglishKeywords
      ? 'en'
      : 'desconocido';
    console.log(
      `[Keywords Logic] Idioma detectado de palabras clave: ${detectedKeywordsLang}`
    );

    let finalKeywords = keywordsText;

    // Si el idioma detectado no coincide con el idioma objetivo, traducir
    if (
      (detectedKeywordsLang === 'es' && targetLang === 'en') ||
      (detectedKeywordsLang === 'en' && targetLang === 'es')
    ) {
      console.log(
        `[Keywords Logic] Se requiere traducción de palabras clave de ${detectedKeywordsLang} a ${targetLang}`
      );

      try {
        // Usar el módulo de traducción existente
        const translationResult = await translateText(keywordsText, targetLang);
        finalKeywords = translationResult.translatedText;

        console.log(
          `[Keywords Logic] Palabras clave traducidas: ${finalKeywords}`
        );
      } catch (translationError) {
        console.error(
          '[Keywords Logic] Error al traducir palabras clave:',
          translationError
        );
        // Si falla la traducción, usamos las palabras clave originales
        console.log(
          '[Keywords Logic] Usando palabras clave sin traducir debido al error'
        );
      }
    } else {
      console.log(
        `[Keywords Logic] No se requiere traducción, el idioma de las palabras clave (${detectedKeywordsLang}) ya coincide con el idioma objetivo (${targetLang}) o no se pudo detectar`
      );
    }

    const durationMs = performance.now() - startTime;

    console.log(
      `[Keywords Logic] Palabras clave generadas en ${durationMs.toFixed(2)}ms`
    );
    console.log(`[Keywords Logic] Palabras clave originales: ${keywordsText}`);
    console.log(`[Keywords Logic] Palabras clave finales: ${finalKeywords}`);

    return {
      originalText: finalKeywords,
      durationMs,
      backend: 'ollama',
    };
  } catch (error) {
    console.error('Error al extraer palabras clave:', error);
    throw new Error('No se pudieron extraer palabras clave de la imagen');
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
