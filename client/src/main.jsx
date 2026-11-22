import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/base.css';
import './styles/backdrop.css';
import './styles/buttons.css';
import './styles/layout.css';
import './styles/forms.css';
import App from './App.jsx';
import { api as real } from './api/api.js';
import { api as mock } from './api/mockApi.js';

const api = import.meta.env.VITE_DEMO ? mock : real;
createRoot(document.getElementById('root')).render(<App api={api} />);
