import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/AppHeader';
import HomeScreen       from '../screens/HomeScreen';
import SimuladoScreen   from '../screens/SimuladoScreen';
import RedacaoScreen    from '../screens/RedacaoScreen';
import CronogramaScreen from '../screens/CronogramaScreen';
import ContaScreen      from '../screens/ContaScreen';
import NoticiasScreen   from '../screens/NoticiasScreen';
import ProvasScreen     from '../screens/ProvasScreen';
import { View, ActivityIndicator } from 'react-native';
import { C, F } from '../theme';

const Tab = createBottomTabNavigator();

const tema = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: C.bg, card: C.primaryDk, text: C.white, border: 'transparent' } };

const ICONES = {
  Home:       ['home', 'home-outline'],
  Simulado:   ['school', 'school-outline'],
  Redacao:    ['create', 'create-outline'],
  Cronograma: ['calendar', 'calendar-outline'],
  Conta:      ['person-circle', 'person-circle-outline'],
};

// Telas "escondidas" da barra inferior (acessadas pelo menu e pela página inicial)
const escondida = { tabBarButton: () => null, tabBarItemStyle: { display: 'none' } };

export default function AppNavigator() {
  const { loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.primaryDk }}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={tema}>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          header: (props) => <AppHeader {...props} />,
          sceneContainerStyle: { backgroundColor: C.bg },
          tabBarIcon: ({ focused, color, size }) => {
            const ic = ICONES[route.name];
            return ic ? <Ionicons name={focused ? ic[0] : ic[1]} size={size} color={color} /> : null;
          },
          tabBarActiveTintColor: C.accent,
          tabBarInactiveTintColor: 'rgba(255,255,255,0.55)',
          tabBarStyle: { backgroundColor: C.primaryDk, borderTopColor: 'rgba(247,189,22,0.15)', height: 62, paddingBottom: 8, paddingTop: 6 },
          tabBarLabelStyle: { fontFamily: F.bS, fontSize: 11 },
        })}
      >
        <Tab.Screen name="Home"       component={HomeScreen}       options={{ tabBarLabel: 'Início' }} />
        <Tab.Screen name="Simulado"   component={SimuladoScreen}   options={{ tabBarLabel: 'Simulados' }} />
        <Tab.Screen name="Redacao"    component={RedacaoScreen}    options={{ tabBarLabel: 'Redação' }} />
        <Tab.Screen name="Cronograma" component={CronogramaScreen} options={{ tabBarLabel: 'Cronograma' }} />
        <Tab.Screen name="Conta"      component={ContaScreen}      options={{ tabBarLabel: 'Minha Área' }} />
        <Tab.Screen name="Noticias"   component={NoticiasScreen}   options={escondida} />
        <Tab.Screen name="Provas"     component={ProvasScreen}     options={escondida} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
