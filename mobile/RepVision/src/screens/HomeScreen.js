import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  StatusBar, 
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Card, Menu, Divider, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import { authFetch } from '../utils/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  background: '#1A1A1A',
  surface: '#2a2a2a',
  accent: '#39FF14',
  text: '#FFFFFF',
  textSecondary: '#A9A9A9',
  textMedium: '#E0E0E0',
};

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
  
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [menuVisible, setMenuVisible] = useState(false);
  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

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

  const fetchData = async () => {
    try {
      const response = await authFetch('/videos/my-summary');

      if (!response.ok) {
        throw new Error('Failed to fetch summary');
      }
      
      const data = await response.json();
      setSummary(data);
    } catch (e) {
      console.error(e);
      if (e.message.includes('Authentication token not found')) {
        navigation.replace('Login');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image
              style={styles.profilePic}
              source={{ uri: `https://ui-avatars.com/api/?name=${user.fullName}&background=39FF14&color=1A1A1A&bold=true` }}
            />
            <Text style={styles.helloText}>Hello, {user.fullName.split(' ')[0]}</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => Alert.alert("Bildirimler", "Burası bildirimler ekranı olacak.")}>
              <MaterialIcons name="notifications" size={28} color={COLORS.textSecondary} />
            </TouchableOpacity>

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
                onPress={handleLogout} 
                title="Logout" 
                titleStyle={{ color: '#FF8A80' }}
                leftIcon={() => <MaterialIcons name="logout" size={20} color={'#FF8A80'} />}
              />
            </Menu>
          </View>
        </View>

        <Text style={styles.headline}>Overall Form Accuracy</Text>

        {isLoading || !summary ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.accent} />
          </View>
        ) : (
          <> 
            <RadialProgressBar progress={summary.overallAccuracy} /> 

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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
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