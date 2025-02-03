import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Define types for navigation
type RootStackParamList = {
  RoleSelection: undefined;
  ChooseTopic: { role: 'learner' | 'educator' };
};

type RoleSelectionScreenProps = NativeStackScreenProps<RootStackParamList, 'RoleSelection'>;

export default function RoleSelectionScreen({ navigation }: RoleSelectionScreenProps) {
  const selectRole = (role: 'learner' | 'educator') => {
    alert(`You chose to be a ${role}`);
    navigation.navigate('ChooseTopic', { role })
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Let's choose who you are!</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => selectRole('learner')}
      >
        <Text style={styles.buttonText}>Learner</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => selectRole('educator')}
      >
        <Text style={styles.buttonText}>Educator</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 600,
  },
  button: {
    width: '60%',
    padding: 15,
    backgroundColor: 'black',
    borderRadius: 5,
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: "bold",
  },
});
