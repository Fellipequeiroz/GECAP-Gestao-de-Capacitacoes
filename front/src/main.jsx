import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AvisoProvider } from './controllers/AvisoController.jsx';
import { ThemeProvider } from './controllers/TemaController.jsx';
// Fontes e ícones instalados pelo npm (antes vinham do Google Fonts nas telas do Stitch).
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/900.css';
import 'material-symbols/outlined.css';
import './views/styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AvisoProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AvisoProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
