import React, { useEffect, useState } from 'react';
import LangSelector from './LangSelector';
import ModeSelector from './ModeSelector';
import { isOllamaAvailable } from '../utils/ollama';

interface PreviewCardProps {
  file: File;
  mode: Mode;
  targetLang: string;
  onModeChange: (mode: Mode) => void;
  onLangChange: (lang: string) => void;
  onProcess: () => void;
  isProcessing: boolean;
}

const PreviewCard: React.FC<PreviewCardProps> = ({
  file,
  mode,
  targetLang,
  onModeChange,
  onLangChange,
  onProcess,
  isProcessing,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [ollamaStatus, setOllamaStatus] = useState<
    'checking' | 'available' | 'unavailable'
  >('checking');
  const [processingStep, setProcessingStep] = useState<string>('');

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      console.log('[PreviewCard] Creando URL para la imagen:', file.name);

      return () => {
        URL.revokeObjectURL(url);
        console.log('[PreviewCard] Limpiando URL de imagen');
      };
    } else {
      setImageUrl(null);
    }
  }, [file]);

  // Verificar estado de Ollama periódicamente cuando está procesando
  useEffect(() => {
    if (isProcessing) {
      const checkOllama = async () => {
        try {
          const available = await isOllamaAvailable();
          setOllamaStatus(available ? 'available' : 'unavailable');
          console.log(
            '[PreviewCard] Estado de Ollama durante procesamiento:',
            available ? 'disponible' : 'no disponible'
          );
        } catch (error) {
          console.error('[PreviewCard] Error al verificar Ollama:', error);
          setOllamaStatus('unavailable');
        }
      };

      // Verificar inmediatamente solo una vez al inicio
      checkOllama();

      // Actualizar los pasos de procesamiento para mostrar información detallada
      const steps = [
        'Preparando imagen para análisis...',
        'Detectando tipo de contenido...',
        'Conectando con Ollama API...',
        'Procesando con modelo de IA...',
        'Analizando contenido visual...',
        'Extrayendo información...',
        mode === 'translate'
          ? 'Reconociendo texto en la imagen...'
          : mode === 'caption'
          ? 'Generando descripción de la imagen...'
          : 'Extrayendo palabras clave de la imagen...',
        mode === 'translate' && targetLang !== 'auto'
          ? 'Traduciendo contenido...'
          : 'Finalizando procesamiento...',
      ];

      let stepIndex = 0;
      const interval = setInterval(() => {
        setProcessingStep(steps[stepIndex]);
        stepIndex = (stepIndex + 1) % steps.length;
      }, 2000);

      // Verificar Ollama solo cada 15 segundos en lugar de cada 5 para reducir spam
      // Y solo si no está disponible para detectar cuando vuelve a estar online
      const ollamaInterval = setInterval(() => {
        if (ollamaStatus !== 'available') {
          checkOllama();
        }
      }, 15000);

      return () => {
        clearInterval(interval);
        clearInterval(ollamaInterval);
      };
    } else {
      setProcessingStep('');
      // Cuando no está procesando, hacer una verificación única si no tenemos estado
      if (ollamaStatus === 'checking') {
        const checkOllamaOnce = async () => {
          try {
            const available = await isOllamaAvailable();
            setOllamaStatus(available ? 'available' : 'unavailable');
          } catch (error) {
            console.error('[PreviewCard] Error al verificar Ollama:', error);
            setOllamaStatus('unavailable');
          }
        };
        checkOllamaOnce();
      }
    }
  }, [isProcessing, mode, targetLang, ollamaStatus]);

  // Texto descriptivo del modo seleccionado
  const getModeDescription = () => {
    switch (mode) {
      case 'translate':
        return 'Extrae y traduce texto de la imagen';
      case 'caption':
        return 'Genera una descripción de la imagen';
      case 'keywords':
        return 'Extrae una palabra clave principal';
      default:
        return '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">Vista previa</h3>

        <div className="mb-4 relative">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Vista previa"
              className={`w-full h-48 object-contain rounded border ${
                isProcessing ? 'opacity-50' : ''
              }`}
            />
          ) : (
            <div className="w-full h-48 flex items-center justify-center border rounded bg-gray-100">
              <p className="text-gray-500">Vista previa de la imagen</p>
            </div>
          )}
          {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-2 bg-white bg-opacity-80 rounded shadow-sm">
                <div className="animate-spin h-8 w-8 mx-auto mb-2 text-blue-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
                <p className="text-xs text-center font-medium">
                  {processingStep || 'Procesando...'}
                </p>
              </div>
            </div>
          )}
          <div className="mt-1 text-sm text-gray-500 flex justify-between items-center">
            <span>
              {file.name} ({Math.round(file.size / 1024)} KB)
            </span>

            {/* Indicador de estado de Ollama */}
            <div
              className={`text-xs ${
                ollamaStatus === 'available'
                  ? 'text-green-600'
                  : ollamaStatus === 'unavailable'
                  ? 'text-red-500'
                  : 'text-gray-400'
              }`}
            >
              <div className="flex items-center">
                <div
                  className={`w-2 h-2 rounded-full mr-1 ${
                    ollamaStatus === 'checking'
                      ? 'bg-gray-400 animate-pulse'
                      : ollamaStatus === 'available'
                      ? 'bg-green-600'
                      : 'bg-red-500'
                  }`}
                ></div>
                Ollama:{' '}
                {ollamaStatus === 'checking'
                  ? 'Verificando...'
                  : ollamaStatus === 'available'
                  ? 'Conectado'
                  : 'Sin conexión'}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <ModeSelector value={mode} onChange={onModeChange} />

          <div className="text-sm text-gray-700 bg-blue-50 p-2 rounded">
            <div className="font-medium">
              Modo:{' '}
              {mode === 'translate'
                ? 'Traducción'
                : mode === 'caption'
                ? 'Descripción'
                : 'Palabras clave'}
            </div>
            <div>{getModeDescription()}</div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Idioma {mode === 'translate' ? 'de traducción' : 'de salida'}
            </label>
            <LangSelector value={targetLang} onChange={onLangChange} />
          </div>

          <button
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            onClick={() => {
              console.log('[PreviewCard] Botón Procesar presionado');
              setOllamaStatus('checking');
              onProcess();
            }}
            disabled={isProcessing}
          >
            {isProcessing ? 'Procesando...' : 'Procesar imagen'}
          </button>

          {isProcessing && (
            <div className="mt-2 text-sm text-gray-600 text-center">
              Procesando... Espere un momento
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewCard;
