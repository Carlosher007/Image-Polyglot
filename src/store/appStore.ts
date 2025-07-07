import { create } from 'zustand';

interface AppState {
  file: File | null;
  mode: Mode;
  targetLang: string;
  result: Result | null;
  processing: boolean;
  error: string | null;
  elapsedTime: number;

  // Actions
  setFile: (file: File | null) => void;
  setMode: (mode: Mode) => void;
  setLang: (lang: string) => void;
  setResult: (result: Result | null) => void;
  setProcessing: (isProcessing: boolean) => void;
  setError: (error: string | null) => void;
  setElapsedTime: (time: number) => void;
  reset: () => void;
}

// Detectar el idioma del navegador (default)
const getBrowserLanguage = (): string => {
  const lang = navigator.language.split('-')[0]; // 'es-ES' -> 'es'
  return lang || 'en'; // Fallback a inglés si no se puede detectar
};

// Crear el store con zustand
export const useAppStore = create<AppState>((set) => ({
  file: null,
  mode: 'translate', // Default: Traducir texto
  targetLang: getBrowserLanguage(),
  result: null,
  processing: false,
  error: null,
  elapsedTime: 0,

  // Actions
  setFile: (file) => set({ file }),
  setMode: (mode) => set({ mode }),
  setLang: (lang) => set({ targetLang: lang }),
  setResult: (result) => set({ result }),
  setProcessing: (processing) => set({ processing }),
  setError: (error) => set({ error }),
  setElapsedTime: (time) => set({ elapsedTime: time }),
  reset: () =>
    set({
      file: null,
      result: null,
      processing: false,
      error: null,
      elapsedTime: 0,
    }),
}));
