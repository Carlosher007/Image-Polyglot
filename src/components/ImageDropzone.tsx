import React, { useCallback, useEffect, useState } from 'react';
import { isOllamaAvailable } from '../utils/ollama';

interface ImageDropzoneProps {
  onSelect: (file: File) => void;
}

const ImageDropzone: React.FC<ImageDropzoneProps> = ({ onSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [ollamaStatus, setOllamaStatus] = useState<
    'checking' | 'available' | 'unavailable'
  >('checking');

  // Verificar estado de Ollama solo una vez al montar
  useEffect(() => {
    let isMounted = true;

    const checkOllamaStatus = async () => {
      try {
        setOllamaStatus('checking');
        const available = await isOllamaAvailable();
        if (isMounted) {
          setOllamaStatus(available ? 'available' : 'unavailable');
          console.log(
            '[ImageDropzone] Estado inicial de Ollama:',
            available ? 'disponible' : 'no disponible'
          );
        }
      } catch (error) {
        if (isMounted) {
          console.error('[ImageDropzone] Error al verificar Ollama:', error);
          setOllamaStatus('unavailable');
        }
      }
    };

    // Solo verificar una vez al montar el componente
    checkOllamaStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      console.log('[ImageDropzone] Archivo soltado');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        console.log(
          '[ImageDropzone] Archivo recibido:',
          file.name,
          file.type,
          file.size
        );
        if (file.type.startsWith('image/')) {
          console.log('[ImageDropzone] Seleccionando imagen');
          setIsUploading(true);
          setProcessingMessage('Preparando imagen para procesamiento...');

          // Usar el estado de Ollama ya verificado (no hacer verificación adicional)
          try {
            console.log(
              '[ImageDropzone] Usando estado de Ollama:',
              ollamaStatus === 'available' ? 'disponible' : 'no disponible'
            );

            // Mostrar mensajes de procesamiento para simular actividad
            setProcessingMessage('Preparando para procesamiento automático...');
            setTimeout(
              () => setProcessingMessage('Enviando imagen para análisis...'),
              700
            );
            setTimeout(
              () =>
                setProcessingMessage('Iniciando procesamiento de imagen...'),
              1500
            );

            // Enviar la imagen para ser procesada con un log claro
            console.log(
              '[ImageDropzone] Enviando imagen al componente principal:',
              file.name,
              file.size
            );
            onSelect(file);

            // Mantener el estado de carga brevemente para que se vea la transición
            setTimeout(() => {
              setIsUploading(false);
            }, 2000);
          } catch (error) {
            console.error('[ImageDropzone] Error al verificar Ollama:', error);
            setIsUploading(false);
          }
        } else {
          console.warn(
            '[ImageDropzone] El archivo no es una imagen:',
            file.type
          );
        }
      } else {
        console.warn('[ImageDropzone] No se recibieron archivos');
      }
    },
    [onSelect]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log('[ImageDropzone] Input de archivo activado');
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        console.log(
          '[ImageDropzone] Archivo seleccionado:',
          file.name,
          file.type,
          file.size
        );
        if (file.type.startsWith('image/')) {
          console.log('[ImageDropzone] Seleccionando imagen');
          setIsUploading(true);
          setProcessingMessage('Preparando imagen para procesamiento...');

          // Usar el estado de Ollama ya verificado (no hacer verificación adicional)
          try {
            console.log(
              '[ImageDropzone] Usando estado de Ollama:',
              ollamaStatus === 'available' ? 'disponible' : 'no disponible'
            );

            // Mostrar mensajes de procesamiento para simular actividad
            setProcessingMessage('Preparando para procesamiento automático...');
            setTimeout(
              () => setProcessingMessage('Enviando imagen para análisis...'),
              700
            );
            setTimeout(
              () =>
                setProcessingMessage('Iniciando procesamiento de imagen...'),
              1500
            );

            // Enviar la imagen para ser procesada con un log claro
            console.log(
              '[ImageDropzone] Enviando imagen al componente principal:',
              file.name,
              file.size
            );
            onSelect(file);

            // Mantener el estado de carga brevemente para que se vea la transición
            setTimeout(() => {
              setIsUploading(false);
            }, 2000);
          } catch (error) {
            console.error('[ImageDropzone] Error al verificar Ollama:', error);
            setIsUploading(false);
          }
        } else {
          console.warn(
            '[ImageDropzone] El archivo no es una imagen:',
            file.type
          );
        }
      } else {
        console.warn('[ImageDropzone] No se seleccionaron archivos');
      }
    },
    [onSelect]
  );

  return (
    <div
      className={`border-2 border-dashed p-8 rounded-lg text-center cursor-pointer transition-colors
        ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : isUploading
            ? 'border-yellow-400 bg-yellow-50'
            : 'border-gray-300 hover:border-blue-400'
        }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() =>
        !isUploading && document.getElementById('fileInput')?.click()
      }
    >
      <input
        type="file"
        id="fileInput"
        className="hidden"
        accept="image/*"
        onChange={handleFileInput}
        disabled={isUploading}
      />
      {isUploading ? (
        <div className="text-lg mb-2">
          <div className="animate-spin h-12 w-12 mx-auto mb-2 text-yellow-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <p className="font-medium">
            {processingMessage || 'Preparando imagen...'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            El procesamiento comenzará automáticamente
          </p>
          <div className="mt-3 w-full max-w-xs mx-auto bg-yellow-100 rounded-full h-1.5">
            <div
              className="bg-yellow-500 h-1.5 rounded-full animate-pulse"
              style={{ width: '70%' }}
            ></div>
          </div>
        </div>
      ) : (
        <div className="text-lg mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto mb-2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p>Arrastra una imagen o haz clic para seleccionar</p>
          <p className="text-sm text-blue-600 mt-1 font-medium">
            Se procesará automáticamente
          </p>
        </div>
      )}
      <p className="text-sm text-gray-500">
        Formatos soportados: JPG, PNG, GIF, etc.
      </p>

      {/* Indicador de estado de Ollama */}
      <div
        className={`mt-3 text-xs ${
          ollamaStatus === 'available'
            ? 'text-green-600'
            : ollamaStatus === 'unavailable'
            ? 'text-red-500'
            : 'text-gray-400'
        }`}
      >
        <div className="flex items-center justify-center">
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
            ? 'Disponible'
            : 'No disponible'}
        </div>
      </div>
    </div>
  );
};

export default ImageDropzone;
