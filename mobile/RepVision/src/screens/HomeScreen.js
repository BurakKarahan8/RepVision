import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  StatusBar, 
  TouchableOpacity,
  ActivityIndicator,
  Alert // Alert eklendi (Bildirimler için geçici)
} from 'react-native';
// Badge (kırmızı nokta) ve Menu için importlar GÜNCELLENDİ
import { Card, Menu, Divider, Button, Badge } from 'react-native-paper'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import { authFetch } from '../utils/apiClient'; // Güvenli API istemcimiz
import AsyncStorage from '@react-native-async-storage/async-storage'; // Çıkış yapmak için

// Renkler
const COLORS = {
  background: '#1A1A1A',
  surface: '#2a2a2a', // Menü arka planı için
  border: '#3f3f46', // Divider için
  accent: '#39FF14',
  text: '#FFFFFF',
  textSecondary: '#A9A9A9',
  textMedium: '#E0E0E0',
};

// Dairesel İlerleme Çubuğu Bileşeni
const RadialProgressBar = ({ progress = 0 }) => {
  const size = 180;
  const strokeWidth = 14;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100); 

  return (
    <View style={styles.progressContainer}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={center} cy={center} r={radius} stroke={COLORS.surface} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={COLORS.accent}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset} 
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={styles.progressTextContainer}>
        <Text style={styles.progressText}>{`${Math.round(progress)}%`}</Text> 
      </View>
    </View>
  );
};

// Stat Kartı Bileşeni
const StatCard = ({ label, value }) => {
  return (
    <Card style={styles.statCard}>
      <Card.Content>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </Card.Content>
    </Card>
  );
};


const HomeScreen = ({ route, navigation }) => {
  const { user } = route.params; 
  
  // State'ler
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); // Kırmızı nokta için

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  // Çıkış Yap Fonksiyonu
  const handleLogout = async () => {
    closeMenu(); 
    try {
      await AsyncStorage.removeItem('@auth_token');
      await AsyncStorage.removeItem('@user_info');
      console.log('Çıkış yapıldı, jeton silindi.');
      navigation.replace('Login'); 
    } catch (e) {
      console.error('Çıkış yaparken hata oluştu:', e);
      navigation.replace('Login');
    }
  };

  // Veri Çekme Fonksiyonu (GÜNCELLENDİ)
  const fetchData = async () => {
    try {
      // İki API isteğini aynı anda yap (daha hızlı)
      const [summaryResponse, countResponse] = await Promise.all([
        authFetch('/videos/my-summary'), // Bu doğru: /api + /videos/my-summary
        
        // --- HATA DÜZELTMESİ BURADA ---
        // '/api/notifications/my-unread-count' idi,
        // '/notifications/my-unread-count' olarak düzeltildi.
        authFetch('/notifications/my-unread-count') // Bu doğru: /api + /notifications/my-unread-count
      ]);

      if (!summaryResponse.ok) {
        const errorText = await summaryResponse.text();
        console.error("Özet verisi hatası:", errorText);
        throw new Error('Failed to fetch summary');
      }
      if (!countResponse.ok) {
        const errorText = await countResponse.text();
        console.error("Bildirim sayısı hatası:", errorText);
        throw new Error('Failed to fetch unread count');
      }
      
      const summaryData = await summaryResponse.json();
      const countData = await countResponse.json();
      
      setSummary(summaryData);
      setUnreadCount(countData); 

    } catch (e) {
      console.error("fetchData Hatası:", e.message); // Hata ayıklama için
      if (e.message.includes('Authentication token not found')) {
        navigation.replace('Login'); 
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Ekran her açıldığında veriyi yeniden çeker
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchData();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
      >
        
        {/* 1. Header (Bildirim ikonu GÜNCELLENDİ) */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image
              style={styles.profilePic}
              source={{ uri: `https://ui-avatars.com/api/?name=${user.fullName}&background=39FF14&color=1A1A1A&bold=true` }}
            />
            <Text style={styles.helloText}>Hello, {user.fullName.split(' ')[0]}</Text>
          </View>

          {/* Header İkonları (Bildirim + Menü) */}
          <View style={styles.headerActions}>
            
            {/* ZİL İKONU (Tıklanabilir ve Kırmızı Noktalı) */}
            <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
              <MaterialIcons name="notifications" size={28} color={COLORS.textSecondary} />
              {/* Okunmamış bildirim varsa KIRMIZI NOKTA göster */}
              {unreadCount > 0 && (
                <Badge style={styles.badge}>{unreadCount}</Badge>
              )}
            </TouchableOpacity>

            {/* Çıkış Yap Menüsü (Dots) */}
            <Menu
              visible={menuVisible}
              onDismiss={closeMenu}
              anchor={
                <TouchableOpacity onPress={openMenu} style={{ marginLeft: 12 }}>
                  <MaterialIcons name="more-vert" size={28} color={COLORS.textSecondary} />
                </TouchableOpacity>
              }
              contentStyle={{ backgroundColor: COLORS.surface }}
            >
              <Menu.Item 
                onPress={() => { Alert.alert("Ayarlar", "Burası Ayarlar ekranı olacak."); closeMenu(); }} 
                title="Settings" 
                titleStyle={{ color: COLORS.text }}
                leftIcon={() => <MaterialIcons name="settings" size={20} color={COLORS.textSecondary} />}
              />
              <Divider style={{ backgroundColor: COLORS.border }} />
              <Menu.Item 
                onPress={handleLogout} // Çıkış yap fonksiyonumuz
                title="Logout" 
                titleStyle={{ color: '#FF8A80' }} // Kırmızı tonu
                leftIcon={() => <MaterialIcons name="logout" size={20} color={'#FF8A80'} />}
              />
            </Menu>
          </View>
        </View>

        {/* 2. Başlık */}
        <Text style={styles.headline}>Overall Form Accuracy</Text>

        {/* Yükleniyorsa veya Veri Yoksa */}
        {isLoading || !summary ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.accent} />
          </View>
        ) : (
          <> 
            {/* 3. Dairesel İlerleme Çubuğu (Canlı Veri) */}
            <RadialProgressBar progress={summary.overallAccuracy} /> 

            {/* 4. Stat Kartları (Canlı Veri) */}
            <View style={styles.statsContainer}>
              <StatCard 
                label="Total Reps Analyzed" 
                value={summary.totalCorrectReps + summary.totalWrongReps} 
              />
              <StatCard 
                label="Common Mistake" 
                value={summary.mostCommonMistake} 
              />
              <StatCard 
                label="Total Videos" 
                value={summary.totalCompletedVideos} 
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Stiller (Badge stili eklendi)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { paddingHorizontal: 16 },
  scrollContentContainer: { paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  headerActions: { // Header ikonlarını (zil ve menü) yan yana koyar
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: { // Kırmızı nokta
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30', 
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  profilePic: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
  },
  helloText: {
    color: COLORS.textMedium,
    fontSize: 18,
    fontWeight: '500',
  },
  headline: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    paddingBottom: 12,
    paddingTop: 20,
  },
  loadingContainer: {
    height: 300, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  progressTextContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    color: COLORS.text,
    fontSize: 48,
    fontWeight: '800',
  },
  statsContainer: { gap: 16 },
  statCard: { backgroundColor: COLORS.surface },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
  },
});

export default HomeScreen;