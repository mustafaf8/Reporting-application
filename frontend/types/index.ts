export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  position?: string;
  profileImageUrl?: string;
  profileImagePublicId?: string;
  phone?: string;
  department?: string;
  company?: string;
  address?: string;
  bio?: string;
  isActive: boolean;
  isApproved: boolean;
  subscription: {
    plan: string;
    status: string;
    customerId: string;
    subscriptionId: string;
    currentPeriodEnd?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  _id: string;
  name: string;
  unit: string;
  unitPrice: number;
  category?: string;
  description?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Proposal {
  _id: string;
  customerName: string;
  items: ProposalItem[];
  grandTotal: number;
  status: "draft" | "sent" | "approved" | "rejected";
  owner: string;
  template?: string;
  customizations?: any;
  vatRate: number;
  discountRate: number;
  extraCosts: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProposalItem {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Template {
  _id: string;
  name: string;
  description: string;
  category: string;
  previewImageUrl: string;
  ejsFile: string;
  structure: any;
  design: any;
  createdAt: Date;
  updatedAt: Date;
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
  customerName: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  template?: string;
  customizations?: any;
  vatRate?: number;
  discountRate?: number;
  extraCosts?: number;
}

export interface UpdateProposalRequest extends Partial<CreateProposalRequest> {
  _id: string;
}

export interface CreateProductRequest {
  name: string;
  unit: string;
  unitPrice: number;
  category?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  _id: string;
}
