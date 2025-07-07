// screens/LibraryScreen.js (Versão para Arquitetura de Lotes)

import React, { useState, useContext } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, Image
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';

const LogoApp = require('../assets/LogoApp.png');
const API_BASE_URL = 'https://back-and-learn-project.fly.dev';
//const API_BASE_URL = 'http://192.168.1.5:5000';

export default function LibraryScreen() {
  const { colors } = useContext(ThemeContext);
  const navigation = useNavigation();

  const [isLoading, setIsLoading] = useState(false);

  const handleSelecionarPDF = async () => {
    setIsLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (result.type === 'success' || (result.assets && result.assets.length > 0)) {
        const fileToUpload = result.assets ? result.assets[0] : result;
        
        const formData = new FormData();
        formData.append('file', { uri: fileToUpload.uri, name: fileToUpload.name, type: 'application/pdf' });

        // Chama o novo endpoint para iniciar o processamento
        const response = await axios.post(`${API_BASE_URL}/iniciar_processamento`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (response.status === 200 && response.data.id_arquivo) {
          // Navega para a tela do Player, passando as informações necessárias
          navigation.navigate('Player', { bookInfo: response.data });
        } else {
          throw new Error('O servidor não conseguiu iniciar o processamento.');
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível enviar o PDF. Verifique sua conexão e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 40 },
    logo: { width: 280, height: 110, resizeMode: 'contain', marginBottom: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 20 },
    subtitle: { fontSize: 16, color: colors.subtext, textAlign: 'center', marginTop: 10, marginBottom: 40 },
    uploadButton: { backgroundColor: colors.primary, paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, flexDirection: 'row', alignItems: 'center' },
    uploadButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    statusText: { color: colors.text, fontSize: 18, marginTop: 20, fontWeight: 'bold' }
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.statusText}>Enviando PDF...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={LogoApp} style={styles.logo} />
      <Text style={styles.title}>Bem-vindo ao HearLearn</Text>
      <Text style={styles.subtitle}>Selecione um PDF para começar a ouvir.</Text>
      <TouchableOpacity style={styles.uploadButton} onPress={handleSelecionarPDF}>
        <MaterialCommunityIcons name="file-upload" size={24} color="#fff" />
        <Text style={styles.uploadButtonText}>Adicionar PDF para OUVIR</Text>
      </TouchableOpacity>
    </View>
  );
}