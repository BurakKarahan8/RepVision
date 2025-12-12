import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  StatusBar, 
  FlatList, 
  Alert, 
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, Card, IconButton, Title } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { authFetch } from '../utils/apiClient'; // Güvenli API istemcimiz
import { MaterialIcons } from '@expo/vector-icons';

// Tasarım renkleri
const COLORS = {
  background: '#1A1A1A',
  surface: '#2a2a2a',
  accent: '#39FF14',
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
};

// Bildirim Kartı Bileşeni
const NotificationItem = ({ item, onMarkAsRead }) => {
  return (
    <Card style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="video-library" size={24} color={COLORS.accent} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardMessage}>{item.message}</Text>
        </View>
        <IconButton
          icon="close" // 'Sil' (okundu işaretle) butonu
          iconColor={COLORS.textSecondary}
          size={20}
          onPress={() => onMarkAsRead(item.id)}
        />
      </View>
    </Card>
  );
};

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Veriyi backend'den çeken fonksiyon
  const fetchData = async () => {
    try {
      const response = await authFetch('/notifications/my-unread');
      if (!response.ok) throw new Error('Bildirimler alınamadı.');
      const data = await response.json();
      setNotifications(data);
    } catch (e) {
      console.error(e);
      if (e.message.includes('Authentication token not found')) {
        navigation.replace('Login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Ekran her açıldığında veriyi yeniden çek
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchData();
    }, [])
  );

  // Bir bildirimi 'okundu' olarak işaretle
  const handleMarkAsRead = async (notificationId) => {
    try {
      // Optimistic UI: Kullanıcıyı bekletmemek için listeden hemen sil
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Arka planda backend'e isteği gönder
      const response = await authFetch(`/notifications/mark-read/${notificationId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        // Eğer hata olursa (teorik olarak) veriyi geri yükle
        // Şimdilik basit tutuyoruz ve sadece hata basıyoruz
        console.error('Bildirim okundu olarak işaretlenemedi.');
        fetchData(); // Listeyi yeniden yükle
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <Appbar.Header style={{ backgroundColor: COLORS.background }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color={COLORS.text} />
        <Appbar.Content title="Bildirimler" titleStyle={{ color: COLORS.text }} />
      </Appbar.Header>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={({ item }) => (
            <NotificationItem 
              item={item} 
              onMarkAsRead={handleMarkAsRead}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>Okunmamış bildiriminiz yok.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconContainer: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1, // Kapanış butonuna kadar olan tüm alanı kapla
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  cardMessage: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
});

export default NotificationsScreen;