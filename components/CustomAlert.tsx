import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  duration?: number; // Auto-dismiss duration in ms
  onClose: () => void;
}

const { width } = Dimensions.get('window');

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  duration = 2000, // Default 2 seconds
  onClose
}) => {
  const [animation] = useState(new Animated.Value(0));
  
  useEffect(() => {
    if (visible) {
      // Slide in animation
      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 8
      }).start();
      
      // Auto dismiss after duration
      const timer = setTimeout(() => {
        dismiss();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [visible]);
  
  const dismiss = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 2000,
      useNativeDriver: true
    }).start(() => {
      onClose();
    });
  };

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0]
  });
  
  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
    >
      <Animated.View 
        style={[
          styles.alertContainer,
          { 
            transform: [{ translateY }],
            opacity
          }
        ]}
      >
        <View style={styles.iconContainer}>
          <MaterialIcons name="check-circle" size={24} color="#2E7D32" />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  alertContainer: {
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
    width: width * 0.9,
    backgroundColor: 'rgba(232, 245, 233, 0.95)', // Slightly transparent green
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#2E7D32' // Deep green border
  },
  iconContainer: {
    marginRight: 12
  },
  textContainer: {
    flex: 1
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B5E20', // Dark green text
    marginBottom: 2
  },
  message: {
    fontSize: 14,
    color: '#2E7D32', // Green text
  }
});

export default CustomAlert;