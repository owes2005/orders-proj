import { Component, inject } from '@angular/core';
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

  // Access orders data and selection logic
  private ordersService = inject(OrdersService);

  // List of all orders
  orders = this.ordersService.orders;

  // Currently selected order
  selectedOrder = this.ordersService.selectedOrder;

  // Select an order from the list
  select(order: Order): void {
    this.ordersService.selectOrder(order);
  }
}
