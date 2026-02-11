import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersService } from '../../core/services/orders.service';
import { Order } from '../../core/models/order.model';
import { MATERIAL_MODULES } from '../../shared/material';

@Component({
  selector: 'app-orders-panel',
  standalone: true,
  imports: [CommonModule, MATERIAL_MODULES],
  templateUrl: './orders-panel.html',
  styleUrl: './orders-panel.css',
})
export class OrdersPanel {

  private ordersService = inject(OrdersService);

  private orders = this.ordersService.orders;

  selectedOrder = this.ordersService.selectedOrder;

  todaysOrders = computed(() =>
    this.orders().filter(order =>
      order.createdAt && this.isToday(order.createdAt)
    )
  );

  private isToday(dateString: string): boolean {
    const today = new Date();
    const date = new Date(dateString);

    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }

  select(order: Order): void {
    this.ordersService.selectOrder(order);
  }
}
