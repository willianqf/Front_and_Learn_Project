import AsyncStorage from '@react-native-async-storage/async-storage';

const LIBRARY_KEY = '@HearLearn:library';

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
 * Salva ou ATUALIZA um livro na biblioteca.
 * @param {object} bookData - O objeto do livro a ser salvo ou atualizado.
 * @returns {Promise<void>}
 */
export const saveBook = async (bookData) => {
  try {
    let library = await loadLibrary();
    const bookIndex = library.findIndex(book => book.id_arquivo === bookData.id_arquivo);

    if (bookIndex !== -1) {
      // O livro já existe, então atualiza-o
      library[bookIndex] = { ...library[bookIndex], ...bookData };
      console.log(`Livro ${bookData.id_arquivo} atualizado.`);
    } else {
      // O livro é novo, adiciona-o com estado inicial se não tiver
      const newBook = { ...bookData, status: bookData.status || 'ready', lastPosition: 0 };
      library.push(newBook);
      console.log(`Livro ${bookData.id_arquivo} salvo.`);
    }

    const jsonValue = JSON.stringify(library);
    await AsyncStorage.setItem(LIBRARY_KEY, jsonValue);
  } catch (e) {
    console.error("Erro ao salvar o livro.", e);
  }
};

// ... as outras funções (removeBook, clearLibrary, etc.) permanecem as mesmas
export const updateBookProgress = async (bookId, pageIndex) => {
    try {
        const library = await loadLibrary();
        const newLibrary = library.map(book => {
            if (book.id_arquivo === bookId) {
                return { ...book, lastPosition: pageIndex };
            }
            return book;
        });
        const jsonValue = JSON.stringify(newLibrary);
        await AsyncStorage.setItem(LIBRARY_KEY, jsonValue);
    } catch (e) {
        console.error("Erro ao atualizar o progresso do livro.", e);
    }
};

export const removeBook = async (bookId) => {
    try {
        const library = await loadLibrary();
        const newLibrary = library.filter(book => book.id_arquivo !== bookId);
        const jsonValue = JSON.stringify(newLibrary);
        await AsyncStorage.setItem(LIBRARY_KEY, jsonValue);
    } catch (e) {
        console.error("Erro ao remover o livro.", e);
    }
};

export const clearLibrary = async () => {
    try {
        await AsyncStorage.removeItem(LIBRARY_KEY);
    } catch (e) {
        console.error("Erro ao limpar a biblioteca.", e);
    }
};