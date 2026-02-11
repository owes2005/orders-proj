import { Injectable } from '@angular/core';

export type ChartType = 'bar' | 'line' | 'pie' | 'doughnut';

export interface StoredChartConfig {
  id: number;
  chartType: ChartType;
  labels: string[];
  data: number[];
  title: string;
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsStateService {

  private STORAGE_KEY = 'custom_analytics_charts';

  private _charts: StoredChartConfig[] = [];

  constructor() {
    this.loadFromStorage();
  }

  get charts(): StoredChartConfig[] {
    return this._charts;
  }

  set charts(value: StoredChartConfig[]) {
    this._charts = value;
    this.saveToStorage();
  }

  private saveToStorage(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._charts));
  }

  private loadFromStorage(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        this._charts = JSON.parse(saved);
      } catch {
        this._charts = [];
      }
    }
  }

  clear(): void {
    this._charts = [];
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
