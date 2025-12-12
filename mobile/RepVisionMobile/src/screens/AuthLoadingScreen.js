import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tasarım renkleri
const COLORS = {
  background: '#1A1A1A',
  accent: '#39FF14',
};

const AuthLoadingScreen = ({ navigation }) => {

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('@auth_token');
        const userInfoString = await AsyncStorage.getItem('@user_info');

        if (token && userInfoString) {
          const userInfo = JSON.parse(userInfoString);
          console.log('Oturum bulundu, ana ekrana yönlendiriliyor...');
          navigation.replace('MainApp', { user: userInfo });
        } else {
          console.log('Oturum bulunamadı, giriş ekranına yönlendiriliyor...');
          navigation.replace('Login');
        }
      } catch (e) {
        console.error('AsyncStorage hatası:', e);
        navigation.replace('Login');
      }
    };

    checkAuth();
  }, [navigation]); 
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ActivityIndicator animating={true} color={COLORS.accent} size="large" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AuthLoadingScreen;