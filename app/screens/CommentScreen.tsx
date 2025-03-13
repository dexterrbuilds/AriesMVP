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
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from '@/contexts/UserContext';

export default function CommentsScreen({ route, navigation }) {
  const { postId } = route.params;
  const { user, access_token } = useUser();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch post and comments data
  useEffect(() => {
    fetchPostAndComments();
  }, [postId, access_token]);

  const fetchPostAndComments = async () => {
    setLoading(true);
    try {
      // Fetch post details
      const postResponse = await fetch(`https://ariesmvp-9903a26b3095.herokuapp.com/api/post/${postId}`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!postResponse.ok) {
        throw new Error("Failed to fetch post");
      }
      
      const postData = await postResponse.json();
      setPost(postData.post);
      
      // Fetch comments
      const commentsResponse = await fetch(`https://ariesmvp-9903a26b3095.herokuapp.com/api/post/${postId}/comments`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!commentsResponse.ok) {
        throw new Error("Failed to fetch comments");
      }
      
      const commentsData = await commentsResponse.json();
      setComments(commentsData.comments || []);
    } catch (error) {
      console.error("Error fetching post and comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`https://ariesmvp-9903a26b3095.herokuapp.com/api/post/${postId}/comment`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body: newComment }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit comment");
      }
      
      // Comment posted successfully
      setNewComment("");
      
      // Return to feed screen
      navigation.goBack();
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("Failed to post comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Comment</Text>
        <View style={styles.placeholderButton} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Original Post */}
        {post && (
          <View style={styles.originalPost}>
            <TouchableOpacity onPress={() => navigation.navigate("UsersProfile", { userName: post.user.username })}>
              <View style={styles.postHeader}>
                <Image 
                  source={{ uri: post.user.avatar || 'https://via.placeholder.com/100' }} 
                  style={styles.avatar} 
                />
                <View>
                  <Text style={styles.authorName}>{post.user.first_name} {post.user.last_name}</Text>
                  <Text style={styles.username}>@{post.user.username}</Text>
                </View>
              </View>
            </TouchableOpacity>
            
            <TextWithLinks text={post.body} />
            
            {post.media_link && (
              <Image 
                source={{ uri: post.media_link }} 
                style={styles.postImage} 
                resizeMode="cover"
              />
            )}
          </View>
        )}
        
        <View style={styles.commentInputContainer}>
          <Image 
            source={{ uri: user?.avatar || 'https://via.placeholder.com/100' }} 
            style={styles.commentAvatar} 
          />
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
            autoFocus
          />
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
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
            <Text style={styles.submitButtonText}>Comment</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  originalPost: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
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
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginTop: 12,
  },
  commentInputContainer: {
    flexDirection: "row",
    padding: 16,
    alignItems: "flex-start",
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentInput: {
    flex: 1,
    minHeight: 80,
    maxHeight: 120,
    fontSize: 16,
    textAlignVertical: "top",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  submitButton: {
    backgroundColor: "#3366ff",
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#a0b4ff",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});