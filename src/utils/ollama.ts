// Adaptador para comunicarse con Ollama API local
const OLLAMA_BASE_URL = 'http://localhost:11434';

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
    stop?: string[];
  };
}

export interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
}

export const ollamaModels = {
  translation: 'llama3.1:8b-instruct-q5_k_m', // Modelo para traducción de texto (mucho mejor que llama2)
  caption: 'minicpm-v:latest', // Modelo para descripción de imágenes
  ocr: 'minicpm-v:latest', // Modelo para reconocimiento de texto en imágenes (mismo modelo multimodal)
  default: 'phi3:3.8b-mini-4k-instruct-q4_K_M', // Modelo por defecto más ligero
};

// Función para verificar si Ollama está disponible
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    console.log('[Ollama] Verificando disponibilidad...');
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('[Ollama] Servidor disponible');
      return true;
    } else {
      console.warn('[Ollama] Servidor no disponible:', response.status);
      return false;
    }
  } catch (error) {
    console.error('[Ollama] Error al verificar disponibilidad:', error);
    return false;
  }
}

// Función para listar modelos disponibles en Ollama
export async function listOllamaModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

    const data = await response.json();
    return data.models?.map((model: { name: string }) => model.name) || [];
  } catch (error) {
    console.error('[Ollama] Error al listar modelos:', error);
    return [];
  }
}

// Función para generar texto usando Ollama
export async function generateWithOllama(
  request: OllamaGenerateRequest
): Promise<string> {
  try {
    console.log(`[Ollama] Generando texto con modelo ${request.model}...`);
    console.log(`[Ollama] Prompt: ${request.prompt.substring(0, 100)}...`);

    const startTime = performance.now();

    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    // Try to get the response content first as text
    const responseText = await response.text();
    let generatedText = '';

    try {
      // Try to parse as JSON
      const data = JSON.parse(responseText) as OllamaResponse;
      generatedText = data.response;
      console.log('[Ollama] Respuesta JSON válida procesada');
    } catch {
      // If not valid JSON, use the raw text as response
      console.log(
        '[Ollama] Respuesta no es JSON válido, usando texto completo'
      );
      generatedText = responseText.trim();

      // Check if it's a streaming response (contains multiple JSON objects)
      if (
        responseText.includes('{"model":') &&
        responseText.includes('"response":')
      ) {
        console.log(
          '[Ollama] Detectada posible respuesta en streaming, extrayendo texto...'
        );
        try {
          // Try to parse as multiple JSON lines and concatenate responses
          const lines = responseText
            .split('\n')
            .filter((line) => line.trim() !== '');
          let combinedResponse = '';

          for (const line of lines) {
            try {
              const lineData = JSON.parse(line) as OllamaResponse;
              combinedResponse += lineData.response;
            } catch {
              // Skip invalid lines
              console.log(
                '[Ollama] Línea no válida en respuesta de streaming:',
                line.substring(0, 50)
              );
            }
          }

          if (combinedResponse) {
            generatedText = combinedResponse;
            console.log(
              '[Ollama] Respuesta de streaming extraída correctamente'
            );
          }
        } catch (streamError) {
          console.log(
            '[Ollama] Error al procesar respuesta de streaming:',
            streamError
          );
          // Keep using the full text if stream parsing fails
        }
      }
    }

    const durationMs = performance.now() - startTime;
    console.log(`[Ollama] Texto generado en ${durationMs.toFixed(2)}ms`);
    console.log(`[Ollama] Respuesta: ${generatedText.substring(0, 100)}...`);

    // If we still have an empty response, throw an error
    if (!generatedText.trim()) {
      throw new Error('Respuesta vacía de Ollama');
    }

    return generatedText;
  } catch (error) {
    console.error('[Ollama] Error en generación:', error);
    throw new Error(
      `Error al generar texto con Ollama: ${
        error instanceof Error ? error.message : 'Error desconocido'
      }`
    );
  }
}

