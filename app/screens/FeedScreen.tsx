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
  Platform,
  Modal
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Feather from 'react-native-vector-icons/Feather';
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
const handleOpenLink = async (url) => {
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

// Function to format the class time
const formatClassTime = (dateTimeString) => {
  const date = new Date(dateTimeString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Function to check if a class is live now
const isLiveNow = (scheduledAt, endedAt) => {
  const now = new Date();
  const scheduled = new Date(scheduledAt);
  return endedAt === null && now >= scheduled;
};

// ReadlistModal Component
const ReadlistModal = ({ visible, onClose, post, token, navigation }) => {
  const [readlists, setReadlists] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's readlists
  useEffect(() => {
    if (visible) {
      fetchReadlists();
    }
  }, [visible]);

  const fetchReadlists = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://ariesmvp-9903a26b3095.herokuapp.com/api/readlists/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch readlists');
      }
      
      const data = await response.json();
      setReadlists(data.readlists || []);
    } catch (error) {
      console.error("Error fetching readlists:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToReadlist = async (readlistId) => {
    try {
      const response = await fetch(`https://ariesmvp-9903a26b3095.herokuapp.com/api/readlist/${readlistId}/add-post`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ post_id: post.id }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add to readlist');
      }
      
      // Show success message or feedback
      alert('Added to readlist successfully!');
      onClose();
    } catch (error) {
      console.error("Error adding to readlist:", error);
      alert('Failed to add to readlist. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          
          <Text style={styles.modalTitle}>Add to Readlist</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3366ff" />
              <Text style={styles.loadingText}>Loading readlists...</Text>
            </View>
          ) : readlists.length > 0 ? (
            <ScrollView style={styles.readlistsContainer}>
              {readlists.map((readlist) => (
                <TouchableOpacity
                  key={readlist.id}
                  style={styles.readlistItem}
                  onPress={() => addToReadlist(readlist.id)}
                >
                  <Ionicons name="bookmark" size={24} color="#3366ff" />
                  <View style={styles.readlistInfo}>
                    <Text style={styles.readlistName}>{readlist.name}</Text>
                    <Text style={styles.readlistCount}>
                      {readlist.posts_count || 0} posts
                    </Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color="#3366ff" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyReadlist}>
              <Ionicons name="bookmark-outline" size={64} color="#ccc" />
              <Text style={styles.emptyReadlistText}>No readlists yet</Text>
            </View>
          )}
          
          <TouchableOpacity
            style={styles.createReadlistButton}
            onPress={() => {
              onClose();
              navigation.navigate("CreateReadlist");
            }}
          >
            <Ionicons name="add" size={24} color="white" />
            <Text style={styles.createReadlistText}>Create New Readlist</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default function FeedScreen({ route, navigation }) {
  const { user, token } = useUser();
  const [activeTab, setActiveTab] = useState("For You");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [liveClasses, setLiveClasses] = useState([]);
  const [loadingLiveClasses, setLoadingLiveClasses] = useState(true);
  const isFocused = useIsFocused();
  const [readlistModalVisible, setReadlistModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

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
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchLiveClasses = async () => {
    setLoadingLiveClasses(true);
    try {
      const response = await fetch("https://ariesmvp-9903a26b3095.herokuapp.com/api/live-classes", {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Live classes error:", errorData);
        throw new Error(`API error: ${errorData.message || 'Unknown error'}`);
      }
      
      const data = await response.json();
      console.log("Fetched live classes successfully");
      
      // Set live classes from the response
      if (data.live_classes && data.live_classes.data) {
        setLiveClasses(data.live_classes.data);
      }
    } catch (error) {
      console.error("Error fetching live classes:", error);
    } finally {
      setLoadingLiveClasses(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchPosts();
      fetchLiveClasses();
    }
  }, [isFocused, token]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts(false);
    fetchLiveClasses();
  };

  const handleAddToReadlist = (post) => {
    setSelectedPost(post);
    setReadlistModalVisible(true);
  };

  const handleAddToLibrary = async (postId) => {
    try {
      const response = await fetch(`https://ariesmvp-9903a26b3095.herokuapp.com/api/library/add`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ post_id: postId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add to library');
      }
      
      // Show success message
      alert('Added to library successfully!');
    } catch (error) {
      console.error("Error adding to library:", error);
      alert('Failed to add to library. Please try again.');
    }
  };

  // Navigate to PostDetails when the post container is clicked
  const navigateToPostDetails = (post) => {
    navigation.navigate("PostDetails", { post });
  };

  // Navigate to Live Class
  const navigateToLiveClass = (liveClass) => {
    navigation.navigate("LiveClass", { liveClass });
  };

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
          {/* Live Classes Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Live Classes</Text>
            <TouchableOpacity onPress={() => navigation.navigate("AllLiveClasses")}>
              <Text style={styles.sectionLink}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {loadingLiveClasses ? (
            <View style={styles.liveEducatorsLoading}>
              <ActivityIndicator size="small" color="#0000ff" />
              <Text style={styles.loadingText}>Loading live classes...</Text>
            </View>
          ) : liveClasses.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.liveEducators}>
              {liveClasses.map((liveClass) => (
                <TouchableOpacity 
                  key={liveClass.id} 
                  style={styles.educatorContainer}
                  onPress={() => navigateToLiveClass(liveClass)}
                >
                  <View style={[
                    styles.liveIndicator, 
                    isLiveNow(liveClass.scheduled_at, liveClass.ended_at) 
                      ? styles.liveNowIndicator 
                      : styles.scheduledIndicator
                  ]}>
                    <Image 
                      source={{ 
                        uri: liveClass.teacher.avatar || 'https://via.placeholder.com/60'
                      }} 
                      style={styles.educatorAvatar} 
                    />
                    {isLiveNow(liveClass.scheduled_at, liveClass.ended_at) && (
                      <View style={styles.liveNowBadge}>
                        <Text style={styles.liveNowText}>LIVE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.educatorName} numberOfLines={1}>
                    {liveClass.teacher.first_name} {liveClass.teacher.last_name}
                  </Text>
                  <Text style={styles.classTitle} numberOfLines={1}>{liveClass.title}</Text>
                  <Text style={styles.classTime}>
                    {isLiveNow(liveClass.scheduled_at, liveClass.ended_at) 
                      ? 'Live Now' 
                      : formatClassTime(liveClass.scheduled_at)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.noLiveClasses}>
              <Text style={styles.noLiveClassesText}>No live classes at the moment</Text>
            </View>
          )}
          
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
              {activeContent.map((post) => (
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
                          style={styles.userAvatar}
                          />
                        </View>
                      </TouchableOpacity>
                      <View style={styles.postUserInfo}>
                        <Text style={styles.userName}>{post.user.first_name} {post.user.last_name}</Text>
                        <Text style={styles.userRole}>{post.user.role || 'User'}</Text>
                      </View>
                    </View>
  
                    <View style={styles.contentContainer}>
                      <View style={styles.textContentContainer}>
                        <TextWithLinks text={post.body} />
                      </View>
  
                      {/* Handle media link if present */}
                      {post.media_link && (
                        <MediaContent 
                          mediaUrl={post.media_link} 
                          preventNavigation={true}
                        />
                      )}
  
                      {/* Handle URLs embedded in the post if no media is present */}
                      {post.hasOnlyTextAndLink && post.urls.length > 0 && (
                        <SafeLinkPreview url={post.urls[0]} />
                      )}
                    </View>
  
                    {/* Post Actions */}
                    <View style={styles.postActions}>
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
                          e.stopPropagation();
                          handleAddToReadlist(post);
                        }}
                      >
                        <Ionicons name="bookmark-outline" size={24} color="black" />
                        <Text style={styles.actionText}>Select</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleAddToLibrary(post.id);
                        }}
                      >
                        <Feather name="paperclip" size={24} color="#000" />
                        <Text style={styles.actionText}>Add to Readlist</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.noPostsContainer}>
                <Ionicons name="newspaper-outline" size={64} color="#ccc" />
                <Text style={styles.noPostsText}>No posts available</Text>
              </View>
            )}
          </ScrollView>
        )}
  
        {/* Bottom Navigation */}
        <BottomNav activeScreen="Feed" navigation={navigation} />
  
        {/* Readlist Modal */}
        <ReadlistModal
          visible={readlistModalVisible}
          onClose={() => setReadlistModalVisible(false)}
          post={selectedPost}
          token={token}
          navigation={navigation}
        />
  
        {/* Floating Add Post Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("CreatePost")}
        >
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>
      </View>
    );
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#f8f8f8",
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 15,
      paddingTop: 50,
      paddingBottom: 10,
      backgroundColor: "white",
      borderBottomWidth: 1,
      borderBottomColor: "#f0f0f0",
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
    },
    screen: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: "#666",
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 15,
      paddingBottom: 10,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
    },
    sectionLink: {
      fontSize: 14,
      color: "#3366ff",
    },
    liveEducators: {
      paddingLeft: 15,
      marginBottom: 15,
    },
    liveEducatorsLoading: {
      height: 120,
      justifyContent: "center",
      alignItems: "center",
    },
    educatorContainer: {
      alignItems: "center",
      marginRight: 20,
      width: 90,
    },
    liveIndicator: {
      padding: 3,
      borderRadius: 50,
      marginBottom: 5,
    },
    liveNowIndicator: {
      borderWidth: 2,
      borderColor: "#FF3B30",
    },
    scheduledIndicator: {
      borderWidth: 2,
      borderColor: "#8E8E93",
    },
    educatorAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
    },
    liveNowBadge: {
      position: "absolute",
      bottom: 0,
      right: 0,
      backgroundColor: "#FF3B30",
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    liveNowText: {
      color: "white",
      fontSize: 10,
      fontWeight: "700",
    },
    educatorName: {
      fontSize: 12,
      fontWeight: "600",
      textAlign: "center",
      marginTop: 5,
    },
    classTitle: {
      fontSize: 10,
      color: "#666",
      textAlign: "center",
      marginTop: 2,
    },
    classTime: {
      fontSize: 10,
      color: "#ff3b30",
      fontWeight: "600",
      marginTop: 2,
    },
    noLiveClasses: {
      height: 80,
      justifyContent: "center",
      alignItems: "center",
    },
    noLiveClassesText: {
      color: "#999",
      fontSize: 14,
    },
    tabs: {
      flexDirection: "row",
      marginBottom: 10,
      backgroundColor: "white",
      padding: 15,
    },
    tab: {
      marginRight: 20,
      paddingBottom: 5,
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
      height: 100,
      backgroundColor: "white",
      paddingLeft: 15,
      marginBottom: 15,
    },
    bannerImage: {
      width: 300,
      height: 100,
      marginRight: 15,
      borderRadius: 10,
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
    userAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 10,
    },
    postUserInfo: {
      flex: 1,
    },
    userName: {
      fontWeight: "600",
      fontSize: 16,
    },
    userRole: {
      color: "#666",
      fontSize: 12,
    },
    contentContainer: {
      marginBottom: 15,
    },
    textContentContainer: {
      marginBottom: 10,
    },
    postContent: {
      fontSize: 16,
      lineHeight: 22,
    },
    linkText: {
      color: "#3366ff",
      textDecorationLine: "underline",
    },
    postImage: {
      width: "100%",
      height: 200,
      borderRadius: 10,
      marginBottom: 10,
    },
    videoContainer: {
      width: "100%",
      height: 200,
      borderRadius: 10,
      marginBottom: 10,
      backgroundColor: "#000",
      overflow: "hidden",
      position: "relative",
    },
    videoPlayer: {
      width: "100%",
      height: "100%",
    },
    videoOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "center",
      alignItems: "center",
    },
    playButtonContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    videoProgressContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: "rgba(255,255,255,0.3)",
    },
    videoProgress: {
      height: "100%",
      backgroundColor: "#ff3b30",
    },
    documentContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#f9f9f9",
      borderRadius: 10,
      padding: 15,
      marginBottom: 10,
    },
    documentIconContainer: {
      width: 60,
      height: 60,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 15,
    },
    documentExtension: {
      fontSize: 10,
      fontWeight: "bold",
      marginTop: 5,
    },
    documentInfo: {
      flex: 1,
    },
    documentName: {
      fontSize: 14,
      fontWeight: "500",
    },
    documentSize: {
      fontSize: 12,
      color: "#666",
      marginTop: 4,
    },
    documentActionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "#3366ff",
      justifyContent: "center",
      alignItems: "center",
    },
    linkPreviewContainer: {
      marginBottom: 10,
    },
    linkPreview: {
      flexDirection: "row",
      backgroundColor: "#f9f9f9",
      borderRadius: 10,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "#eee",
    },
    linkPreviewImage: {
      width: 100,
      height: 100,
    },
    linkPreviewNoImage: {
      width: 100,
      height: 100,
      backgroundColor: "#eee",
      justifyContent: "center",
      alignItems: "center",
    },
    linkPreviewContent: {
      flex: 1,
      padding: 10,
    },
    linkPreviewTitle: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 5,
    },
    linkPreviewDescription: {
      fontSize: 12,
      color: "#666",
      marginBottom: 5,
    },
    linkPreviewUrl: {
      fontSize: 10,
      color: "#999",
    },
    linkPreviewLoading: {
      height: 100,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#f9f9f9",
      borderRadius: 10,
    },
    linkPreviewLoadingText: {
      marginTop: 10,
      fontSize: 14,
      color: "#666",
    },
    postActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderTopColor: "#f0f0f0",
      paddingTop: 15,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
    },
    actionText: {
      marginLeft: 5,
      fontSize: 14,
      color: "#666",
    },
    noPostsContainer: {
      padding: 30,
      alignItems: "center",
      justifyContent: "center",
    },
    noPostsText: {
      marginTop: 10,
      fontSize: 16,
      color: "#999",
    },
    addButton: {
      position: "absolute",
      right: 20,
      bottom: 80,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: "#3366ff",
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: "white",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: "70%",
    },
    modalHandle: {
      width: 40,
      height: 5,
      backgroundColor: "#e0e0e0",
      borderRadius: 3,
      alignSelf: "center",
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 20,
    },
    readlistsContainer: {
      maxHeight: 300,
    },
    readlistItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: "#f0f0f0",
    },
    readlistInfo: {
      flex: 1,
      marginLeft: 15,
    },
    readlistName: {
      fontSize: 16,
      fontWeight: "500",
    },
    readlistCount: {
      fontSize: 12,
      color: "#666",
      marginTop: 2,
    },
    emptyReadlist: {
      alignItems: "center",
      justifyContent: "center",
      padding: 30,
    },
    emptyReadlistText: {
      marginTop: 10,
      fontSize: 16,
      color: "#999",
    },
    createReadlistButton: {
      flexDirection: "row",
      backgroundColor: "#3366ff",
      borderRadius: 10,
      padding: 15,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 20,
    },
    createReadlistText: {
      color: "white",
      fontWeight: "600",
      fontSize: 16,
      marginLeft: 10,
    },
  });