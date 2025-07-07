declare type Mode = 'translate' | 'caption' | 'keywords';

declare interface Result {
  original: string;
  translated: string;
  durationMs: number;
  backend?: 'ollama';
  keywords?: string[];
  detectedSourceLang?: string;
  actualTargetLang?: string;
}

declare interface WorkerMessage {
  type: string;
  payload: any;
}

declare interface ImageProcessResult {
  originalText: string;
  durationMs: number;
  backend?: 'ollama' | 'blip' | 'tesseract' | 'trocr';
}

declare interface TranslateResult {
  translatedText: string;
  durationMs: number;
  backend: 'ollama' | 'nllb';
  detectedSourceLang?: string;
  actualTargetLang?: string;
}

declare interface LangOption {
  code: string;
  name: string;
}
