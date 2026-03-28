export interface Expense {
  id: string;
  date: string;
  time?: string;
  amount: number;
  category: string;
  description: string;
  merchant: string;
  tags: string[];
  paymentMethod?: string;
  status?: 'pending' | 'completed' | 'cancelled';
  userId: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  period: 'monthly';
  userId: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  monthlyBudget?: number;
}

export interface LiteracyArticle {
  id: string;
  title: string;
  content: string;
  category: 'budgeting' | 'investing' | 'saving' | 'debt';
  readTime: string;
}

export interface Tag {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
}
