export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  clientName: string;
  clientEmail: string;
  status: "draft" | "sent" | "approved" | "rejected";
  template: string;
  products: ProposalProduct[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface ProposalProduct {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  preview: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  bootstrapping: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; message?: string }>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface CreateProposalRequest {
  title: string;
  description: string;
  clientName: string;
  clientEmail: string;
  template: string;
  products: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface UpdateProposalRequest extends Partial<CreateProposalRequest> {
  id: string;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  category: string;
  isActive?: boolean;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string;
}
