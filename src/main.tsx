import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

// Load theme configuration from JSON
fetch('/config.json')
  .then(response => response.json())
  .then(themeConfig => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <ThemeProvider theme={themeConfig}>
          <App />
        </ThemeProvider>
      </StrictMode>
    );
  })
  .catch(error => {
    console.error('Failed to load theme configuration:', error);
    // Fallback to default theme if config fails to load
    import('./config/theme').then(({ defaultTheme }) => {
      createRoot(document.getElementById('root')!).render(
        <StrictMode>
          <ThemeProvider theme={defaultTheme}>
            <App />
          </ThemeProvider>
        </StrictMode>
      );
    });
  });
