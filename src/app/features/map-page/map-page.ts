import { Component, inject, OnInit } from '@angular/core';
import { MapView } from '../map-view/map-view';
import { OrdersService } from '../../core/services/orders.service';

@Component({
  selector: 'app-map-page',
  standalone: true,
  imports: [MapView],
  templateUrl: './map-page.html',
  styleUrl: './map-page.css',
})
export class MapPage implements OnInit {
  private ordersService = inject(OrdersService);

  ngOnInit(): void {
    this.ordersService.loadOrders();
  }
}
