import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DatabaseService from '../services/DatabaseService';
import { AnalysisResult } from '../types';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HistoryScreen: React.FC = () => {
  const [measurements, setMeasurements] = useState<AnalysisResult[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigation = useNavigation<NavigationProp>();

  const loadMeasurements = async () => {
    try {
      const data = await DatabaseService.getAllMeasurements();
      setMeasurements(data);
    } catch (error) {
      console.error('Error loading measurements:', error);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadMeasurements();
    setIsRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadMeasurements();
    }, [])
  );

  const handleItemPress = (item: AnalysisResult) => {
    navigation.navigate('Result', { result: item });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item }: { item: AnalysisResult }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => handleItemPress(item)}
    >
      <Image source={{ uri: item.imageUri }} style={styles.thumbnail} />
      
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
          <Text style={styles.lossText}>
            {item.statistics.totalLossKgPerHa.toFixed(2)} кг/га
          </Text>
        </View>

        {(item.fieldName || item.combineOperator) && (
          <View style={styles.metadataRow}>
            {item.fieldName && (
              <Text style={styles.metadataText}>📍 {item.fieldName}</Text>
            )}
            {item.combineOperator && (
              <Text style={styles.metadataText}>👤 {item.combineOperator}</Text>
            )}
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Text style={[styles.badgeText, { color: '#22c55e' }]}>
              ✓ {item.statistics.healthyCount}
            </Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={[styles.badgeText, { color: '#ef4444' }]}>
              ✗ {item.statistics.badCount}
            </Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={[styles.badgeText, { color: '#6b7280' }]}>
              ◆ {item.statistics.impurityCount}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.chevron}>
        <Text style={styles.chevronText}>›</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>История пуста</Text>
      <Text style={styles.emptyText}>
        Здесь будут отображаться все ваши сохраненные замеры.
      </Text>
      <Text style={styles.emptyText}>
        Перейдите на вкладку "Камера" чтобы сделать первый снимок.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>История замеров</Text>
        <Text style={styles.headerSubtitle}>
          Всего: {measurements.length}
        </Text>
      </View>

      <FlatList
        data={measurements}
        renderItem={renderItem}
        keyExtractor={(item) => item.id?.toString() || item.timestamp.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#22c55e']}
          />
        }
      />
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 15,
    flexGrow: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#e5e5e5',
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  lossText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f59e0b',
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metadataText: {
    fontSize: 12,
    color: '#666',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chevron: {
    justifyContent: 'center',
    paddingLeft: 8,
  },
  chevronText: {
    fontSize: 24,
    color: '#ccc',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
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
    marginBottom: 8,
  },
});

export default HistoryScreen;
