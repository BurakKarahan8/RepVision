import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar, 
  FlatList, 
  Alert, 
  ActivityIndicator,
  Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, Card } from 'react-native-paper'; // <-- Appbar eklendi
import { useFocusEffect } from '@react-navigation/native';
import { authFetch } from '../utils/apiClient';

const COLORS = {
  background: '#1A1A1A',
  surface: 'rgba(50, 50, 50, 0.2)',
  surfaceInner: 'rgba(30, 30, 30, 0.5)',
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
};

const VideoCard = ({ item, onPress }) => {
  const thumbnailUrl = item.videoUrl.replace('.mp4', '.jpg');
  
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Card.Cover 
        source={{ uri: thumbnailUrl }} 
        style={styles.cardCover} 
      />
      <View style={styles.textContainer}>
        <Text style={styles.cardTitle}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        <Text style={styles.cardSubtitle}>
          {item.correctReps} Doğru / {item.wrongReps} Yanlış
        </Text>
      </View>
    </TouchableOpacity>
  );
};


const VideoListScreen = ({ route, navigation }) => {
  const { exerciseName } = route.params;

  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const response = await authFetch(
        `/videos/my-videos-by-category?exerciseName=${encodeURIComponent(exerciseName)}`
      );

      if (!response.ok) throw new Error('Failed to fetch videos');
      
      const data = await response.json();
      setVideos(data);
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
    }, [exerciseName])
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Appbar.Header style={{ backgroundColor: COLORS.background }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color={COLORS.text} />
        <Appbar.Content title={exerciseName} titleStyle={{ color: COLORS.text }} />
      </Appbar.Header>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <FlatList
          data={videos}
          renderItem={({ item }) => (
            <VideoCard 
              item={item} 
              onPress={() => Alert.alert(
                'Analiz Detayı', 
                `Video ID: ${item.id}\nFeedback: ${item.feedback}`
              )} 
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2} // İsteğine göre 2 sütunlu grid
          contentContainerStyle={styles.gridContainer}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.errorText}>Bu kategori için video bulunamadı.</Text>
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
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  gridContainer: {
    paddingHorizontal: 10,
    paddingTop: 16,
  },
  card: {
    flex: 1,
    margin: 6,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  cardCover: {
    height: 200,
    backgroundColor: COLORS.surfaceInner,
  },
  textContainer: {
    padding: 12,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
  cardSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
});

export default VideoListScreen;