import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomNav from "@/components/BottomNav";
import { useUser } from '@/contexts/UserContext';
import { useIsFocused } from '@react-navigation/native';

export default function FeedScreen({route, navigation }: any) {
    const { user, access_token } = useUser();
    const [activeTab, setActiveTab] = useState("For You");
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [likedPosts, setLikedPosts] = useState<number[]>([]);
    const isFocused = useIsFocused();

    const fetchPosts = async (showLoader = true) => {
      if (showLoader) setLoading(true);
      try {
        const response = await fetch("https://ariesmvp-9903a26b3095.herokuapp.com/api/feed", {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Feed error:", errorData);
          throw new Error(`API error: ${errorData.message || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log("Fetched posts successfully");
        setPosts(data.posts || []);
        
        // Initialize liked posts based on response data
        if (data.posts && Array.isArray(data.posts)) {
          const initialLikedPosts = data.posts
            .filter(post => post.is_liked)
            .map(post => post.id);
          setLikedPosts(initialLikedPosts);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    useEffect(() => {
      if (isFocused) {
        fetchPosts();
      }
    }, [isFocused, access_token]);
  
    const handleRefresh = () => {
      setRefreshing(true);
      fetchPosts(false);
    };

    const handleLike = async (postId: number) => {
      try {
        const response = await fetch(`https://ariesmvp-9903a26b3095.herokuapp.com/api/post/${postId}/like`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          // Toggle the liked status locally
          setLikedPosts(prevLikedPosts => {
            if (prevLikedPosts.includes(postId)) {
              return prevLikedPosts.filter(id => id !== postId);
            } else {
              return [...prevLikedPosts, postId];
            }
          });
          
          // Update the liked count in the posts array
          setPosts(prevPosts => {
            return prevPosts.map(post => {
              if (post.id === postId) {
                const isAlreadyLiked = likedPosts.includes(postId);
                const likesCount = isAlreadyLiked ? 
                  (post.likes_count > 0 ? post.likes_count - 1 : 0) : 
                  ((post.likes_count || 0) + 1);
                return {
                  ...post,
                  likes_count: likesCount
                };
              }
              return post;
            });
          });
        } else {
          const errorData = await response.json();
          console.error("Like error:", errorData);
        }
      } catch (error) {
        console.error("Error liking post:", error);
      }
    };
  
    const liveEducators = [
      { id: "1", name: "Dexterr", avatar: "https://via.placeholder.com/60" },
      { id: "2", name: "Pompey", avatar: "https://via.placeholder.com/60" },
      { id: "3", name: "Louis", avatar: "https://via.placeholder.com/60" },
      { id: "4", name: "John", avatar: "https://via.placeholder.com/60" },
      { id: "5", name: "Chris", avatar: "https://via.placeholder.com/60" },
      { id: "6", name: "Alex", avatar: "https://via.placeholder.com/60" },
    ];
  
    const banners = [
      { id: "1", image: "https://via.placeholder.com/300x100" },
      { id: "2", image: "https://via.placeholder.com/300x100" },
      { id: "3", image: "https://via.placeholder.com/300x100" },
    ];
  
    const coursePosts = [
      { id: 1001, user: { username: "edu_mentor", first_name: "Edu", last_name: "Mentor", role: "Mentor", avatar: "https://via.placeholder.com/60" }, body: "New course: Blockchain Basics", media_link: "https://via.placeholder.com/300x200", likes_count: 12 },
      { id: 1002, user: { username: "learn_hub", first_name: "Learn", last_name: "Hub", role: "Instructor", avatar: "https://via.placeholder.com/60" }, body: "Advanced Solidity programming now available!", likes_count: 8 },
    ];
  
    const activeContent = activeTab === "For You" ? posts : coursePosts;
  
    return (
      <View style={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
            <Ionicons name="person-circle" size={30} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>Welcome, {user?.first_name}!</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
            <Ionicons name="notifications" size={30} color="black" />
          </TouchableOpacity>
        </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.screen}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#0000ff"]}
            />
          }
        >
          {/* Live Educators */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.liveEducators}>
            {liveEducators.map((educator) => (
              <View key={educator.id} style={styles.educatorContainer}>
                <View style={styles.liveIndicator}>
                  <Image source={{ uri: educator.avatar }} style={styles.educatorAvatar} />
                </View>
                <Text style={styles.educatorName}>{educator.name}</Text>
              </View>
            ))}
          </ScrollView>
    
          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "For You" && styles.activeTab]}
              onPress={() => setActiveTab("For You")}
            >
              <Text style={[styles.tabText, activeTab === "For You" && styles.activeTabText]}>For You</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "Courses" && styles.activeTab]}
              onPress={() => setActiveTab("Courses")}
            >
              <Text style={[styles.tabText, activeTab === "Courses" && styles.activeTabText]}>Courses</Text>
            </TouchableOpacity>
          </View>
    
          {/* Banners */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.banners}>
            {banners.map((banner) => (
              <Image key={banner.id} source={{ uri: banner.image }} style={styles.bannerImage} />
            ))}
          </ScrollView>
    
          {/* Active Content */}
          {activeContent.length > 0 ? (
            <View style={styles.posts}>
              {activeContent.map((post) => {
                const isLiked = likedPosts.includes(post.id);
                return (
                  <View key={post.id} style={styles.postContainer}>
                    <TouchableOpacity onPress={() => navigation.navigate("UsersProfile", { userName: post.user.username })}>
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
                        <Image source={require('../assets/images/pfp.png')} style={styles.postAvatar} />
                        <View>
                          <Text style={styles.postAuthor}>{post.user.first_name} {post.user.last_name}</Text>
                          <Text style={styles.userName}>@{post.user.username}</Text>
                          <Text style={styles.postRole}>{post.user.role}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                    <Text style={styles.postContent}>{post.body}</Text>
                    {post.media_link && <Image source={{ uri: post.media_link }} style={styles.postImage} />}
                    <View style={styles.actionButtons}>
                      <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(post.id)}>
                        <Ionicons 
                          name={isLiked ? "heart" : "heart-outline"} 
                          size={24} 
                          color={isLiked ? "red" : "black"} 
                        />
                        <Text style={[styles.actionText, isLiked && {color: 'red'}]}>
                          {post.likes_count > 0 ? `${post.likes_count} Like${post.likes_count > 1 ? 's' : ''}` : 'Like'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton} onPress={() => console.log("Reposted post", post.id)}>
                        <Ionicons name="repeat-outline" size={24} color="black" />
                        <Text style={styles.actionText}>Repost</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton} onPress={() => console.log("Comment on post", post.id)}>
                        <Ionicons name="chatbubble-outline" size={24} color="black" />
                        <Text style={styles.actionText}>Comment</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.noContentContainer}>
              <Ionicons name="document-text-outline" size={50} color="#ccc" />
              <Text style={styles.noContentText}>No posts to display</Text>
            </View>
          )}
        </ScrollView>
      )}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("Post")}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
        <View style={styles.bottomnav}>
          <BottomNav navigation={navigation}/>
        </View>
      </View>
    );
  }

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    flex: 1,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  screen: {
    paddingBottom: 200,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  noContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  noContentText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  fab: {
    position: "absolute",
    bottom: 80,
    right: 20,
    width: 60,
    height: 60,
    backgroundColor: "black",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  bottomnav: {
    backgroundColor: "white",
    borderStyle: "solid",
    borderTopWidth: 1,
    borderTopColor: "#808080",
    height: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  liveEducators: {
    marginVertical: 5,
    paddingLeft: 10,
  },
  educatorContainer: {
    alignItems: "center",
    marginRight: 15,
    marginBottom: 10,
  },
  liveIndicator: {
    borderWidth: 2,
    borderColor: "red",
    borderRadius: 50,
    padding: 2,
  },
  educatorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  educatorName: {
    marginTop: 5,
    fontSize: 12,
    textAlign: "center",
  },  
  tabs: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 5,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "black",
  },
  tabText: {
    fontSize: 16,
    color: "#888",
  },
  activeTabText: {
    color: "black",
    fontWeight: "bold",
  },
  banners: {
    marginTop: 20,
  },
  bannerImage: {
    width: 300,
    height: 100,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  posts: {
    paddingHorizontal: 10,
    marginTop: 10,
    paddingBottom: 100,
  },
  postContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  postAuthor: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  userName: {
    fontSize: 12,
    color: "#666",
  },
  postContent: {
    fontSize: 14,
    marginBottom: 10,
    lineHeight: 20,
  },
  postRole: {
    fontSize: 12,
    color: "#888",
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginTop: 5,
    marginBottom: 10,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
  },
  actionText: {
    marginLeft: 5,
    fontSize: 14,
    color: "black",
  },
});