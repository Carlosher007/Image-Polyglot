// Adapter para TrOCR (reconocimiento de escritura a mano)
export async function recognizeHandwriting(
  imageData: Blob
): Promise<ImageProcessResult> {
  try {
    const startTime = performance.now();

    // Importar transformers.js
    const { pipeline } = await import('@xenova/transformers');

    // Cargar modelo TrOCR
    const handwritingRecognizer = await pipeline(
      'image-to-text',
      'microsoft/trocr-base-handwritten'
    );

    // Convertir Blob a URL
    const imageUrl = URL.createObjectURL(imageData);

    // Reconocer texto manuscrito
    const result = await handwritingRecognizer(imageUrl);

    // Limpiar URL
    URL.revokeObjectURL(imageUrl);

    // Extraer texto
    const text =
      Array.isArray(result) && result.length > 0
        ? result[0].text || result[0].generated_text || ''
        : 'No se pudo reconocer texto manuscrito';

    const durationMs = performance.now() - startTime;

    return {
      originalText: text,
      durationMs,
      backend: 'trocr',
    };
  } catch (error) {
    console.error('Error en reconocimiento de escritura a mano:', error);
    throw new Error('No se pudo reconocer el texto manuscrito de la imagen');
  }
}
