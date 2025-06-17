import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// No use of PUBLIC_URL here or anywhere in the JS entry point to avoid build errors.

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
