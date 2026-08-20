// TimerContext.tsx
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
} from 'react';
import { TimerInstance, TimerStatus } from '../types/timer';
import {
  getAllTimers,
  saveTimer,
  deleteTimer,
  clearAllTimers,
} from '../db/timerRepository';
import {
  loadAppSettings,
  saveAppSettings,
} from '../config/appConfig';

/* -------------------------------------------------------------------------- */
/*  Types & Initial State                                                     */
/* -------------------------------------------------------------------------- */
interface TimerState {
  timers: TimerInstance[];
}

type TimerAction =
  | { type: 'ADD_TIMER' }
  | {
      type: 'ADD_SCHEDULED_TIMER';
      timer: Omit<
        TimerInstance,
        'id' | 'remainingTime' | 'status' | 'isSelected' | 'targetTime' |
        'notificationId' | 'completedAt'
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

/* -------------------------------------------------------------------------- */
/*  Reducer                                                                   */
/* -------------------------------------------------------------------------- */
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
      const remaining = state.timers.filter(t => !t.isSelected);
      return { ...state, timers: remaining };
    }

    case 'TOGGLE_SELECT_TIMER': {
      return {
        ...state,
        timers: state.timers.map(t =>
          t.id === action.id ? { ...t, isSelected: !t.isSelected } : t
        ),
      };
    }

    case 'UPDATE_TIMER_NAME': {
      return {
        ...state,
        timers: state.timers.map(t =>
          t.id === action.id ? { ...t, name: action.name } : t
        ),
      };
    }

    case 'UPDATE_TIMER_DURATION': {
      return {
        ...state,
        timers: state.timers.map(t =>
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
        timers: state.timers.map(t =>
          t.id === action.id ? { ...t, notes: action.notes } : t
        ),
      };
    }

    case 'UPDATE_TIMER_STATUS': {
      return {
        ...state,
        timers: state.timers.map(t => {
          if (t.id === action.id) {
            const isCompleted = action.status === 'COMPLETED';
            const completedAt = isCompleted
              ? action.completedAt ?? new Date().toISOString()
              : action.status === 'IDLE' || action.status === 'RUNNING'
              ? null
              : t.completedAt;

            return {
              ...t,
              status: action.status,
              targetTime:
                action.targetTime !== undefined ? action.targetTime : t.targetTime,
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
      const index = state.timers.findIndex(t => t.id === action.id);
      if (index === -1) return state;

      const newTimers = [...state.timers];
      const targetIndex = action.direction === 'UP' ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= newTimers.length) return state;

      // swap
      const tmp = newTimers[index];
      newTimers[index] = newTimers[targetIndex];
      newTimers[targetIndex] = tmp;

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

/* -------------------------------------------------------------------------- */
/*  Context & Provider                                                        */
/* -------------------------------------------------------------------------- */
interface TimerContextType {
  state: TimerState;
  dispatch: React.Dispatch<TimerAction>;
  timers: TimerInstance[];
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(timerReducer, {
    timers: initialTimers,
  });
  const prevTimersRef = useRef<TimerInstance[]>(initialTimers);
  const isInitializedRef = useRef<boolean>(false);

  /* ---------- Load persisted timers from SQLite on mount ---------- */
  useEffect(() => {
    let isMounted = true;
    getAllTimers()
      .then(timersFromDb => {
        if (!isMounted) return;
        if (timersFromDb && timersFromDb.length > 0) {
          dispatch({ type: 'SET_TIMERS', timers: timersFromDb });
          prevTimersRef.current = timersFromDb;
        } else {
          // Seed the DB with the built‑in timers
          Promise.all(
            initialTimers.map(t => saveTimer(t))
          ).catch(err => console.error('Failed to seed initial timers:', err));
          prevTimersRef.current = initialTimers;
        }
        isInitializedRef.current = true;
      })
      .catch(err => {
        console.error('Failed to load timers from SQLite', err);
        isInitializedRef.current = true;
      });

    return () => {
      isMounted = false;
    };
  }, []);

  /* ---------- Sync state changes with SQLite (and optionally Postgres) ---------- */
  useEffect(() => {
    if (!isInitializedRef.current) return;

    const prevTimers = prevTimersRef.current;
    const currentTimers = state.timers;

    const syncData = async () => {
      try {
        // Upsert: save changed or new timers
        for (const timer of currentTimers) {
          const prev = prevTimers.find(t => t.id === timer.id);
          if (!prev || JSON.stringify(prev) !== JSON.stringify(timer)) {
            await saveTimer(timer);
          }
        }

        // Delete timers that no longer exist in the UI
        for (const prev of prevTimers) {
          const exists = currentTimers.some(t => t.id === prev.id);
          if (!exists) {
            await deleteTimer(prev.id);
          }
        }

        // PostgreSQL sync is triggered from Settings screen, not here
      } catch (e) {
        console.error('Failed to synchronize timers with SQLite', e);
      }
    };

    syncData();
    // keep the reference up‑to‑date for the next run
    prevTimersRef.current = currentTimers;
  }, [state.timers]);

  return (
    <TimerContext.Provider value={{ state, dispatch, timers: state.timers }}>
      {children}
    </TimerContext.Provider>
  );
};

/* -------------------------------------------------------------------------- */
/*  Hook                                                                      */
/* -------------------------------------------------------------------------- */
export const useTimerContext = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimerContext must be used within a TimerProvider');
  }
  return context;
};
