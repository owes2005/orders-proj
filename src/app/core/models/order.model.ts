export interface Order {
  id: number;
  customerName: string;
  status: 'ON_ROUTE' | 'DELIVERED';
  latitude: number;
  longitude: number;

  amount: number;
  createdAt: string;
}
