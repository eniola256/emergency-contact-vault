import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App.jsx';
import { api as real } from './api.js';
import { api as mock } from './mockApi.js';

const api = import.meta.env.VITE_DEMO ? mock : real;
createRoot(document.getElementById('root')).render(<App api={api} />);
