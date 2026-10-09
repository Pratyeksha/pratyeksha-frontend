import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/feedback-suite-app/sw.js', { scope: '/feedback-suite-app/' }).catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/feedback-suite-app">
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
