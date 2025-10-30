import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import Dashboard  from './components/Dashboard';
const root = createRoot(document.getElementById('app'));
root.render(<Dashboard/>);