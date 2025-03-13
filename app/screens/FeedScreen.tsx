import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, RefreshControl, Linking, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomNav from "@/components/BottomNav";
import { useUser } from '@/contexts/UserContext';
import { useIsFocused } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import { LinkPreview } from '@flyerhq/react-native-link-preview';

// Function to detect URLs in text
const findUrls = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

// Function to open links
const handleOpenLink = async (url) => {
  try {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      // Use WebBrowser for in-app browser experience
      await WebBrowser.openBrowserAsync(url);
    } else {
      // Fallback to standard Linking API
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error("Don't know how to open this URL:", url);
      }
    }
  } catch (error) {
    console.error("Error opening URL:", error);
  }
};

// Custom link preview component to handle image errors
const SafeLinkPreview = ({ url }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <TouchableOpacity 
      style={styles.linkPreviewContainer} 
      onPress={() => handleOpenLink(url)}
    >
      <LinkPreview 
        text={url}
        onPreviewDataFetched={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setError(true);
        }}
        renderLinkPreview={({ previewData }) => {
          if (isLoading) {
            return (
              <View style={styles.linkPreviewLoading}>
                <ActivityIndicator size="small" color="#0000ff" />
                <Text style={styles.linkPreviewLoadingText}>Loading preview...</Text>
              </View>
            );
          }
          
          if (error || !previewData) {
            return (
              <View style={styles.linkPreview}>
                <View style={styles.linkPreviewNoImage}>
                  <Ionicons name="link" size={24} color="#666" />
                </View>
                <View style={styles.linkPreviewContent}>
                  <Text style={styles.linkPreviewUrl} numberOfLines={1}>
                    {url}
                  </Text>
                </View>
              </View>
            );
          }
          
          return (
            <View style={styles.linkPreview}>
              {previewData.image && typeof previewData.image === 'string' ? (
                <Image 
                  source={{ uri: previewData.image }} 
                  style={styles.linkPreviewImage} 
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.linkPreviewNoImage}>
                  <Ionicons name="link" size={24} color="#666" />
                </View>
              )}
              <View style={styles.linkPreviewContent}>
                <Text style={styles.linkPreviewTitle} numberOfLines={2}>
                  {previewData.title || 'Visit link'}
                </Text>
                {previewData.description ? (
                  <Text style={styles.linkPreviewDescription} numberOfLines={2}>
                    {previewData.description}
                  </Text>
                ) : null}
                <Text style={styles.linkPreviewUrl} numberOfLines={1}>
                  {url}
                </Text>
              </View>
            </View>
          );
        }}
      />
    </TouchableOpacity>
  );
};

