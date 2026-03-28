export interface SquareAuthor {
  id: string;
  name: string;
  avatarUrl?: string;
  verified?: boolean;
  following?: boolean;
}

export interface SquarePost {
  id: string;
  author: SquareAuthor;
  createdAt: string;
  content: string;
  tags: string[];
  imageUrl?: string;
  likes: number;
  comments: number;
  shares: number;
}

export interface SquareComment {
  id: string;
  postId: string;
  authorName: string;
  content: string;
  createdAt: string;
}
