import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
// import Svg, { Rect } from 'react-native-svg'; // Не используется - боксы отключены
import { useNavigation, useRoute } from '@react-navigation/native';
import DatabaseService from '../services/DatabaseService';
import { AnalysisResult, CLASS_COLORS } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = SCREEN_WIDTH - 40;

const ResultScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { result: initialResult } = route.params as { result: AnalysisResult };
  
  const [result, setResult] = useState(initialResult);
  const [isSaving, setIsSaving] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [fieldName, setFieldName] = useState(result.fieldName || '');
  const [combineOperator, setCombineOperator] = useState(result.combineOperator || '');

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const updatedResult = {
        ...result,
        fieldName: fieldName.trim() || undefined,
        combineOperator: combineOperator.trim() || undefined,
      };

      await DatabaseService.saveMeasurement(updatedResult);
      
      Alert.alert(
        'Успешно',
        'Результат сохранен в историю',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Camera' as never),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving measurement:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить результат');
    } finally {
      setIsSaving(false);
    }
  };

  /*
  // Функция отрисовки боксов ОТКЛЮЧЕНА - боксы больше не показываются
  const renderBoundingBoxes = () => {
    return result.detections.map((detection, index) => {
      const color = CLASS_COLORS[detection.class];
      const { x, y, width, height } = detection.bbox;

      return (
        <Rect
          key={index}
          x={x}
          y={y}
          width={width}
          height={height}
          stroke={color}
          strokeWidth={3}
          fill="none"
        />
      );
    });
  };
  */

  const { statistics } = result;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Изображение БЕЗ разметки (боксы убраны) */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: result.imageUri }}
            style={styles.image}
            resizeMode="contain"
          />
          {/* 
            Отрисовка боксов ОТКЛЮЧЕНА по запросу
            <Svg style={StyleSheet.absoluteFill}>
              {renderBoundingBoxes()}
            </Svg>
          */}
        </View>

        {/* Основная статистика */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Ключевые Показатели</Text>
          
          <View style={styles.mainStatCard}>
            <Text style={styles.mainStatLabel}>Общие потери</Text>
            <Text style={styles.mainStatValue}>
              {statistics.totalLossKgPerHa.toFixed(2)} кг/га
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { borderColor: CLASS_COLORS['healthy seed'] }]}>
              <Text style={styles.statLabel}>Здоровые</Text>
              <Text style={styles.statValue}>{statistics.healthyCount}</Text>
              <Text style={styles.statPercent}>{statistics.healthyPercent.toFixed(1)}%</Text>
            </View>

            <View style={[styles.statCard, { borderColor: CLASS_COLORS['bad seed'] }]}>
              <Text style={styles.statLabel}>Поврежденные</Text>
              <Text style={styles.statValue}>{statistics.badCount}</Text>
              <Text style={styles.statPercent}>{statistics.badPercent.toFixed(1)}%</Text>
            </View>

            <View style={[styles.statCard, { borderColor: CLASS_COLORS['impurity'] }]}>
              <Text style={styles.statLabel}>Примеси</Text>
              <Text style={styles.statValue}>{statistics.impurityCount}</Text>
              <Text style={styles.statPercent}>{statistics.impurityPercent.toFixed(1)}%</Text>
            </View>
          </View>

          <Text style={styles.totalDetections}>
            Всего обнаружено: {result.detections.length} объектов
          </Text>

          {/* Параметры анализа */}
          {(result.grainWeightGrams || result.photoAreaM2) && (
            <View style={styles.paramsContainer}>
              <Text style={styles.paramsTitle}>Параметры анализа:</Text>
              {result.grainWeightGrams && (
                <Text style={styles.paramText}>
                  • Вес 1000 зерен: {result.grainWeightGrams} г
                </Text>
              )}
              {result.photoAreaM2 && (
                <Text style={styles.paramText}>
                  • Площадь фото: {result.photoAreaM2} м²
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Метаданные (опционально) */}
        <TouchableOpacity
          style={styles.metadataToggle}
          onPress={() => setShowMetadata(!showMetadata)}
        >
          <Text style={styles.metadataToggleText}>
            {showMetadata ? '▼' : '▶'} Добавить метаданные
          </Text>
        </TouchableOpacity>

        {showMetadata && (
          <View style={styles.metadataContainer}>
            <Text style={styles.inputLabel}>Название поля:</Text>
            <TextInput
              style={styles.input}
              value={fieldName}
              onChangeText={setFieldName}
              placeholder="Например: Поле №5"
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>Комбайнер:</Text>
            <TextInput
              style={styles.input}
              value={combineOperator}
              onChangeText={setCombineOperator}
              placeholder="Например: Иванов И.И."
              placeholderTextColor="#999"
            />
          </View>
        )}

        {/* Кнопки действий */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>💾 Сохранить</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  imageContainer: {
    width: IMAGE_WIDTH,
    height: IMAGE_WIDTH,
    alignSelf: 'center',
    marginTop: 20,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  statsContainer: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
  },
  mainStatCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 5,
    borderLeftColor: '#f59e0b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mainStatLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  mainStatValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#f59e0b',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  statPercent: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  totalDetections: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  paramsContainer: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#22c55e',
  },
  paramsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  paramText: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  metadataToggle: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  metadataToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  metadataContainer: {
    marginHorizontal: 20,
    marginTop: 10,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  actionsContainer: {
    marginHorizontal: 20,
    marginTop: 25,
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButton: {
    backgroundColor: '#22c55e',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ResultScreen;
