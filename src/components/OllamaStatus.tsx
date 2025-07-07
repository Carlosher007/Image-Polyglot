import React, { useEffect, useState } from 'react';
import {
  isOllamaAvailable,
  listOllamaModels,
  ollamaModels,
} from '../utils/ollama';

const OllamaStatus: React.FC = () => {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const checkOllama = async () => {
      try {
        setLoading(true);
        const isAvailable = await isOllamaAvailable();
        setAvailable(isAvailable);

        if (isAvailable) {
          const installedModels = await listOllamaModels();
          setModels(installedModels);
        }
      } catch (error) {
        console.error('Error checking Ollama:', error);
        setAvailable(false);
      } finally {
        setLoading(false);
      }
    };

    checkOllama();
  }, []);

  const getMissingModels = () => {
    const requiredModels = Object.values(ollamaModels);
    return requiredModels.filter((model) => !models.includes(model));
  };

  const missingModels = getMissingModels();
  const hasAllModels = missingModels.length === 0;

  if (loading) {
    return (
      <div className="text-sm text-gray-500 animate-pulse">
        Verificando Ollama...
      </div>
    );
  }

  if (!available) {
    return (
      <div className="text-sm text-amber-500 flex items-center">
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
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        Ollama no está disponible
      </div>
    );
  }

  return (
    <div className="text-sm">
      <div
        className={`flex items-center ${
          hasAllModels ? 'text-green-600' : 'text-amber-500'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {hasAllModels ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          )}
        </svg>
        <span>Ollama {hasAllModels ? 'listo' : 'requiere modelos'}</span>
        <button
          className="ml-1 text-blue-500 hover:underline focus:outline-none"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Ocultar' : 'Ver'} detalles
        </button>
      </div>

      {showDetails && (
        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
          <p className="font-medium mb-1">
            Modelos instalados ({models.length}):
          </p>
          {models.length === 0 ? (
            <p className="text-gray-500">No hay modelos instalados</p>
          ) : (
            <ul className="list-disc pl-5">
              {models.map((model) => (
                <li key={model}>{model}</li>
              ))}
            </ul>
          )}

          {missingModels.length > 0 && (
            <div className="mt-2">
              <p className="font-medium text-amber-600 mb-1">
                Modelos requeridos:
              </p>
              <ul className="list-disc pl-5">
                {missingModels.map((model) => (
                  <li key={model} className="text-amber-600">
                    {model}{' '}
                    <span className="text-gray-500">
                      (ejecuta: ollama pull {model})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-2 text-gray-500">
            {hasAllModels
              ? '¡Perfecto! Tienes todos los modelos necesarios para el funcionamiento óptimo de la aplicación.'
              : 'Instala los modelos faltantes para mejorar el rendimiento de la aplicación.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default OllamaStatus;
