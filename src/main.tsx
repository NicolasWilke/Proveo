import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { prepararInstalacion } from './app/instalar';
import { prepararMedicion } from './app/medicion';
import './styles/tokens.css';
import './styles/app.css';

prepararInstalacion();
prepararMedicion();

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
