import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authFetch } from './apiClient'; // Backend'e jetonu göndermek için
import Constants from 'expo-constants';

// Expo'nun Push Notification sunucu adresi
const EXPO_PUSH_ENDPOINT = 'https://api.expo.dev/v2/push/send';

// Bildirim geldiğinde nasıl davranacağını ayarla (uygulama açıkken)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Bildirimi göster
    shouldPlaySound: true, // Ses çal
    shouldSetBadge: true,  // İkonun üzerine nokta koy
  }),
});

/**
 * Kullanıcıdan bildirim izni ister ve alınan Expo Push Token'ı
 * bizim backend sunucumuza kaydeder.
 */
export async function registerForPushNotificationsAsync() {
  let token;

  // 1. Gerçek bir telefonda mı çalışıyor?
  if (!Device.isDevice) {
    Alert.alert("Push Notification", "Anlık bildirimler sadece fiziksel bir telefonda çalışır, emülatörde değil.");
    return;
  }
  
  // 2. Mevcut izin durumunu kontrol et
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // 3. İzin verilmemişse, tekrar iste
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // 4. Kullanıcı izni reddettiyse
  if (finalStatus !== 'granted') {
    Alert.alert('İzin Reddedildi', 'Anlık bildirim almak için bildirim izinlerini açmanız gerekmektedir.');
    return;
  }

  // 5. Android için ekstra 'kanal' ayarı (gerekli)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  try {
    // 6. Expo Push Token'ı (telefonun adresi) al
    // projectId'yi .env'den değil, doğrudan app.json'dan (Constants) oku
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    if (!projectId) {
        // Bu, app.json'daki projectId'nin hala eksik olduğu anlamına gelir
        throw new Error("app.json dosyasında 'extra.eas.projectId' bulunamadı!");
    }

    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({
      projectId: projectId, 
    });
    token = expoPushToken;
    console.log("Expo Push Token alındı:", token);
  } catch (e) {
      console.error("Expo Push Token alınırken hata:", e);
      // Hata mesajını daha anlaşılır hale getirelim
      Alert.alert(
        "Jeton Hatası", 
        `Push notification jetonu alınamadı. Hata: ${e.message}`
      );
      return;
  }

  // 7. Jetonu backend'e gönder
  if (token) {
    try {
      console.log("Jeton backend'e gönderiliyor...");
      await authFetch('/user/register-push-token', {
        method: 'POST',
        body: JSON.stringify({ pushToken: token }),
      });
      console.log("Push token backend'e başarıyla kaydedildi.");
      
      // Jetonu telefona da kaydet (her girişte tekrar göndermemek için)
      await AsyncStorage.setItem('@push_token_registered', 'true');
    } catch (e) {
      console.error("Push token backend'e kaydedilemedi:", e);
    }
  }
}