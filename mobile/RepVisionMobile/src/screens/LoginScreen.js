import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StatusBar,
  Alert
} from 'react-native';
import {
  TextInput,
  Button,
  Title,
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video } from 'expo-av'; // Arka plan videosu için
import Svg, { Path } from 'react-native-svg'; // Logo için
import { API_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from '../utils/notificationService';

// Tasarımdaki renkleri sabit olarak tanımlayalım
const COLORS = {
  background: '#1A1A1A',
  text: '#F5F5F5',
  textSecondary: '#A9A9A9',
  accent: '#39FF14',
  inputBackground: '#2C2C2C',
  inputBorder: '#4A4A4A',
  inputBackgroundFocused: '#2C2C2C' // Aynı kalabilir
};

const LoginScreen = ({ navigation }) => {
  // Mevcut işlevselliğimiz (State'ler ve Fonksiyonlar)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef(null);

  const handleLogin = async () => {
    setError(null);
    if (!email.includes('@')) {
      setError('Geçerli bir e-posta adresi girin.');
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      if (response.ok) {
        const authResponse = await response.json();
        await AsyncStorage.setItem('@auth_token', authResponse.token);
        const userInfo = {
          fullName: authResponse.fullName,
          email: authResponse.email
        };
        await AsyncStorage.setItem('@user_info', JSON.stringify(userInfo));
        registerForPushNotificationsAsync().catch(err => console.error("Push token kaydı başarısız:", err));
        console.log('Giriş başarılı, jeton kaydedildi.');
        navigation.replace('MainApp', { user: userInfo });
        
      } else {
        const errorMessage = await response.text();
        setError(errorMessage);
      }
    } catch (e) {
      console.error(e);
      setError('Bağlantı hatası: Sunucuya ulaşılamıyor. IP/Port ayarlarını kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* 1. Arka Plan Videosu */}
      <Video
        ref={videoRef}
        style={styles.backgroundVideo}
        source={{
          uri: 'https://assets.mixkit.co/videos/preview/mixkit-man-lifting-weights-in-a-gym-230-large.mp4',
        }}
        isMuted
        shouldPlay
        isLooping
        resizeMode="cover"
      />
      {/* 2. Video Üzerindeki Karartma Katmanı */}
      <View style={styles.videoOverlay} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          
          {/* 3. Ana İçerik Alanı */}
          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <Path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H8l4-5v4h3l-4 5z"
                  fill={COLORS.accent}
                />
              </Svg>
              <Text style={styles.title}>RepVision</Text>
            </View>

            {/* Email Girişi */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email address"
                placeholderTextColor={COLORS.textSecondary}
                textColor={COLORS.text}
                keyboardType="email-address"
                autoCapitalize="none"
                mode="outlined"
                activeOutlineColor={COLORS.accent} // Odaklanma rengi
                outlineColor={COLORS.inputBorder} // Normal border rengi
                disabled={isLoading}
                theme={{
                  colors: {
                    background: COLORS.inputBackground, // Arka plan rengi
                    onSurfaceVariant: COLORS.textSecondary, // Border'ın label rengi
                  },
                }}
              />
            </View>

            {/* Şifre Girişi */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity onPress={() => { /* TODO: Forgot Password */ }}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.textSecondary}
                textColor={COLORS.text}
                secureTextEntry={!showPassword}
                mode="outlined"
                activeOutlineColor={COLORS.accent}
                outlineColor={COLORS.inputBorder}
                disabled={isLoading}
                theme={{
                  colors: {
                    background: COLORS.inputBackground,
                    onSurfaceVariant: COLORS.textSecondary,
                  },
                }}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    color={COLORS.textSecondary}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  />
                }
              />
            </View>

            {/* Hata Mesajı */}
            {error && (
              <HelperText type="error" visible={true} style={styles.errorText}>
                {error}
              </HelperText>
            )}

            {/* Yükleme Göstergesi veya Giriş Butonu */}
            <View style={styles.buttonContainer}>
              {isLoading ? (
                <ActivityIndicator animating={true} color={COLORS.accent} size="large" />
              ) : (
                <Button
                  mode="contained"
                  onPress={handleLogin}
                  style={styles.loginButton}
                  labelStyle={styles.loginButtonLabel}
                  disabled={isLoading}>
                  Login
                </Button>
              )}
            </View>

            {/* Kayıt Linki */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={isLoading}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// Yeni Tasarımın StyleSheet'i
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backgroundVideo: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    opacity: 0.1, // HTML'deki opacity
    // blurRadius: 10, // HTML'deki blur-sm. Performansı etkileyebilir, şimdilik opsiyonel.
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 26, 26, 0.7)', // HTML'deki bg-[#1A1A1A] opacity-70
    zIndex: 1,
  },
  keyboardView: {
    flex: 1,
    zIndex: 2, // İçerik videonun üzerinde olmalı
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20, // max-w-sm ve px-4 için genel padding
  },
  content: {
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32, // 4xl
    fontWeight: '700', // font-bold
    color: COLORS.text,
    letterSpacing: -0.5, // tracking-tight
    marginTop: 12, // mb-3
  },
  inputGroup: {
    marginBottom: 24, // space-y-6
  },
  label: {
    color: COLORS.text,
    fontSize: 16, // text-base
    fontWeight: '500', // font-medium
    marginBottom: 8, // pb-2
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  forgotPasswordText: {
    fontSize: 14, // text-sm
    color: COLORS.textSecondary,
  },
  input: {
    height: 56, // h-14
    fontSize: 16, // text-base
    backgroundColor: COLORS.inputBackground, // Paper theme'i bunu zaten yapıyor
  },
  errorText: {
    fontSize: 14,
    color: '#FF8A80', // Paper'ın varsayılan error rengi daha iyi olabilir
    textAlign: 'center',
    marginBottom: 10,
  },
  buttonContainer: {
    paddingTop: 16, // pt-8
    paddingBottom: 12, // pb-6
    height: 84, // Yükseklik verelim ki spinner varken kaymasın
    justifyContent: 'center',
  },
  loginButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 8, // rounded-lg
    height: 56, // h-14
    justifyContent: 'center',
  },
  loginButtonLabel: {
    color: COLORS.background,
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 16, // text-base
    color: COLORS.textSecondary,
  },
  signUpLink: {
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: '600', // font-semibold
  },
});

export default LoginScreen;