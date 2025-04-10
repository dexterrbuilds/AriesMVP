import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from '@/contexts/UserContext';
import * as WebBrowser from 'expo-web-browser';

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

// Function to render text with clickable links
const TextWithLinks = ({ text }) => {
  // Ensure `text` is always a string
  const safeText = text || ""; // Fallback to an empty string if `text` is undefined or null

  // Split text by URLs and render accordingly
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = safeText.split(urlRegex);
  const matches = safeText.match(urlRegex) || [];
  
  return (
    <Text style={styles.postContent}>
      {parts.map((part, i) => {
        // Check if this part is a URL
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

export default function CommentsScreen({ route, navigation } : any) {
  const { post: routePost } = route.params;
  const { user, token } = useUser();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [likedComments, setLikedComments] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Only fetch comments when component mounts
  useEffect(() => {
    fetchComments();
  }, [routePost.id, token]);

  const fetchComments = async () => {
    if (!routePost?.id || !token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const commentsResponse = await fetch(`https://ariesmvp-9903a26b3095.herokuapp.com/api/comment/${routePost.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      // If the response is not OK, we need to check if it's the "no comments" message
      if (!commentsResponse.ok) {
        const errorData = await commentsResponse.json();
        // If it's the specific "no comments" message, treat it as empty comments, not an error
        if (errorData.message === "no comments for this post yet") {
          setComments([]);
          setLoading(false);
          return;
        }
        throw new Error(errorData.message || "Failed to fetch comments");
      }
      
      const commentsData = await commentsResponse.json();
      
      // Process comments data
      if (Array.isArray(commentsData)) {
        // Direct array of comments
        setComments(commentsData);
        
        // Initialize liked comments
        const initialLikedComments = commentsData
          .filter(comment => comment.is_liked)
          .map(comment => comment.id);
        setLikedComments(initialLikedComments);
      } else if (commentsData && commentsData.comments && Array.isArray(commentsData.comments)) {
        // Object with comments property
        setComments(commentsData.comments);
        
        // Initialize liked comments
        const initialLikedComments = commentsData.comments
          .filter(comment => comment.is_liked)
          .map(comment => comment.id);
        setLikedComments(initialLikedComments);
      } else {
        // If structure is unclear, set empty array
        setComments([]);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      
      // Special handling for the "no comments" error message
      if (error.message === "no comments for this post yet") {
        setComments([]);
      } else {
        setError("Couldn't load comments. Pull down to refresh.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`https://ariesmvp-9903a26b3095.herokuapp.com/api/comment/${postId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit comment");
      }
      
      // Comment posted successfully
      setNewComment("");
      // Refresh comments list
      fetchComments();
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("Failed to post comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comments</Text>
        <View style={styles.placeholderButton} />
      </View>
      
      <ScrollView style={styles.scrollContainer}>
        {/* Original Post */}
        {routePost && (
          <View style={styles.originalPost}>
            <TouchableOpacity onPress={() => navigation.navigate("UsersProfile", { userName: post.user.username })}>
              <View style={styles.postHeader}>
                <Image
                  source={{ uri: routePost.user.avatar || 'https://via.placeholder.com/100' }}
                  style={styles.avatar}
                />
                <View>
                  <Text style={styles.authorName}>{routePost.user.first_name} {routePost.user.last_name}</Text>
                  <Text style={styles.username}>@{routePost.user.username}</Text>
                  {routePost.user.role && <Text style={styles.userRole}>{routePost.user.role}</Text>}
                </View>
              </View>
            </TouchableOpacity>
            <TextWithLinks text={routePost?.body} />
            {routePost.media_link && (
              <Image
                source={{ uri: routePost.media_link }}
                style={styles.postImage}
                resizeMode="cover"
              />
            )}
          </View>
        )}
        
        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsHeader}>
            {comments.length > 0
              ? `${comments.length} Comment${comments.length !== 1 ? 's' : ''}`
              : 'No comments yet'}
          </Text>
          
          {loading ? (
            <View style={styles.loadingCommentsContainer}>
              <ActivityIndicator size="small" color="#0000ff" />
              <Text style={styles.loadingCommentsText}>Loading comments...</Text>
            </View>
          ) : (
            comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <TouchableOpacity onPress={() => navigation.navigate("UsersProfile", { userName: comment.user.username })}>
                  <View style={styles.commentHeader}>
                    <Image
                      source={{ uri: comment.user.avatar || 'https://via.placeholder.com/100' }}
                      style={styles.commentAvatar}
                    />
                    <View>
                      <Text style={styles.commentAuthor}>{comment.user.first_name} {comment.user.last_name}</Text>
                      <Text style={styles.commentUsername}>@{comment.user.username}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
                <TextWithLinks text={comment.content} />
              </View>
            ))
          )}
        </View>
      </ScrollView>
      
      <View style={styles.commentInputWrapper}>
        <View style={styles.commentInputContainer}>
          <Image
            source={{ uri: user?.avatar || 'https://via.placeholder.com/100' }}
            style={styles.inputAvatar}
          />
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
        </View>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!newComment.trim() || submitting) && styles.disabledButton
          ]}
          onPress={handleSubmitComment}
          disabled={!newComment.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="send" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingTop: Platform.OS === "ios" ? 50 : 16,
    marginTop: 10,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  placeholderButton: {
    width: 32,
  },
  scrollContainer: {
    flex: 1,
  },
  originalPost: {
    padding: 16,
    borderBottomWidth: 8,
    borderBottomColor: "#f0f0f0",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  authorName: {
    fontWeight: "bold",
    fontSize: 16,
  },
  username: {
    color: "#666",
    fontSize: 14,
  },
  userRole: {
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
    marginTop: 12,
  },
  commentsSection: {
    padding: 16,
  },
  commentsHeader: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  loadingCommentsContainer: {
    alignItems: "center",
    padding: 16,
  },
  loadingCommentsText: {
    marginTop: 8,
    color: "#666",
  },
  commentItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  commentAuthor: {
    fontWeight: "bold",
    fontSize: 14,
  },
  commentUsername: {
    color: "#666",
    fontSize: 12,
  },
  commentInputWrapper: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
  },
  commentInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  commentInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 120,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: "#3366ff",
    borderRadius: 24,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: "#a0b4ff",
  },
});