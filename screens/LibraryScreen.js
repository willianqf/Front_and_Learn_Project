// /Front-and/screens/LibraryScreen.js

import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Alert, ActivityIndicator, Image, SafeAreaView, Dimensions } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { loadLibrary, saveBook, removeBook } from '../utils/libraryManager';
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
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [numColumns, setNumColumns] = useState(2); // Mantemos como estado para a chave

    useEffect(() => {
        if (isFocused) {
            loadBooksFromStorage();
        }
    }, [isFocused]);

    const loadBooksFromStorage = async () => {
        const books = await loadLibrary();
        setLibrary(books);
    };

    const processAndSaveBook = async (bookInfo, texts) => {
        const completeBook = { ...bookInfo, textPlaylist: texts };
        await saveBook(completeBook);
        loadBooksFromStorage();
    };

    const handleDocumentPick = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
            if (result.canceled) return;
            
            const file = result.assets[0];
            setIsLoading(true);
            setLoadingMessage('Enviando PDF...');

            const formData = new FormData();
            formData.append('file', { uri: file.uri, name: file.name, type: 'application/pdf' });

            const response = await axios.post(`${API_BASE_URL}/iniciar_processamento`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            const bookInfo = response.data;
            setLoadingMessage(`Iniciando extração de ${bookInfo.total_paginas} páginas...`);

            const allTexts = [];
            for (let i = 1; i <= bookInfo.total_paginas; i++) {
                setLoadingMessage(`Processando página ${i} de ${bookInfo.total_paginas}...`);
                const textResponse = await axios.post(`${API_BASE_URL}/obter_texto_pagina`, { id_arquivo: bookInfo.id_arquivo, numero_pagina: i }, { timeout: 60000 });
                if (textResponse.data && typeof textResponse.data.texto === 'string') {
                    allTexts.push(textResponse.data.texto);
                } else {
                    throw new Error(`Resposta inválida para a página ${i}.`);
                }
            }
            
            setLoadingMessage('Salvando na biblioteca...');
            await processAndSaveBook(bookInfo, allTexts);
            
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            console.error("Erro no processamento:", error);
            Alert.alert("Erro", "Não foi possível processar o PDF. Tente novamente.");
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

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>{loadingMessage}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Image source={LogoApp} style={styles.logo}/>
            </View>

            <FlatList
                // --- CORREÇÃO APLICADA AQUI ---
                key={numColumns} // A chave agora está ligada ao número de colunas
                data={library}
                keyExtractor={(item) => item.id_arquivo}
                numColumns={numColumns}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="library-outline" size={64} color={colors.subtext} />
                        <Text style={[styles.emptyText, { color: colors.text }]}>Sua estante está vazia</Text>
                        <Text style={[styles.emptySubText, { color: colors.subtext }]}>Toque no '+' para adicionar um PDF e começar a ouvir.</Text>
                    </View>
                )}
                renderItem={({ item, index }) => (
                    <TouchableOpacity 
                        style={styles.bookItem}
                        onPress={() => navigation.navigate('Player', { bookInfo: item })}
                        onLongPress={() => handleRemoveBook(item.id_arquivo)}
                    >
                        <View style={[styles.card, { backgroundColor: cardColors[index % cardColors.length] }]}>
                            <Text style={styles.cardInitials}>{getInitials(item.nome_original)}</Text>
                        </View>
                        <Text style={[styles.bookTitle, { color: colors.text }]} numberOfLines={2}>{item.nome_original}</Text>
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
    header: {
        paddingTop: 25,
        paddingBottom: 20,
        alignItems: 'center',
    },
    logo: {
      width: 120,
      height: 120,
      resizeMode: 'contain',
    },
    appName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 4,
    },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 20, fontSize: 16, fontWeight: '500' },
    emptyContainer: {
        height: Dimensions.get('window').height * 0.6,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: { fontSize: 18, fontWeight: 'bold', marginTop: 16, textAlign: 'center' },
    emptySubText: { fontSize: 15, marginTop: 8, textAlign: 'center' },
    listContainer: {
        paddingHorizontal: 10,
    },
    bookItem: {
        width: '50%',
        alignItems: 'center',
        marginBottom: 20,
        padding: 10,
    },
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
    cardInitials: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
    },
    bookTitle: {
        marginTop: 10,
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        width: cardSize,
    },
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