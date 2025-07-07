import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import ImageDropzone from '../components/ImageDropzone';
import PreviewCard from '../components/PreviewCard';
import ResultPanel from '../components/ResultPanel';
import OllamaStatus from '../components/OllamaStatus';
import { useAppStore } from '../store/appStore';
import { isOllamaAvailable } from '../utils/ollama';

const Home: React.FC = () => {
  const {
    file,
    mode,
    targetLang,
    result,
    processing,
    setFile,
    setMode,
    setLang,
    setResult,
    setProcessing,
    setError,
    setElapsedTime,
    reset,
  } = useAppStore();

  const [ollamaAvailable, setOllamaAvailable] = useState<boolean | null>(null);
  const [ollamaCheckInProgress, setOllamaCheckInProgress] = useState(false);

  // Verificar disponibilidad de Ollama al cargar la página
  useEffect(() => {
    let isMounted = true;
    let isChecking = false;

    const checkOllama = async () => {
      // Evitar llamadas concurrentes
      if (isChecking) return;

      try {
        isChecking = true;
        if (isMounted) setOllamaCheckInProgress(true);

        console.log('[Home] Verificando disponibilidad de Ollama...');
        const available = await isOllamaAvailable();

        if (isMounted) {
          setOllamaAvailable(available);
          console.log('[Home] Ollama disponible:', available);
          setOllamaCheckInProgress(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error('[Home] Error al verificar Ollama:', error);
          setOllamaAvailable(false);
          setOllamaCheckInProgress(false);
        }
      } finally {
        isChecking = false;
      }
    };

    checkOllama();

    // Verificar cada 60 segundos (tiempo aumentado para reducir llamadas)
    const interval = setInterval(checkOllama, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []); // Sin dependencias para evitar el bucle

  // Resetear resultados cuando cambia la imagen
  useEffect(() => {
    if (file) {
      setResult(null);
    }
  }, [file, setResult]);

  // Función para procesar la imagen (declarada antes de handleImageSelect)
  const processImage = useCallback(async () => {
    // Verificamos nuevamente el archivo para asegurarnos de que existe
    const currentFile = file;
    console.log('[Home] processImage - Archivo:', currentFile?.name);

    if (!currentFile) {
      console.error('[Home] No hay archivo para procesar');
      toast.error('No hay imagen para procesar', { id: 'process-error' });
      return;
    }

    try {
      console.group('Procesamiento de imagen');
      console.log('Iniciando procesamiento...');
      console.log('Archivo:', {
        name: currentFile.name,
        size: currentFile.size,
        type: currentFile.type,
      });
      console.log('Modo:', mode);
      console.log('Idioma destino:', targetLang);

      // Verificar Ollama antes de procesar
      try {
        console.log('[Home] Verificando Ollama antes de procesar...');
        const available = await isOllamaAvailable();
        setOllamaAvailable(available);
        console.log(
          '[Home] Estado de Ollama antes de procesar:',
          available ? 'disponible' : 'no disponible'
        );

        if (!available) {
          console.error(
            '[Home] Ollama no disponible - se requiere para el procesamiento'
          );
          toast.error(
            'Ollama no está disponible. Por favor, asegúrate de que Ollama esté en ejecución.',
            {
              id: 'ollama-error',
              duration: 5000,
            }
          );
          throw new Error(
            'Ollama no está disponible. Por favor, asegúrate de que Ollama esté en ejecución.'
          );
        }

        toast.success('Procesando con Ollama local', {
          id: 'ollama-process',
        });
      } catch (error) {
        console.error(
          '[Home] Error al verificar Ollama antes de procesar:',
          error
        );
        setOllamaAvailable(false);
        throw error;
      }

      setProcessing(true);
      setError(null);

      toast.success('Procesando imagen...', { id: 'processing' });

      // Convertir File a Blob para pasar a los workers
      console.log('Convirtiendo archivo a Blob...');
      const arrayBuffer = await currentFile.arrayBuffer();
      const imageBlob = new Blob([arrayBuffer], { type: currentFile.type });
      console.log('Blob creado:', {
        size: imageBlob.size,
        type: imageBlob.type,
      });

      const startTime = performance.now();
      let originalText = '';
      let processingBackend = 'ollama';

      // Seleccionar worker según el modo
      if (mode === 'translate') {
        console.log('[Home] Modo seleccionado: Traducir texto de imagen');
        try {
          // Procesar con OCR
          console.log('[Home] Creando OCR worker...');
          const ocrWorker = new Worker(
            new URL('../workers/ocrWorker.ts', import.meta.url),
            { type: 'module' }
          );
          console.log('[Home] OCR worker creado correctamente');

          const result = await new Promise<ImageProcessResult>(
            (resolve, reject) => {
              console.log('[Home] Enviando mensaje al OCR worker...');
              ocrWorker.postMessage({ imageBlob, lang: 'eng' });
              console.log('[Home] Mensaje enviado al OCR worker');

              ocrWorker.onmessage = (e: MessageEvent<WorkerMessage>) => {
                console.log(
                  '[Home] Respuesta recibida del OCR worker:',
                  e.data
                );
                const { type, payload } = e.data;

                if (type === 'success') {
                  console.log('[Home] OCR exitoso:', payload);
                  resolve({
                    originalText: (payload as any).text,
                    backend: (payload as any).backend,
                  } as ImageProcessResult);
                  ocrWorker.terminate();
                } else if (type === 'error') {
                  console.error('[Home] Error en OCR worker:', payload);
                  reject(new Error(payload.message));
                  ocrWorker.terminate();
                } else if (type === 'progress') {
                  console.log('[Home] Progreso OCR:', payload);
                  toast.loading(`OCR: ${payload.status || 'Procesando...'}`, {
                    id: 'ocr-progress',
                  });
                }
              };

              ocrWorker.onerror = (err: Event) => {
                console.error('[Home] Error en el OCR worker:', err);
                reject(new Error('Error en el worker de OCR'));
                ocrWorker.terminate();
              };
            }
          );
          originalText = result.originalText;
          processingBackend = result.backend || 'ollama';
          console.log('[Home] Texto reconocido por OCR:', originalText);
          toast.dismiss('ocr-progress');
        } catch (err) {
          console.error(
            '[Home] Error al inicializar o procesar con OCR worker:',
            err
          );
          toast.dismiss('ocr-progress');
          throw err;
        }
      } else if (mode === 'caption') {
        // Procesar con Caption
        console.log('[Home] Modo seleccionado: Descripción de imagen');
        toast.loading('Generando descripción de la imagen...', {
          id: 'caption-progress',
        });

        const captionWorker = new Worker(
          new URL('../workers/captionWorker.ts', import.meta.url),
          { type: 'module' }
        );
        console.log('[Home] Caption worker creado correctamente');

        const result = await new Promise<ImageProcessResult>(
          (resolve, reject) => {
            console.log('[Home] Enviando mensaje al Caption worker...');
            captionWorker.postMessage({ imageBlob, targetLang });
            console.log('[Home] Mensaje enviado al Caption worker');

            captionWorker.onmessage = (e: MessageEvent<WorkerMessage>) => {
              console.log(
                '[Home] Respuesta recibida del Caption worker:',
                e.data
              );
              const { type, payload } = e.data;

              if (type === 'success') {
                console.log('[Home] Caption exitoso:', payload);
                resolve(payload as ImageProcessResult);
                captionWorker.terminate();
              } else if (type === 'error') {
                console.error('[Home] Error en Caption worker:', payload);
                reject(new Error(payload.message));
                captionWorker.terminate();
              } else if (type === 'progress') {
                console.log('[Home] Progreso Caption:', payload);
                toast.loading(`Caption: ${payload.status || 'Procesando...'}`, {
                  id: 'caption-progress',
                });
              }
            };

            captionWorker.onerror = (err: Event) => {
              console.error('[Home] Error en el Caption worker:', err);
              reject(new Error('Error en el worker de Caption'));
              captionWorker.terminate();
            };
          }
        );
        originalText = result.originalText;
        processingBackend = result.backend || 'ollama';
        console.log('Texto de caption generado:', originalText);
        console.log('Backend utilizado:', processingBackend);
        toast.dismiss('caption-progress');
      } else if (mode === 'keywords') {
        // Procesar con Keywords
        console.log('[Home] Modo seleccionado: Palabras clave de imagen');
        toast.loading('Extrayendo palabras clave de la imagen...', {
          id: 'keywords-progress',
        });

        const keywordsWorker = new Worker(
          new URL('../workers/keywordsWorker.ts', import.meta.url),
          { type: 'module' }
        );
        console.log('[Home] Keywords worker creado correctamente');

        const result = await new Promise<ImageProcessResult>(
          (resolve, reject) => {
            console.log('[Home] Enviando mensaje al Keywords worker...');
            keywordsWorker.postMessage({ imageBlob, targetLang });
            console.log('[Home] Mensaje enviado al Keywords worker');

            keywordsWorker.onmessage = (e: MessageEvent<WorkerMessage>) => {
              console.log(
                '[Home] Respuesta recibida del Keywords worker:',
                e.data
              );
              const { type, payload } = e.data;

              if (type === 'success') {
                console.log(
                  '[Home] Extracción de palabras clave exitosa:',
                  payload
                );
                resolve(payload as ImageProcessResult);
                keywordsWorker.terminate();
              } else if (type === 'error') {
                console.error('[Home] Error en Keywords worker:', payload);
                reject(new Error(payload.message));
                keywordsWorker.terminate();
              } else if (type === 'progress') {
                console.log('[Home] Progreso Keywords:', payload);
                toast.loading(
                  `Keywords: ${payload.status || 'Procesando...'}`,
                  { id: 'keywords-progress' }
                );
              }
            };

            keywordsWorker.onerror = (err: Event) => {
              console.error('[Home] Error en el Keywords worker:', err);
              reject(new Error('Error en el worker de Keywords'));
              keywordsWorker.terminate();
            };
          }
        );
        originalText = result.originalText;
        processingBackend = result.backend || 'ollama';
        console.log('Palabras clave extraídas:', originalText);
        console.log('Backend utilizado:', processingBackend);
        toast.dismiss('keywords-progress');
      }

      // Traducir el texto si es necesario
      let translatedText = '';
      let translationBackend = 'ollama';

      if (originalText && targetLang !== 'auto' && mode === 'translate') {
        console.log('Iniciando traducción al idioma:', targetLang);
        toast.loading(`Traduciendo al ${targetLang}...`, {
          id: 'translate-progress',
        });

        const translateWorker = new Worker(
          new URL('../workers/translateWorker.ts', import.meta.url),
          { type: 'module' }
        );
        console.log('[Home] Translate worker creado correctamente');

        const translationResult = await new Promise<TranslateResult>(
          (resolve, reject) => {
            console.log('[Home] Enviando mensaje al Translate worker...', {
              text: originalText,
              targetLang,
            });
            translateWorker.postMessage({ text: originalText, targetLang });
            console.log('[Home] Mensaje enviado al Translate worker');

            translateWorker.onmessage = (e: MessageEvent<WorkerMessage>) => {
              console.log(
                '[Home] Respuesta recibida del Translate worker:',
                e.data
              );
              const { type, payload } = e.data;

              if (type === 'success') {
                console.log('[Home] Traducción exitosa:', payload);
                resolve(payload as TranslateResult);
                translateWorker.terminate();
              } else if (type === 'error') {
                console.error('[Home] Error en Translate worker:', payload);
                reject(new Error(payload.message));
                translateWorker.terminate();
              } else if (type === 'progress') {
                console.log('[Home] Progreso Traducción:', payload);
                toast.loading(
                  `Traducción: ${payload.status || 'Procesando...'}`,
                  { id: 'translate-progress' }
                );
              }
            };

            translateWorker.onerror = (err: Event) => {
              console.error('[Home] Error en el Translate worker:', err);
              reject(new Error('Error en el worker de Traducción'));
              translateWorker.terminate();
            };
          }
        );

        translatedText = translationResult.translatedText;
        translationBackend = translationResult.backend;
        console.log('Texto traducido:', translatedText);
        console.log('Backend de traducción utilizado:', translationBackend);
        toast.dismiss('translate-progress');
      } else {
        translatedText = originalText;
        console.log('No se requiere traducción (mismo idioma o texto vacío)');
      }

      const totalDuration = performance.now() - startTime;
      console.log(`[Home] Proceso completado en ${totalDuration.toFixed(2)}ms`);

      // Guardar resultado
      console.log('[Home] Guardando resultado en el estado:', {
        original: originalText,
        translated: translatedText,
        durationMs: totalDuration,
        backend: translationBackend,
      });

      setResult({
        original: originalText,
        translated: translatedText,
        durationMs: totalDuration,
        backend: 'ollama',
        // Add language info for all modes
        detectedSourceLang: '', // No language detection in this flow
        actualTargetLang: targetLang, // Use the requested target language
      });

      setElapsedTime(totalDuration);
      console.groupEnd();

      toast.success('¡Imagen procesada con éxito!', { id: 'processing' });
    } catch (error) {
      console.error('Error procesando imagen:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      toast.error(
        error instanceof Error ? error.message : 'Error desconocido',
        { id: 'processing' }
      );
      console.groupEnd();
    } finally {
      setProcessing(false);
      toast.dismiss('ocr-progress');
      toast.dismiss('caption-progress');
      toast.dismiss('keywords-progress');
      toast.dismiss('translate-progress');
      toast.dismiss('ollama-process');
    }
  }, [
    file,
    mode,
    targetLang,
    setProcessing,
    setResult,
    setError,
    setElapsedTime,
  ]);

  // Handler para seleccionar imagen (añadido después de processImage)
  const handleImageSelect = useCallback(
    async (selectedFile: File) => {
      try {
        console.log(
          '[Home] Archivo seleccionado:',
          selectedFile.name,
          selectedFile.type,
          selectedFile.size
        );

        // Limpiar estados anteriores
        reset();

        // Importante: guardar el archivo en el estado antes de continuar
        setFile(selectedFile);
        console.log('[Home] Archivo guardado en estado:', selectedFile.name);

        // Verificar Ollama al seleccionar una imagen (una sola vez)
        try {
          console.log('[Home] Verificando Ollama al seleccionar imagen...');
          setOllamaCheckInProgress(true);
          const available = await isOllamaAvailable();
          setOllamaAvailable(available);
          console.log(
            '[Home] Ollama disponible tras seleccionar imagen:',
            available
          );

          if (available) {
            toast.success(
              'Ollama conectado. Selecciona un modo de procesamiento y haz clic en "Procesar imagen manualmente"',
              {
                id: 'ollama-status',
                duration: 5000,
              }
            );

            // No procesamos automáticamente, esperamos a que el usuario haga clic en el botón
          } else {
            toast.error(
              'Ollama no disponible. Se requiere Ollama para procesar imágenes.',
              {
                id: 'ollama-status',
                duration: 5000,
              }
            );
          }
        } catch (error) {
          console.error(
            '[Home] Error al verificar Ollama tras seleccionar imagen:',
            error
          );
          setOllamaAvailable(false);
          toast.error('No se pudo conectar con Ollama', {
            id: 'ollama-status',
          });
        } finally {
          setOllamaCheckInProgress(false);
        }
      } catch (error) {
        console.error('[Home] Error general en handleImageSelect:', error);
        toast.error('Error al seleccionar la imagen');
      }
    },
    [setFile, reset, setOllamaAvailable, setOllamaCheckInProgress]
  );

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Image Polyglot
        </h1>
        <p className="text-gray-600">
          Carga una imagen para traducir texto, generar descripciones o extraer
          palabras clave.
        </p>
        <div className="mt-2 flex justify-center">
          <OllamaStatus />
        </div>

        {/* Indicador de disponibilidad de Ollama */}
        {ollamaAvailable !== null && (
          <div
            className={`mt-1 text-xs inline-flex items-center px-2.5 py-0.5 rounded-full ${
              ollamaAvailable
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full mr-1 ${
                ollamaCheckInProgress
                  ? 'bg-yellow-500 animate-pulse'
                  : ollamaAvailable
                  ? 'bg-green-500'
                  : 'bg-red-500'
              }`}
            ></div>
            API Ollama:{' '}
            {ollamaCheckInProgress
              ? 'Verificando...'
              : ollamaAvailable
              ? 'Conectada'
              : 'No disponible'}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {!file ? (
            <ImageDropzone onSelect={handleImageSelect} />
          ) : (
            <PreviewCard
              file={file}
              mode={mode}
              targetLang={targetLang}
              onModeChange={setMode}
              onLangChange={setLang}
              onProcess={processImage}
              isProcessing={processing}
            />
          )}
        </div>

        <div>
          <ResultPanel result={result} isLoading={processing} />
        </div>
      </div>
    </div>
  );
};

export default Home;
