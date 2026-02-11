import { Component, AfterViewInit, OnDestroy, inject, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

import { OrdersService } from '../../core/services/orders.service';
import { GpsService } from '../../core/services/gps.service';
import { Order } from '../../core/models/order.model';
import { MATERIAL_MODULES } from '../../shared/material';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [CommonModule, ...MATERIAL_MODULES],
  templateUrl: './map-view.html',
  styleUrl: './map-view.css',
})
export class MapView implements AfterViewInit, OnDestroy {
  private ordersService = inject(OrdersService);
  gpsService = inject(GpsService);

  private map!: L.Map;
  private mapReady = signal(false);

  private markers = new Map<string, L.Marker>();

  orders = this.ordersService.orders;
  selectedOrder = this.ordersService.selectedOrder;
  topOrders = this.ordersService.topOrdersOfDay;

  autoFollow = true;

  constructor() {
    /**
     * EFFECT 1:
     * Create markers ONLY for today's orders
     */
    effect(() => {
      if (!this.mapReady()) return;

      const todaysOrders = this.getTodaysOrders();

      todaysOrders.forEach((order) => {
        if (!order.id) return;
        if (this.markers.has(order.id)) return;

        const marker = L.marker([order.latitude, order.longitude], {
          icon: this.getBikeIcon(order, false),
        }).addTo(this.map);

        marker.on('click', () => {
          this.ordersService.selectOrder(order);
          marker.openPopup();
        });

        marker.bindPopup(this.getMarkerPopupHtml(order), {
          closeButton: false,
          offset: L.point(0, -24),
        });

        this.markers.set(order.id, marker);
      });

      // 🔥 Remove markers that are NOT from today
      this.markers.forEach((marker, id) => {
        const stillExists = todaysOrders.some((o) => o.id === id);
        if (!stillExists) {
          this.map.removeLayer(marker);
          this.markers.delete(id);
        }
      });
    });

    /**
     * EFFECT 2:
     * Update markers (only today's)
     */
    effect(() => {
      const selectedId = this.selectedOrder()?.id ?? null;
      const todaysOrders = this.getTodaysOrders();

      todaysOrders.forEach((order) => {
        if (!order.id) return;

        const marker = this.markers.get(order.id);
        if (!marker) return;

        marker.setLatLng([order.latitude, order.longitude]);
        marker.setIcon(this.getBikeIcon(order, selectedId === order.id));
        marker.setPopupContent(this.getMarkerPopupHtml(order));
      });
    });

    /**
     * EFFECT 3:
     * Auto-follow selected order
     */
    effect(() => {
      const o = this.selectedOrder();
      if (o && o.createdAt && this.map && this.autoFollow && this.isToday(o.createdAt)) {
        this.map.panTo([o.latitude, o.longitude], { animate: true });
      }
    });
  }

  /**
   * Returns only today's orders
   */
  private getTodaysOrders(): Order[] {
    return this.orders().filter((order) => order.createdAt && this.isToday(order.createdAt));
  }

  /**
   * Checks if date string is today
   */
  private isToday(dateString: string): boolean {
    const today = new Date();
    const date = new Date(dateString);

    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }

  ngAfterViewInit(): void {
    this.map = L.map('map', {
      zoomControl: false,
      dragging: true,
    }).setView([22.9734, 78.6569], 5);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(this.map);

    this.mapReady.set(true);

    this.gpsService.start();

    setTimeout(() => this.map.invalidateSize(), 100);
  }

  toggleGps(): void {
    this.gpsService.isRunning() ? this.gpsService.stop() : this.gpsService.start();
  }

  private getBikeIcon(order: Order, selected: boolean): L.Icon {
    const baseSize = order.status === 'DELIVERED' ? 36 : 40;
    const size = selected ? baseSize + 10 : baseSize;
    const anchor = size / 2;

    let className = 'marker-icon';
    if (order.status === 'DELIVERED') className += ' marker-icon--delivered';

    return L.icon({
      iconUrl: 'assets/delivery-bike.png',
      iconSize: [size, size],
      iconAnchor: [anchor, anchor],
      popupAnchor: [0, -anchor],
      className,
    });
  }

  private getMarkerPopupHtml(order: Order): string {
    return `
      <div class="marker-popup">
        <strong>${this.ordersService.getPrettyOrderId(order.id)}</strong>
        — ${order.status.replace('_', ' ')}
        <div>${order.customerName}</div>
      </div>
    `;
  }

  ngOnDestroy(): void {
    this.gpsService.stop();
    this.mapReady.set(false);
    this.map?.remove();
  }
}