// Function to render text with clickable links
const TextWithLinks = ({ text }) => {
  // Split text by URLs and render accordingly
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  const matches = text.match(urlRegex) || [];
  
  return (
    <Text style={styles.postContent}>
      {parts.map((part, i) => {
        // Check if this part is a URL (matches a URL at position i/2)
        const isUrl = matches.includes(part);
        if (isUrl) {
          return (
            <Text 
              key={i} 
              style={styles.linkText}
              onPress={() => handleOpenLink(part)}
            >
              {part}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
};

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
        
        // Process posts to identify URLs
        const processedPosts = data.posts ? data.posts.map(post => ({
          ...post,
          urls: findUrls(post.body),
          hasOnlyTextAndLink: post.body && !post.media_link && findUrls(post.body).length > 0
        })) : [];
        
        setPosts(processedPosts);
        
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
      { 
        id: 1001, 
        user: { username: "edu_mentor", first_name: "Edu", last_name: "Mentor", role: "Mentor", avatar: "https://via.placeholder.com/60" }, 
        body: "New course: Blockchain Basics https://edu-platform.com/courses/blockchain-101", 
        media_link: "https://via.placeholder.com/300x200", 
        likes_count: 12,
        urls: ["https://edu-platform.com/courses/blockchain-101"],
        hasOnlyTextAndLink: false
      },
      { 
        id: 1002, 
        user: { username: "learn_hub", first_name: "Learn", last_name: "Hub", role: "Instructor", avatar: "https://via.placeholder.com/60" }, 
        body: "Advanced Solidity programming now available! Check it out: https://edu-platform.com/courses/solidity-advanced", 
        likes_count: 8,
        urls: ["https://edu-platform.com/courses/solidity-advanced"],
        hasOnlyTextAndLink: true
      },
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
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
                      <TouchableOpacity onPress={() => navigation.navigate("UsersProfile", { userName: post.user.username })}>
                        <View>
                          <Image source={{uri: post.user.avatar || 'https://via.placeholder.com/100'}} style={styles.postAvatar} />
                        </View>
                      </TouchableOpacity>
                      <View>
                            <Text style={styles.postAuthor}>{post.user.first_name} {post.user.last_name}</Text>
                            <Text style={styles.userName}>@{post.user.username}</Text>
                            <Text style={styles.postRole}>{post.user.role}</Text>
                      </View>
                    </View>
                    
                    {/* Post content with clickable links */}
                    <TextWithLinks text={post.body} />
                    
                    {/* Link preview for posts with links but no images */}
                    {post.hasOnlyTextAndLink && post.urls.length > 0 && (
                      <SafeLinkPreview url={post.urls[0]} />
                    )}
                    
                    {/* Post image if available - make it clickable if there's a link */}
                    {post.media_link && (
                      <TouchableOpacity onPress={() => post.urls.length > 0 ? handleOpenLink(post.urls[0]) : null}
                      >
                       <Image 
                         source={{ uri: post.media_link }} 
                         style={styles.postImage} 
                         resizeMode="cover"
                       />
                      </TouchableOpacity>
                      )}
                      
                      <View style={styles.actionButtons}>
                       <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(post.id)}>
                         <Ionicons 
                           name={isLiked ? "heart" : "heart-outline"} 
                           size={24} 
                           color={isLiked ? "#ff4757" : "#666"} 
                         />
                         <Text style={[styles.actionText, isLiked && {color: '#ff4757'}]}>
                           {post.likes_count > 0 ? `${post.likes_count}` : ''} Like{post.likes_count !== 1 ? 's' : ''}
                         </Text>
                       </TouchableOpacity>
                       
                       <TouchableOpacity 
                         style={styles.actionButton} 
                         onPress={() => navigation.navigate("Comments", { 
                           postId: post.id,
                           post: post // Pass the entire post object
                         })}
                       >
                         <Ionicons name="chatbubble-outline" size={24} color="#666" />
                         <Text style={styles.actionText}>
                           {post.comments_count > 0 ? `${post.comments_count}` : ''} Comment{post.comments_count !== 1 ? 's' : ''}
                         </Text>
                       </TouchableOpacity>
                       
                       <TouchableOpacity style={styles.actionButton} onPress={() => {
                         if (Platform.OS === 'ios' || Platform.OS === 'android') {
                           const message = post.body;
                           const url = post.urls.length > 0 ? post.urls[0] : undefined;
                           
                           Linking.share({
                             title: `Shared post from ${post.user.first_name} ${post.user.last_name}`,
                             message,
                             url
                           }).catch(err => console.error('Error sharing post:', err));
                         }
                       }}>
                         <Ionicons name="share-social-outline" size={24} color="#666" />
                         <Text style={styles.actionText}>Share</Text>
                       </TouchableOpacity>
                      </View>
                      
                      {/* Show interactions count (likes, comments) */}
                      {(post.likes_count > 0 || post.comments_count > 0) && (
                       <View style={styles.interactionSummary}>
                         {post.likes_count > 0 && (
                           <View style={styles.interactionItem}>
                             <Ionicons name="heart" size={14} color="#ff4757" />
                             <Text style={styles.interactionText}>{post.likes_count}</Text>
                           </View>
                         )}
                         {post.comments_count > 0 && (
                           <View style={styles.interactionItem}>
                             <Ionicons name="chatbubble" size={14} color="#3366ff" />
                             <Text style={styles.interactionText}>{post.comments_count}</Text>
                           </View>
                         )}
                       </View>
                      )}
                      </View>
                      );
                      })}
                      </View>
                      ) : (
                      <View style={styles.emptyContainer}>
                       <Ionicons name="document-text-outline" size={64} color="#ccc" />
                       <Text style={styles.emptyText}>No posts available</Text>
                       <Text style={styles.emptySubtext}>Follow more educators to see their content here</Text>
                       
                       <TouchableOpacity 
                         style={styles.emptyButton}
                         onPress={() => navigation.navigate("Discover")}
                       >
                         <Text style={styles.emptyButtonText}>Discover Educators</Text>
                       </TouchableOpacity>
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
                      
                      {/* Bottom Navigation */}
                      <BottomNav navigation={navigation} />
                      </View>
  );
  }
                      
  const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
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
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingTop: Platform.OS === "ios" ? 50 : 16,
    marginTop: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  screen: {
    flex: 1,
  },
  liveEducators: {
    padding: 16,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  educatorContainer: {
    alignItems: "center",
    marginRight: 16,
  },
  liveIndicator: {
    borderWidth: 2,
    borderColor: "#ff4757",
    borderRadius: 30,
    padding: 2,
    position: "relative",
  },
  educatorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  educatorName: {
    marginTop: 4,
    textAlign: "center",
    fontSize: 12,
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#3366ff",
  },
  tabText: {
    fontSize: 16,
    color: "#666",
  },
  activeTabText: {
    color: "#3366ff",
    fontWeight: "600",
  },
  banners: {
    padding: 16,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  bannerImage: {
    width: 300,
    height: 100,
    borderRadius: 8,
    marginRight: 16,
  },
  posts: {
  },
  postContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'white',
    elevation: 2,
  },
  postAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  postAuthor: {
    fontWeight: "bold",
    fontSize: 16,
  },
  userName: {
    color: "#666",
    fontSize: 14,
  },
  postRole: {
    color: "#3366ff",
    fontSize: 12,
    marginTop: 2,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  linkText: {
    color: "#3366ff",
    textDecorationLine: "underline",
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    marginLeft: 4,
    color: "#666",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    color: "#666",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: "#3366ff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  linkPreviewContainer: {
    marginVertical: 12,
  },
  linkPreview: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
  },
  linkPreviewImage: {
    width: 80,
    height: 80,
  },
  linkPreviewNoImage: {
    width: 80,
    height: 80,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  linkPreviewContent: {
    flex: 1,
    padding: 10,
    justifyContent: "space-between",
  },
  linkPreviewTitle: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
  },
  linkPreviewDescription: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  linkPreviewUrl: {
    fontSize: 10,
    color: "#999",
  },
  linkPreviewLoading: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  linkPreviewLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  interactionSummary: {
    flexDirection: "row",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1, 
    borderTopColor: "#f0f0f0",
  },
  interactionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  interactionText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  }
  });