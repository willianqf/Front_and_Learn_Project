// navigation/RootNavigator.js (Versão Corrigida)

import React, { useContext } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
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
      {/* AQUI ESTÁ A CORREÇÃO PRINCIPAL */}
      <Stack.Screen
        name="Player"
        component={PlayerScreen}
        options={({ route }) => ({
          // Usamos "optional chaining" (?.) para evitar o erro se os parâmetros não existirem.
          // E usamos a nova propriedade 'nome_original' do objeto 'bookInfo'.
          title: route.params?.bookInfo?.nome_original || 'Player',
          headerBackTitleVisible: false,
        })}
      />
    </Stack.Navigator>
  );
}

// O resto do arquivo permanece o mesmo...
export default function RootNavigator() {
  const { theme, colors } = useContext(ThemeContext);

  const MyLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      primary: colors.primary,
    },
  };

  const MyDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      primary: colors.primary,
    },
  };

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
            borderTopColor: colors.card,
            elevation: 0,
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
