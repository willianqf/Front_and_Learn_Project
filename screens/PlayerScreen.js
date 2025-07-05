import React, { useState, useEffect, useRef, useContext } from 'react'; // 1. Importamos useContext
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

import { ThemeContext } from '../context/ThemeContext'; // 2. Importamos nosso contexto

export default function PlayerScreen({ route }) {
  const { book } = route.params;
  const { colors } = useContext(ThemeContext); // 3. Usamos o hook para pegar as cores

  // A lógica de estado do player não muda
  const soundRef = useRef(new Audio.Sound());
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // As funções de controle do player não mudam
  const playSound = async (pageIndex) => { setIsLoading(true); try { const sound = soundRef.current; await sound.unloadAsync(); const source = { uri: book.urls[pageIndex] }; await sound.loadAsync(source); await sound.setRateAsync(playbackRate, true); await sound.playAsync(); setCurrentPageIndex(pageIndex); setIsPlaying(true); } catch (error) { console.error("Erro ao carregar o áudio", error); Alert.alert("Erro", "Não foi possível tocar este áudio."); } finally { setIsLoading(false); } };
  const handlePlayPause = async () => { if (isPlaying) { await soundRef.current.pauseAsync(); setIsPlaying(false); } else { await soundRef.current.playAsync(); setIsPlaying(true); } };
  const handleNext = () => { if (currentPageIndex < book.urls.length - 1) { playSound(currentPageIndex + 1); } };
  const handlePrevious = () => { if (currentPageIndex > 0) { playSound(currentPageIndex - 1); } };
  const handleChangeRate = async (rate) => { setPlaybackRate(rate); if (isPlaying) { await soundRef.current.setRateAsync(rate, true); } };
  useEffect(() => { playSound(0); return () => { soundRef.current.unloadAsync(); }; }, []);

  const speedOptions = [1.0, 1.5, 2.0];

  // 4. A folha de estilos agora é criada dentro do componente
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background, // Usa a cor do tema
      justifyContent: 'center',
      padding: 20,
    },
    bookTitleContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    titulo: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text, // Usa a cor do tema
      textAlign: 'center',
    },
    pageIndicator: {
      fontSize: 18,
      color: colors.subtext, // Usa a cor do tema
      textAlign: 'center',
      marginTop: 10,
    },
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
    speedLabel: {
      color: colors.text, // Usa a cor do tema
      fontSize: 16,
      marginRight: 15,
    },
    speedButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.subtext, // Usa a cor do tema
      marginHorizontal: 5,
    },
    speedButtonActive: {
      backgroundColor: colors.primary, // Usa a cor do tema
      borderColor: colors.primary, // Usa a cor do tema
    },
    speedButtonText: {
      color: colors.text, // Usa a cor do tema
      fontSize: 16,
    },
    speedButtonTextActive: {
      color: '#fff', // Texto do botão ativo sempre branco para contraste
      fontSize: 16,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.bookTitleContainer}>
        <Text style={styles.titulo} numberOfLines={2}>{book.name}</Text>
        <Text style={styles.pageIndicator}>
          Página {currentPageIndex + 1} de {book.urls.length}
        </Text>
      </View>

      <View style={styles.playerControls}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <>
            <TouchableOpacity onPress={handlePrevious} disabled={currentPageIndex === 0}>
              <Ionicons name="play-skip-back" size={40} color={currentPageIndex === 0 ? colors.subtext : colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handlePlayPause}>
              <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={80} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNext} disabled={currentPageIndex === book.urls.length - 1}>
              <Ionicons name="play-skip-forward" size={40} color={currentPageIndex === book.urls.length - 1 ? colors.subtext : colors.text} />
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.speedControls}>
        <Text style={styles.speedLabel}>Velocidade:</Text>
        {speedOptions.map(speed => (
          <TouchableOpacity 
            key={speed} 
            style={[styles.speedButton, playbackRate === speed && styles.speedButtonActive]}
            onPress={() => handleChangeRate(speed)}
          >
            <Text style={playbackRate === speed ? styles.speedButtonTextActive : styles.speedButtonText}>{speed}x</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}