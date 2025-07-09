import React, { useState, useEffect, useContext, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';

export default function PlayerScreen({ route, navigation }) {
    const { colors } = useContext(ThemeContext);
    
    const bookInfo = route.params?.bookInfo;
    if (!bookInfo) {
        return <View />; // Fallback de segurança
    }

    const { textPlaylist, total_paginas, nome_original } = bookInfo;

    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const speedOptions = [1.0, 1.25, 1.5, 2.0];
    
    const startSpeech = useCallback((pageIndex, rate) => {
        const textToSpeak = textPlaylist[pageIndex];
        
        if (!textToSpeak || !textToSpeak.trim()) {
            if (pageIndex < total_paginas - 1) {
                setCurrentPageIndex(prevIndex => prevIndex + 1);
            } else {
                setIsPlaying(false);
            }
            return;
        }

        setIsPlaying(true);
        Speech.speak(textToSpeak, {
            language: 'pt-BR',
            rate: rate,
            onDone: () => setIsPlaying(false),
            onStopped: () => setIsPlaying(false),
            onError: () => setIsPlaying(false),
        });
    }, [textPlaylist, total_paginas]);

    useEffect(() => {
        if (isPlaying) {
            Speech.stop();
            startSpeech(currentPageIndex, playbackRate);
        }
    }, [currentPageIndex, playbackRate, startSpeech]);

    useFocusEffect(
        useCallback(() => {
            navigation.setOptions({ title: nome_original });
            return () => Speech.stop();
        }, [nome_original])
    );

    const handlePlayPause = () => {
        if (isPlaying) {
            Speech.stop();
            setIsPlaying(false);
        } else {
            startSpeech(currentPageIndex, playbackRate);
        }
    };

    const handleNext = () => {
        if (currentPageIndex < total_paginas - 1) {
            setCurrentPageIndex(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentPageIndex > 0) {
            setCurrentPageIndex(prev => prev - 1);
        }
    };

    const handleChangeRate = (newRate) => {
        // Apenas atualiza a velocidade — sem reiniciar a fala automaticamente
        setPlaybackRate(newRate);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.bookTitleContainer}>
                <Text style={[styles.titulo, { color: colors.text }]} numberOfLines={3}>
                    {nome_original}
                </Text>
                <Text style={[styles.pageIndicator, { color: colors.subtext }]}>
                    Página {currentPageIndex + 1} de {total_paginas}
                </Text>
            </View>

            <View style={styles.playerControls}>
                <TouchableOpacity onPress={handlePrevious} disabled={currentPageIndex === 0}>
                    <Ionicons
                        name="play-skip-back-circle-outline"
                        size={50}
                        color={currentPageIndex === 0 ? colors.subtext : colors.text}
                    />
                </TouchableOpacity>

                <TouchableOpacity onPress={handlePlayPause}>
                    <Ionicons
                        name={isPlaying ? 'pause-circle' : 'play-circle'}
                        size={80}
                        color={colors.primary}
                    />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleNext} disabled={currentPageIndex >= total_paginas - 1}>
                    <Ionicons
                        name="play-skip-forward-circle-outline"
                        size={50}
                        color={currentPageIndex >= total_paginas - 1 ? colors.subtext : colors.text}
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.speedControls}>
                <Text style={[styles.speedLabel, { color: colors.text }]}>Velocidade:</Text>
                {speedOptions.map(speed => (
                    <TouchableOpacity
                        key={speed}
                        style={[
                            styles.speedButton,
                            { borderColor: colors.subtext },
                            playbackRate === speed && {
                                backgroundColor: colors.primary,
                                borderColor: colors.primary,
                            },
                        ]}
                        onPress={() => handleChangeRate(speed)}
                    >
                        <Text
                            style={
                                playbackRate === speed
                                    ? styles.speedButtonTextActive
                                    : [styles.speedButtonText, { color: colors.text }]
                            }
                        >
                            {speed % 1 === 0 ? speed.toFixed(0) : speed.toFixed(2)}x
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    bookTitleContainer: { flex: 2, justifyContent: 'center' },
    titulo: { fontSize: 26, fontWeight: 'bold', textAlign: 'center' },
    pageIndicator: { fontSize: 16, textAlign: 'center', marginTop: 10 },
    playerControls: {
        flex: 2,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        width: '100%',
    },
    speedControls: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    speedLabel: { fontSize: 16, marginRight: 15, fontWeight: '500' },
    speedButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1.5,
        marginHorizontal: 5,
    },
    speedButtonText: { fontSize: 14, fontWeight: 'bold' },
    speedButtonTextActive: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});