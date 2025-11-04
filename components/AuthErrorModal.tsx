import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AuthErrorModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: 'error' | 'warning' | 'info';
}

const { width } = Dimensions.get('window');

export const AuthErrorModal: React.FC<AuthErrorModalProps> = ({
  visible,
  title,
  message,
  onClose,
  type = 'error'
}) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [canDismiss, setCanDismiss] = React.useState(false);

  // Debug logging
  React.useEffect(() => {
    console.log('AuthErrorModal props changed:', { visible, title, message, type });
  }, [visible, title, message, type]);

  React.useEffect(() => {
    if (visible) {
      setCanDismiss(false); // Prevent dismissal during animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Allow dismissal after animation completes
        setTimeout(() => setCanDismiss(true), 100);
      });
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      setCanDismiss(false);
    }
  }, [visible]);

  const handleClose = () => {
    if (canDismiss) {
      console.log('Modal close triggered');
      onClose();
    } else {
      console.log('Modal close prevented - animation in progress');
    }
  };

  const getIconName = () => {
    switch (type) {
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      default:
        return 'close-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#3b82f6';
      default:
        return '#ef4444';
    }
  };

  const getGradientColors = () => {
    switch (type) {
      case 'error':
        return ['#fee2e2', '#ffffff'];
      case 'warning':
        return ['#fef3c7', '#ffffff'];
      case 'info':
        return ['#dbeafe', '#ffffff'];
      default:
        return ['#fee2e2', '#ffffff'];
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.content}>
              {/* Icon */}
              <View style={[styles.iconContainer, { backgroundColor: getIconColor() + '20' }]}>
                <Ionicons name={getIconName()} size={48} color={getIconColor()} />
              </View>

              {/* Title */}
              <Text style={styles.title}>{title}</Text>

              {/* Message */}
              <Text style={styles.message}>{message}</Text>

              {/* Close Button */}
              <TouchableOpacity
                style={[styles.button, { backgroundColor: getIconColor() }]}
                activeOpacity={0.8}
                onPress={handleClose}
              >
                <Text style={styles.buttonText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: width - 48,
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  gradient: {
    borderRadius: 24,
  },
  content: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  button: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
