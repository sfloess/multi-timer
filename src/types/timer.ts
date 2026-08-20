export type TimerStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED';

export interface TimerInstance {
  id: string;
  name: string;
  initialDuration: number; // in seconds
  remainingTime: number;   // in seconds
  status: TimerStatus;
  notes: string;
  isSelected: boolean;
  targetTime: number | null;     // timestamp ms when timer completes
  notificationId: string | null;
  scheduledFor: string | null;   // ISO string if scheduled
  completedAt: string | null;    // ISO string when completed
  createdAt?: string;
  updatedAt?: string;
}

export interface TimerRow {
  id: string;
  name: string;
  initialDuration: number;
  remainingTime: number;
  status: string;
  notes: string;
  isSelected: number;
  targetTime: number | null;
  notificationId: string | null;
  scheduledFor: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
