// /Front-and/screens/PlayerScreen.js

import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { updateBookProgress } from '../utils/libraryManager';

const VOICE_PREFERENCE_KEY = '@HearLearn:voicePreference';

// --- Componente HighlightedText (sem alterações) ---
const HighlightedText = ({ text, currentWordIndex, colors }) => {
    const words = text ? text.split(/\s+/) : [];
    return (
        <Text style={[styles.textContainer, { color: colors.text }]}>
            {words.map((word, index) => (
                <Text key={index} style={index === currentWordIndex ? [styles.highlightedWord, { backgroundColor: colors.primary, color: colors.card }] : null}>
                    {word}{' '}
                </Text>
            ))}
        </Text>
    );
};

export default function PlayerScreen({ route }) {
    const { colors } = useContext(ThemeContext);
    const navigation = useNavigation();
    const bookInfo = route.params?.bookInfo;
    
    if (!bookInfo) return <View />;

    const { id_arquivo, textPlaylist, total_paginas, nome_original } = bookInfo;

    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const speedOptions = [1.0, 1.25, 1.5, 2.0];
    
    // Apenas um estado para guardar a voz carregada
    const [activeVoice, setActiveVoice] = useState(null);
    
    const isMounted = useRef(true);
    const speechStartIndex = useRef(0);

    // Carrega a preferência de voz ao iniciar
    useEffect(() => {
        const loadVoicePreference = async () => {
            const savedVoice = await AsyncStorage.getItem(VOICE_PREFERENCE_KEY);
            setActiveVoice(savedVoice); // Pode ser null se nenhuma for guardada
        };
        loadVoicePreference();
    }, []);

    // Função de fala atualizada para usar a voz ativa
    const startSpeech = useCallback((pageIdx, rate, fromWordIndex, voiceIdentifier) => {
        const fullText = textPlaylist[pageIdx];
        if (!fullText || !fullText.trim()) { if (isMounted.current) setIsPlaying(false); return; }

        const words = fullText.split(/\s+/);
        const startIndex = fromWordIndex > 0 ? fromWordIndex : 0;
        speechStartIndex.current = startIndex;
        const textToSpeak = words.slice(startIndex).join(' ');

        if (!textToSpeak) { if (isMounted.current) setIsPlaying(false); return; }

        Speech.speak(textToSpeak, {
            language: 'pt-BR',
            rate: rate,
            voice: voiceIdentifier, // Usa a voz carregada do estado
            onDone: () => { if (isMounted.current) setIsPlaying(false); },
            onStopped: () => { if (isMounted.current) setIsPlaying(false); },
            onError: (error) => { console.error("Speech Error:", error); if (isMounted.current) setIsPlaying(false); },
            onBoundary: (event) => {
                if (isMounted.current) {
                    const spokenWords = textToSpeak.split(/\s+/);
                    let charIndex = 0;
                    for (let i = 0; i < spokenWords.length; i++) {
                        if (event.charIndex >= charIndex && event.charIndex < charIndex + spokenWords[i].length) {
                            setCurrentWordIndex(i + speechStartIndex.current);
                            break;
                        }
                        charIndex += spokenWords[i].length + 1;
                    }
                }
            },
        });
    }, [textPlaylist]);

    // Funções de controlo atualizadas para passar a voz ativa
    const handlePlayPause = () => {
        if (isPlaying) { Speech.stop(); } 
        else { setIsPlaying(true); startSpeech(currentPageIndex, playbackRate, currentWordIndex, activeVoice); }
    };

    const handleChangeRate = (newRate) => {
        setPlaybackRate(newRate);
        if (isPlaying) { Speech.stop(); setIsPlaying(true); startSpeech(currentPageIndex, newRate, currentWordIndex, activeVoice); }
    };

    const handleNext = () => {
        if (currentPageIndex < total_paginas - 1) {
            const newPageIndex = currentPageIndex + 1;
            Speech.stop();
            setCurrentPageIndex(newPageIndex);
            setCurrentWordIndex(-1);
            if (isPlaying) { startSpeech(newPageIndex, playbackRate, -1, activeVoice); }
        }
    };

    const handlePrevious = () => {
        if (currentPageIndex > 0) {
            const newPageIndex = currentPageIndex - 1;
            Speech.stop();
            setCurrentPageIndex(newPageIndex);
            setCurrentWordIndex(-1);
            if (isPlaying) { startSpeech(newPageIndex, playbackRate, -1, activeVoice); }
        }
    };

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; Speech.stop(); };
    }, []);

    useFocusEffect(
        useCallback(() => {
            navigation.setOptions({ title: nome_original });
            return () => {
                Speech.stop();
                updateBookProgress(id_arquivo, currentPageIndex);
            };
        }, [id_arquivo, currentPageIndex, nome_original])
    );
    
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* O cabeçalho foi removido daqui */}
            <View style={styles.textScrollView}>
                <ScrollView contentContainerStyle={{ padding: 20 }}>
                    <HighlightedText text={textPlaylist[currentPageIndex]} currentWordIndex={currentWordIndex} colors={colors} />
                </ScrollView>
            </View>

            <View style={styles.controlsContainer}>
                 <Text style={[styles.pageIndicator, { color: colors.subtext }]}>Página {currentPageIndex + 1} de {total_paginas}</Text>
                <View style={styles.playerControls}>
                    <TouchableOpacity onPress={handlePrevious} disabled={currentPageIndex === 0}>
                        <Ionicons name="play-skip-back-circle-outline" size={50} color={currentPageIndex === 0 ? colors.subtext : colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handlePlayPause}>
                        <Ionicons name={isPlaying ? 'pause-circle' : 'play-circle'} size={80} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleNext} disabled={currentPageIndex >= total_paginas - 1}>
                        <Ionicons name="play-skip-forward-circle-outline" size={50} color={currentPageIndex >= total_paginas - 1 ? colors.subtext : colors.text} />
                    </TouchableOpacity>
                </View>
                <View style={styles.speedControls}>
                    <Text style={[styles.speedLabel, { color: colors.text }]}>Velocidade:</Text>
                    {speedOptions.map(speed => (
                        <TouchableOpacity
                            key={speed}
                            style={[styles.speedButton, { borderColor: colors.subtext }, playbackRate === speed && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                            onPress={() => handleChangeRate(speed)}
                        >
                            <Text style={playbackRate === speed ? styles.speedButtonTextActive : [styles.speedButtonText, { color: colors.text }]}>
                                {speed % 1 === 0 ? speed.toFixed(0) : speed.toFixed(2)}x
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );
}

// --- Estilos (sem alterações) ---
const styles = StyleSheet.create({
    container: { flex: 1 },
    textScrollView: { flex: 3, paddingTop: 20 },
    textContainer: { fontSize: 20, lineHeight: 30 },
    highlightedWord: { paddingVertical: 2, paddingHorizontal: 3, borderRadius: 4, overflow: 'hidden' },
    controlsContainer: { flex: 2, justifyContent: 'center', borderTopWidth: 1, borderTopColor: '#ccc', paddingVertical: 10 },
    pageIndicator: { fontSize: 16, textAlign: 'center', marginBottom: 10 },
    playerControls: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', width: '100%' },
    speedControls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: 20 },
    speedLabel: { fontSize: 16, marginRight: 15, fontWeight: '500' },
    speedButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1.5, marginHorizontal: 5 },
    speedButtonText: { fontSize: 14, fontWeight: 'bold' },
    speedButtonTextActive: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});