import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  input,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Order } from '../../../core/models/order.model';
import { MATERIAL_MODULES } from '../../../shared/material';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard-stats',
  standalone: true,
  imports: [CommonModule, MATERIAL_MODULES],
  templateUrl: './dashboard-stats.html',
  styleUrl: './dashboard-stats.css',
})
export class DashboardStats implements AfterViewInit {
  @ViewChild('revenueChart') revenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topOrdersChart') topOrdersChartRef!: ElementRef<HTMLCanvasElement>;

  todaysOrdersCount = input.required<number>();
  todaysRevenue = input.required<number>();
  topOrders = input.required<Order[]>();

  private chartInstance: Chart | null = null;
  private topOrdersChartInstance: Chart | null = null;

  constructor() {
    effect(() => {
      this.todaysRevenue();
      this.topOrders();
      if (this.chartInstance || this.topOrdersChartInstance) {
        this.updateCharts();
      }
    });
  }

  ngAfterViewInit(): void {
    this.setupCharts();
  }

  private setupCharts(): void {
    this.createRevenueChart();
    this.createTopOrdersChart();
  }

  private updateCharts(): void {
    if (this.chartInstance) {
      this.chartInstance.data.datasets[0].data = [this.todaysRevenue()];
      this.chartInstance.update('none');
    }
    if (this.topOrdersChartInstance) {
      const orders = this.topOrders();
      this.topOrdersChartInstance.data.labels = orders.map((o) => o.customerName);
      this.topOrdersChartInstance.data.datasets[0].data = orders.map((o) => o.amount);
      this.topOrdersChartInstance.update('none');
    }
  }

  private createRevenueChart(): void {
    if (!this.revenueChartRef?.nativeElement) return;
    const revenue = this.todaysRevenue(); 
    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: ["Today's Revenue"],
        datasets: [{
          label: 'Revenue (₹)',
          data: [revenue],
          backgroundColor: 'rgba(99, 102, 241, 0.7)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => `₹${v}` },
          },
        },
      },
    };
    this.chartInstance = new Chart(this.revenueChartRef.nativeElement, config);
  }

  private createTopOrdersChart(): void {
    if (!this.topOrdersChartRef?.nativeElement) return;
    const orders = this.topOrders();
    const labels = orders.map((o) => o.customerName);
    const data = orders.map((o) => o.amount);
    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Order Amount (₹)',
          data,
          backgroundColor: [
            'rgba(34, 197, 94, 0.7)', 'rgba(59, 130, 246, 0.7)',
            'rgba(168, 85, 247, 0.7)', 'rgba(249, 115, 22, 0.7)',
            'rgba(236, 72, 153, 0.7)',
          ],
          borderColor: [
            'rgb(34, 197, 94)', 'rgb(59, 130, 246)', 'rgb(168, 85, 247)',
            'rgb(249, 115, 22)', 'rgb(236, 72, 153)',
          ],
          borderWidth: 1,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { callback: (v) => `₹${v}` },
          },
        },
      },
    };
    this.topOrdersChartInstance = new Chart(this.topOrdersChartRef.nativeElement, config);
  }

  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
}
