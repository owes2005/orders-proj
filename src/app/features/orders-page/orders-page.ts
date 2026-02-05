import { Component, inject, OnInit } from '@angular/core';
import { OrdersPanel } from '../orders-panel/orders-panel';
import { MapView } from '../map-view/map-view';
import { OrdersService } from '../../core/services/orders.service';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [OrdersPanel, MapView],
  templateUrl: './orders-page.html',
  styleUrl: './orders-page.css',
})
export class OrdersPage implements OnInit {
  private ordersService = inject(OrdersService);

  ngOnInit(): void {
    this.ordersService.loadOrders();
  }
}
