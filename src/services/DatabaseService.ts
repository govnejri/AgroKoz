import * as SQLite from 'expo-sqlite';
import { AnalysisResult, AnalyticsFilter, AggregatedData } from '../types';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('agrokoz.db');
      await this.createTables();
      console.log('Database initialized');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS measurements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        imageUri TEXT NOT NULL,
        detections TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        fieldName TEXT,
        combineOperator TEXT,
        healthyCount INTEGER NOT NULL,
        badCount INTEGER NOT NULL,
        impurityCount INTEGER NOT NULL,
        totalLossKgPerHa REAL NOT NULL,
        healthyPercent REAL NOT NULL,
        badPercent REAL NOT NULL,
        impurityPercent REAL NOT NULL
      );
    `;

    await this.db.execAsync(createTableQuery);
  }

  async saveMeasurement(result: AnalysisResult): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      INSERT INTO measurements (
        imageUri, detections, timestamp, fieldName, combineOperator,
        healthyCount, badCount, impurityCount, totalLossKgPerHa,
        healthyPercent, badPercent, impurityPercent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const params = [
      result.imageUri,
      JSON.stringify(result.detections),
      result.timestamp,
      result.fieldName || null,
      result.combineOperator || null,
      result.statistics.healthyCount,
      result.statistics.badCount,
      result.statistics.impurityCount,
      result.statistics.totalLossKgPerHa,
      result.statistics.healthyPercent,
      result.statistics.badPercent,
      result.statistics.impurityPercent,
    ];

    const resultSet = await this.db.runAsync(query, params);
    return resultSet.lastInsertRowId || 0;
  }

  async getAllMeasurements(): Promise<AnalysisResult[]> {
    if (!this.db) throw new Error('Database not initialized');

    const query = 'SELECT * FROM measurements ORDER BY timestamp DESC;';
    const results = await this.db.getAllAsync(query);

    return results.map((row: any) => this.rowToAnalysisResult(row));
  }

  async getMeasurementById(id: number): Promise<AnalysisResult | null> {
    if (!this.db) throw new Error('Database not initialized');

    const query = 'SELECT * FROM measurements WHERE id = ?;';
    const result = await this.db.getFirstAsync(query, [id]);

    if (!result) return null;
    return this.rowToAnalysisResult(result);
  }

  async getFilteredMeasurements(filter: AnalyticsFilter): Promise<AnalysisResult[]> {
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM measurements WHERE 1=1';
    const params: any[] = [];

    if (filter.startDate) {
      query += ' AND timestamp >= ?';
      params.push(filter.startDate.getTime());
    }

    if (filter.endDate) {
      query += ' AND timestamp <= ?';
      params.push(filter.endDate.getTime());
    }

    if (filter.fieldName) {
      query += ' AND fieldName = ?';
      params.push(filter.fieldName);
    }

    if (filter.combineOperator) {
      query += ' AND combineOperator = ?';
      params.push(filter.combineOperator);
    }

    query += ' ORDER BY timestamp DESC;';

    const results = await this.db.getAllAsync(query, params);
    return results.map((row: any) => this.rowToAnalysisResult(row));
  }

  async getAggregatedByField(filter: AnalyticsFilter): Promise<AggregatedData[]> {
    if (!this.db) throw new Error('Database not initialized');

    let query = `
      SELECT 
        COALESCE(fieldName, 'Без поля') as fieldName,
        COUNT(*) as totalMeasurements,
        AVG(totalLossKgPerHa) as averageLoss,
        AVG(badPercent) as averageBadPercent,
        SUM(healthyCount) as totalHealthy,
        SUM(badCount) as totalBad,
        SUM(impurityCount) as totalImpurity
      FROM measurements
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filter.startDate) {
      query += ' AND timestamp >= ?';
      params.push(filter.startDate.getTime());
    }

    if (filter.endDate) {
      query += ' AND timestamp <= ?';
      params.push(filter.endDate.getTime());
    }

    query += ' GROUP BY fieldName ORDER BY averageLoss DESC;';

    const results = await this.db.getAllAsync(query, params);

    return results.map((row: any) => ({
      fieldName: row.fieldName,
      totalMeasurements: row.totalMeasurements,
      averageLoss: row.averageLoss,
      averageBadPercent: row.averageBadPercent,
      totalHealthy: row.totalHealthy,
      totalBad: row.totalBad,
      totalImpurity: row.totalImpurity,
    }));
  }

  async deleteMeasurement(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM measurements WHERE id = ?;', [id]);
  }

  private rowToAnalysisResult(row: any): AnalysisResult {
    return {
      id: row.id,
      imageUri: row.imageUri,
      detections: JSON.parse(row.detections),
      timestamp: row.timestamp,
      fieldName: row.fieldName,
      combineOperator: row.combineOperator,
      statistics: {
        healthyCount: row.healthyCount,
        badCount: row.badCount,
        impurityCount: row.impurityCount,
        totalLossKgPerHa: row.totalLossKgPerHa,
        healthyPercent: row.healthyPercent,
        badPercent: row.badPercent,
        impurityPercent: row.impurityPercent,
      },
    };
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

export default new DatabaseService();
