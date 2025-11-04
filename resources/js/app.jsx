import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import HomeComponent  from './components/Home';
const root = createRoot(document.getElementById('app'));
root.render(<HomeComponent/>);