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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { authFetch } from '../utils/apiClient';

const COLORS = {
  background: '#1A1A1A',
  surface: 'rgba(50, 50, 50, 0.2)',
  surfaceInner: 'rgba(30, 30, 30, 0.5)',
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
};

const getIconForExercise = (exerciseName) => {
  const name = exerciseName.toLowerCase();
  if (name.includes('squat')) return 'weight-lifter';
  if (name.includes('push')) return 'arm-flex';
  if (name.includes('deadlift')) return 'weight';
  if (name.includes('press')) return 'arrow-up-bold-outline';
  return 'run';
};

const AnalysisCategoryCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={styles.iconContainer}>
      <MaterialCommunityIcons 
        name={getIconForExercise(item.exerciseName)}
        size={72} 
        color={COLORS.text} 
      />
    </View>
    <View style={styles.textContainer}>
      <Text style={styles.cardTitle}>{item.exerciseName}</Text>
      <Text style={styles.cardSubtitle}>{item.count} Analyses</Text> 
    </View>
  </TouchableOpacity>
);


const AnalysisScreen = ({ route, navigation }) => {

  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setError(null);
      const response = await authFetch('/videos/my-analysis-categories');

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const data = await response.json();
      setCategories(data);
    } catch (e) {
      console.error(e);
      setError(e.message);
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

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load analyses.</Text>
        <Button onPress={fetchData}>Try Again</Button>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.headerButtonSpacer} /> 
        <Text style={styles.headerTitle}>My Analyses</Text>
        <TouchableOpacity style={styles.headerButton}>
          <MaterialIcons name="more-horiz" size={28} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories} 
        renderItem={({ item }) => (
          <AnalysisCategoryCard 
            item={item} 
            onPress={() => navigation.navigate('VideoList', { exerciseName: item.exerciseName })} 
          />
        )}
        keyExtractor={(item) => item.exerciseName}
        numColumns={2}
        contentContainerStyle={styles.gridContainer}
        ListFooterComponent={<View style={{ height: 80 }} />}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>Henüz tamamlanmış bir analiziniz yok.</Text>
          </View>
        } 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
  },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  headerButton: { width: 48, height: 48, alignItems: 'flex-end', justifyContent: 'center' },
  headerButtonSpacer: { width: 48 },
  gridContainer: { paddingHorizontal: 10, paddingTop: 16 },
  card: {
    flex: 1,
    margin: 6,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    padding: 12,
  },
  iconContainer: {
    height: 160,
    width: '100%',
    borderRadius: 8,
    backgroundColor: COLORS.surfaceInner,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: { marginTop: 12 },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: '500' },
  cardSubtitle: { color: COLORS.textSecondary, fontSize: 14, marginTop: 2 },
});

export default AnalysisScreen;