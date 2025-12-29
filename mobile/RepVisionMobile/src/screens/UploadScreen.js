import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert
} from 'react-native';
import { Button, Chip, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { API_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Toast from 'react-native-toast-message';

const COLORS = {
  background: '#1A1A1A',
  surface: '#2a2a2a',
  border: '#3f3f46',
  accent: '#39FF14',
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
};

const EXERCISES = ['Squat', 'Push-up', 'Barbell Curl', 'Shoulder Press', 'Bench Press'];

const UploadScreen = ({ route }) => {
  const { user } = route.params;

  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectVideo = async () => {
    let permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.granted === false) {
      Alert.alert('İzin Gerekli', 'Video yüklemek için galeriye erişim izni vermelisiniz.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setSelectedVideo(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!selectedVideo || !selectedExercise) {
      Alert.alert('Eksik Bilgi', 'Lütfen bir video seçin ve hareket adını belirtin.');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Cloudinary\'e yükleniyor...');

      const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      const formData = new FormData();
      formData.append('file', {
        uri: selectedVideo,
        type: 'video/mp4',
        name: 'upload.mp4',
      });
      formData.append('upload_preset', uploadPreset);

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;

      const cloudinaryResponse = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const cloudinaryData = await cloudinaryResponse.json();

      if (cloudinaryData.error || !cloudinaryData.secure_url) {
        throw new Error('Cloudinary yüklemesi başarısız oldu: ' + (cloudinaryData.error?.message || 'Bilinmeyen hata'));
      }

      const videoUrl = cloudinaryData.secure_url;
      console.log('Cloudinary yüklemesi başarılı:', videoUrl);
      console.log('Backend API\'ye gönderiliyor...');

      const token = await AsyncStorage.getItem('@auth_token');
      if (!token) {
        Alert.alert('Hata', 'Oturum bulunamadı. Lütfen tekrar giriş yapın.');
        setIsLoading(false);
        return;
      }

      const backendResponse = await fetch(`${API_URL}/videos/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          videoUrl: videoUrl,
          exerciseName: selectedExercise,
        }),
      });

      if (!backendResponse.ok) {
        throw new Error('Backend kaydı başarısız oldu. Durum: ' + backendResponse.status);
      }

      const savedAnalysis = await backendResponse.json();
      console.log('Backend kaydı başarılı:', savedAnalysis.id);
      setIsLoading(false);

      Toast.show({
        type: 'success',
        text1: 'Başarılı!',
        text2: 'Videonuz işlenmek üzere kaydedildi.',
        position: 'top',
        visibilityTime: 3000,
      });

      setSelectedVideo(null);
      setSelectedExercise(null);

    } catch (error) {
      console.error('handleSubmit hatası:', error);
      setIsLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Bir Hata Oluştu',
        text2: error.message || 'Video yüklenemedi.',
        position: 'top',
      });
    }
  };

  const isSubmitDisabled = !selectedVideo || !selectedExercise || isLoading;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {selectedVideo ? (
          <View style={styles.videoPreviewContainer}>
            <Video
              source={{ uri: selectedVideo }}
              style={styles.videoPreview}
              useNativeControls
              resizeMode="contain"
              isLooping
            />
            <TouchableOpacity style={styles.changeVideoButton} onPress={handleSelectVideo}>
              <Text style={styles.changeVideoText}>Videoyu Değiştir</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadBox} onPress={handleSelectVideo}>
            <Text style={styles.uploadBoxTitle}>Tap to Upload Video</Text>
            <Text style={styles.uploadBoxSubtitle}>or Record New Video</Text>
            <Button
              mode="contained"
              style={styles.selectButton}
              labelStyle={styles.selectButtonLabel}
              onPress={handleSelectVideo}
            >
              Select Video
            </Button>
          </TouchableOpacity>
        )}
        <View style={styles.exerciseSection}>
          <Text style={styles.sectionTitle}>What exercise is this?</Text>
          <View style={styles.chipContainer}>
            {EXERCISES.map((exercise) => (
              <Chip
                key={exercise}
                mode="flat"
                selected={selectedExercise === exercise}
                onPress={() => setSelectedExercise(exercise)}
                style={[
                  styles.chip,
                  selectedExercise === exercise ? styles.chipSelected : styles.chipUnselected
                ]}
                textStyle={[
                  styles.chipText,
                  selectedExercise === exercise ? styles.chipTextSelected : styles.chipTextUnselected
                ]}
              >
                {exercise}
              </Chip>
            ))}
          </View>
        </View>

      </ScrollView>
      <View style={styles.submitContainer}>
        <Button
          mode="contained"
          style={[
            styles.submitButton,
            isSubmitDisabled && styles.submitButtonDisabled
          ]}
          labelStyle={styles.submitButtonLabel}
          onPress={handleSubmit}
          disabled={isSubmitDisabled}
          loading={isLoading}
        >
          {isLoading ? 'Processing...' : 'Submit for Analysis'}
        </Button>
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 150,
  },

  uploadBox: {
    alignItems: 'center',
    gap: 12, 
    borderRadius: 12, 
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    paddingVertical: 56,
    paddingHorizontal: 24,
  },
  uploadBoxTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  uploadBoxSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  selectButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
  },
  selectButtonLabel: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 14,
  },
  videoPreviewContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  videoPreview: {
    width: '100%',
    height: 250,
  },
  changeVideoButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    position: 'absolute',
    bottom: 10,
    right: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  changeVideoText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  exerciseSection: {
    paddingTop: 24,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    height: 32,
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: COLORS.accent,
  },
  chipUnselected: {
    backgroundColor: COLORS.surface,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: COLORS.background,
  },
  chipTextUnselected: {
    color: COLORS.text,
  },
  submitContainer: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    right: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  submitButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.surface,
  },
  submitButtonLabel: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default UploadScreen;