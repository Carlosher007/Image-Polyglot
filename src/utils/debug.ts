import { logDebugInfo } from '../utils/config';

// Función para mostrar información de depuración en la consola
export const debugProcessing = (
  file: File,
  mode: Mode,
  targetLang: string
): void => {
  console.group('=== DEBUG INFO - PROCESAMIENTO ===');
  console.log('Archivo:', {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified).toISOString(),
  });
  console.log('Modo:', mode);
  console.log('Idioma destino:', targetLang);
  logDebugInfo();
  console.groupEnd();
};

// Función para crear un worker con manejo de errores mejorado
export const createWorkerWithErrorHandling = (url: URL): Worker => {
  try {
    const worker = new Worker(url, { type: 'module' });
    console.log(`Worker creado correctamente: ${url.href}`);
    return worker;
  } catch (error) {
    console.error(`Error al crear worker ${url.href}:`, error);
    throw new Error(
      `No se pudo inicializar el worker: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

// Convierte un File a Blob de manera segura
export const fileToBlob = async (file: File): Promise<Blob> => {
  try {
    // Método 1: Usar arrayBuffer
    try {
      const buffer = await file.arrayBuffer();
      return new Blob([buffer], { type: file.type });
    } catch (err) {
      console.warn('Error al convertir File a Blob usando arrayBuffer:', err);

      // Método 2: Alternativa usando slice
      return file.slice(0, file.size, file.type);
    }
  } catch (error) {
    console.error('Error al convertir File a Blob:', error);
    throw new Error('No se pudo procesar el archivo de imagen');
  }
};
