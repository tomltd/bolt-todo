export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      todos: {
        Row: {
          id: string
          text: string
          completed: boolean
          created_at: string
          position: number
          user_id: string
          delegate: string
        }
        Insert: {
          id?: string
          text: string
          completed?: boolean
          created_at?: string
          position: number
          user_id: string
          delegate?: string
        }
        Update: {
          id?: string
          text?: string
          completed?: boolean
          created_at?: string
          position?: number
          user_id?: string
          delegate?: string
        }
      }
    }
  }
}