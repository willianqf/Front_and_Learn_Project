import React from 'react';
import { ThemeProvider } from './context/ThemeContext'; // Importamos o nosso provedor
import RootNavigator from './navigation/RootNavigator'; // Importaremos o navegador de um novo arquivo

export default function App() {
  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}