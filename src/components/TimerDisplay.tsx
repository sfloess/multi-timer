import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Platform, Animated } from 'react-native';

export type TimerStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED';

interface TimerDisplayProps {
  remainingTime: number; // in seconds
  status: TimerStatus;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ remainingTime, status }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let animationLoop: Animated.CompositeAnimation | null = null;

    if (status === 'COMPLETED') {
      animationLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      animationLoop.start();
    } else if (status === 'RUNNING') {
      animationLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      animationLoop.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      if (animationLoop) {
        animationLoop.stop();
      }
    };
  }, [status, pulseAnim]);

  // Formats time cleanly to 2-digit strings
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);

    const pad = (num: number) => String(num).padStart(2, '0');
    return {
      hours: pad(hrs),
      minutes: pad(mins),
      seconds: pad(secs),
    };
  };

  const { hours, minutes, seconds } = formatTime(remainingTime);

  const getStatusColor = () => {
    switch (status) {
      case 'RUNNING':
        return '#10B981'; // Emerald Green
      case 'PAUSED':
        return '#F59E0B'; // Amber Orange
      case 'COMPLETED':
        return '#EF4444'; // Rose Red
      case 'IDLE':
      default:
        return '#64748B'; // Slate Gray
    }
  };

  const statusColor = getStatusColor();

  return (
    <Animated.View 
      style={[
        styles.container, 
        { transform: [{ scale: pulseAnim }] }
      ]}
    >
      <View style={[styles.displayWrapper, { borderColor: statusColor }]}>
        {/* Hours Segment */}
        <View style={styles.segment}>
          <Text style={[styles.digits, { color: statusColor }]}>{hours}</Text>
          <Text style={[styles.label, { color: statusColor }]}>H</Text>
        </View>
        
        <Text style={[styles.separator, { color: statusColor }]}>:</Text>
        
        {/* Minutes Segment */}
        <View style={styles.segment}>
          <Text style={[styles.digits, { color: statusColor }]}>{minutes}</Text>
          <Text style={[styles.label, { color: statusColor }]}>M</Text>
        </View>
        
        <Text style={[styles.separator, { color: statusColor }]}>:</Text>
        
        {/* Seconds Segment */}
        <View style={styles.segment}>
          <Text style={[styles.digits, { color: statusColor }]}>{seconds}</Text>
          <Text style={[styles.label, { color: statusColor }]}>S</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    width: '100%',
  },
  displayWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 18,
    borderWidth: 2,
    backgroundColor: Platform.select({
      ios: 'rgba(255, 255, 255, 0.9)',
      android: '#FFFFFF',
      default: '#FFFFFF',
    }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    minWidth: 260,
  },
  segment: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
  },
  digits: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    ...Platform.select({
      ios: {
        fontFamily: 'Courier',
      },
      android: {
        fontFamily: 'monospace',
      },
      web: {
        fontFamily: 'monospace, monospace',
        userSelect: 'none',
      },
    }),
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 1,
    opacity: 0.7,
  },
  separator: {
    fontSize: 30,
    fontWeight: '300',
    opacity: 0.5,
    marginHorizontal: 2,
  },
});
