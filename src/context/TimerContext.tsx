import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { TimerInstance, TimerStatus } from '../types/timer';

interface TimerState {
  timers: TimerInstance[];
}

type TimerAction =
  | { type: 'ADD_TIMER' }
  | {
      type: 'ADD_SCHEDULED_TIMER';
      timer: Omit<
        TimerInstance,
        'id' | 'remainingTime' | 'status' | 'isSelected' | 'targetTime' | 'notificationId' | 'completedAt'
      >;
    }
  | {
      type: 'SCHEDULE_NEW_TIMER';
      name: string;
      duration: number;
      notes: string;
      scheduledFor: string;
    }
  | { type: 'DELETE_TIMERS' }
  | { type: 'TOGGLE_SELECT_TIMER'; id: string }
  | { type: 'UPDATE_TIMER_NAME'; id: string; name: string }
  | { type: 'UPDATE_TIMER_DURATION'; id: string; seconds: number }
  | { type: 'UPDATE_TIMER_NOTES'; id: string; notes: string }
  | {
      type: 'UPDATE_TIMER_STATUS';
      id: string;
      status: TimerStatus;
      targetTime?: number | null;
      notificationId?: string | null;
      remainingTime?: number;
      completedAt?: string | null;
    }
  | { type: 'MOVE_TIMER'; direction: 'UP' | 'DOWN'; id: string }
  | { type: 'SET_TIMERS'; timers: TimerInstance[] }
  | { type: 'CLEAR_ALL' };

const STORAGE_KEY = '@multi_timers_app_state';

const initialTimers: TimerInstance[] = [
  {
    id: '1',
    name: 'Pomodoro Focus',
    initialDuration: 1500,
    remainingTime: 1500,
    status: 'IDLE',
    notes: 'Stay focused on code architecture.',
    isSelected: false,
    targetTime: null,
    notificationId: null,
    scheduledFor: null,
    completedAt: null,
  },
  {
    id: '2',
    name: 'Short Break',
    initialDuration: 300,
    remainingTime: 300,
    status: 'IDLE',
    notes: 'Stretch and drink water.',
    isSelected: false,
    targetTime: null,
    notificationId: null,
    scheduledFor: null,
    completedAt: null,
  },
];

const timerReducer = (state: TimerState, action: TimerAction): TimerState => {
  switch (action.type) {
    case 'ADD_TIMER': {
      const newTimer: TimerInstance = {
        id: Date.now().toString(),
        name: `Timer ${state.timers.length + 1}`,
        initialDuration: 60,
        remainingTime: 60,
        status: 'IDLE',
        notes: '',
        isSelected: false,
        targetTime: null,
        notificationId: null,
        scheduledFor: null,
        completedAt: null,
      };
      return { ...state, timers: [newTimer, ...state.timers] };
    }

    case 'ADD_SCHEDULED_TIMER': {
      const newTimer: TimerInstance = {
        id: Date.now().toString(),
        name: action.timer.name,
        initialDuration: action.timer.initialDuration,
        remainingTime: action.timer.initialDuration,
        status: 'IDLE',
        notes: action.timer.notes || '',
        isSelected: false,
        targetTime: null,
        notificationId: null,
        scheduledFor: action.timer.scheduledFor || null,
        completedAt: null,
      };
      return { ...state, timers: [newTimer, ...state.timers] };
    }

    case 'SCHEDULE_NEW_TIMER': {
      const newTimer: TimerInstance = {
        id: Date.now().toString(),
        name: action.name,
        initialDuration: action.duration,
        remainingTime: action.duration,
        status: 'IDLE',
        notes: action.notes,
        isSelected: false,
        targetTime: null,
        notificationId: null,
        scheduledFor: action.scheduledFor,
        completedAt: null,
      };
      return { ...state, timers: [newTimer, ...state.timers] };
    }

    case 'DELETE_TIMERS': {
      const remaining = state.timers.filter((t) => !t.isSelected);
      return { ...state, timers: remaining };
    }

    case 'TOGGLE_SELECT_TIMER': {
      return {
        ...state,
        timers: state.timers.map((t) =>
          t.id === action.id ? { ...t, isSelected: !t.isSelected } : t
        ),
      };
    }

    case 'UPDATE_TIMER_NAME': {
      return {
        ...state,
        timers: state.timers.map((t) =>
          t.id === action.id ? { ...t, name: action.name } : t
        ),
      };
    }

    case 'UPDATE_TIMER_DURATION': {
      return {
        ...state,
        timers: state.timers.map((t) =>
          t.id === action.id
            ? {
                ...t,
                initialDuration: action.seconds,
                remainingTime: action.seconds,
                targetTime: null,
              }
            : t
        ),
      };
    }

    case 'UPDATE_TIMER_NOTES': {
      return {
        ...state,
        timers: state.timers.map((t) =>
          t.id === action.id ? { ...t, notes: action.notes } : t
        ),
      };
    }

    case 'UPDATE_TIMER_STATUS': {
      return {
        ...state,
        timers: state.timers.map((t) => {
          if (t.id === action.id) {
            const isCompleted = action.status === 'COMPLETED';
            const completedAt = isCompleted
              ? action.completedAt !== undefined
                ? action.completedAt
                : new Date().toISOString()
              : action.status === 'IDLE' || action.status === 'RUNNING'
                ? null
                : t.completedAt;

            return {
              ...t,
              status: action.status,
              targetTime:
                action.targetTime !== undefined
                  ? action.targetTime
                  : t.targetTime,
              notificationId:
                action.notificationId !== undefined
                  ? action.notificationId
                  : t.notificationId,
              remainingTime:
                action.remainingTime !== undefined
                  ? action.remainingTime
                  : t.remainingTime,
              completedAt,
            };
          }
          return t;
        }),
      };
    }

    case 'MOVE_TIMER': {
      const index = state.timers.findIndex((t) => t.id === action.id);
      if (index === -1) return state;

      const newTimers = [...state.timers];
      const targetIndex = action.direction === 'UP' ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= newTimers.length) return state;

      const temp = newTimers[index];
      newTimers[index] = newTimers[targetIndex];
      newTimers[targetIndex] = temp;

      return { ...state, timers: newTimers };
    }

    case 'SET_TIMERS':
      return { ...state, timers: action.timers };

    case 'CLEAR_ALL':
      return { ...state, timers: [] };

    default:
      return state;
  }
};

interface TimerContextType {
  state: TimerState;
  dispatch: React.Dispatch<TimerAction>;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(timerReducer, { timers: initialTimers });

  // Load persisted timers on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            dispatch({ type: 'SET_TIMERS', timers: parsed });
          }
        } catch (e) {
          console.error('Failed to load timers from storage', e);
        }
      }
    });
  }, []);

  // Persist timers whenever they change
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.timers)).catch((e) =>
      console.error('Failed to save timers to storage', e)
    );
  }, [state.timers]);

  return (
    <TimerContext.Provider value={{ state, dispatch }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimerContext = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimerContext must be used within a TimerProvider');
  }
  return context;
};
