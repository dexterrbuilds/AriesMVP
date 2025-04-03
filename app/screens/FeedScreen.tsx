import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as DocumentPicker from 'expo-document-picker';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { Video, ResizeMode } from 'expo-av';
import RNFS from 'react-native-fs';
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

// Function to get file extension
const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase();
};

// Function to determine file type
const getFileType = (url) => {
  const extension = getFileExtension(url);
  
  const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'];
  
  if (videoExtensions.includes(extension)) {
    return 'video';
  } else if (documentExtensions.includes(extension)) {
    return 'document';
  } else {
    return 'other';
  }
};

// Function to download and open files
const handleFileOpen = async (fileUrl, fileType) => {
  try {
    // Request permissions first
    if (Platform.OS === 'android') {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        return;
      }
    }

    // Create a unique filename
    const filename = fileUrl.split('/').pop();
    const extension = getFileExtension(fileUrl);
    const localFile = `${FileSystem.cacheDirectory}${filename}`;

    // Show download progress indicator
    const downloadResumable = FileSystem.createDownloadResumable(
      fileUrl,
      localFile,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        // Progress can be used to show a progress bar if needed
      }
    );

    const { uri } = await downloadResumable.downloadAsync();
    
    // Open based on platform and file type
    if (Platform.OS === 'ios') {
      // iOS can use QuickLook for most file types
      Sharing.shareAsync(uri);
    } else {
      // Android needs specific handling
      const UTI = {
        pdf: 'application/pdf',
        txt: 'text/plain',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ppt: 'application/vnd.ms-powerpoint',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      };

      const mimeType = UTI[extension] || '*/*';
      
      // Use Intent Launcher to open with appropriate app
      IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: uri,
        flags: 1,
        type: mimeType
      });
    }
  } catch (error) {
    console.error("Error opening file:", error);
  }
};

