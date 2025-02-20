export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  created_at: string;
  position: number;
  user_id: string;
  delegate: 'T' | 'K';
}