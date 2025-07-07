import React, { useEffect, useState } from 'react';
import { isOllamaAvailable } from '../utils/ollama';
import { useAppStore } from '../store/appStore';

interface ResultPanelProps {
  result: Result | null;
  isLoading: boolean;
}

const ResultPanel: React.FC<ResultPanelProps> = ({ result, isLoading }) => {
  const { mode } = useAppStore();
  const [activeTab, setActiveTab] = useState<'original' | 'translated'>(
    'translated'
  );
  const [ollamaStatus, setOllamaStatus] = useState<
    'checking' | 'available' | 'unavailable'
  >('checking');
  const [loadingStep, setLoadingStep] = useState<string>(
    'Iniciando procesamiento...'
  );

  // Verificar estado de Ollama solo al montar o cambiar isLoading significativamente
  useEffect(() => {
    let isMounted = true;

    const checkOllama = async () => {
      try {
        const available = await isOllamaAvailable();
        if (isMounted) {
          setOllamaStatus(available ? 'available' : 'unavailable');
          console.log(
            '[ResultPanel] Estado de Ollama:',
            available ? 'disponible' : 'no disponible'
          );
        }
      } catch (error) {
        if (isMounted) {
          console.error('[ResultPanel] Error al verificar Ollama:', error);
          setOllamaStatus('unavailable');
        }
      }
    };

    // Solo verificar una vez al montar o cuando cambia de no-loading a loading
    if (!isLoading || ollamaStatus === 'checking') {
      checkOllama();
    }

    // Si está cargando, actualizar los pasos para mostrar información de la API de Ollama
    if (isLoading) {
      const steps = [
        'Iniciando procesamiento...',
        'Conectando con la API de Ollama...',
        'Preparando modelo de IA...',
        'Analizando contenido de la imagen...',
        mode === 'translate'
          ? 'Reconociendo texto en la imagen...'
          : mode === 'caption'
          ? 'Generando descripción detallada...'
          : 'Extrayendo palabras clave...',
        mode === 'translate'
          ? 'Traduciendo texto detectado...'
          : 'Finalizando procesamiento...',
        'Aplicando post-procesamiento...',
        'Finalizando...',
      ];

      let currentStep = 0;
      const stepInterval = setInterval(() => {
        if (isMounted) {
          setLoadingStep(steps[currentStep]);
          currentStep = (currentStep + 1) % steps.length;
        }
      }, 2000);

      // No verificar Ollama constantemente durante la carga
      return () => {
        isMounted = false;
        clearInterval(stepInterval);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [isLoading, mode, ollamaStatus]); // Agregar ollamaStatus como dependencia

  // Función para sintetizar voz
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      // Intentar establecer el idioma adecuado
      window.speechSynthesis.speak(utterance);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600 mb-2 font-medium">{loadingStep}</p>

        <div className="mt-4 w-full max-w-xs bg-gray-100 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full animate-pulse"
            style={{ width: '70%' }}
          ></div>
        </div>

        {/* Indicador de estado de Ollama */}
        <div
          className={`mt-4 text-xs flex items-center ${
            ollamaStatus === 'available'
              ? 'text-green-600'
              : ollamaStatus === 'unavailable'
              ? 'text-red-500'
              : 'text-gray-400'
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full mr-1 ${
              ollamaStatus === 'checking'
                ? 'bg-gray-400 animate-pulse'
                : ollamaStatus === 'available'
                ? 'bg-green-600'
                : 'bg-red-500'
            }`}
          ></div>
          API Ollama:{' '}
          {ollamaStatus === 'checking'
            ? 'Verificando conexión...'
            : ollamaStatus === 'available'
            ? 'Conectada y procesando'
            : 'Sin conexión'}
        </div>

        <div className="mt-3 text-xs text-gray-500 max-w-md text-center">
          {ollamaStatus === 'available'
            ? 'El modelo de IA local está procesando la imagen automáticamente...'
            : 'Sin conexión a Ollama. No se puede procesar la imagen.'}
          <br />
          <span className="mt-2 block font-medium">
            Por favor espere, esto puede tomar hasta 30 segundos dependiendo del
            tipo de imagen y el modo seleccionado.
          </span>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="text-gray-400 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>

        {isLoading ? (
          <p className="text-gray-600">
            Procesando imagen... Por favor espere.
          </p>
        ) : (
          <p className="text-gray-600">
            Aún no hay resultados.{' '}
            {!isLoading && 'Carga una imagen para procesarla con Ollama.'}
          </p>
        )}

        {/* Sugerencias de solución de problemas */}
        {!isLoading && (
          <div className="mt-4 text-sm text-gray-500 bg-gray-50 p-3 rounded">
            <p className="font-medium mb-1">
              ¿Has cargado una imagen pero no ves resultados?
            </p>
            <ul className="text-left list-disc pl-5 space-y-1">
              <li>Verifica que Ollama esté en ejecución en tu sistema</li>
              <li>
                Asegúrate de que la imagen tenga contenido{' '}
                {mode === 'translate' ? 'de texto' : 'visible'} para procesar
              </li>
              <li>
                Intenta cambiar el modo de procesamiento (traducción,
                descripción, palabras clave)
              </li>
              <li>
                Haz clic en el botón "Procesar imagen manualmente" en el panel
                izquierdo
              </li>
            </ul>
          </div>
        )}

        {/* Indicador de estado de Ollama */}
        <div
          className={`mt-4 text-xs inline-flex items-center ${
            ollamaStatus === 'available'
              ? 'text-green-600'
              : ollamaStatus === 'unavailable'
              ? 'text-red-500'
              : 'text-gray-400'
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full mr-1 ${
              ollamaStatus === 'checking'
                ? 'bg-gray-400 animate-pulse'
                : ollamaStatus === 'available'
                ? 'bg-green-600'
                : 'bg-red-500'
            }`}
          ></div>
          Ollama API:{' '}
          {ollamaStatus === 'checking'
            ? 'Verificando...'
            : ollamaStatus === 'available'
            ? 'Lista para procesar'
            : 'No disponible'}
        </div>
      </div>
    );
  }

  const {
    original,
    translated,
    durationMs,
    detectedSourceLang,
    actualTargetLang,
  } = result;
  const content = activeTab === 'original' ? original : translated;

  // Renderizado específico según el modo
  const renderContent = () => {
    if (mode === 'keywords') {
      // Para el modo de palabras clave, mostrar la palabra en un formato especial
      return (
        <div className="bg-gray-50 rounded p-4 min-h-[150px] flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-500 text-sm mb-2">
              Palabra clave principal:
            </div>
            <div className="text-3xl font-bold text-blue-600">{content}</div>
          </div>
        </div>
      );
    } else {
      // Para los modos de traducción y caption, mostrar el texto completo
      return (
        <div className="bg-gray-50 rounded p-3 min-h-[150px] whitespace-pre-line">
          {content || 'No se detectó ningún contenido'}
        </div>
      );
    }
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'translate':
        return 'Texto traducido';
      case 'caption':
        return 'Descripción';
      case 'keywords':
        return 'Palabra clave';
      default:
        return 'Resultado';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Solo mostrar las pestañas para el modo traducción */}
      {mode === 'translate' && (
        <div className="border-b">
          <nav className="flex">
            <button
              className={`px-4 py-3 text-sm font-medium flex-1 text-center ${
                activeTab === 'original'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('original')}
            >
              Texto original
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium flex-1 text-center ${
                activeTab === 'translated'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('translated')}
            >
              Texto traducido
            </button>
          </nav>
        </div>
      )}

      {/* Para los modos caption y keywords, mostrar un encabezado */}
      {mode !== 'translate' && (
        <div className="border-b px-4 py-3 bg-gray-50">
          <h3 className="font-medium text-gray-700">{getModeTitle()}</h3>
        </div>
      )}

      <div className="p-4">
        {renderContent()}

        <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
          <div className="text-sm text-gray-500 flex items-center gap-2 flex-wrap">
            <span>⏱ {(durationMs / 1000).toFixed(1)} s</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
              Procesado con Ollama
            </span>

            {/* Mostrar idioma detectado y usado para traducción */}
            {mode === 'translate' && detectedSourceLang && actualTargetLang && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                {detectedSourceLang === 'es'
                  ? 'Español'
                  : detectedSourceLang === 'en'
                  ? 'Inglés'
                  : detectedSourceLang}{' '}
                →
                {actualTargetLang === 'es'
                  ? 'Español'
                  : actualTargetLang === 'en'
                  ? 'Inglés'
                  : actualTargetLang}
              </span>
            )}

            {/* Mostrar idioma de palabras clave */}
            {mode === 'keywords' && actualTargetLang && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                Palabras clave en{' '}
                {actualTargetLang === 'es'
                  ? 'español'
                  : actualTargetLang === 'en'
                  ? 'inglés'
                  : actualTargetLang}
              </span>
            )}

            {/* Estado actual de Ollama */}
            <span
              className={`px-2 py-0.5 text-xs rounded-full ${
                ollamaStatus === 'available'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              API Ollama:{' '}
              {ollamaStatus === 'available' ? 'Conectada' : 'Desconectada'}
            </span>
          </div>

          {/* Solo mostrar botón de escuchar para modos de texto */}
          {mode !== 'keywords' && (
            <button
              className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              onClick={() => speakText(content)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              </svg>
              Escuchar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultPanel;
