import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Define the navigation types
type RootStackParamList = {
  Home: undefined;
  Info: undefined;
};

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: HomeScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('Info');
    }, 2000); // Navigate to InfoScreen after 2 seconds

    return () => clearTimeout(timer); // Cleanup on unmount
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/icon.png')}/>
      <View style={styles.textContainer}>
        <Text style={styles.logoText}>Aries</Text>
        <Text style={styles.tagline}>Learn.earn.enjoy it</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  textContainer: {
    alignItems: 'center',
    position: 'absolute',
    bottom: 50,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  tagline: {
    fontSize: 12,
    color: 'white',
  }
});
