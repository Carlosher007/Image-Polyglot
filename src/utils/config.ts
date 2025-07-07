// Configuración para acceder a la API de Hugging Face
export const getHfToken = (): string | null => {
  // Intenta obtener el token de las variables de entorno
  const token = import.meta.env.HF_TOKEN || import.meta.env.VITE_HF_TOKEN;

  if (token) {
    console.log('HF Token encontrado');
    return token;
  }

  console.warn(
    'HF Token no encontrado. Si no hay WebGPU disponible, las inferencias podrían fallar.'
  );
  return null;
};

// Función para detectar si WebGPU está disponible
export const isWebGpuAvailable = (): boolean => {
  return 'gpu' in navigator;
};

// Configuración de modelos y backends
export type Backend = 'webgpu' | 'huggingface' | 'ollama';

export interface ModelConfig {
  backend: Backend;
  modelId: string;
}

// Modelos configurados
export const MODELS = {
  ocr: {
    backend: 'tesseract' as const,
    modelId: 'eng',
  },
  caption: {
    backend: 'ollama' as const, // Cambiado a Ollama como principal
    modelId: 'minicpm-v:latest',
    webgpuFallback: 'Xenova/blip-image-captioning-base', // Fallback a WebGPU si Ollama falla
  },
  handwriting: {
    backend: 'webgpu' as const,
    modelId: 'microsoft/trocr-base-handwritten',
  },
  translation: {
    backend: 'ollama' as const, // Cambiado a Ollama como principal
    modelId: 'llama3.1:8b-instruct-q5_k_m',
    webgpuFallback: 'facebook/nllb-200-distilled-600M', // Fallback a WebGPU si Ollama falla
  },
};

// Función para mostrar información de depuración
export const logDebugInfo = (): void => {
  console.log('=== DEBUG INFO ===');
  console.log(`WebGPU disponible: ${isWebGpuAvailable()}`);
  console.log(`HF Token configurado: ${getHfToken() ? 'Sí' : 'No'}`);
  console.log(`User Agent: ${navigator.userAgent}`);
  console.log('=================');
};
