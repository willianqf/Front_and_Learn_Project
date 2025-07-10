// /Front-and/screens/LibraryScreen.js

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Alert, ActivityIndicator, Image, SafeAreaView, Dimensions } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { loadLibrary, saveBook, removeBook, updateBookProgress } from '../utils/libraryManager'; // Precisamos de uma nova função aqui
import LogoApp from '../assets/LogoApp.png';

const API_BASE_URL = 'https://back-and-learn-project.fly.dev';
const cardColors = ['#2EC4B6', '#E71D36', '#FF9F1C', '#54478C', '#011627', '#20A4F3'];

const getInitials = (name) => {
    if (!name) return '??';
    const words = name.split(' ');
    if (words.length > 1) {
        return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

export default function LibraryScreen() {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const { colors } = useContext(ThemeContext);
    
    const [library, setLibrary] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false); // Estado para controlar o processamento em segundo plano

    // Carrega a biblioteca quando a tela ganha foco
    useEffect(() => {
        if (isFocused) {
            loadBooksFromStorage();
        }
    }, [isFocused]);

    // Efeito para processar livros pendentes em "segundo plano"
    useEffect(() => {
        const processPendingBooks = async () => {
            const pendingBook = library.find(book => book.status === 'processing');
            if (pendingBook && !isProcessing) {
                setIsProcessing(true);
                await processBookPages(pendingBook);
                setIsProcessing(false);
                loadBooksFromStorage(); // Recarrega a biblioteca para refletir a mudança de estado
            }
        };
        processPendingBooks();
    }, [library, isProcessing]); // Roda quando a biblioteca ou o estado de processamento muda

    const loadBooksFromStorage = async () => {
        const books = await loadLibrary();
        setLibrary(books);
    };

    const processBookPages = async (bookInfo) => {
        try {
            console.log(`Iniciando processamento em segundo plano para: ${bookInfo.nome_original}`);
            const allTexts = [];
            for (let i = 1; i <= bookInfo.total_paginas; i++) {
                const textResponse = await axios.post(`${API_BASE_URL}/obter_texto_pagina`, {
                    id_arquivo: bookInfo.id_arquivo,
                    numero_pagina: i
                }, { timeout: 60000 });
                
                if (textResponse.data && typeof textResponse.data.texto === 'string') {
                    allTexts.push(textResponse.data.texto);
                } else {
                    throw new Error(`Resposta inválida para a página ${i}.`);
                }
            }
            
            // Atualiza o livro com o texto completo e o estado 'pronto'
            const completeBook = { ...bookInfo, textPlaylist: allTexts, status: 'ready' };
            await saveBook(completeBook); // A função saveBook será modificada para lidar com atualizações
            console.log(`Livro ${bookInfo.nome_original} processado com sucesso!`);

        } catch (error) {
            console.error("Erro no processamento em segundo plano:", error);
            // Marcar o livro como falha para que o utilizador possa tentar novamente
            const failedBook = { ...bookInfo, status: 'failed' };
            await saveBook(failedBook);
        }
    };


    const handleDocumentPick = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
            if (result.canceled) return;
            
            const file = result.assets[0];
            const formData = new FormData();
            formData.append('file', { uri: file.uri, name: file.name, type: 'application/pdf' });

            // 1. Inicia o processamento no backend
            const response = await axios.post(`${API_BASE_URL}/iniciar_processamento`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const bookInfo = response.data;

            // 2. Adiciona o livro à biblioteca com o estado 'processing' IMEDIATAMENTE
            const bookToProcess = { ...bookInfo, status: 'processing', textPlaylist: [] };
            await saveBook(bookToProcess);

            // 3. Atualiza a UI para mostrar o novo livro "a processar"
            loadBooksFromStorage();
            
        } catch (error) {
            console.error("Erro ao escolher o documento:", error);
            Alert.alert("Erro", "Não foi possível iniciar o processamento do PDF. Tente novamente.");
        }
    };

    const handleRemoveBook = (bookId) => {
        Alert.alert("Remover Livro", "Deseja remover este livro da biblioteca?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Remover", style: "destructive", onPress: async () => {
                await removeBook(bookId);
                loadBooksFromStorage();
            }}
        ]);
    };

    const handlePressBook = (item) => {
        if (item.status === 'processing') {
            Alert.alert("Processando...", "Este livro ainda está a ser preparado. Por favor, aguarde.");
        } else if (item.status === 'failed') {
            Alert.alert("Falha no Processamento", "Ocorreu um erro ao processar este livro. Deseja tentar novamente?", [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Tentar Novamente', onPress: async () => {
                    const bookToRetry = { ...item, status: 'processing' };
                    await saveBook(bookToRetry);
                    loadBooksFromStorage();
                }}
            ]);
        } else {
            navigation.navigate('Player', { bookInfo: item });
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Image source={LogoApp} style={styles.logo}/>
            </View>

            <FlatList
                data={library}
                keyExtractor={(item) => item.id_arquivo}
                numColumns={2}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="library-outline" size={64} color={colors.subtext} />
                        <Text style={[styles.emptyText, { color: colors.text }]}>A sua estante está vazia</Text>
                        <Text style={[styles.emptySubText, { color: colors.subtext }]}>Toque em '+' para adicionar um PDF e começar a ouvir.</Text>
                    </View>
                )}
                renderItem={({ item, index }) => (
                    <TouchableOpacity 
                        style={styles.bookItem}
                        onPress={() => handlePressBook(item)}
                        onLongPress={() => handleRemoveBook(item.id_arquivo)}
                    >
                        <View style={[styles.card, { backgroundColor: cardColors[index % cardColors.length] }]}>
                            {item.status === 'processing' ? (
                                <ActivityIndicator color="#fff" />
                            ) : item.status === 'failed' ? (
                                <Ionicons name="alert-circle-outline" size={48} color="#fff" />
                            ) : (
                                <Text style={styles.cardInitials}>{getInitials(item.nome_original)}</Text>
                            )}
                        </View>
                        <Text style={[styles.bookTitle, { color: colors.text }]} numberOfLines={2}>
                            {item.nome_original}
                        </Text>
                         {item.status === 'processing' && <Text style={{color: colors.subtext}}>A processar...</Text>}
                         {item.status === 'failed' && <Text style={{color: '#E71D36'}}>Falhou</Text>}
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.listContainer}
            />
            <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={handleDocumentPick}>
                <Ionicons name="add" size={32} color="#fff" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const { width } = Dimensions.get('window');
const cardSize = (width / 2) - 30;

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 25, paddingBottom: 20, alignItems: 'center' },
    logo: { width: 120, height: 120, resizeMode: 'contain' },
    emptyContainer: { height: Dimensions.get('window').height * 0.6, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { fontSize: 18, fontWeight: 'bold', marginTop: 16, textAlign: 'center' },
    emptySubText: { fontSize: 15, marginTop: 8, textAlign: 'center' },
    listContainer: { paddingHorizontal: 10 },
    bookItem: { width: '50%', alignItems: 'center', marginBottom: 20, padding: 10 },
    card: {
        width: cardSize,
        height: cardSize,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
    },
    cardInitials: { fontSize: 48, fontWeight: 'bold', color: '#fff' },
    bookTitle: { marginTop: 10, fontSize: 14, fontWeight: '500', textAlign: 'center', width: cardSize },
    addButton: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
    },
});