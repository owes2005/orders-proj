import { Component, Input, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';

import { MatTableDataSource } from '@angular/material/table';
import { Order } from '../../../core/models/order.model';

@Component({
  selector: 'app-orders-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule
  ],
  templateUrl: './orders-table.html',
  styleUrls: ['./orders-table.css']
})
export class OrdersTableComponent implements AfterViewInit {

  @Input() orders: Order[] = [];

  displayedColumns: string[] = [
    'id',
    'customerName',
    'status',
    'amount',
    'createdAt'
  ];

  dataSource = new MatTableDataSource<Order>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnChanges() {
    this.dataSource.data = this.orders || [];
  }

  formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
}