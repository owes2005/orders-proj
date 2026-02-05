import { Injectable, inject } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { OrdersService } from './orders.service';

@Injectable({ providedIn: 'root' })
export class GpsService {

  private ordersService = inject(OrdersService);
  private sub?: Subscription;

  // Start simulating live GPS updates
  start(): void {
    // Prevent multiple intervals
    if (this.sub) return;

    // Update location every 2.5 seconds
    this.sub = interval(2500).subscribe(() => {
      this.ordersService.orders().forEach(order => {

        // Move only orders that are still on the way
        if (order.status !== 'ON_ROUTE') return;

        // Small random movement to simulate live GPS updates
        const jitterLat = (Math.random() - 0.5) * 0.01;
        const jitterLng = (Math.random() - 0.5) * 0.01;

        const nextLat = order.latitude + jitterLat;
        const nextLng = order.longitude + jitterLng;

        // Update order location in memory
        this.ordersService.updateOrderLocation(order.id, nextLat, nextLng);
      });
    });
  }

  // Stop GPS updates
  stop(): void {
    this.sub?.unsubscribe();
    this.sub = undefined;
  }

  // Check if GPS simulation is running
  isRunning(): boolean {
    return !!this.sub;
  }
}
