import React, { createContext, useContext, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const { width } = Dimensions.get('window');

const ToastItem: React.FC<{ toast: Toast; onHide: (id: string) => void }> = ({ toast, onHide }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after duration
    const timer = setTimeout(() => {
      hideToast();
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, []);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide(toast.id);
    });
  };

  const getIconName = () => {
    switch (toast.type) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'close-circle';
      case 'warning': return 'warning';
      case 'info': return 'information-circle';
      default: return 'information-circle';
    }
  };

  const getColors = () => {
    switch (toast.type) {
      case 'success': return { bg: '#dcfce7', border: '#10b981', icon: '#059669', text: '#065f46' };
      case 'error': return { bg: '#fee2e2', border: '#ef4444', icon: '#dc2626', text: '#991b1b' };
      case 'warning': return { bg: '#fef3c7', border: '#f59e0b', icon: '#d97706', text: '#92400e' };
      case 'info': return { bg: '#dbeafe', border: '#3b82f6', icon: '#2563eb', text: '#1e40af' };
      default: return { bg: '#f3f4f6', border: '#6b7280', icon: '#4b5563', text: '#374151' };
    }
  };

  const colors = getColors();

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: colors.bg,
          borderLeftColor: colors.border,
        },
      ]}
    >
      <View style={styles.toastContent}>
        <Ionicons name={getIconName()} size={24} color={colors.icon} />
        <View style={styles.toastText}>
          <Text style={[styles.toastTitle, { color: colors.text }]}>{toast.title}</Text>
          {toast.message && (
            <Text style={[styles.toastMessage, { color: colors.text }]}>{toast.message}</Text>
          )}
        </View>
        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={colors.icon} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    setToasts(prev => [newToast, ...prev]);
  };

  const hideToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <View style={styles.toastWrapper} pointerEvents="box-none">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onHide={hideToast} />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
  },
  toastContainer: {
    marginBottom: 8,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  toastText: {
    flex: 1,
    marginLeft: 12,
  },
  toastTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  toastMessage: {
    fontSize: 13,
    opacity: 0.8,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});