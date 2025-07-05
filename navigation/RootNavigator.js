import React, { useContext } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native'; // 1. Importamos os temas padrão
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'react-native';

import { ThemeContext } from '../context/ThemeContext';
import LibraryScreen from '../screens/LibraryScreen';
import PlayerScreen from '../screens/PlayerScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AboutScreen from '../screens/AboutScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// O componente LibraryStack não precisa de alterações
function LibraryStack() {
  const { colors } = useContext(ThemeContext);
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: 'bold' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="LibraryHome" component={LibraryScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Player" component={PlayerScreen} options={({ route }) => ({ title: route.params.book.name })} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { theme, colors } = useContext(ThemeContext);

  // 2. Criamos nossos temas customizados ESTENDENDO os padrões
  const MyLightTheme = {
    ...DefaultTheme, // Copia todas as propriedades do tema claro padrão
    colors: {
      ...DefaultTheme.colors, // Copia todas as cores padrão
      background: colors.background, // E sobrescreve apenas as que queremos
      card: colors.card,
      text: colors.text,
      primary: colors.primary,
    },
  };

  const MyDarkTheme = {
    ...DarkTheme, // Copia todas as propriedades do tema escuro padrão
    colors: {
      ...DarkTheme.colors,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      primary: colors.primary,
    },
  };

  // 3. Escolhemos qual tema customizado usar
  const currentTheme = theme === 'light' ? MyLightTheme : MyDarkTheme;

  return (
    <NavigationContainer theme={currentTheme}>
      <StatusBar barStyle={colors.statusBar} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Biblioteca') {
              iconName = focused ? 'bookshelf' : 'bookshelf';
            } else if (route.name === 'Configurações') {
              iconName = focused ? 'cog' : 'cog-outline';
            } else if (route.name === 'Sobre') {
              iconName = focused ? 'information' : 'information-outline';
            }
            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.activeIcon,
          tabBarInactiveTintColor: colors.icon,
          tabBarStyle: { 
            backgroundColor: colors.card, 
            borderTopColor: colors.card, // Deixa a borda da mesma cor para sumir
            elevation: 0, // Remove sombra no Android
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Biblioteca" component={LibraryStack} />
        <Tab.Screen name="Configurações" component={SettingsScreen} />
        <Tab.Screen name="Sobre" component={AboutScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}