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
}
