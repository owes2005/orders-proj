import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Order } from '../models/order.model';

/**
 * OrdersService
 * --------------
 * Acts as the single source of truth for all order-related data.
 * Handles:
 *  - fetching orders
 *  - creating orders (demo + real)
 *  - updating order status & location
 *  - computing analytics (today’s orders, revenue, top orders)
 */
@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private readonly API_URL = 'http://127.0.0.1:3000/orders';

  /** Internal writable signals */
  private _orders = signal<Order[]>([]);
  private _selectedOrder = signal<Order | null>(null);
  private readonly DAILY_ORDER_KEY = 'daily_orders_generated';


  /** Read-only signals exposed to components */
  orders = this._orders.asReadonly();
  selectedOrder = this._selectedOrder.asReadonly();

  constructor(private http: HttpClient) {}

  /**
   * Loads all orders from backend (json-server)
   * Called once when dashboard loads
   */
  loadOrders(): void {
    this.http.get<Order[]>(this.API_URL).subscribe({
      next: (data) => this._orders.set(data),
      error: (err) => console.error('Failed to load orders', err),
    });
  }

  /**
   * Adds a new order
   * createdAt is generated here to simulate backend behavior
   */
  addOrder(order: Order) {
    return this.http.post<Order>(this.API_URL, {
      ...order,
      createdAt: new Date().toISOString(),
    });
  }

  /**
   * Sets the currently selected order
   * Used by map & dashboard interactions
   */
  selectOrder(order: Order): void {
    this._selectedOrder.set(order);
  }

  /**
   * Updates order location both locally and in backend
   * Used by GPS simulation
   */
  updateOrderLocation(id: String, lat: number, lng: number): void {
    // Update local signal state
    this._orders.update((orders) =>
      orders.map((o) => (o.id === id ? { ...o, latitude: lat, longitude: lng } : o)),
    );

    // Persist change to backend
    this.http
      .patch(`${this.API_URL}/${id}`, {
        latitude: lat,
        longitude: lng,
      })
      .subscribe();
  }

  /**
   * Marks an order as delivered
   */
  markDelivered(id: String): void {
    this._orders.update((orders) =>
      orders.map((o) => (o.id === id ? { ...o, status: 'DELIVERED' } : o)),
    );

    this.http
      .patch(`${this.API_URL}/${id}`, {
        status: 'DELIVERED',
      })
      .subscribe();
  }

  // =========================
  // DEMO MODE HELPERS
  // =========================

  /**
   * Checks if at least one order exists for today
   * Prevents duplicate demo orders on refresh
   */
  hasOrdersForToday(): boolean {
    const today = new Date().toISOString().split('T')[0];

    return this._orders().some((o) => o.createdAt && o.createdAt.startsWith(today));
  }

  /**
   * Generates fake orders for demo purposes
   * Runs once per day
   */
  generateDemoOrders(count = 5): void {
    const customers = [
      'Rahul Sharma',
      'Ayesha Khan',
      'Arjun Verma',
      'Sneha Iyer',
      'Vikram Rao',
      'Neha Patel',
      'Pooja Singh',
      'Mohammed Ali',
    ];

    for (let i = 0; i < count; i++) {
      const order: Order = {
        customerName: customers[Math.floor(Math.random() * customers.length)],
        status: 'ON_ROUTE',
        latitude: 8 + Math.random() * 29,
        longitude: 68 + Math.random() * 29, 
        amount: Math.floor(500 + Math.random() * 2500),
      };

      this.addOrder(order).subscribe(() => this.loadOrders());
    }
  }

  


  // =========================
  // ANALYTICS (Computed Signals)
  // =========================

  /**
   * Returns only today’s orders
   * Used by dashboard cards, analytics & map highlighting
   */
  todaysOrders = computed(() => {
    const today = new Date().toISOString().split('T')[0];

    return this._orders().filter(
      (o): o is Order & { createdAt: string } => !!o.createdAt && o.createdAt.startsWith(today),
    );
  });

  /**
   * Total revenue from today’s orders
   */
  todaysRevenue = computed(() => this.todaysOrders().reduce((sum, o) => sum + o.amount, 0));

  /**
   * Top 5 highest-value orders of today
   */
  topOrdersOfDay = computed(() =>
    [...this.todaysOrders()].sort((a, b) => b.amount - a.amount).slice(0, 5),
  );

  /**
   * Returns a order reference for UI
   * Example: ORD-6DE5
   */
  getPrettyOrderId(id?: string): string {
    if (!id) return 'ORD-0000';

    return `ORD-${id.slice(-4).toUpperCase()}`;
  }



  /**
   * Generates 5–10 demo orders once per day
   */
  generateDailyOrders(): void {
    const today = new Date().toISOString().split('T')[0];
    const lastGenerated = localStorage.getItem(this.DAILY_ORDER_KEY);

    if (lastGenerated === today) return;

    const count = Math.floor(5 + Math.random() * 6); // 5–10
    this.generateDemoOrders(count);

    localStorage.setItem(this.DAILY_ORDER_KEY, today);
  }

  /**
   * Automatically moves ON_ROUTE orders to DELIVERED over time
   */
  startAutoDeliverySimulation(): void {
    setInterval(() => {
      const onRouteOrders = this._orders().filter(
        (o: Order) => o.status === 'ON_ROUTE'
      );

      if (onRouteOrders.length === 0) return;

      const deliverCount = Math.min(
        Math.ceil(Math.random() * 2),
        onRouteOrders.length
      );

      const shuffled = [...onRouteOrders].sort(() => Math.random() - 0.5);
      const toDeliver = shuffled.slice(0, deliverCount);

      toDeliver.forEach((order: Order) => {
        if (order.id) {
          this.markDelivered(order.id);
        }
      });
    }, 2 * 60 * 1000); // every 2 minutes
  }


}

