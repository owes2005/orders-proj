import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Order } from '../models/order.model';
import { computed } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private readonly API_URL = 'http://127.0.0.1:3000/orders';

  // Orders state
  private _orders = signal<Order[]>([]);
  private _selectedOrder = signal<Order | null>(null);

  // Readonly signals
  orders = this._orders.asReadonly();
  selectedOrder = this._selectedOrder.asReadonly();

  constructor(private http: HttpClient) {}

  // Load orders from backend
  loadOrders(): void {
    this.http.get<Order[]>(this.API_URL).subscribe({
      next: (data) => this._orders.set(data),
      error: (err) => console.error('Failed to load orders', err),
    });
  }

  // Select an order
  selectOrder(order: Order): void {
    this._selectedOrder.set(order);
  }

  // Update live location (local + backend)
  updateOrderLocation(id: number, lat: number, lng: number): void {
    // Update local state
    this._orders.update((orders) =>
      orders.map((o) => (o.id === id ? { ...o, latitude: lat, longitude: lng } : o)),
    );

    // Persist to backend
    this.http
      .patch(`${this.API_URL}/${id}`, {
        latitude: lat,
        longitude: lng,
      })
      .subscribe();
  }

  // Mark as delivered
  markDelivered(id: number): void {
    // Update local state
    this._orders.update((orders) =>
      orders.map((o) => (o.id === id ? { ...o, status: 'DELIVERED' } : o)),
    );

    // Persist to backend
    this.http
      .patch(`${this.API_URL}/${id}`, {
        status: 'DELIVERED',
      })
      .subscribe();
  }

  // Orders of the Day (computed)
  todaysOrders = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this._orders().filter((order) => order.createdAt.startsWith(today));
  });

  // Revenue from today's orders
  todaysRevenue = computed(() => {
    return this.todaysOrders().reduce((sum, o) => sum + o.amount, 0);
  });

  // Top orders of the day (by amount, descending)
  topOrdersOfDay = computed(() => {
    return [...this.todaysOrders()]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  });
}
