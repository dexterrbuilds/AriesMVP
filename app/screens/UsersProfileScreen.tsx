import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../(tabs)/index';
import BottomNav from '@/components/BottomNav';
import { useUser } from '@/contexts/UserContext';
import axios from 'axios';

const Tab = createMaterialTopTabNavigator();

const UsersProfile = ({ navigation, route }: any) => {
  const { userName } = route.params;
  console.log("Navigated with username:", userName);
  const { user, access_token } = useUser();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Fetching profile for:", userName); // Debugging API call
    console.log("Access token:", access_token); // Debugging token

    const fetchProfileData = async () => {
      try {
        const response = await axios.get(`https://ariesmvp-9903a26b3095.herokuapp.com/api/api/profile/${userName}`, {
          headers: {
            Authorization: `Bearer ${access_token}`
          }
        });
        setProfileData(response.data);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userName, access_token]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'white', paddingTop: 40 }}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.name}>{profileData?.username}</Text>
          <Image
            source={{ uri: profileData?.avatar || 'https://via.placeholder.com/100' }}
            style={styles.profilePicture}
          />
          <Text style={styles.username}>@{profileData?.username}</Text>
          <Text style={styles.bio}>Developer | Educator | Learner</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profileData?.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profileData?.following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profileData?.likes.length}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Tab.Navigator
            screenOptions={{
              tabBarLabelStyle: styles.tabBarLabel,
              tabBarStyle: styles.tabBar,
              tabBarIndicatorStyle: styles.tabBarIndicator,
            }}
          >
            <Tab.Screen name="Courses" component={CoursesTab} />
            <Tab.Screen name="Links" component={LinksTab} />
            <Tab.Screen name="Readlists" component={ReadlistsTab} />
          </Tab.Navigator>
        </View>
      </ScrollView>

      <View style={styles.bottomnav}>
        <BottomNav navigation={navigation} user={user} />
      </View>
    </View>
  );
};

const CoursesTab = () => (
  <View style={styles.tabContainer}>
    <Text>Courses Content</Text>
  </View>
);

const LinksTab = () => (
  <View style={styles.tabContainer}>
    <Text>Links Content</Text>
  </View>
);

const ReadlistsTab = () => (
  <View style={styles.tabContainer}>
    <Text>Readlists Content</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  username: {
    fontSize: 16,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  bio: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    backgroundColor: '#fff',
    paddingVertical: 15,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  editButton: {
    backgroundColor: 'black',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignSelf: 'center',
    marginVertical: 20,
    width: '80%',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tabContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    backgroundColor: '#ffffff',
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarLabel: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'none',
    color: '#333333',
  },
  tabBarIndicator: {
    backgroundColor: 'black',
    height: 3,
  },
  bottomnav: {
    backgroundColor: 'white',
    borderStyle: 'solid',
    borderTopWidth: 1,
    borderTopColor: '#808080',
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    alignItems: 'center',
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default UsersProfile;