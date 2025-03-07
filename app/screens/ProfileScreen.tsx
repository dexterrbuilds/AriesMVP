import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useUser } from '@/contexts/UserContext';
import BottomNav from '@/components/BottomNav';
import axios from 'axios';
import { Feather } from '@expo/vector-icons'; // Import icons

// Define types for better type safety
interface ProfileData {
  username: string;
  followers: number;
  following: number;
  likes: string[];
  bio?: string;
  profileImage?: string;
}

const Tab = createMaterialTopTabNavigator();

const ProfileScreen = ({ navigation }: any) => {
  const { user, access_token } = useUser();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfileData = async () => {
    try {
      const response = await axios.get(
        `https://ariesmvp-9903a26b3095.herokuapp.com/api/profile/${user?.username}`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`
          }
        }
      );
      setProfileData(response.data);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user?.username, access_token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const profileImage = profileData?.profileImage 
    ? { uri: profileData.profileImage } 
    : require('../assets/images/pfp.png');

  return (
    <View style={styles.container}>
      {/* Header with Back and Settings buttons */}
      <View style={styles.navigationHeader}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Feather name="settings" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ProfileHeader 
          username={profileData?.username || ''} 
          profileImage={profileImage}
          bio={profileData?.bio || 'Developer | Educator | Learner'}
        />

        <ProfileStats 
          followers={profileData?.followers || 0}
          following={profileData?.following || 0}
          points={profileData?.likes.length || 0}
        />

        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile', { profileData })}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        <View style={styles.tabContainer}>
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

      <BottomNav navigation={navigation}/>
    </View>
  );
};

const ProfileHeader = ({ username, profileImage, bio }: { username: string, profileImage: any, bio: string }) => (
  <View style={styles.header}>
    <Text style={styles.name}>{username}</Text>
    <Image source={profileImage} style={styles.profilePicture} />
    <Text style={styles.username}>@{username}</Text>
    <Text style={styles.bio}>{bio}</Text>
  </View>
);

const ProfileStats = ({ followers, following, points }: { followers: number, following: number, points: number }) => (
  <View style={styles.statsContainer}>
    <StatItem value={followers} label="Followers" />
    <StatItem value={following} label="Following" />
    <StatItem value={points} label="Points" />
  </View>
);

const StatItem = ({ value, label }: { value: number, label: string }) => (
  <TouchableOpacity style={styles.stat}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

const CoursesTab = () => (
  <View style={styles.tabContentContainer}>
    <Text>Courses Content</Text>
  </View>
);

const LinksTab = () => (
  <View style={styles.tabContentContainer}>
    <Text>Links Content</Text>
  </View>
);

const ReadlistsTab = () => (
  <View style={styles.tabContentContainer}>
    <Text>Readlists Content</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  navigationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 30, // Increased to account for status bar
    paddingBottom: 10,
    backgroundColor: 'white',
  },
  backButton: {
    padding: 8,
  },
  settingsButton: {
    padding: 8,
  },
  scrollContainer: {
    paddingBottom: 70, // Added more padding to account for bottom nav
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  username: {
    fontSize: 14,
    color: '#666',
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 50,
    marginBottom: 10,
  },
  bio: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    backgroundColor: '#fff',
    paddingVertical: 10,
  },
  stat: {
    alignItems: 'center',
    padding: 10,
  },
  statValue: {
    fontSize: 15,
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
    borderRadius: 8,
    alignSelf: 'center',
    marginVertical: 10,
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
    height: 400, // Fixed height to ensure tabs are visible
  },
  tabContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tabBar: {
    backgroundColor: '#ffffff',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileScreen;