import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MATERIAL_MODULES } from '../../shared/material';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { OrdersService } from '../../core/services/orders.service';
import { Order } from '../../core/models/order.model';
import { Chart } from 'chart.js/auto';
import { Injectable } from '@angular/core';

type ChartType = 'bar' | 'line' | 'pie' | 'doughnut' ;
type ChartDimension = 'date' | 'hour' | 'status' | 'customer';
type ChartMetric = 'orderCount' | 'totalRevenue' | 'avgOrderValue';

interface CustomChartConfig {
  id: number;
  chartType: ChartType;
  labels: string[];
  data: number[];
  title: string;
  chartInstance?: Chart;
}

interface ChartFilters {
  status?: Order['status'] | null;
  fromDate?: Date | null;
  toDate?: Date | null;
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  /**
   * Builds chart labels and data based on the selected
   * dimension, metric and optional filters.
   */
  buildChartData(
    orders: Order[],
    options: {
      chartType: ChartType;
      xAxis: ChartDimension;
      yAxis: ChartMetric;
      filters: ChartFilters;
    },
  ): { labels: string[]; data: number[] } {
    const { xAxis, yAxis, filters } = options;

    let filtered = [...orders];

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter((o) => o.status === filters.status);
    }

    // Apply date range filter (uses createdAt when available)
    if (filters.fromDate || filters.toDate) {
      filtered = filtered.filter((o) => {
        if (!o.createdAt) return false;
        const created = new Date(o.createdAt);

        if (filters.fromDate && created < this.startOfDay(filters.fromDate)) {
          return false;
        }

        if (filters.toDate && created > this.endOfDay(filters.toDate)) {
          return false;
        }

        return true;
      });
    }

    const buckets = new Map<string, { count: number; sum: number }>();

    for (const order of filtered) {
      const key = this.getBucketKey(order, xAxis);
      if (!key) continue;

      const existing = buckets.get(key) ?? { count: 0, sum: 0 };
      existing.count += 1;
      existing.sum += order.amount;
      buckets.set(key, existing);
    }

    const sortedKeys = this.sortKeys([...buckets.keys()], xAxis);
    const labels: string[] = [];
    const data: number[] = [];

    for (const key of sortedKeys) {
      const bucket = buckets.get(key)!;
      labels.push(key);

      switch (yAxis) {
        case 'orderCount':
          data.push(bucket.count);
          break;
        case 'totalRevenue':
          data.push(bucket.sum);
          break;
        case 'avgOrderValue':
          data.push(bucket.count === 0 ? 0 : bucket.sum / bucket.count);
          break;
      }
    }

    return { labels, data };
  }

  private getBucketKey(order: Order, xAxis: ChartDimension): string | null {
    switch (xAxis) {
      case 'date': {
        if (!order.createdAt) return null;
        return order.createdAt.split('T')[0]; // YYYY-MM-DD
      }
      case 'hour': {
        if (!order.createdAt) return null;
        const d = new Date(order.createdAt);
        const hour = d.getHours().toString().padStart(2, '0');
        return `${hour}:00`;
      }
      case 'status':
        return order.status;
      case 'customer':
        return order.customerName;
      default:
        return null;
    }
  }

  private sortKeys(keys: string[], xAxis: ChartDimension): string[] {
    if (xAxis === 'date') {
      return keys.sort((a, b) => a.localeCompare(b));
    }

    if (xAxis === 'hour') {
      return keys.sort((a, b) => {
        const aNum = parseInt(a.split(':')[0], 10);
        const bNum = parseInt(b.split(':')[0], 10);
        return aNum - bNum;
      });
    }

    return keys.sort((a, b) => a.localeCompare(b));
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  }

  private endOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  }
}

