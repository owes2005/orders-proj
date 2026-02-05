import {
  Component,
  AfterViewInit,
  OnDestroy,
  inject,
  effect,
  signal,
} from '@angular/core';
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

  // Services
  private ordersService = inject(OrdersService);
  gpsService = inject(GpsService);

  // Leaflet map
  private map!: L.Map;
  private mapReady = signal(false);

  // Markers indexed by order id
  private markers = new Map<string, L.Marker>();

  // Signals from OrdersService
  orders = this.ordersService.orders;
  selectedOrder = this.ordersService.selectedOrder;
  topOrders = this.ordersService.topOrdersOfDay;

  // UI state
  autoFollow = true;

  constructor() {

    /**
     * EFFECT 1:
     * Create markers when orders arrive
     */
    effect(() => {
      if (!this.mapReady()) return;

      this.orders().forEach(order => {
        if (!order.id) return;
        if (this.markers.has(order.id)) return;

        const marker = L.marker(
          [order.latitude, order.longitude],
          { icon: this.getBikeIcon(order, false) }
        ).addTo(this.map);

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
    });

    /**
     * EFFECT 2:
     * Update marker position, icon and popup when order changes
     */
    effect(() => {
      const selectedId = this.selectedOrder()?.id ?? null;

      this.orders().forEach(order => {
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
     * Auto-follow selected order on map
     */
    effect(() => {
      const o = this.selectedOrder();
      if (o && this.map && this.autoFollow) {
        this.map.panTo([o.latitude, o.longitude], { animate: true });
      }
    });
  }

  /**
   * Initialize Leaflet map after view loads
   */
  ngAfterViewInit(): void {
    this.map = L.map('map', {
      zoomControl: false,
      dragging: true,
    }).setView([22.9734, 78.6569], 5);

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { attribution: '© OpenStreetMap © CARTO' }
    ).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(this.map);

    this.mapReady.set(true);

    // Start GPS simulation
    this.gpsService.start();

    // Fix map sizing issues
    setTimeout(() => this.map.invalidateSize(), 100);
  }

  /**
   * Toggle GPS simulation (used by map controls)
   */
  toggleGps(): void {
    this.gpsService.isRunning()
      ? this.gpsService.stop()
      : this.gpsService.start();
  }

  /**
   * Create delivery bike icon
   */
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

  /**
   * Popup HTML for marker
   */
  private getMarkerPopupHtml(order: Order): string {
    if (!order.id) return '';

    return `
      <div class="marker-popup">
        <strong>#${order.id}</strong> — ${order.status.replace('_', ' ')}
        <div>${order.customerName}</div>
      </div>
    `;
  }

  /**
   * Cleanup on component destroy
   */
  ngOnDestroy(): void {
    this.gpsService.stop();
    this.mapReady.set(false);
    this.map?.remove();
  }
}
