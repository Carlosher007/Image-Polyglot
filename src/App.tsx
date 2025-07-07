import { Toaster } from 'react-hot-toast';
import Home from './routes/Home';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    console.log('App inicializada');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      <Home />
    </div>
  );
}

export default App;
