import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersPanel } from './orders-panel';

describe('OrdersPanel', () => {
  let component: OrdersPanel;
  let fixture: ComponentFixture<OrdersPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdersPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrdersPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
