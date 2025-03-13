import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

// Define the navigation types
type RootStackParamList = {
  Home: undefined;
  Register: undefined;
};

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const handleContinue = () => {
    navigation.navigate('Register');
  };

  return (
    <View style={styles.container}>
      <Image
        style={styles.backgroundImage}
        source={require('../assets/images/bg.jpg')}
        resizeMode="cover"
      />
      
      {/* Gradient Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.8)', 'black']} 
        style={styles.gradient}
      />

      <View style={styles.textContainer}>
        <Text style={styles.logoText}>Welcome to Aries!</Text>
        <Text style={styles.tagline}>
          Revolutionize education through intelligent adaptive tutoring and AI-powered learning.
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '40%',  // Adjust height to control fade intensity
  },
  textContainer: {
    alignItems: 'center',
    position: 'absolute',
    bottom: 50,
    paddingHorizontal: 20,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  tagline: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
  },
  button: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    width: '100%',
  },
  buttonText: {
    fontSize: 18,
    color: 'black',
    textAlign: 'center',
  },
});

