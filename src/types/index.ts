import "fastify";

export interface AdminUser {
  id: string;
  email: string;
}

declare module "fastify" {
  interface FastifyRequest {
    admin?: AdminUser;
  }
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  price_range: string;
  image: string;
  in_stock: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type OrderType = "delivery" | "pickup";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "ready"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  type: OrderType;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  address?: string;
  pickup_code?: string;
  pickup_expires_at?: string;
  collected_at?: string;
  items: OrderItem[];
  total: number;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsEvent {
  event: string;
  session_id: string;
  metadata: Record<string, unknown>;
}

export interface ProductParams {
  id: string;
}

export interface ProductQuery {
  category?: string;
  brand?: string;
  search?: string;
  page?: string;
  limit?: string;
  tag?: string;
  priceRange?: string;
  in_stock?: boolean;
}

export interface CreateProductBody {
  name: string;
  brand: string;
  category: string;
  price: number;
  price_range: string;
  image: string;
  in_stock: boolean;
  tags: string[];
}

export type UpdateProductBody = Partial<CreateProductBody>;

export interface StockBody {
  in_stock: boolean;
}
