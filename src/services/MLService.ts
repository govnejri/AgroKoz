import { Detection, SeedClass } from '../types';

class MLService {
  private isInitialized = false;
  // ЗАМЕНИТЕ на IP вашего компьютера! (не localhost!)
  private readonly API_URL = 'http://192.168.8.31:8000'; 
  private readonly CONFIDENCE_THRESHOLD = 0.5;
  private useAPI = false; // Переключатель между API и mock

  async init(): Promise<void> {
    try {
      console.log('🚀 Initializing ML Service...');
      console.log(`🌐 API URL: ${this.API_URL}`);
      
      // Проверяем доступность API
      try {
        const response = await fetch(`${this.API_URL}/health`, {
          method: 'GET',
          timeout: 3000,
        } as any);
        
        if (response.ok) {
          this.useAPI = true;
          console.log('✅ ML API is available - using real YOLOv8 model!');
        } else {
          console.log('⚠️ ML API unavailable - using mock mode');
        }
      } catch (error) {
        console.log('⚠️ Cannot connect to ML API - using mock mode');
        console.log('� Start Python server: python ml-server/server.py');
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize ML service:', error);
      this.isInitialized = true; // Continue with mock
    }
  }

  async analyzeImage(imageUri: string): Promise<Detection[]> {
    if (!this.isInitialized) {
      throw new Error('Service not initialized');
    }

    // Если API доступен, используем реальную модель
    if (this.useAPI) {
      try {
        return await this.analyzeWithAPI(imageUri);
      } catch (error) {
        console.error('❌ API error, falling back to mock:', error);
        return this.generateMockDetections();
      }
    }

    // Иначе mock данные
    console.log('⚠️ Using mock data');
    await new Promise(resolve => setTimeout(resolve, 1500));
    return this.generateMockDetections();
  }

  private async analyzeWithAPI(imageUri: string): Promise<Detection[]> {
    console.log('🚀 Sending image to ML API...');
    const startTime = Date.now();

    // Создаем FormData
    const formData = new FormData();
    
    // Для React Native нужен объект с uri, type, name
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);
    
    formData.append('confidence', this.CONFIDENCE_THRESHOLD.toString());
    formData.append('iou', '0.45');

    // Отправляем на сервер (используем endpoint /detect)
    const response = await fetch(`${this.API_URL}/detect`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    const inferenceTime = Date.now() - startTime;

    console.log(`✅ API response received in ${inferenceTime}ms`);
    console.log(`📊 Statistics:`, result.statistics);

    if (!result.success || !result.detections) {
      throw new Error('Invalid API response');
    }

    // Конвертируем формат API в формат приложения
    return this.convertAPIDetections(result.detections);
  }

  private convertAPIDetections(apiDetections: any[]): Detection[] {
    // Конвертируем 'good', 'bad', 'impurity' в 'healthy seed', 'bad seed', 'impurity'
    const classMapping: Record<string, SeedClass> = {
      'good': 'healthy seed',
      'bad': 'bad seed',
      'impurity': 'impurity'
    };

    return apiDetections.map(det => ({
      class: classMapping[det.class] || 'impurity' as SeedClass,
      confidence: det.confidence,
      bbox: {
        x: det.bbox.x1,
        y: det.bbox.y1,
        width: det.bbox.width,
        height: det.bbox.height,
      }
    }));
  }

  private generateMockDetections(): Detection[] {
    const classes: SeedClass[] = ['healthy seed', 'bad seed', 'impurity'];
    const detections: Detection[] = [];
    
    // Генерируем случайное количество обнаружений
    const count = Math.floor(Math.random() * 25) + 15; // 15-40 объектов
    
    for (let i = 0; i < count; i++) {
      const classIndex = Math.floor(Math.random() * 100);
      let seedClass: SeedClass;
      
      // 50% здоровые, 30% поврежденные, 20% примеси
      if (classIndex < 50) {
        seedClass = 'healthy seed';
      } else if (classIndex < 80) {
        seedClass = 'bad seed';
      } else {
        seedClass = 'impurity';
      }
      
      detections.push({
        class: seedClass,
        confidence: 0.7 + Math.random() * 0.3,
        bbox: {
          x: Math.random() * 550,
          y: Math.random() * 550,
          width: 20 + Math.random() * 40,
          height: 20 + Math.random() * 40,
        },
      });
    }
    
    return detections;
  }

  calculateStatistics(
    detections: Detection[], 
    grainWeightGrams: number = 40, // Вес 1000 зерен в граммах (по умолчанию 40г)
    photoAreaM2: number = 0.1 // Площадь фото в м² (по умолчанию 0.1 м²)
  ) {
    const healthyCount = detections.filter(d => d.class === 'healthy seed').length;
    const badCount = detections.filter(d => d.class === 'bad seed').length;
    const impurityCount = detections.filter(d => d.class === 'impurity').length;
    
    const grainCount = healthyCount + badCount;
    const total = detections.length;
    
    // Формула расчета потерь:
    // 1. Вес всех зерен на фото = (количество зерен * вес 1000 зерен в граммах) / 1000
    // 2. Плотность потерь на м² = вес всех зерен / площадь фото
    // 3. Потери на гектар = плотность потерь * 10000 м²
    // 4. Переводим в кг
    const totalGrainsWeightGrams = (grainCount * grainWeightGrams) / 1000;
    const lossPerM2Grams = totalGrainsWeightGrams / photoAreaM2;
    const totalLossKgPerHa = (lossPerM2Grams * 10000) / 1000;
    
    return {
      healthyCount,
      badCount,
      impurityCount,
      totalLossKgPerHa: Math.round(totalLossKgPerHa * 100) / 100,
      healthyPercent: total > 0 ? Math.round((healthyCount / total) * 100 * 10) / 10 : 0,
      badPercent: total > 0 ? Math.round((badCount / total) * 100 * 10) / 10 : 0,
      impurityPercent: total > 0 ? Math.round((impurityCount / total) * 100 * 10) / 10 : 0,
    };
  }

  cleanup(): void {
    this.isInitialized = false;
  }
}

export default new MLService();
