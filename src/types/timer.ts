export type TimerStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED';

export interface TimerInstance {
  id: string;
  name: string;
  initialDuration: number;
  remainingTime: number;
  status: TimerStatus;
  notes: string;
  isSelected: boolean;
  targetTime: number | null;
  notificationId: string | null;
  scheduledFor?: string | null; // ISO string representing scheduled date & time
  completedAt?: string | null;  // ISO string representing completion timestamp
}
