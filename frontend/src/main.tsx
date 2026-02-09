import React from 'react';
import ReactDOM from 'react-dom/client';
import $ from 'jquery';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';

if (typeof window !== 'undefined') {
  const anyWindow = window as any;
  anyWindow.jQuery = $;
  anyWindow.$ = $;
  if (!(($ as any).isArray)) {
    ($ as any).isArray = Array.isArray;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