// Función para traducir texto usando Ollama
export async function translateWithOllama(
  text: string,
  targetLang: string
): Promise<{
  translatedText: string;
  detectedSourceLang: string;
  actualTargetLang: string;
}> {
  try {
    const model = ollamaModels.translation;

    // Mapear códigos de idioma a nombres legibles
    const languageNames: { [key: string]: string } = {
      es: 'español',
      en: 'inglés',
      fr: 'francés',
      de: 'alemán',
      it: 'italiano',
      pt: 'portugués',
      zh: 'chino',
      ja: 'japonés',
      ko: 'coreano',
      ru: 'ruso',
    };

    // Detectar automáticamente el idioma del texto
    const isSpanishText =
      /[ñáéíóúü¿¡]/i.test(text) ||
      /\b(es|la|el|de|que|y|a|en|un|ser|se|no|te|lo|le|da|su|por|son|con|para|al|una|su|del|está|todo|pero|más|hay|muy|fue|tener|como|donde)\b/i.test(
        text
      );

    const isEnglishText =
      /\b(the|and|or|but|in|on|at|to|for|of|with|by|from|up|about|into|through|during|before|after|above|below|between|among|under|over|since|until|while|because|although|however|therefore|moreover|furthermore|nevertheless|consequently|accordingly|indeed|certainly|obviously|apparently|perhaps|probably|possibly|definitely|absolutely)\b/i.test(
        text
      );

    // Ajustar automáticamente el idioma destino basado en el contenido detectado
    let actualTargetLang = targetLang;
    let detectedSourceLang = 'desconocido';

    if (isSpanishText) {
      detectedSourceLang = 'es';
      // Si se detectó idioma español y el destino era español, cambiar a inglés
      if (targetLang === 'es') {
        console.log(
          '[Ollama] Texto detectado en español, cambiando traducción a inglés automáticamente'
        );
        actualTargetLang = 'en';
      }
    } else if (isEnglishText) {
      detectedSourceLang = 'en';
      // Si se detectó idioma inglés y el destino era inglés, cambiar a español
      if (targetLang === 'en') {
        console.log(
          '[Ollama] Texto detectado en inglés, cambiando traducción a español automáticamente'
        );
        actualTargetLang = 'es';
      }
    }

    const targetLanguageName =
      languageNames[actualTargetLang] || actualTargetLang;

    console.log(
      `[Ollama] Idioma detectado: ${
        isSpanishText ? 'español' : isEnglishText ? 'inglés' : 'desconocido'
      }`
    );
    console.log(`[Ollama] Traduciendo a: ${targetLanguageName}`);

    // Crear un prompt más específico y sin stop tokens problemáticos
    const prompt = `Eres un traductor profesional. Tu única tarea es traducir el siguiente texto al ${targetLanguageName}.

INSTRUCCIONES:
- Traduce EXACTAMENTE el texto proporcionado
- Mantén el mismo significado, tono y estilo
- NO agregues explicaciones, notas o texto adicional
- NO incluyas el texto original en tu respuesta
- Solo devuelve la traducción

TEXTO A TRADUCIR:
${text}

TRADUCCIÓN AL ${targetLanguageName.toUpperCase()}:`;

    console.log(
      `[Ollama] Traduciendo "${text.substring(
        0,
        50
      )}..." al ${targetLanguageName}`
    );

    const result = await generateWithOllama({
      model,
      prompt,
      options: {
        temperature: 0.1,
        top_p: 0.9,
        // Removemos los stop tokens problemáticos que incluían comillas
        num_predict: 200, // Limitar la longitud de la respuesta
      },
    });

    // Limpiar la respuesta de manera más robusta
    let cleanedResult = result.trim();

    // Remover posibles prefijos comunes de respuesta
    const prefixesToRemove = [
      'TRADUCCIÓN AL',
      'Traducción:',
      'Translation:',
      'TRADUÇÃO:',
      'Traduction:',
      'Übersetzung:',
      'Traduzione:',
      '翻译:',
      '翻譯:',
      '번역:',
    ];

    for (const prefix of prefixesToRemove) {
      if (cleanedResult.toUpperCase().startsWith(prefix.toUpperCase())) {
        cleanedResult = cleanedResult.substring(prefix.length).trim();
        break;
      }
    }

    // Remover comillas solo si están al inicio y final completos
    if (cleanedResult.startsWith('"') && cleanedResult.endsWith('"')) {
      cleanedResult = cleanedResult.substring(1, cleanedResult.length - 1);
    } else if (cleanedResult.startsWith("'") && cleanedResult.endsWith("'")) {
      cleanedResult = cleanedResult.substring(1, cleanedResult.length - 1);
    }

    // Remover múltiples saltos de línea, pero mantener los individuales
    cleanedResult = cleanedResult.replace(/\n{3,}/g, '\n\n').trim();

    if (!cleanedResult) {
      throw new Error('La traducción resultó en texto vacío');
    }

    console.log(
      `[Ollama] Traducción completada: "${cleanedResult.substring(0, 100)}..."`
    );

    return {
      translatedText: cleanedResult,
      detectedSourceLang,
      actualTargetLang,
    };
  } catch (error) {
    console.error('[Ollama] Error en traducción:', error);
    throw new Error(
      `Error al traducir con Ollama: ${
        error instanceof Error ? error.message : 'Error desconocido'
      }`
    );
  }
}

