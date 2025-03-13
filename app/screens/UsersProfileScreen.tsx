import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, Platform, Dimensions, FlatList } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '@/components/BottomNav';
import { useUser } from '@/contexts/UserContext';
import axios from 'axios';

const Tab = createMaterialTopTabNavigator();
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Define a consistent header height
const HEADER_HEIGHT = 270;
const STICKY_HEADER_HEIGHT = 60;
const TAB_BAR_HEIGHT = 48;

const UsersProfile = ({ navigation, route }: any) => {
  const { userName } = route.params;
  const { user, access_token } = useUser();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await axios.get(`https://ariesmvp-9903a26b3095.herokuapp.com/api/profile/${userName}`, {
          headers: {
            Authorization: `Bearer ${access_token}`
          }
        });
        setProfileData(response.data);
        // Check if user is following this profile
        if (response.data?.isFollowing) {
          setIsFollowing(true);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userName, access_token]);

  useEffect(() => {
    if (profileData) {
      console.log('Profile data posts:', profileData.posts);
    }
  }, [profileData]);

  const toggleFollow = async () => {
    try {
      const userId = profileData?.posts?.[0]?.user_id || profileData?.id;
      console.log('User ID:', userId);
    
      if (!userId) {
        console.error('User ID not found');
        return;
      }
      
      const endpoint = isFollowing 
        ? `https://ariesmvp-9903a26b3095.herokuapp.com/api/unfollow/${userId}`
        : `https://ariesmvp-9903a26b3095.herokuapp.com/api/follow/${userId}`;
      
      await axios.post(endpoint, {}, {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      });
      
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Animation value for header opacity
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT - STICKY_HEADER_HEIGHT],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Animation value for sticky header
  const stickyHeaderOpacity = scrollY.interpolate({
    inputRange: [HEADER_HEIGHT - STICKY_HEADER_HEIGHT - 20, HEADER_HEIGHT - STICKY_HEADER_HEIGHT],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Animation for tab bar position
  const tabBarTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT - TAB_BAR_HEIGHT],
    outputRange: [0, -(HEADER_HEIGHT - TAB_BAR_HEIGHT)],
    extrapolate: 'clamp',
  });

  // Create the tab content components
  const renderTabs = () => {
    const PostsTab = () => {
      if (!profileData || !profileData.posts || profileData.posts.length === 0) {
        return (
          <View style={styles.noContentContainer}>
            <Text>No posts available</Text>
          </View>
        );
      }

      const renderPostItem = ({ item }: { item: any }) => {
        const postDate = new Date(item.created_at);
        const formattedDate = postDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });

        return (
          <View style={styles.postItem}>
            <View style={styles.postHeader}>
              <Image
                source={{ uri: profileData.avatar || 'https://via.placeholder.com/40' }}
                style={styles.postAvatar}
              />
              <View style={styles.postHeaderText}>
                <Text style={styles.postUsername}>{profileData.username}</Text>
                <Text style={styles.postDate}>{formattedDate}</Text>
              </View>
            </View>
            
            <Text style={styles.postBody}>{item.body}</Text>
            
            {item.media_type === 'image' && item.media_link && (
              <Image
                source={{ uri: item.media_link }}
                style={styles.postImage}
                resizeMode="cover"
              />
            )}
            
            <View style={styles.postActions}>
              <TouchableOpacity style={styles.postAction}>
                <Ionicons name="heart-outline" size={22} color="#657786" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.postAction}>
                <Ionicons name="chatbubble-outline" size={22} color="#657786" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.postAction}>
                <Ionicons name="share-outline" size={22} color="#657786" />
              </TouchableOpacity>
            </View>
          </View>
        );
      };

      return (
        <View style={styles.tabContent}>
          <FlatList
            data={profileData.posts}
            keyExtractor={(item, index) => `post-${item.id || index}`}
            renderItem={renderPostItem}
            contentContainerStyle={styles.postsListContent}
            showsVerticalScrollIndicator={true}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
        </View>
      );
    };

    const CoursesTab = () => (
      <View style={styles.tabContent}>
        <FlatList
          data={[{ id: '1', title: 'Course 1' }, { id: '2', title: 'Course 2' }]}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.tabItemContainer}>
              <Text>{item.title}</Text>
            </View>
          )}
          contentContainerStyle={styles.genericListContent}
        />
      </View>
    );
    
    const ReadlistsTab = () => (
      <View style={styles.tabContent}>
        <FlatList
          data={[{ id: '1', title: 'Readlist 1' }, { id: '2', title: 'Readlist 2' }]}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.tabItemContainer}>
              <Text>{item.title}</Text>
            </View>
          )}
          contentContainerStyle={styles.genericListContent}
        />
      </View>
    );

    return (
      <Tab.Navigator
        style={styles.tabNavigator}
        screenOptions={{
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarStyle: styles.tabBar,
          tabBarIndicatorStyle: styles.tabBarIndicator,
          lazy: false, // Making sure all tabs are rendered
        }}
      >
        <Tab.Screen name="Posts" component={PostsTab} />
        <Tab.Screen name="Courses" component={CoursesTab} />
        <Tab.Screen name="Readlists" component={ReadlistsTab} />
      </Tab.Navigator>
    );
  };

  return (
    <View style={styles.container}>
      {/* Sticky header - shows when scrolled */}
      <Animated.View
        style={[
          styles.stickyHeader,
          { 
            opacity: stickyHeaderOpacity,
            zIndex: 1000
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.stickyHeaderText}>{profileData?.username}</Text>
      </Animated.View>
      
      {/* Main profile header */}
      <Animated.View 
        style={[
          styles.profileHeader,
          { 
            opacity: headerOpacity,
            transform: [{ 
              translateY: scrollY.interpolate({
                inputRange: [0, HEADER_HEIGHT],
                outputRange: [0, -HEADER_HEIGHT],
                extrapolate: 'clamp',
              }) 
            }],
            zIndex: 10
          }
        ]}
      >
        {/* Profile content */}
        <View style={styles.profileTopRow}>
          <Image
            source={{ uri: profileData?.avatar || 'https://via.placeholder.com/100' }}
            style={styles.profilePicture}
          />
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.messageButton}
              onPress={() => navigation.navigate('Conversation', { userName: profileData?.username })}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.followButton,
                isFollowing ? styles.followingButton : {}
              ]}
              onPress={toggleFollow}
            >
              <Text style={[
                styles.followButtonText,
                isFollowing ? styles.followingButtonText : {}
              ]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.name}>{profileData?.full_name || profileData?.username}</Text>
        <Text style={styles.username}>@{profileData?.username}</Text>
        <Text style={styles.bio}>{profileData?.bio || 'Developer | Educator | Learner'}</Text>
        <Text style={styles.role}>{profileData?.role || 'Content Creator'}</Text>

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profileData?.following || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profileData?.followers || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profileData?.likes?.length || 0}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
        </View>
      </Animated.View>

      {/* Main content area - tabs and their content */}
      <Animated.View 
        style={[
          styles.mainContentContainer,
          {
            transform: [{ translateY: tabBarTranslateY }],
            paddingTop: HEADER_HEIGHT,
          }
        ]}
      >
        {renderTabs()}
      </Animated.View>

      {/* Transparent scroll view to drive animations */}
      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        style={styles.scrollViewDriver}
      >
        {/* Empty space to allow scrolling */}
        <View style={{ height: SCREEN_HEIGHT * 2 }} />
      </Animated.ScrollView>

      {/* Bottom navigation */}
      <View style={styles.bottomnav}>
        <BottomNav navigation={navigation} user={user} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollViewDriver: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
    opacity: 0,
  },
  mainContentContainer: {
    flex: 1,
    backgroundColor: 'white',
    zIndex: 5,
  },
  backButton: {
    position: 'absolute',
    left: 15,
    top: Platform.OS === 'ios' ? 40 : 15,
    zIndex: 1001,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: STICKY_HEADER_HEIGHT,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingTop: Platform.OS === 'ios' ? 30 : 5,
  },
  stickyHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileHeader: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 15,
    backgroundColor: 'white',
    height: HEADER_HEIGHT,
    position: 'absolute',
    width: '100%',
  },
  profileTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  profilePicture: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: 'white',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageButton: {
    backgroundColor: 'black',
    padding: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  followButton: {
    backgroundColor: 'black',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  followingButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  followButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  followingButtonText: {
    color: 'black',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 5,
  },
  username: {
    fontSize: 15,
    color: '#657786',
    marginBottom: 10,
  },
  bio: {
    fontSize: 15,
    marginBottom: 5,
  },
  role: {
    fontSize: 15,
    color: '#1DA1F2',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 5,
  },
  stat: {
    marginRight: 20,
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  statLabel: {
    color: '#657786',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabNavigator: {
    flex: 1,
  },
  tabBarLabel: {
    fontWeight: 'bold',
    textTransform: 'none',
    fontSize: 14,
  },
  tabBar: {
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'white',
  },
  tabBarIndicator: {
    backgroundColor: 'black',
    height: 3,
  },
  tabContent: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  noContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  postItem: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 8,
    borderRadius: 8,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  postHeaderText: {
    flex: 1,
  },
  postUsername: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  postDate: {
    color: '#657786',
    fontSize: 13,
  },
  postBody: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    maxWidth: 150,
  },
  postAction: {
    paddingHorizontal: 10,
  },
  postsListContent: {
    padding: 8,
  },
  tabItemContainer: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 8,
    borderRadius: 8,
  },
  genericListContent: {
    padding: 8,
  },
  bottomnav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    zIndex: 1000,
  },
});

export default UsersProfile;