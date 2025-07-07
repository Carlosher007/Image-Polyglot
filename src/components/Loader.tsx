import React from 'react';

interface LoaderProps {
  label?: string;
}

const Loader: React.FC<LoaderProps> = ({ label = 'Cargando...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-2"></div>
      <p className="text-gray-600">{label}</p>
    </div>
  );
};

export default Loader;