// Función para describir imágenes usando Ollama
// Utiliza un modelo multimodal como minicpm-v que el usuario ya tiene instalado
export async function describeImageWithOllama(
  imageDataUrl: string,
  prompt: string,
  model = 'minicpm-v:latest'
): Promise<string> {
  console.log('[Ollama] Analizando imagen con OCR...');

  try {
    if (!(await isOllamaAvailable())) {
      throw new Error('Ollama no está disponible');
    }

    // Validar y corregir el formato de la imagen
    const validatedDataUrl = validateAndFixImageDataUrl(imageDataUrl);

    // Extraer solo la parte base64 para Ollama
    let base64Data = '';
    if (validatedDataUrl.includes(';base64,')) {
      base64Data = validatedDataUrl.split(';base64,')[1];
    } else if (validatedDataUrl.includes(',')) {
      base64Data = validatedDataUrl.split(',')[1];
    } else {
      // Ya es base64 puro
      base64Data = cleanBase64(validatedDataUrl);
    }

    // Verificar que tenemos datos base64 válidos
    if (!base64Data || !isValidBase64(base64Data)) {
      throw new Error(
        'No se pudieron extraer datos base64 válidos para Ollama'
      );
    }

    console.log(`[Ollama] Usando modelo "${model}" para ocr`);
    console.log(
      `[Ollama] Base64 preparado para Ollama: ${base64Data.length} caracteres`
    );

    const payload = {
      model,
      prompt,
      images: [base64Data], // Solo el base64 puro, sin prefijo data:
      stream: false,
      options: {
        temperature: 0.1,
        top_p: 0.9,
        top_k: 40,
      },
    };

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log(`[Ollama] Respuesta HTTP: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(
        `[Ollama] Error HTTP: ${response.status}. Respuesta: ${errorText}`
      );
      throw new Error(`Error HTTP: ${response.status}. Detalles: ${errorText}`);
    }

    const data = await response.json();

    if (!data.response) {
      throw new Error('No se recibió respuesta del modelo');
    }

    console.log('[Ollama] Imagen analizada exitosamente');
    return data.response;
  } catch (error) {
    console.error('[Ollama] Error al analizar imagen:', error);
    throw new Error(
      `Error al analizar imagen con Ollama: ${
        error instanceof Error ? error.message : 'Error desconocido'
      }`
    );
  }
}

// Función para validar y corregir el formato de una data URL de imagen
function validateAndFixImageDataUrl(dataUrl: string): string {
  console.log('[Ollama] Validando formato de imagen...');

  try {
    let base64Data = '';
    let mimeType = 'image/jpeg';

    // Extraer la parte base64 dependiendo del formato
    if (dataUrl.startsWith('data:image/')) {
      console.log('[Ollama] Formato data:image/ detectado');

      const parts = dataUrl.split(';base64,');
      if (parts.length === 2) {
        mimeType = parts[0].replace('data:', '');
        base64Data = parts[1];
      } else {
        throw new Error('Formato de data URL inválido');
      }
    } else if (dataUrl.startsWith('data:')) {
      console.log('[Ollama] Formato data: detectado sin especificar image/');

      const parts = dataUrl.split(',');
      if (parts.length === 2) {
        base64Data = parts[1];
      } else {
        throw new Error('No se pudo extraer base64 de data URL');
      }
    } else {
      console.log('[Ollama] Tratando como base64 puro');
      base64Data = dataUrl;
    }

    // Limpiar y validar los datos base64
    base64Data = cleanBase64(base64Data);

    if (!base64Data) {
      throw new Error('No se pudieron obtener datos base64 válidos');
    }

    // Construir la data URL final
    const finalDataUrl = `data:${mimeType};base64,${base64Data}`;

    console.log(
      `[Ollama] Data URL procesada correctamente (${finalDataUrl.length} caracteres)`
    );
    return finalDataUrl;
  } catch (error) {
    console.error('[Ollama] Error al validar formato de imagen:', error);
    throw new Error(
      `Error al procesar formato de imagen: ${
        error instanceof Error ? error.message : 'Error desconocido'
      }`
    );
  }
}

// Función para limpiar y validar datos base64
function cleanBase64(str: string): string {
  if (!str || typeof str !== 'string') {
    throw new Error('Datos base64 vacíos o inválidos');
  }

  // Remover espacios en blanco, saltos de línea y otros caracteres no válidos
  let cleaned = str.replace(/\s/g, '').replace(/[^A-Za-z0-9+/=]/g, '');

  // Verificar que la longitud sea correcta (múltiplo de 4)
  const remainder = cleaned.length % 4;
  if (remainder !== 0) {
    // Agregar padding si es necesario
    cleaned += '='.repeat(4 - remainder);
  }

  // Verificar que solo contenga caracteres base64 válidos
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(cleaned)) {
    throw new Error(
      'Datos base64 contienen caracteres inválidos después de la limpieza'
    );
  }

  // Verificar que tenga una longitud mínima razonable para una imagen
  if (cleaned.length < 100) {
    throw new Error('Datos base64 demasiado cortos para ser una imagen válida');
  }

  console.log(`[Ollama] Datos base64 limpiados: ${cleaned.length} caracteres`);
  return cleaned;
}

// Función auxiliar para validar si una cadena es base64 válida
function isValidBase64(str: string): boolean {
  try {
    cleanBase64(str);
    return true;
  } catch {
    return false;
  }
}
