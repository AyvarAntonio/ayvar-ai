export interface Message {
  id: string;
  content: string;
  role: 'user' | 'ai';
  timestamp: Date;
  status?: 'sending' | 'streaming' | 'sent' | 'error' | 'stopped';
  responseTime?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  title: string;
  date: Date;
  messages: Message[];
  preview?: string;
}
