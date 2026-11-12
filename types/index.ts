/* ────────── mobile domain contracts ────────── */
export type Station = string;
export type Page =
  | "tables"
  | "menu"
  | "cart"
  | "orders"
  | "receipt"
  | "operations"
  | "notifications";
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  roleName?: string;
  mobileMode?: "waiter" | "operator" | "none";
  stations?: string[];
  tables?: string[];
  role: string;
  permissions: string[];
}
export interface Session {
  token: string;
  user: User;
  server: string;
}
export interface MenuItem {
  aliases?: string[];
  code?: string;
  nameBn?: string;
  id: string;
  name: string;
  category: string;
  station: Station;
  price: number;
  active: boolean;
}
export interface OrderLine {
  fulfillment?: "dine_in" | "parcel";
  nameBn?: string;
  menuId: string;
  name: string;
  price: number;
  station: Station;
  quantity: number;
  note?: string;
}
export interface Order {
  orderType?: "dine_in" | "takeaway";
  parcelToken?: string;
  customerName?: string;
  customerPhone?: string;
  packingCharge?: number;
  paymentStatus?: "unpaid" | "paid";
  deliveredAt?: string;
  id: string;
  table: string;
  waiter: string;
  createdAt: string;
  status: string;
  items: OrderLine[];
}
export interface Table {
  name?: string;
  id: string;
  floor: string;
  seats: number;
  occupied: boolean;
  orders: { id: string; waiter: string; status: string; total: number }[];
}
export interface Bootstrap {
  orderEpoch?: number;
  unavailableMenu?: (Omit<MenuItem, "price"> & { price: number | null })[];
  stockSummary?: Record<
    string,
    { available: boolean; quantity: number | null; reason?: string }
  >;
  kitchens?: { id: string; name: string; floor: string }[];
  user: User;
  menu: MenuItem[];
  tables: Table[];
  orders: Order[];
}
export interface Draft {
  orderType?: "dine_in" | "takeaway";
  customerName?: string;
  customerPhone?: string;
  packingCharge?: number;
  table: string;
  orderId?: string;
  items: OrderLine[];
  note: string;
}
export interface Pending {
  path: string;
  body: {
    orderEpoch?: number;
    requestId: string;
    orderType?: "dine_in" | "takeaway";
    customerName?: string;
    customerPhone?: string;
    packingCharge?: number;
    table: string;
    items: {
      fulfillment?: "dine_in" | "parcel";
      menuId: string;
      quantity: number;
      note?: string;
      expectedPrice?: number;
    }[];
    note: string;
  };
}
export interface Ticket {
  parcelToken?: string;
  id: string;
  station: Station;
  kind: string;
  status: string;
  error?: string;
  reprints: number;
  lines: {
    fulfillment?: "dine_in" | "parcel";
    name: string;
    nameBn?: string;
    quantity: number;
    note?: string;
  }[];
}
export interface Receipt {
  order: Order;
  tickets: Ticket[];
  duplicate: boolean;
}
export interface ServiceLine {
  fulfillment?: "dine_in" | "parcel";
  name: string;
  nameBn?: string;
  quantity: number;
  ready: number;
  collected: number;
  served: number;
  note?: string;
}
export interface ServiceBatch {
  parcelToken?: string;
  id: string;
  orderId: string;
  table: string;
  waiter: string;
  station: Station;
  createdAt: string;
  acceptedAt?: string;
  lines: ServiceLine[];
  orderStatus: string;
  history: { id: string; action: string; actor: string; at: string }[];
}
export interface StaffNotification {
  id: string;
  batchId: string;
  orderId: string;
  title: string;
  body: string;
  createdAt: string;
  readAt?: string;
}
