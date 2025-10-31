import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper'; 
import { NavigationContainer } from '@react-navigation/native'; 
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// ekranlarımız
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MainAppTabs from './src/navigation/MainAppTabs'; 
import AuthLoadingScreen from './src/screens/AuthLoadingScreen';
import VideoListScreen from './src/screens/VideoListScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <Stack.Navigator 
            initialRouteName="AuthLoading" 
            screenOptions={{ headerShown: false }}
          >
            {/* Ekranlar */}
            <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="MainApp" component={MainAppTabs} />
            <Stack.Screen name="VideoList" component={VideoListScreen} />

          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}