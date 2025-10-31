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
import { API_URL } from '../config/api';

// Tasarımdaki renkleri sabit olarak tanımlayalım
const COLORS = {
  background: '#1A1A1A',
  text: '#F5F5F5',
  textSecondary: '#A9A9A9',
  accent: '#39FF14',
  inputBackground: 'rgba(255, 255, 255, 0.05)', // bg-white/5
  inputBorder: 'rgba(255, 255, 255, 0.20)', // border-white/20
};

const RegisterScreen = ({ navigation }) => {
  // Mevcut işlevselliğimiz (State'ler ve Fonksiyonlar)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef(null);

  const handleRegister = async () => {
    setError(null);
    if (!fullName || !email || !password) {
      setError('Tüm alanlar zorunludur.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Şifreler uyuşmuyor.');
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: fullName,
          email: email,
          password: password,
        }),
      });

      if (response.ok) {
        Alert.alert(
          'Kayıt Başarılı!',
          'Hesabınız oluşturuldu. Lütfen giriş yapın.',
          [{ text: 'Tamam', onPress: () => navigation.navigate('Login') }]
        );
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

  // Yeni Tasarımın JSX Kodları
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* 1. Arka Plan Videosu */}
      <Video
        ref={videoRef}
        style={styles.backgroundVideo}
        source={{
          uri: 'https://assets.mixkit.co/videos/preview/mixkit-man-doing-push-ups-in-a-gym-45585-large.mp4',
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
            
            {/* Başlık */}
            <Text style={styles.title}>Create Your{"\n"}Account</Text>

            {/* Full Name Girişi */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.textSecondary}
                textColor={COLORS.text}
                autoCapitalize="words"
                mode="outlined"
                activeOutlineColor={COLORS.accent} // Odaklanma rengi
                outlineColor={COLORS.inputBorder} // Normal border rengi
                disabled={isLoading}
                theme={{
                  colors: {
                    background: COLORS.inputBackground, 
                    onSurfaceVariant: COLORS.textSecondary, 
                  },
                }}
              />
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
                activeOutlineColor={COLORS.accent}
                outlineColor={COLORS.inputBorder}
                disabled={isLoading}
                theme={{
                  colors: {
                    background: COLORS.inputBackground,
                    onSurfaceVariant: COLORS.textSecondary,
                  },
                }}
              />
            </View>

            {/* Şifre Girişi */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
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

            {/* Şifre Tekrar Girişi */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                placeholderTextColor={COLORS.textSecondary}
                textColor={COLORS.text}
                secureTextEntry={!showConfirmPassword}
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
                    icon={showConfirmPassword ? 'eye-off' : 'eye'}
                    color={COLORS.textSecondary}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
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

            {/* Yükleme Göstergesi veya Kayıt Butonu */}
            <View style={styles.buttonContainer}>
              {isLoading ? (
                <ActivityIndicator animating={true} color={COLORS.accent} size="large" />
              ) : (
                <Button
                  mode="contained"
                  onPress={handleRegister}
                  style={styles.registerButton}
                  labelStyle={styles.registerButtonLabel}
                  disabled={isLoading}>
                  Create Account
                </Button>
              )}
            </View>

            {/* Giriş Linki */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={isLoading}>
                <Text style={styles.loginLink}>Log In</Text>
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
    opacity: 0.1,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 26, 26, 0.8)', // HTML'deki bg-background-dark/80
    zIndex: 1,
  },
  keyboardView: {
    flex: 1,
    zIndex: 2,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20, 
  },
  content: {
    width: '100%',
  },
  title: {
    fontSize: 40, // 4xl
    fontWeight: '700', // font-bold
    color: COLORS.text,
    letterSpacing: -0.5, // tracking-tight
    textAlign: 'center',
    paddingBottom: 32, // pb-8
    paddingTop: 24, // pt-6
    lineHeight: 44,
  },
  inputGroup: {
    marginBottom: 16, // HTML'deki gap-4
  },
  label: {
    color: COLORS.text,
    fontSize: 16, // text-base
    fontWeight: '500', // font-medium
    marginBottom: 8, // pb-2
  },
  input: {
    height: 56, // h-14
    fontSize: 16, // text-base
    backgroundColor: COLORS.inputBackground, 
  },
  errorText: {
    fontSize: 14,
    color: '#FF8A80',
    textAlign: 'center',
    marginTop: 8,
  },
  buttonContainer: {
    paddingTop: 16, // pt-8
    paddingBottom: 12, // pb-6
    height: 84, // Yükseklik verelim ki spinner varken kaymasın
    justifyContent: 'center',
  },
  registerButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 8, // rounded-lg
    height: 56, // h-14
    justifyContent: 'center',
  },
  registerButtonLabel: {
    color: COLORS.background,
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16, // text-base
    color: COLORS.textSecondary,
  },
  loginLink: {
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: '600', // font-semibold
  },
});

export default RegisterScreen;