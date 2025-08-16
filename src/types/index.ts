export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  role: 'fan' | 'admin';
  fanLevel: number;
}

export interface MediaContent {
  id: string;
  title: string;
  type: 'video' | 'audio' | 'image';
  thumbnail: string;
  url: string;
  category: string;
  likes: number;
  views: number;
  description?: string;
  isNew?: boolean;
  userHasLiked?: boolean;
}

export interface MerchItem {
  id: string;
  type: 'physical' | 'digital';
  subtype?: 'music' | 'beats' | 'book';
  name: string;
  price: number;
  images: string[];
  description: string;
  category: 'clothing' | 'accessories' | 'beats' | 'limited';
  sizes?: string[];
  stock: number;
  isNew?: boolean;
  printify_product_id?: string;
  printify_shop_id?: string;
  digital_asset_path?: string;
}

export interface PrintifyOptionValue {
  id: number;
  title: string;
}

export interface PrintifyOption {
  name: string;
  type: string;
  values: PrintifyOptionValue[];
}

export interface PrintifyVariant {
  id: number;
  sku: string;
  cost: number;
  price: number;
  title: string;
  grams: number;
  is_enabled: boolean;
  is_default: boolean;
  is_available: boolean;
  is_printify_express_eligible: boolean;
  options: number[];
}

export interface PrintifyImage {
  src: string;
  variant_ids: number[];
  position: string;
  is_default: boolean;
}

export interface PrintifyProductDetails {
  id: string;
  title: string;
  description: string;
  safety_information?: string;
  tags: string[];
  options: PrintifyOption[];
  variants: PrintifyVariant[];
  images: PrintifyImage[];
}

export interface Post {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  title: string;
  content: string;
  image?: string;
  content_id?: string;
  linkedContent?: {
    id: string;
    title: string;
    type: 'video' | 'audio' | 'image';
    thumbnail?: string;
    file_url: string;
  };
  timestamp: Date;
  likes_count: number;
  comments_count: number;
  isAnnouncement?: boolean;
  userHasLiked?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  content: string;
  timestamp: Date;
}

export interface CartItem {
  id: string;
  item: MerchItem;
  quantity: number;
  selectedOptions?: { [optionName: string]: string };
  printifyVariantId?: number;
}