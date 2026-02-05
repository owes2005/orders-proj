import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  exact?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  collapsed = signal(false);

  navItems: NavItem[] = [
    { label: 'Dashboard', path: '/', icon: 'dashboard', exact: true },
    { label: 'Orders', path: '/orders', icon: 'list_alt' },
    { label: 'Map', path: '/map', icon: 'map' },
    { label: 'Analytics', path: '/analytics', icon: 'analytics' },
  ];

  toggleCollapse(): void {
    this.collapsed.update((c) => !c);
  }
}
