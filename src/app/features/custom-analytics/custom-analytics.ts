import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
  inject,
  Injectable,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MATERIAL_MODULES } from '../../shared/material';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { OrdersService } from '../../core/services/orders.service';
import { Order } from '../../core/models/order.model';
import { Chart } from 'chart.js/auto';
import {
  AnalyticsStateService,
  StoredChartConfig,
  ChartType,
} from '../../core/services/analytics-state.service';

type ChartDimension = 'date' | 'hour' | 'status' | 'customer';
type ChartMetric = 'orderCount' | 'totalRevenue' | 'avgOrderValue';

interface ChartFilters {
  status?: Order['status'] | null;
  fromDate?: Date | null;
  toDate?: Date | null;
}

/* ----------------------------- Analytics Service ----------------------------- */

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  buildChartData(
    orders: Order[],
    options: {
      chartType: ChartType;
      xAxis: ChartDimension;
      yAxis: ChartMetric;
      filters: ChartFilters;
    }
  ): { labels: string[]; data: number[] } {

    const { xAxis, yAxis, filters } = options;
    let filtered = [...orders];

    if (filters.status) {
      filtered = filtered.filter((o) => o.status === filters.status);
    }

    if (filters.fromDate || filters.toDate) {
      filtered = filtered.filter((o) => {
        if (!o.createdAt) return false;

        const created = new Date(o.createdAt);

        if (filters.fromDate && created < this.startOfDay(filters.fromDate))
          return false;

        if (filters.toDate && created > this.endOfDay(filters.toDate))
          return false;

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
      case 'date':
        return order.createdAt?.split('T')[0] ?? null;

      case 'hour':
        if (!order.createdAt) return null;
        const d = new Date(order.createdAt);
        return `${d.getHours().toString().padStart(2, '0')}:00`;

      case 'status':
        return order.status;

      case 'customer':
        return order.customerName;

      default:
        return null;
    }
  }

  private sortKeys(keys: string[], xAxis: ChartDimension): string[] {
    if (xAxis === 'date')
      return keys.sort((a, b) => a.localeCompare(b));

    if (xAxis === 'hour')
      return keys.sort(
        (a, b) => parseInt(a.split(':')[0]) - parseInt(b.split(':')[0])
      );

    return keys.sort((a, b) => a.localeCompare(b));
  }

  private startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0);
  }

  private endOfDay(date: Date) {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23,
      59,
      59,
      999
    );
  }
}

/* ---------------------------- Custom Analytics ---------------------------- */

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
export class CustomAnalytics implements OnInit, AfterViewInit, OnDestroy {

  private fb = inject(FormBuilder);
  private ordersService = inject(OrdersService);
  private analyticsService = inject(AnalyticsService);
  private analyticsState = inject(AnalyticsStateService);

  @ViewChildren('chartCanvas')
  chartCanvases!: QueryList<ElementRef<HTMLCanvasElement>>;

  private chartInstances = new Map<number, Chart>();
  private chartIdCounter = 1;

  // Color palette
  private chartColors = [
    { bg: 'rgba(63,81,181,0.6)', border: 'rgba(63,81,181,1)' },
    { bg: 'rgba(244,67,54,0.6)', border: 'rgba(244,67,54,1)' },
    { bg: 'rgba(76,175,80,0.6)', border: 'rgba(76,175,80,1)' },
    { bg: 'rgba(255,152,0,0.6)', border: 'rgba(255,152,0,1)' },
    { bg: 'rgba(156,39,176,0.6)', border: 'rgba(156,39,176,1)' },
    { bg: 'rgba(0,188,212,0.6)', border: 'rgba(0,188,212,1)' },
  ];

  get charts(): StoredChartConfig[] {
    return this.analyticsState.charts;
  }

  configForm: FormGroup = this.fb.group({
    chartType: ['bar', Validators.required],
    xAxis: ['date', Validators.required],
    yAxis: ['orderCount', Validators.required],
    status: [null],
    fromDate: [null],
    toDate: [null],
  });

  chartTypes = [
    { value: 'bar', label: 'Bar' },
    { value: 'line', label: 'Line' },
    { value: 'pie', label: 'Pie' },
    { value: 'doughnut', label: 'Doughnut' },
  ];

  xAxes = [
    { value: 'date', label: 'Date' },
    { value: 'hour', label: 'Hour of Day' },
    { value: 'status', label: 'Status' },
    { value: 'customer', label: 'Customer' },
  ];

  yAxes = [
    { value: 'orderCount', label: 'Order Count' },
    { value: 'totalRevenue', label: 'Total Revenue' },
    { value: 'avgOrderValue', label: 'Average Order Value' },
  ];

  ngOnInit(): void {
    if (this.ordersService.orders().length === 0) {
      this.ordersService.loadOrders();
    }
  }

  ngAfterViewInit(): void {
    this.chartCanvases.changes.subscribe(() => this.renderCharts());
    setTimeout(() => this.renderCharts());
  }

  ngOnDestroy(): void {
    this.chartInstances.forEach((chart) => chart.destroy());
    this.chartInstances.clear();
  }

  addChart(): void {
    if (this.configForm.invalid) return;

    const chartType = this.configForm.value.chartType;
    const xAxis = this.configForm.value.xAxis;
    const yAxis = this.configForm.value.yAxis;

    const orders = this.ordersService.orders();

    const { labels, data } = this.analyticsService.buildChartData(orders, {
      chartType,
      xAxis,
      yAxis,
      filters: {
        status: this.configForm.value.status,
        fromDate: this.configForm.value.fromDate,
        toDate: this.configForm.value.toDate,
      },
    });

    const title = `${this.getChartTypeLabel(chartType)} - ${this.getAxisLabel(xAxis)} vs ${this.getMetricLabel(yAxis)}`;

    const newChart: StoredChartConfig = {
      id: this.chartIdCounter++,
      chartType,
      labels,
      data,
      title,
    };

    this.analyticsState.charts = [...this.analyticsState.charts, newChart];
  }

  removeChart(id: number): void {
    const instance = this.chartInstances.get(id);
    instance?.destroy();
    this.chartInstances.delete(id);

    this.analyticsState.charts =
      this.analyticsState.charts.filter((c) => c.id !== id);
  }

  trackByChartId(_: number, chart: StoredChartConfig) {
    return chart.id;
  }

  private renderCharts(): void {
    const canvasArray = this.chartCanvases.toArray();

    this.charts.forEach((chartConfig, index) => {
      if (this.chartInstances.has(chartConfig.id)) return;

      const canvasRef = canvasArray[index];
      if (!canvasRef) return;

      const ctx = canvasRef.nativeElement.getContext('2d');
      if (!ctx) return;

      const baseColor = this.chartColors[index % this.chartColors.length];

      let backgroundColor: any = baseColor.bg;
      let borderColor: any = baseColor.border;

      if (chartConfig.chartType === 'pie' || chartConfig.chartType === 'doughnut') {
        backgroundColor = chartConfig.labels.map((_, i) =>
          this.chartColors[i % this.chartColors.length].bg
        );

        borderColor = chartConfig.labels.map((_, i) =>
          this.chartColors[i % this.chartColors.length].border
        );
      }

      const chart = new Chart(ctx, {
        type: chartConfig.chartType,
        data: {
          labels: chartConfig.labels,
          datasets: [
            {
              label: chartConfig.title,
              data: chartConfig.data,
              backgroundColor,
              borderColor,
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
        },
      });

      this.chartInstances.set(chartConfig.id, chart);
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
