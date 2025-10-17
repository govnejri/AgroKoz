import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DatabaseService from '../services/DatabaseService';
import { AnalysisResult, AnalyticsFilter, AggregatedData } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnalyticsScreen: React.FC = () => {
  const [measurements, setMeasurements] = useState<AnalysisResult[]>([]);
  const [aggregated, setAggregated] = useState<AggregatedData[]>([]);
  const [filter, setFilter] = useState<AnalyticsFilter>({});
  const [showFilterModal, setShowFilterModal] = useState(false);

  const loadData = async () => {
    try {
      const data = await DatabaseService.getFilteredMeasurements(filter);
      setMeasurements(data);

      const aggData = await DatabaseService.getAggregatedByField(filter);
      setAggregated(aggData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [filter])
  );

  const calculateKPIs = () => {
    if (measurements.length === 0) {
      return {
        averageLoss: 0,
        averageBadPercent: 0,
        totalMeasurements: 0,
        totalHealthy: 0,
        totalBad: 0,
      };
    }

    const totalLoss = measurements.reduce(
      (sum, m) => sum + m.statistics.totalLossKgPerHa,
      0
    );
    const totalBadPercent = measurements.reduce(
      (sum, m) => sum + m.statistics.badPercent,
      0
    );
    const totalHealthy = measurements.reduce(
      (sum, m) => sum + m.statistics.healthyCount,
      0
    );
    const totalBad = measurements.reduce(
      (sum, m) => sum + m.statistics.badCount,
      0
    );

    return {
      averageLoss: totalLoss / measurements.length,
      averageBadPercent: totalBadPercent / measurements.length,
      totalMeasurements: measurements.length,
      totalHealthy,
      totalBad,
    };
  };

  const prepareChartData = () => {
    // Сортируем по времени
    const sorted = [...measurements].sort((a, b) => a.timestamp - b.timestamp);
    
    return sorted.map((m, index) => ({
      x: index + 1,
      y: m.statistics.totalLossKgPerHa,
      date: new Date(m.timestamp).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
      }),
    }));
  };

  const kpis = calculateKPIs();
  const chartData = prepareChartData();

  const setLastWeekFilter = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    setFilter({ ...filter, startDate, endDate });
    setShowFilterModal(false);
  };

  const setLastMonthFilter = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    setFilter({ ...filter, startDate, endDate });
    setShowFilterModal(false);
  };

  const clearFilter = () => {
    setFilter({});
    setShowFilterModal(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Аналитика</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Text style={styles.filterButtonText}>🔍 Фильтры</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* KPI Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ключевые Показатели</Text>
          
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Всего замеров</Text>
              <Text style={styles.kpiValue}>{kpis.totalMeasurements}</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Средние потери</Text>
              <Text style={styles.kpiValue}>{kpis.averageLoss.toFixed(1)}</Text>
              <Text style={styles.kpiUnit}>кг/га</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Средний % поврежд.</Text>
              <Text style={styles.kpiValue}>{kpis.averageBadPercent.toFixed(1)}%</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Всего здоровых</Text>
              <Text style={[styles.kpiValue, { color: '#22c55e' }]}>
                {kpis.totalHealthy}
              </Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Всего поврежденных</Text>
              <Text style={[styles.kpiValue, { color: '#ef4444' }]}>
                {kpis.totalBad}
              </Text>
            </View>
          </View>
        </View>

        {/* График динамики потерь - Упрощенная версия */}
        {chartData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Динамика Потерь</Text>
            <View style={styles.simpleChartContainer}>
              {chartData.map((point, index) => {
                const maxValue = Math.max(...chartData.map(d => d.y));
                const height = maxValue > 0 ? (point.y / maxValue) * 150 : 0;
                return (
                  <View key={index} style={styles.barContainer}>
                    <View style={[styles.bar, { height }]} />
                    <Text style={styles.barLabel}>#{point.x}</Text>
                    <Text style={styles.barValue}>{point.y.toFixed(1)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Таблица по полям */}
        {aggregated.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Рейтинг по Полям</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Поле</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Замеры</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Потери</Text>
              </View>
              {aggregated.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>
                    {item.fieldName}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {item.totalMeasurements}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1, fontWeight: '700', color: '#f59e0b' }]}>
                    {item.averageLoss.toFixed(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {measurements.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>Нет данных для анализа</Text>
            <Text style={styles.emptyText}>
              Сделайте несколько замеров, чтобы увидеть аналитику
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Модальное окно фильтров */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Фильтры</Text>

            <TouchableOpacity style={styles.filterOption} onPress={setLastWeekFilter}>
              <Text style={styles.filterOptionText}>Последние 7 дней</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.filterOption} onPress={setLastMonthFilter}>
              <Text style={styles.filterOptionText}>Последний месяц</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.filterOption} onPress={clearFilter}>
              <Text style={styles.filterOptionText}>Все время</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  filterButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    minWidth: (SCREEN_WIDTH - 60) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  kpiUnit: {
    fontSize: 12,
    color: '#999',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  simpleChartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    marginHorizontal: 2,
  },
  bar: {
    backgroundColor: '#22c55e',
    width: '80%',
    minHeight: 5,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 5,
  },
  barValue: {
    fontSize: 9,
    color: '#999',
    marginTop: 2,
  },
  table: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  tableCell: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  filterOption: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 10,
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  modalCloseButton: {
    padding: 15,
    backgroundColor: '#22c55e',
    borderRadius: 8,
    marginTop: 10,
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
});

export default AnalyticsScreen;
