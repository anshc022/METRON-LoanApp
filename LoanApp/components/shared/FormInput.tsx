import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'password';
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  icon,
  required = false,
  type = 'text',
  value,
  onChangeText,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;
  const borderColor = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  React.useEffect(() => {
    Animated.timing(borderColor, {
      toValue: error ? 2 : isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, error]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const labelStyle = {
    position: 'absolute' as const,
    left: 12,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 8],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['#9ca3af', '#6b7280'],
    }),
  };

  const containerBorderColor = borderColor.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['#e5e7eb', '#3b82f6', '#ef4444'],
  });

  const getInputProps = () => {
    const baseProps = {
      ...props,
      value,
      onChangeText,
      onFocus: handleFocus,
      onBlur: handleBlur,
      style: [styles.input, { paddingTop: isFocused || value ? 20 : 16 }],
    };

    switch (type) {
      case 'email':
        return {
          ...baseProps,
          keyboardType: 'email-address' as const,
          autoCapitalize: 'none' as const,
          autoCorrect: false,
        };
      case 'password':
        return {
          ...baseProps,
          secureTextEntry: !showPassword,
        };
      default:
        return baseProps;
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.inputContainer, { borderColor: containerBorderColor }]}>
        {icon && (
          <View style={styles.iconContainer}>
            <Ionicons name={icon as any} size={20} color={isFocused ? '#3b82f6' : '#9ca3af'} />
          </View>
        )}
        
        <View style={styles.textContainer}>
          <Animated.Text style={labelStyle}>
            {label}{required && ' *'}
          </Animated.Text>
          <TextInput {...getInputProps()} />
        </View>

        {type === 'password' && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.passwordToggle}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color="#9ca3af"
            />
          </TouchableOpacity>
        )}
      </Animated.View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    minHeight: 56,
  },
  iconContainer: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  textContainer: {
    flex: 1,
    position: 'relative',
  },
  input: {
    fontSize: 16,
    color: '#111827',
    paddingHorizontal: 12,
    paddingBottom: 8,
    minHeight: 40,
  },
  passwordToggle: {
    paddingHorizontal: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },
});