@Component({
  selector: 'app-custom-analytics',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MATERIAL_MODULES,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './custom-analytics.html',
  styleUrls: ['./custom-analytics.css'],
})
export class CustomAnalytics implements AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private ordersService = inject(OrdersService);
  private analyticsService = inject(AnalyticsService);

  @ViewChildren('chartCanvas') chartCanvases!: QueryList<ElementRef<HTMLCanvasElement>>;

  configForm: FormGroup = this.fb.group({
    chartType: ['bar' as ChartType, Validators.required],
    xAxis: ['date' as ChartDimension, Validators.required],
    yAxis: ['orderCount' as ChartMetric, Validators.required],
    status: [null as Order['status'] | null],
    fromDate: [null as Date | null],
    toDate: [null as Date | null],
  });

  charts: CustomChartConfig[] = [];
  private chartIdCounter = 1;

  chartTypes: { value: ChartType; label: string }[] = [
    { value: 'bar', label: 'Bar' },
    { value: 'line', label: 'Line' },
    { value: 'pie', label: 'Pie' },
    { value: 'doughnut', label: 'Doughnut' },
    
  ];

  xAxes: { value: ChartDimension; label: string }[] = [
    { value: 'date', label: 'Date' },
    { value: 'hour', label: 'Hour of Day' },
    { value: 'status', label: 'Status' },
    { value: 'customer', label: 'Customer' },
  ];

  yAxes: { value: ChartMetric; label: string }[] = [
    { value: 'orderCount', label: 'Order Count' },
    { value: 'totalRevenue', label: 'Total Revenue' },
    { value: 'avgOrderValue', label: 'Average Order Value' },
  ];

  isBuildingChart = false;

  ngOnInit(): void {
    // Ensure orders are loaded when the page is opened directly
    if (this.ordersService.orders().length === 0) {
      this.ordersService.loadOrders();
    }
  }

  ngAfterViewInit(): void {
    // Render charts whenever canvas list changes
    this.chartCanvases.changes.subscribe(() => this.renderCharts());
  }

  ngOnDestroy(): void {
    this.charts.forEach((c) => c.chartInstance?.destroy());
  }

  addChart(): void {
    if (this.configForm.invalid) {
      this.configForm.markAllAsTouched();
      return;
    }

    const orders = this.ordersService.orders();
    this.isBuildingChart = true;

    const chartType = this.configForm.value.chartType as ChartType;
    const xAxis = this.configForm.value.xAxis as ChartDimension;
    const yAxis = this.configForm.value.yAxis as ChartMetric;
    const status = this.configForm.value.status as Order['status'] | null;
    const fromDate = this.configForm.value.fromDate as Date | null;
    const toDate = this.configForm.value.toDate as Date | null;

    const { labels, data } = this.analyticsService.buildChartData(orders, {
      chartType,
      xAxis,
      yAxis,
      filters: {
        status,
        fromDate,
        toDate,
      },
    });

    const title = `${this.getChartTypeLabel(chartType)} - ${this.getAxisLabel(
      xAxis,
    )} vs ${this.getMetricLabel(yAxis)}`;

    const newChart: CustomChartConfig = {
      id: this.chartIdCounter++,
      chartType,
      labels,
      data,
      title,
    };

    this.charts = [...this.charts, newChart];
    this.isBuildingChart = false;
  }

  removeChart(id: number): void {
    const chart = this.charts.find((c) => c.id === id);
    chart?.chartInstance?.destroy();
    this.charts = this.charts.filter((c) => c.id !== id);
  }

  trackByChartId(_index: number, chart: CustomChartConfig): number {
    return chart.id;
  }

  private renderCharts(): void {
    const canvasArray = this.chartCanvases.toArray();

    this.charts.forEach((chartConfig, index) => {
      if (chartConfig.chartInstance) {
        return;
      }

      const canvasRef = canvasArray[index];
      if (!canvasRef) {
        return;
      }

      const ctx = canvasRef.nativeElement.getContext('2d');
      if (!ctx) {
        return;
      }

      chartConfig.chartInstance = new Chart(ctx, {
        type: chartConfig.chartType,
        data: {
          labels: chartConfig.labels,
          datasets: [
            {
              label: chartConfig.title,
              data: chartConfig.data,
              backgroundColor: 'rgba(63, 81, 181, 0.4)',
              borderColor: 'rgba(63, 81, 181, 1)',
              borderWidth: 1,
              
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
        },
      });
    });
  }

  private getChartTypeLabel(type: ChartType): string {
    return this.chartTypes.find((t) => t.value === type)?.label ?? type;
  }

  private getAxisLabel(axis: ChartDimension): string {
    return this.xAxes.find((x) => x.value === axis)?.label ?? axis;
  }

  private getMetricLabel(metric: ChartMetric): string {
    return this.yAxes.find((y) => y.value === metric)?.label ?? metric;
  }
}