// Function to open links
const handleOpenLink = async (url: string) => {
  try {
    // Check if this is a file link
    const fileType = getFileType(url);
    
    if (fileType === 'video' || fileType === 'document') {
      await handleFileOpen(url, fileType);
      return;
    }
    
    // Handle regular web links
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

// Video Player Component
const VideoPlayer = ({ source }) => {
  const [status, setStatus] = useState({});
  const [visible, setVisible] = useState(true);
  const videoRef = useRef(null);
  
  return (
    <View style={styles.videoContainer}>
      <Video
        ref={videoRef}
        source={{ uri: source }}
        style={styles.videoPlayer}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        onPlaybackStatusUpdate={status => setStatus(() => status)}
        shouldPlay={false}
        isMuted={false}
        isLooping={false}
      />
      <TouchableOpacity 
        style={styles.videoOverlay}
        onPress={() => {
          if (videoRef.current) {
            if (status.isPlaying) {
              videoRef.current.pauseAsync();
            } else {
              videoRef.current.playAsync();
            }
          }
        }}
      >
        {!status.isPlaying && (
          <View style={styles.playButtonContainer}>
            <Ionicons name="play" size={40} color="white" />
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.videoProgressContainer}>
        <View 
          style={[
            styles.videoProgress, 
            { width: `${status.positionMillis && status.durationMillis ? (status.positionMillis / status.durationMillis) * 100 : 0}%` }
          ]} 
        />
      </View>
    </View>
  );
};

// Document Preview Component
const DocumentPreview = ({ url }) => {
  const extension = getFileExtension(url);
  const filename = url.split('/').pop();
  const [downloading, setDownloading] = useState(false);
  
  const getDocumentIcon = () => {
    switch (extension) {
      case 'pdf':
        return 'document-text';
      case 'doc':
      case 'docx':
        return 'document';
      case 'txt':
        return 'create';
      case 'xls':
      case 'xlsx':
        return 'grid';
      case 'ppt':
      case 'pptx':
        return 'easel';
      default:
        return 'document-attach';
    }
  };

  const getDocumentColor = () => {
    switch (extension) {
      case 'pdf':
        return '#FF5733';
      case 'doc':
      case 'docx':
        return '#2B7AE9';
      case 'txt':
        return '#333333';
      case 'xls':
      case 'xlsx':
        return '#1F7244';
      case 'ppt':
      case 'pptx':
        return '#D24726';
      default:
        return '#666666';
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    await handleFileOpen(url, 'document');
    setDownloading(false);
  };

  return (
    <TouchableOpacity
      style={styles.documentContainer}
      onPress={handleDownload}
    >
      <View style={[styles.documentIconContainer, { backgroundColor: `${getDocumentColor()}15` }]}>
        <Ionicons name={getDocumentIcon()} size={36} color={getDocumentColor()} />
        <Text style={[styles.documentExtension, { color: getDocumentColor() }]}>.{extension}</Text>
      </View>
      <View style={styles.documentInfo}>
        <Text style={styles.documentName} numberOfLines={1}>{filename}</Text>
        <Text style={styles.documentSize}>{extension.toUpperCase()} document</Text>
      </View>
      {downloading ? (
        <ActivityIndicator size="small" color="#3366ff" />
      ) : (
        <View style={styles.documentActionButton}>
          <Ionicons name="download-outline" size={20} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );
};

// Custom link preview component to handle image errors
const SafeLinkPreview = ({ url }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Check if this is a file link
  const fileType = getFileType(url);
  
  if (fileType === 'video') {
    return <VideoPlayer source={url} />;
  }
  
  if (fileType === 'document') {
    return <DocumentPreview url={url} />;
  }

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
// Media Component to handle various types
const MediaContent = ({ mediaUrl, preventNavigation = false }) => {
  if (!mediaUrl) return null;
  
  const fileType = getFileType(mediaUrl);
  
  switch(fileType) {
    case 'video':
      return <VideoPlayer source={mediaUrl} />;
    case 'document':
      return <DocumentPreview url={mediaUrl} />;
    default:
      return (
        <TouchableOpacity 
          onPress={() => handleOpenLink(mediaUrl)}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: mediaUrl }}
            style={styles.postImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      );
  }
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

export default function FeedScreen({ route, navigation }) {
  const { user, token } = useUser();
  const [activeTab, setActiveTab] = useState("For You");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likedPosts, setLikedPosts] = useState([]);
  const isFocused = useIsFocused();

  const fetchPosts = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const response = await fetch("https://ariesmvp-9903a26b3095.herokuapp.com/api/feed", {
        headers: {
          Authorization: `Bearer ${token}`,
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
      
      // Process posts to identify URLs and file types
      const processedPosts = data.posts ? data.posts.map(post => {
        const urls = findUrls(post.body);
        
        // Process media_link to determine file type
        let mediaType = null;
        if (post.media_link) {
          mediaType = getFileType(post.media_link);
        }
        
        return {
          ...post,
          urls,
          mediaType,
          hasOnlyTextAndLink: post.body && !post.media_link && urls.length > 0
        };
      }) : [];
      
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
  }, [isFocused, token]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts(false);
  };

  const handleLike = async (postId) => {
    try {
      const response = await fetch(`https://ariesmvp-9903a26b3095.herokuapp.com/api/post/${postId}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
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

  // Navigate to PostDetails when the post container is clicked
  const navigateToPostDetails = (post) => {
    navigation.navigate("PostDetails", { post });
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

  // Sample course posts including different media types
  const coursePosts = [
    {
      id: 1001,
      user: { username: "edu_mentor", first_name: "Edu", last_name: "Mentor", role: "Mentor", avatar: "https://via.placeholder.com/60" },
      body: "New course: Blockchain Basics",
      media_link: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
      mediaType: "video",
      likes_count: 12,
      urls: ["https://edu-platform.com/courses/blockchain-101"],
      hasOnlyTextAndLink: false
    },
    {
      id: 1002,
      user: { username: "learn_hub", first_name: "Learn", last_name: "Hub", role: "Instructor", avatar: "https://via.placeholder.com/60" },
      body: "Advanced Solidity programming now available! Check it out: https://edu-platform.com/courses/solidity-advanced",
      media_link: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      mediaType: "document",
      likes_count: 8,
      urls: ["https://edu-platform.com/courses/solidity-advanced"],
      hasOnlyTextAndLink: false
    },
    {
      id: 1003,
      user: { username: "tech_teach", first_name: "Tech", last_name: "Teacher", role: "Instructor", avatar: "https://via.placeholder.com/60" },
      body: "Here's the lecture notes from today's class on JavaScript fundamentals",
      media_link: "https://www.w3.org/TR/PNG/iso_8859-1.txt",
      mediaType: "document",
      likes_count: 15,
      urls: [],
      hasOnlyTextAndLink: false
    }
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
                  <TouchableOpacity
                    key={post.id}
                    style={styles.postContainer}
                    onPress={() => navigateToPostDetails(post)}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation(); // Prevent triggering the parent onPress
                          navigation.navigate("UsersProfile", { userName: post.user.username });
                        }}
                      >
                        <View>
                          <Image
                            source={{uri: post.user.avatar || 'https://via.placeholder.com/100'}}
                            style={styles.postAvatar}
                          />
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
                    
                    {/* Post media - render based on media type */}
                    {post.media_link && (
                      <MediaContent mediaUrl={post.media_link} />
                    )}
                    
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={(e) => {
                          e.stopPropagation(); // Prevent triggering the parent onPress
                          handleLike(post.id);
                        }}
                      >
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
                        onPress={(e) => {
                          e.stopPropagation(); // Prevent triggering the parent onPress
                          navigation.navigate("Comments", {
                            postId: post.id,
                            post: post // Pass the entire post object
                          });
                        }}
                      >
                        <Ionicons name="chatbubble-outline" size={24} color="#666" />
                        <Text style={styles.actionText}>
                          {post.comments_count > 0 ? `${post.comments_count}` : ''} Comment{post.comments_count !== 1 ? 's' : ''}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={(e) => {
                          e.stopPropagation(); // Prevent triggering the parent onPress
                          if (Platform.OS === 'ios' || Platform.OS === 'android') {
                            const message = post.body;
                            const url = post.urls.length > 0 ? post.urls[0] : undefined;
                            Sharing.shareAsync({
                              title: `Shared post from ${post.user.first_name} ${post.user.last_name}`,
                              message,
                              url
                            }).catch(err => console.error('Error sharing post:', err));
                          }
                        }}
                      >
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
                  </TouchableOpacity>
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
  videoContainer: {
    width: "100%",
    height: 200,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  videoPlayer: {
    width: "100%",
    height: "100%",
  },
  // Just add these to your existing styles
videoContainer: {
  width: "100%",
  height: 220,
  backgroundColor: "#000",
  borderRadius: 8,
  overflow: "hidden",
  marginBottom: 12,
  position: "relative",
},
videoPlayer: {
  width: "100%",
  height: "100%",
},
videoOverlay: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: "rgba(0,0,0,0.2)",
  justifyContent: "center",
  alignItems: "center",
},
playButtonContainer: {
  width: 70,
  height: 70,
  borderRadius: 35,
  backgroundColor: "rgba(0,0,0,0.6)",
  justifyContent: "center",
  alignItems: "center",
},
videoProgressContainer: {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  height: 3,
  backgroundColor: "rgba(255,255,255,0.3)",
},
videoProgress: {
  height: 3,
  backgroundColor: "#3366ff",
},
documentContainer: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#f9f9f9",
  borderRadius: 12,
  padding: 12,
  marginVertical: 10,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 3,
  elevation: 2,
},
documentIconContainer: {
  width: 70,
  height: 70,
  borderRadius: 10,
  justifyContent: "center",
  alignItems: "center",
  marginRight: 12,
},
documentExtension: {
  fontSize: 12,
  fontWeight: "600",
  marginTop: 4,
},
documentInfo: {
  flex: 1,
},
documentName: {
  fontWeight: "bold",
  fontSize: 16,
  marginBottom: 6,
},
documentSize: {
  fontSize: 12,
  color: "#666",
},
documentActionButton: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: "#3366ff",
  justifyContent: "center",
  alignItems: "center",
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