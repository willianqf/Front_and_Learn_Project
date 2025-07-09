// Front-and/src/utils/libraryManager.js

import AsyncStorage from '@react-native-async-storage/async-storage';

const LIBRARY_KEY = '@HearLearn:library';

/**
 * Carrega todos os livros da biblioteca.
 * @returns {Promise<Array>} Uma promessa que resolve para um array de livros.
 */
export const loadLibrary = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(LIBRARY_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error("Erro ao carregar a biblioteca.", e);
    return [];
  }
};

/**
 * Salva um novo livro na biblioteca.
 * @param {object} newBook - O objeto do livro a ser salvo.
 * @returns {Promise<void>}
 */
export const saveBook = async (newBook) => {
  try {
    const library = await loadLibrary();
    // Verifica se o livro já existe para evitar duplicatas
    const bookExists = library.some(book => book.id_arquivo === newBook.id_arquivo);
    
    if (!bookExists) {
      const newLibrary = [...library, newBook];
      const jsonValue = JSON.stringify(newLibrary);
      await AsyncStorage.setItem(LIBRARY_KEY, jsonValue);
      console.log("Livro salvo com sucesso na biblioteca!");
    } else {
      console.log("Este livro já está na biblioteca.");
    }
  } catch (e) {
    console.error("Erro ao salvar o livro.", e);
  }
};

/**
 * Remove um livro da biblioteca.
 * @param {string} bookId - O id_arquivo do livro a ser removido.
 * @returns {Promise<void>}
 */
export const removeBook = async (bookId) => {
    try {
        const library = await loadLibrary();
        const newLibrary = library.filter(book => book.id_arquivo !== bookId);
        const jsonValue = JSON.stringify(newLibrary);
        await AsyncStorage.setItem(LIBRARY_KEY, jsonValue);
        console.log(`Livro ${bookId} removido com sucesso.`);
    } catch (e) {
        console.error("Erro ao remover o livro.", e);
    }
};

/**
 * Limpa toda a biblioteca (útil para desenvolvimento).
 * @returns {Promise<void>}
 */
export const clearLibrary = async () => {
    try {
        await AsyncStorage.removeItem(LIBRARY_KEY);
        console.log("Biblioteca limpa com sucesso.");
    } catch (e) {
        console.error("Erro ao limpar a biblioteca.", e);
    }
};