import React from 'react';

interface ModeSelectorProps {
  value: Mode;
  onChange: (mode: Mode) => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ value, onChange }) => {
  const modes: { id: Mode; label: string; description: string }[] = [
    {
      id: 'translate',
      label: 'Traducir texto',
      description: 'Para traducir texto de imágenes',
    },
    {
      id: 'caption',
      label: 'Descripción de imagen',
      description: 'Generar descripción detallada',
    },
    {
      id: 'keywords',
      label: 'Palabras clave',
      description: 'Extraer conceptos principales',
    },
  ];

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Modo de procesamiento
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {modes.map((mode) => (
          <div
            key={mode.id}
            className={`border rounded-lg p-3 cursor-pointer transition-colors
              ${
                value === mode.id
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-300 hover:border-blue-300'
              }`}
            onClick={() => onChange(mode.id)}
          >
            <div className="font-medium">{mode.label}</div>
            <div className="text-xs text-gray-500">{mode.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModeSelector;
