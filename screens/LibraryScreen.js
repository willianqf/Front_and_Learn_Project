// screens/LibraryScreen.js

import React, { useState, useContext } from 'react'; // Removido o 'useEffect' que não é mais necessário
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Alert, 
  FlatList, 
  ActivityIndicator, 
  Image
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage'; // 1. AsyncStorage foi removido
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemeContext } from '../context/ThemeContext';
import LogoApp from '../image/LogoApp.png'; 

// A URL da sua API no Fly.io
const API_URL = 'https://back-and-learn-project.fly.dev/processar';

export default function LibraryScreen() {
  const { colors } = useContext(ThemeContext);
  const navigation = useNavigation();
  
  const [status, setStatus] = useState('idle');
  // A biblioteca agora começa vazia e vive apenas no estado do componente.
  // Quando o app fechar, esta informação será perdida, o que é o comportamento desejado.
  const [library, setLibrary] = useState({});

  const BookCard = ({ book, onPress, onLongPress }) => {
    const generateColor = (name) => { let hash = 0; for (let i = 0; i < name.length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); } let color = '#'; for (let i = 0; i < 3; i++) { let value = (hash >> (i * 8)) & 0xFF; color += ('00' + value.toString(16)).substr(-2); } return color; };
    const getInitials = (name) => name.split(' ').map(n => n[0]).join('').substr(0, 2).toUpperCase();
  
    return (
      <TouchableOpacity style={styles.cardContainer} onPress={onPress} onLongPress={onLongPress}>
        <View style={[styles.cardCover, { backgroundColor: generateColor(book.name) }]}>
          <Text style={styles.cardInitials}>{getInitials(book.name)}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>{book.name}</Text>
      </TouchableOpacity>
    );
  };
  
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', paddingTop: 50, },
    centered: { justifyContent: 'center' },
    logo: { width: 280, height: 110, resizeMode: 'contain', marginBottom: 20, },
    listContainer: { paddingHorizontal: 10, },
    cardContainer: { flex: 1, margin: 10, alignItems: 'center' },
    cardCover: { width: '100%', height: 200, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    cardInitials: { fontSize: 40, fontWeight: 'bold', color: 'rgba(255, 255, 255, 0.8)' },
    cardTitle: { fontSize: 14, color: colors.text, textAlign: 'center', fontWeight: '500' },
    fab: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', right: 30, bottom: 30, elevation: 8 },
    statusText: { color: colors.text, fontSize: 22, marginTop: 20 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 20 },
    emptySubtitle: { fontSize: 16, color: colors.subtext, textAlign: 'center', marginTop: 10 },
  });

  // 2. O useEffect que carregava a biblioteca do AsyncStorage foi removido.

  const handleDeleteBook = (bookName) => {
    Alert.alert("Confirmar Exclusão", `Excluir "${bookName}" da sessão atual?`, [{ text: "Cancelar", style: "cancel" }, { text: "Confirmar", onPress: () => {
        const updatedLibrary = { ...library };
        delete updatedLibrary[bookName];
        setLibrary(updatedLibrary);
        // 3. A linha que salvava no AsyncStorage foi removida.
    }, style: "destructive" }]);
  };

  const handleSelecionarPDF = async () => {
    setStatus('loading');
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (result.type === 'success' || (result.assets && result.assets.length > 0)) {
        const fileToUpload = result.assets ? result.assets[0] : result;
        const formData = new FormData();
        formData.append('file', { uri: fileToUpload.uri, name: fileToUpload.name, type: 'application/pdf' });
        
        const response = await axios.post(API_URL, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

        if (response.data?.status === 'sucesso') {
          const newBook = { name: fileToUpload.name, urls: response.data.audio_urls };
          const updatedLibrary = { ...library, [newBook.name]: newBook };
          setLibrary(updatedLibrary);
          // 4. A linha que salvava no AsyncStorage foi removida.
          setStatus('idle');
          Alert.alert("Sucesso!", `O livro "${newBook.name}" foi adicionado à sua sessão de audição.`);
        } else {
          throw new Error('Resposta da API inválida.');
        }
      } else {
        setStatus('idle');
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível processar o PDF. Verifique sua conexão e tente novamente.");
      setStatus('idle');
    }
  };
  
  if (status === 'loading') {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.statusText}>Processando seu PDF...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={LogoApp} style={styles.logo} />
      
      {Object.keys(library).length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="bookshelf" size={80} color={colors.subtext} />
          <Text style={styles.emptyTitle}>Biblioteca Vazia</Text>
          <Text style={styles.emptySubtitle}>Clique no botão '+' para adicionar seu primeiro PDF e iniciar uma sessão de audição.</Text>
        </View>
      ) : (
        <FlatList
          style={{ width: '100%' }}
          data={Object.values(library)}
          renderItem={({ item }) => (
            <BookCard 
              book={item} 
              onPress={() => navigation.navigate('Player', { book: item })}
              onLongPress={() => handleDeleteBook(item.name)}
            />
          )}
          keyExtractor={(item) => item.name}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
        />
      )}
      
      <TouchableOpacity style={styles.fab} onPress={handleSelecionarPDF}>
        <MaterialCommunityIcons name="plus" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}