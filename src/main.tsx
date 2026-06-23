import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

if (!window.location.hash) window.location.hash = '/gallery';

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
);
