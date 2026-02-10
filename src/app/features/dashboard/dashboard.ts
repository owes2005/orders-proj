import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrdersService } from '../../core/services/orders.service';
import { Order } from '../../core/models/order.model';
import { MATERIAL_MODULES } from '../../shared/material';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MATERIAL_MODULES],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  ordersService = inject(OrdersService);

  ngOnInit(): void {
    // 1️⃣ Load existing orders
    this.ordersService.loadOrders();

    // 2️⃣ Daily generation + lifecycle simulation
    setTimeout(() => {
      this.ordersService.generateDailyOrders();
      this.ordersService.startAutoDeliverySimulation();
    }, 300);
  }

  formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  get todaysOrders(): Order[] {
    return this.ordersService.todaysOrders();
  }
}
