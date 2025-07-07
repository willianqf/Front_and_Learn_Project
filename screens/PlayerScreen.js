// screens/PlayerScreen.js (Versão com Barra de Progresso)

import React, { useState, useEffect, useRef, useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { Audio } from 'expo-av';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';

//const API_BASE_URL = 'http://192.168.1.5:5000'; // Mude para o IP local para testes
const API_BASE_URL = 'https://back-and-learn-project.fly.dev'; // URL de produção

const BATCH_SIZE = 3; 

// --- NOVO COMPONENTE: BARRA DE PROGRESSO ---
const ProgressBar = ({ progress, color }) => {
  return (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: color }]} />
    </View>
  );
};

export default function PlayerScreen({ route, navigation }) {
  const { bookInfo } = route.params;
  const { colors } = useContext(ThemeContext);

  const soundRef = useRef(new Audio.Sound());
  const isSoundLoading = useRef(false);
  const isFetching = useRef(false);
  
  const [playlist, setPlaylist] = useState(Array(bookInfo.total_paginas).fill(null));
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  
  // --- NOVO ESTADO: Progresso do Carregamento ---
  const [loadingProgress, setLoadingProgress] = useState(0);

  const [playbackRate, setPlaybackRate] = useState(1.0);
  const speedOptions = [1.0, 1.25, 1.5, 2.0];
  
  const lastFetchedPage = useRef(0);

  const fetchAudioBatch = async (startPage) => {
    if (isFetching.current || startPage > bookInfo.total_paginas || lastFetchedPage.current >= startPage) {
      return;
    }
    
    isFetching.current = true;
    
    try {
      const endPage = Math.min(startPage + BATCH_SIZE - 1, bookInfo.total_paginas);
      console.log(`Buscando lote de áudio para as páginas ${startPage}-${endPage}`);
      
      const response = await axios.post(`${API_BASE_URL}/obter_audio_lote`, {
        id_arquivo: bookInfo.id_arquivo,
        pagina_inicio: startPage,
        pagina_fim: endPage,
      });

      if (response.data.audio_urls) {
        setPlaylist(prev => {
          const newPlaylist = [...prev];
          response.data.audio_urls.forEach((url, index) => {
            newPlaylist[startPage - 1 + index] = url;
          });
          // Calcula a porcentagem de páginas carregadas
          const loadedCount = newPlaylist.filter(p => p !== null).length;
          setLoadingProgress(Math.round((loadedCount / bookInfo.total_paginas) * 100));
          return newPlaylist;
        });
        lastFetchedPage.current = endPage;
      }
    } catch (error) {
      console.error("Erro ao buscar lote de áudio:", error);
    } finally {
      isFetching.current = false;
    }
  };

  useEffect(() => {
    navigation.setOptions({ title: bookInfo.nome_original });
    fetchAudioBatch(1);
    return () => { soundRef.current.unloadAsync(); };
  }, []);

  useEffect(() => {
    if (!playlist[currentPageIndex]) {
      setIsPageLoading(true);
      fetchAudioBatch(currentPageIndex + 1);
    }
    
    const pagesLeftInBatch = lastFetchedPage.current - (currentPageIndex + 1);
    if (pagesLeftInBatch <= 1 && lastFetchedPage.current < bookInfo.total_paginas) {
      fetchAudioBatch(lastFetchedPage.current + 1);
    }
  }, [currentPageIndex]);

  useEffect(() => {
    const url = playlist[currentPageIndex];
    if (url) {
      playSound(url);
    }
  }, [playlist[currentPageIndex]]);


  const playSound = async (uri) => {
    if (isSoundLoading.current) return;
    isSoundLoading.current = true;
    setIsPageLoading(true);

    try {
      const sound = soundRef.current;
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }
      
      await sound.loadAsync({ uri });
      await sound.setRateAsync(playbackRate, true, Audio.PitchCorrectionQuality.High);
      await sound.playAsync();

      setIsPlaying(true);
    } catch (error) {
      console.error("Erro ao tocar áudio:", error);
      Alert.alert("Erro", "Não foi possível tocar este áudio.");
      setIsPlaying(false);
    } finally {
      isSoundLoading.current = false;
      setIsPageLoading(false);
    }
  };
  
  const handleChangeRate = async (rate) => {
    setPlaybackRate(rate);
    const status = await soundRef.current.getStatusAsync();
    if (status.isLoaded) {
      try {
        await soundRef.current.setRateAsync(rate, true, Audio.PitchCorrectionQuality.High);
      } catch (error) {
        console.log("Erro ao definir a velocidade:", error);
      }
    }
  };

  const handlePlayPause = async () => {
    const status = await soundRef.current.getStatusAsync();
    if (!status.isLoaded) return;
    if (isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (currentPageIndex < bookInfo.total_paginas - 1) {
      setCurrentPageIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    }
  };
  
  if (isPageLoading && !playlist[currentPageIndex]) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{color: colors.text, marginTop: 10}}>A carregar áudio...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.bookTitleContainer}>
        <Text style={styles.titulo} numberOfLines={3}>{bookInfo.nome_original}</Text>
        <Text style={styles.pageIndicator}>
          Página {currentPageIndex + 1} de {bookInfo.total_paginas}
        </Text>
      </View>

      <View style={styles.playerControls}>
        <TouchableOpacity onPress={handlePrevious} disabled={currentPageIndex === 0}>
          <Ionicons name="play-skip-back" size={40} color={currentPageIndex === 0 ? colors.subtext : colors.text} />
        </TouchableOpacity>
        
        <View style={styles.playerButtonContainer}>
          {isPageLoading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <TouchableOpacity onPress={handlePlayPause}>
              <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={80} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={handleNext} disabled={currentPageIndex >= bookInfo.total_paginas - 1}>
          <Ionicons name="play-skip-forward" size={40} color={currentPageIndex >= bookInfo.total_paginas - 1 ? colors.subtext : colors.text} />
        </TouchableOpacity>
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

      {/* --- UI DA BARRA DE PROGRESSO --- */}
      <View style={styles.progressContainer}>
        <Text style={[styles.progressText, {color: colors.subtext}]}>
          {loadingProgress === 100 ? 'Audiolivro completo' : `Carregado: ${loadingProgress}%`}
        </Text>
        <ProgressBar progress={loadingProgress} color={colors.primary} />
      </View>
    </View>
  );
}

// --- ESTILOS ADICIONADOS ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8', justifyContent: 'center', padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f6f8' },
  bookTitleContainer: { flex: 2, justifyContent: 'center', position: 'relative' },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#111', textAlign: 'center' },
  pageIndicator: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 10 },
  playerControls: { flex: 2, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', width: '100%' },
  playerButtonContainer: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },
  speedControls: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%' },
  speedLabel: { color: '#111', fontSize: 16, marginRight: 15, fontWeight: '500' },
  speedButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#666', marginHorizontal: 5 },
  speedButtonActive: { backgroundColor: '#007bff', borderColor: '#007bff' },
  speedButtonText: { color: '#111', fontSize: 14, fontWeight: 'bold' },
  speedButtonTextActive: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  progressContainer: { flex: 1, justifyContent: 'center', width: '100%', paddingHorizontal: 10 },
  progressText: { textAlign: 'center', marginBottom: 5, fontSize: 12 },
  progressBarContainer: { height: 6, width: '100%', backgroundColor: '#e0e0e0', borderRadius: 3 },
  progressBar: { height: '100%', borderRadius: 3 },
});