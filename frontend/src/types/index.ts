export type Role = 'USER' | 'COMPANY';

export type PostTopic =
  | 'BUSINESS_NEWS'
  | 'MANUFACTURING'
  | 'PRODUCTS'
  | 'WHOLESALE'
  | 'D2C_BRANDS'
  | 'FINANCE'
  | 'TECHNOLOGY'
  | 'AGRICULTURE'
  | 'JOBS'
  | 'MEMES';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: Role | null;
  headline: string | null;
  bio: string | null;
  city: string | null;
  createdAt: string;
  updatedAt: string;
  company?: Company | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export interface Company {
  id: string;
  userId: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  coverUrl: string | null;
  businessType: string;
  categoryId: string | null;
  city: string;
  state: string;
  description: string | null;
  tags: string[];
  yearFounded: number | null;
  verified: boolean;
  followerCount: number;
  createdAt: string;
  updatedAt: string;
  category?: Category | null;
  isFollowing?: boolean;
}

export interface Product {
  id: string;
  companyId: string;
  categoryId: string | null;
  title: string;
  description: string | null;
  price: number | null;
  priceUnit: string | null;
  moq: number | null;
  images: string[];
  tags: string[];
  material: string | null;
  sizes: string | null;
  usage: string | null;
  createdAt: string;
  updatedAt: string;
  company?: Company;
  category?: Category | null;
}

export interface Post {
  id: string;
  companyId: string;
  content: string;
  images: string[];
  topic: PostTopic;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  company: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    businessType: string;
    city: string;
    state: string;
    verified: boolean;
  };
  isLiked?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
    headline: string | null;
    role: Role | null;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
