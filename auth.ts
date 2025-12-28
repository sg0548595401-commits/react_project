export interface User {
  id: string;
  name: string;
  email: string; // הוספנו את המייל שחוסר בתמונה
  role: 'admin' | 'customer';
}

export interface AuthState {
  user: User | null;
  token: string | null;
}