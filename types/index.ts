export interface ProductAttribute {
  name: string;
  slug?: string;
  options: string[];
  variation?: boolean;
}

export interface ProductVariation {
  id: number;
  databaseId?: number;
  name?: string;
  attributes: Array<{
    name: string;
    option: string;
    value?: string;
  }>;
  price: string;
  regularPrice?: string;
  salePrice?: string;
  onSale?: boolean;
  stockStatus: string;
  stockQuantity: number | null;
  image?: {
    src?: string;
    sourceUrl?: string;
    alt?: string;
  };
}

export interface Product {
  id: string;
  databaseId?: number;
  name: string;
  price: string;
  regularPrice?: string;
  salePrice?: string;
  onSale?: boolean;
  slug: string;
  status?: string;
  type?: string;
  image?: {
    sourceUrl: string;
  };
  galleryImages?: {
    nodes: Array<{
      sourceUrl: string;
    }>;
  };
  description?: string;
  shortDescription?: string;
  stockQuantity?: number | null;
  stockStatus?: string;
  manageStock?: boolean;
  featured?: boolean;
  __typename?: string;
  attributes?: {
    nodes: ProductAttribute[];
  };
  variations?: {
    nodes: ProductVariation[];
  };
}

export interface CartItem extends Omit<Product, 'image'> {
  quantity: number;
  variationId?: number | null;
  selectedAttributes?: Record<string, string>;
  variationImage?: {
    sourceUrl: string;
  } | null;
  variationPrice?: string | null;
  image?: {
    sourceUrl: string;
  } | null;
}

export interface TimelineItem {
  timeStart: number;
  timeEnd: number;
  productAssociated: Product;
}

export interface LiveEvent {
  id: string;
  title: string;
  videoUrl: string;
  timeline: TimelineItem[];
  date: string;
}

export interface UserProfile {
  id: string;
  statutColis: 'ouvert' | 'fermé';
  dateOuverture?: string;
  montantEconomise: number;
  points?: number;
}

export interface GetProductsResponse {
  products: {
    nodes: Product[];
  };
}

export interface GetProductBySlugResponse {
  product: Product;
}

export interface GetLiveEventsResponse {
  liveEvents: {
    nodes: Array<{
      id: string;
      title: string;
      date: string;
      liveEventFields: {
        videoUrl: string;
        timeline: TimelineItem[];
      };
    }>;
  };
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: {
    sourceUrl: string;
  };
  count: number;
  parentId?: string;
}

export interface GetProductCategoriesResponse {
  productCategories: {
    nodes: ProductCategory[];
  };
}

export interface GetProductsByCategoryResponse {
  products: {
    nodes: Product[];
  };
}

export interface Slider {
  id: string;
  title: string;
  featuredImage?: {
    node: {
      sourceUrl: string;
      altText: string;
    };
  };
}

export interface GetHomeSlidersResponse {
  sliders: {
    nodes: Slider[];
  };
}

export interface PostCategory {
  id: string;
  databaseId?: string;
  name: string;
  slug: string;
  description?: string;
  count: number;
}

export interface Post {
  id: string;
  databaseId?: number;
  title: string;
  slug: string;
  excerpt: string;
  date: string;
  content?: string;
  featuredImage?: {
    node: {
      sourceUrl: string;
      altText: string;
    };
  };
  categories: {
    nodes: PostCategory[];
  };
}

export interface GetPostCategoriesResponse {
  categories: {
    nodes: PostCategory[];
  };
}

export interface GetPostsResponse {
  posts: {
    nodes: Post[];
  };
}

export interface GetPostBySlugResponse {
  post: Post;
}
