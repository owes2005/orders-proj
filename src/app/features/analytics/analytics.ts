import { Component, inject, OnInit } from '@angular/core';
import { DashboardStats } from './dashboard-stats/dashboard-stats';
import { OrdersService } from '../../core/services/orders.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [DashboardStats],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css',
})
export class Analytics implements OnInit {
  ordersService = inject(OrdersService);

  ngOnInit(): void {
    this.ordersService.loadOrders();
  }
}
