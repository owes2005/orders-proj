import { Injectable, inject } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { OrdersService } from './orders.service';

/**
 GpsService

  Simulates live GPS movement of delivery agents.
  Runs on a timer and updates order coordinates periodically.
 */
@Injectable({ providedIn: 'root' })
export class GpsService {
  private ordersService = inject(OrdersService);
  private sub?: Subscription;

  /**
    Starts GPS simulation
    Prevents multiple intervals from running
   */
  start(): void {
    if (this.sub) return;

    this.sub = interval(2500).subscribe(() => {
      this.ordersService.orders().forEach(order => {

        // Move only active (on-route) orders
        if (order.status !== 'ON_ROUTE') return;

        // Backend-generated id is mandatory for updates
        if (!order.id) return;

        // Small random offset to simulate movement
        const jitterLat = (Math.random() - 0.5) * 0.01;
        const jitterLng = (Math.random() - 0.5) * 0.01;

        this.ordersService.updateOrderLocation(
          order.id,
          order.latitude + jitterLat,
          order.longitude + jitterLng
        );
      });
    });
  }

  /**
   * Stops GPS simulation
   */
  stop(): void {
    this.sub?.unsubscribe();
    this.sub = undefined;
  }

  /**
   * Indicates whether GPS simulation is active
   */
  isRunning(): boolean {
    return !!this.sub;
  }
}
