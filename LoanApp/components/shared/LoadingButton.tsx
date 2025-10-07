import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LoadingButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  fullWidth?: boolean;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  title,
  loading = false,
  variant = 'primary',
  size = 'medium',
  icon,
  fullWidth = false,
  onPress,
  disabled,
  style,
  ...props
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 0.96,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: '#3b82f6',
          shadowColor: '#3b82f6',
        };
      case 'secondary':
        return {
          backgroundColor: '#f3f4f6',
          shadowColor: '#000',
        };
      case 'danger':
        return {
          backgroundColor: '#ef4444',
          shadowColor: '#ef4444',
        };
      case 'success':
        return {
          backgroundColor: '#10b981',
          shadowColor: '#10b981',
        };
      default:
        return {
          backgroundColor: '#3b82f6',
          shadowColor: '#3b82f6',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 12,
          paddingVertical: 8,
          minHeight: 36,
        };
      case 'large':
        return {
          paddingHorizontal: 24,
          paddingVertical: 16,
          minHeight: 56,
        };
      default:
        return {
          paddingHorizontal: 16,
          paddingVertical: 12,
          minHeight: 48,
        };
    }
  };

  const getTextColor = () => {
    return variant === 'secondary' ? '#374151' : '#ffffff';
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'large':
        return 18;
      default:
        return 16;
    }
  };

  const isDisabled = disabled || loading;
  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleValue }],
          opacity: opacityValue,
        },
        fullWidth && { width: '100%' },
      ]}
    >
      <TouchableOpacity
        {...props}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          styles.button,
          variantStyles,
          sizeStyles,
          isDisabled && styles.disabled,
          fullWidth && { width: '100%' },
          style,
        ]}
      >
        {loading && (
          <ActivityIndicator
            size="small"
            color={getTextColor()}
            style={styles.loader}
          />
        )}
        
        {!loading && icon && (
          <Ionicons
            name={icon as any}
            size={getFontSize()}
            color={getTextColor()}
            style={styles.icon}
          />
        )}
        
        <Text
          style={[
            styles.text,
            {
              color: getTextColor(),
              fontSize: getFontSize(),
              opacity: loading ? 0.7 : 1,
            },
          ]}
        >
          {loading ? 'Please wait...' : title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  disabled: {
    opacity: 0.5,
    shadowOpacity: 0.05,
    elevation: 1,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  loader: {
    marginRight: 8,
  },
  icon: {
    marginRight: 8,
  },
});