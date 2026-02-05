export interface Order {
  id?: string;
  customerName: string;
  status: 'ON_ROUTE' | 'DELIVERED';
  latitude: number;
  longitude: number;

  amount: number;
  createdAt?: string;
}
