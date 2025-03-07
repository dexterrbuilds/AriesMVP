import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Lets choose who you are!</Text>
      </View>
      <View style={styles.cardContainer}>
        <View style={[styles.card, styles.referCard]}>
          <Text style={styles.cardTitle}>Refer and earn</Text>
          <Text style={styles.cardDescription}>Invite friends to learn or tutor on Aries and earn attractive rewards</Text>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Invite Friends</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => selectRole('learner')} style={[styles.card, styles.learnerCard]}>
          <Text style={styles.cardTitle}>Learner</Text>
          <Text style={styles.cardDescription}>Invite friends to learn or tutor on Aries and earn attractive rewards</Text>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Invite Friends</Text>
          </TouchableOpacity>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => selectRole('educator')} style={[styles.card, styles.tutorCard]}>
          <Text style={styles.tcardTitle}>Become a tutor</Text>
          <Text style={styles.tcardDescription}>Invite friends to learn or tutor on Aries and earn attractive rewards</Text>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Invite Friends</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How Aries works</Text>
        <View style={styles.listItem}>
          <Text style={styles.listItemText}>1. How do i find the right tutor</Text>
          <View style={styles.arrow}>
            <Text style={styles.arrowText}>&#8595;</Text>
          </View>
        </View>
        <View style={styles.listItem}>
          <Text style={styles.listItemText}>1. How do i check a tutor </Text>
          <View style={styles.arrow}>
            <Text style={styles.arrowText}>&#8595;</Text>
          </View>
        </View>
        <View style={styles.listItem}>
          <Text style={styles.listItemText}>3. How do I book a session</Text>
          <View style={styles.arrow}>
            <Text style={styles.arrowText}>&#8595;</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cardContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 20,
  },
  card: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  referCard: {
    backgroundColor: '#F27E92',
  },
  learnerCard: {
    backgroundColor: '#f5f5f5',
  },
  tutorCard: {
    backgroundColor: '#001f54',
    color: 'white',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tcardTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tcardDescription: {
    color: 'white',
    fontSize: 14,
    marginVertical: 10,
  },
  cardDescription: {
    fontSize: 14,
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 5,
    borderRadius: 15,
    alignItems: 'center',
    width: '50%',
  },
  buttonText: {
    color: '#fff',
    
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  listItemText: {
    fontSize: 16,
    flex: 1,
  },
  arrow: {
    width: 30,
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 20,
  },
});
