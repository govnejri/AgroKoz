import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import MLService from '../services/MLService';
import { AnalysisResult } from '../types';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CameraScreen: React.FC = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [grainWeight, setGrainWeight] = useState('40'); // Вес 1000 зерен в граммах
  const [photoArea, setPhotoArea] = useState('0.1'); // Площадь фото в м²
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp>();

  const analyzeWithParams = async (imageUri: string) => {
    try {
      setIsAnalyzing(true);
      
      const detections = await MLService.analyzeImage(imageUri);
      const grainWeightNum = parseFloat(grainWeight) || 40;
      const photoAreaNum = parseFloat(photoArea) || 0.1;
      const statistics = MLService.calculateStatistics(detections, grainWeightNum, photoAreaNum);

      const result: AnalysisResult = {
        imageUri,
        detections,
        timestamp: Date.now(),
        grainWeightGrams: grainWeightNum,
        photoAreaM2: photoAreaNum,
        statistics,
      };

      navigation.navigate('Result', { result });
    } catch (error) {
      console.error('Error analyzing:', error);
      Alert.alert('Ошибка', 'Не удалось проанализировать изображение');
    } finally {
      setIsAnalyzing(false);
      setShowWeightModal(false);
      setPendingImageUri(null);
    }
  };

  const takePhoto = async () => {
    if (!cameraRef) return;

    try {
      const photo = await cameraRef.takePictureAsync();
      setPendingImageUri(photo.uri);
      setShowWeightModal(true);
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Ошибка', 'Не удалось сделать снимок');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setPendingImageUri(result.assets[0].uri);
        setShowWeightModal(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать изображение');
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Необходимо разрешение на использование камеры
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Предоставить доступ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        ref={(ref) => setCameraRef(ref)}
      />

      {/* Оверлей */}
      <View style={styles.overlay}>
        <View style={styles.topOverlay} />
        <View style={styles.middleRow}>
          <View style={styles.sideOverlay} />
          <View style={styles.focusArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <View style={styles.sideOverlay} />
        </View>
        <View style={styles.bottomOverlay}>
          <Text style={styles.instructionText}>
            Наведите камеру на зерно на земле
          </Text>
        </View>
      </View>

      {/* Кнопки */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
          <Text style={styles.galleryButtonText}>📁</Text>
        </TouchableOpacity>

        {isAnalyzing ? (
          <View style={styles.captureButtonOuter}>
            <ActivityIndicator size="large" color="#22c55e" />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.captureButtonOuter}
            onPress={takePhoto}
            disabled={isAnalyzing}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        )}

        <View style={styles.galleryButton} />
      </View>

      {isAnalyzing && (
        <View style={styles.analyzingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.analyzingText}>Анализ изображения...</Text>
        </View>
      )}

      {/* Модальное окно для ввода параметров */}
      <Modal
        visible={showWeightModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWeightModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Параметры Анализа</Text>
            
            <Text style={styles.inputLabel}>Вес 1000 зерен (грамм):</Text>
            <TextInput
              style={styles.input}
              value={grainWeight}
              onChangeText={setGrainWeight}
              keyboardType="decimal-pad"
              placeholder="40"
            />

            <Text style={styles.inputLabel}>Площадь фото (м²):</Text>
            <TextInput
              style={styles.input}
              value={photoArea}
              onChangeText={setPhotoArea}
              keyboardType="decimal-pad"
              placeholder="0.1"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowWeightModal(false);
                  setPendingImageUri(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.analyzeButton]}
                onPress={() => {
                  if (pendingImageUri) {
                    analyzeWithParams(pendingImageUri);
                  }
                }}
              >
                <Text style={styles.analyzeButtonText}>Анализировать</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 30,
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  middleRow: {
    flexDirection: 'row',
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  focusArea: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#22c55e',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 20,
  },
  instructionText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryButtonText: {
    fontSize: 24,
  },
  captureButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 20,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 25,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e5e5e5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  analyzeButton: {
    backgroundColor: '#22c55e',
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CameraScreen;
