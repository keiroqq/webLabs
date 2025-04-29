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
  participantsCount: number;
  isCurrentUserParticipant: boolean;
}

export interface EventCreationData {
  title: string;
  description?: string | null;
  date: string;
  category: EventCategory;
}

import type { FrontendUser } from './user';
export type Participant = Pick<FrontendUser, 'id' | 'name' | 'email'>;
