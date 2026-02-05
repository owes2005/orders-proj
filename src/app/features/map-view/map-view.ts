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
import { MATERIAL_MODULES } from '../../shared/material';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [CommonModule, MATERIAL_MODULES],
  templateUrl: './map-view.html',
  styleUrl: './map-view.css',
})
export class MapView implements AfterViewInit, OnDestroy {

  private ordersService = inject(OrdersService);
  gpsService = inject(GpsService);

  private map!: L.Map;
  private mapReady = signal(false);
  private markers = new Map<number, L.Marker>();

  orders = this.ordersService.orders;
  selectedOrder = this.ordersService.selectedOrder;
  topOrderIds = this.ordersService.topOrdersOfDay;
  todaysOrderIds = this.ordersService.todaysOrders;

  autoFollow = true;

  constructor() {

    // Create markers
    effect(() => {
      if (!this.mapReady()) return;

      this.orders().forEach(order => {
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

    // Update marker movement & icon
    effect(() => {
      const selectedId = this.selectedOrder()?.id ?? null;

      this.orders().forEach(order => {
        const marker = this.markers.get(order.id);
        if (!marker) return;

        const from = marker.getLatLng();
        const to = L.latLng(order.latitude, order.longitude);

        if (order.status === 'DELIVERED') {
          marker.setLatLng(to);
        } else {
          this.animateMarker(marker, from, to);
        }

        marker.setIcon(this.getBikeIcon(order, selectedId === order.id));
        marker.setPopupContent(this.getMarkerPopupHtml(order));
      });
    });

    // Auto-follow
    effect(() => {
      const o = this.selectedOrder();
      if (o && this.map && this.autoFollow) {
        this.map.panTo([o.latitude, o.longitude], { animate: true });
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
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
      this.gpsService.start();

      // Leaflet needs invalidateSize when container dimensions change after init
      setTimeout(() => this.map?.invalidateSize(), 100);
    });
  }

  // Smooth animation
  private animateMarker(marker: L.Marker, from: L.LatLng, to: L.LatLng): void {
    let step = 0;
    const steps = 15;
    const latStep = (to.lat - from.lat) / steps;
    const lngStep = (to.lng - from.lng) / steps;

    const timer = setInterval(() => {
      step++;
      marker.setLatLng([
        from.lat + latStep * step,
        from.lng + lngStep * step,
      ]);
      if (step >= steps) clearInterval(timer);
    }, 40);
  }

  toggleGps(): void {
    this.gpsService.isRunning()
      ? this.gpsService.stop()
      : this.gpsService.start();
  }

  private isTopOrder(order: { id: number }): boolean {
    return this.topOrderIds().some((o) => o.id === order.id);
  }

  private isTodaysOrder(order: { createdAt: string }): boolean {
    const today = new Date().toISOString().split('T')[0];
    return order.createdAt.startsWith(today);
  }

  /** Custom icon: delivery-bike.png with styles for top/today orders */
  private getBikeIcon(order: { id: number; status: string; createdAt: string }, selected: boolean): L.Icon {
    const isTop = this.isTopOrder(order);
    const isToday = this.isTodaysOrder(order);
    const baseSize = isTop ? 52 : isToday ? 46 : 40;
    const size = selected ? baseSize + 10 : baseSize;
    const anchor = size / 2;

    let className = 'marker-icon';
    if (order.status === 'DELIVERED') className += ' marker-icon--delivered';
    if (isTop) className += ' marker-icon--top';
    else if (isToday) className += ' marker-icon--today';

    return L.icon({
      iconUrl: 'assets/delivery-bike.png',
      iconSize: [size, size],
      iconAnchor: [anchor, anchor],
      popupAnchor: [0, -anchor],
      className,
    });
  }

  private getMarkerPopupHtml(order: {
    id: number;
    customerName: string;
    status: string;
  }): string {
    return `
      <div class="marker-popup">
        <strong>#${order.id}</strong> — ${order.status.replace('_', ' ')}
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