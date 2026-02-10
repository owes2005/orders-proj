import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { Dashboard } from './features/dashboard/dashboard';
import { OrdersPage } from './features/orders-page/orders-page';
import { MapPage } from './features/map-page/map-page';
import { Analytics } from './features/analytics/analytics';
import { CustomAnalytics } from './features/custom-analytics/custom-analytics';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', component: Dashboard },
      { path: 'orders', component: OrdersPage },
      { path: 'map', component: MapPage },
      { path: 'analytics', component: Analytics },
      { path: 'custom-analytics', component: CustomAnalytics },
    ],
  },
];
