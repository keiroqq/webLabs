export type EventCategory = 'concert' | 'lecture' | 'exhibition';

export interface FrontendEvent {
  id: number;
  title: string;
  description?: string | null;
  date: string;
  category: EventCategory;
  createdBy: number;
  createdAt?: string;
  updatedAt?: string;
}