// Типы для классификации
export type SeedClass = 'healthy seed' | 'bad seed' | 'impurity';

// Интерфейс для обнаруженного объекта
export interface Detection {
  class: SeedClass;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Интерфейс для результата анализа
export interface AnalysisResult {
  id?: number;
  imageUri: string;
  detections: Detection[];
  timestamp: number;
  fieldName?: string;
  combineOperator?: string;
  grainWeightGrams?: number; // Вес одного зерна в граммах
  photoAreaM2?: number; // Площадь фото в м²
  statistics: {
    healthyCount: number;
    badCount: number;
    impurityCount: number;
    totalLossKgPerHa: number;
    healthyPercent: number;
    badPercent: number;
    impurityPercent: number;
  };
}

// Интерфейс для фильтров аналитики
export interface AnalyticsFilter {
  startDate?: Date;
  endDate?: Date;
  fieldName?: string;
  combineOperator?: string;
}

// Интерфейс для агрегированных данных
export interface AggregatedData {
  fieldName: string;
  totalMeasurements: number;
  averageLoss: number;
  averageBadPercent: number;
  totalHealthy: number;
  totalBad: number;
  totalImpurity: number;
}

// Цвета для классов
export const CLASS_COLORS: Record<SeedClass, string> = {
  'healthy seed': '#22c55e',  // green
  'bad seed': '#ef4444',       // red
  'impurity': '#6b7280',       // gray
};
