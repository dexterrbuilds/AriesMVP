import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Define the navigation types
type RootStackParamList = {
  Info: undefined;
  Register: undefined;
};

type InfoScreenProps = NativeStackScreenProps<RootStackParamList, 'Info'>;

export default function InfoScreen({ navigation }: InfoScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.infoText}>
        a place to learn
      </Text>
      <Text style={styles.infoText}>
        a place to earn
      </Text>
      <Text style={styles.infoText}>
        a place to share
      </Text>
      <TouchableOpacity
        style={styles.joinButton}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.buttonText}>Join </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    padding: 20,
  },
  infoText: {
    fontSize: 40,
    fontWeight: 900,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  joinButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    position: "absolute",
    bottom: 20,
    right: 40
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
