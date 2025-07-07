import React, { useState } from 'react';

interface LangSelectorProps {
  value: string;
  onChange: (lang: string) => void;
}

// Lista reducida de idiomas soportados
const SUPPORTED_LANGUAGES: LangOption[] = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
];

const LangSelector: React.FC<LangSelectorProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Mostrar el nombre del idioma seleccionado
  const selectedLang =
    SUPPORTED_LANGUAGES.find((lang) => lang.code === value) ||
    SUPPORTED_LANGUAGES[0];

  return (
    <div className="relative">
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>
          {selectedLang.name} ({selectedLang.code})
        </span>
        <svg
          className="h-5 w-5 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute mt-1 w-full rounded-md bg-white shadow-lg z-10">
          <ul className="py-1">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <li
                key={lang.code}
                className={`px-3 py-2 cursor-pointer hover:bg-blue-100 ${
                  lang.code === value ? 'bg-blue-50 font-medium' : ''
                }`}
                onClick={() => {
                  onChange(lang.code);
                  setIsOpen(false);
                }}
              >
                {lang.name} ({lang.code})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LangSelector;
