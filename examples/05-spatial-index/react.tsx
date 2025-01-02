import React from 'react';
import {createRoot} from 'react-dom/client';
import {App} from './app';

const container = document.querySelector('#app')!;
createRoot(container).render(<App />);
