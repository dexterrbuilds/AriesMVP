import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SettingsItem = ({ title, onPress }) => (
  <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
    <Text style={styles.itemText}>{title}</Text>
    <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
  </TouchableOpacity>
);

const SectionHeader = ({ title }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionHeaderText}>{title}</Text>
  </View>
);

export default function SettingsScreen({navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.profileIcon} onPress={() => navigation.navigate("Profile")}>
            <Ionicons name="person-outline" size={24} color="#8E8E93" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Settings</Text>
        </View>

        <SectionHeader title="Account" />
        <SettingsItem title="Edit account" onPress={() => {}} />
        <View style={styles.separator} />
        <SettingsItem title="Change your password" onPress={() => {}} />
        <View style={styles.separator} />
        <SettingsItem title="Security & privacy" onPress={() => {}} />

        <SectionHeader title="Notification" />
        <SettingsItem title="Notification" onPress={() => {}} />
        <View style={styles.separator} />
        <SettingsItem title="Push Notification" onPress={() => {}} />
        <View style={styles.separator} />
        <SettingsItem title="Email notification" onPress={() => {}} />

        <SectionHeader title="More" />
        <SettingsItem title="Account security" onPress={() => {}} />
        <View style={styles.separator} />
        <SettingsItem title="Language/country" onPress={() => {}} />
        <View style={styles.separator} />
        <SettingsItem title="Downloaded courses" onPress={() => {}} />
        <View style={styles.separator} />
        <SettingsItem title="Payment details" onPress={() => {}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 30,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBEBEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemText: {
    fontSize: 16,
    color: '#000',
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginLeft: 16,
  },
});