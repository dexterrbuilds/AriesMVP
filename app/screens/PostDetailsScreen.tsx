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
  Linking,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from '@/contexts/UserContext';

// Function to detect URLs in text
const findUrls = (text) => {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

// Component for displaying text with clickable links
const TextWithLinks = ({ text }) => {
  if (!text) return null;
  
  // Find URLs in the text
  const urls = findUrls(text);
  
  // If no URLs, return plain text
  if (urls.length === 0) {
    return <Text style={styles.postText}>{text}</Text>;
  }
  
  // Split text by URLs
  let lastIndex = 0;
  const textParts = [];
  
  urls.forEach((url, index) => {
    const urlIndex = text.indexOf(url, lastIndex);
    
    // Add text before URL
    if (urlIndex > lastIndex) {
      textParts.push({
        type: 'text',
        content: text.substring(lastIndex, urlIndex),
        key: `text_${index}`
      });
    }
    
    // Add URL
    textParts.push({
      type: 'url',
      content: url,
      key: `url_${index}`
    });
    
    lastIndex = urlIndex + url.length;
  });
  
  // Add remaining text after last URL
  if (lastIndex < text.length) {
    textParts.push({
      type: 'text',
      content: text.substring(lastIndex),
      key: `text_last`
    });
  }
  
  // Render text parts
  return (
    <Text style={styles.postText}>
      {textParts.map(part => {
        if (part.type === 'url') {
          return (
            <Text
              key={part.key}
              style={styles.urlText}
              onPress={() => Linking.openURL(part.content)}
            >
              {part.content}
            </Text>
          );
        }
        return <Text key={part.key}>{part.content}</Text>;
      })}
    </Text>
  );
};

// Component for link preview
const SafeLinkPreview = ({ url }) => {
  return (
    <TouchableOpacity 
      style={styles.linkPreviewContainer}
      onPress={() => Linking.openURL(url)}
    >
      <View style={styles.linkPreviewContent}>
        <Text style={styles.linkPreviewUrl} numberOfLines={1}>
          {url}
        </Text>
        <Text style={styles.linkPreviewText}>
          Tap to open link
        </Text>
      </View>
      <Ionicons name="open-outline" size={20} color="#666" />
    </TouchableOpacity>
  );
};

export default function PostDetailsScreen({ route, navigation }) {
  const { post: routePost } = route.params;
  const { user, token } = useUser();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [likedPosts, setLikedPosts] = useState([]);
  const [likedComments, setLikedComments] = useState([]);
  const [error, setError] = useState(null);

  // Process post data and fetch comments when component mounts
  useEffect(() => {
    if (routePost) {
      // Process post to identify URLs
      const processedPost = {
        ...routePost,
        urls: findUrls(routePost.body || ""),
        hasOnlyTextAndLink: routePost.body && !routePost.media_link && findUrls(routePost.body || "").length > 0
      };
      
      setPost(processedPost);
      
      // Initialize liked status
      if (processedPost.is_liked) {
        setLikedPosts([processedPost.id]);
      }
      
      // Fetch comments for this post
      fetchComments();
    }
  }, [routePost, token]);

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
    if (!newComment.trim() || !post?.id) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`https://ariesmvp-9903a26b3095.herokuapp.com/api/comment/${post.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit comment");
      }
      
      // Get the new comment data
      const commentData = await response.json();
      
      // Add the new comment to the comments list
      if (commentData && commentData.comment) {
        setComments([commentData.comment, ...comments]);
      } else if (commentData) {
        // If the API returns the comment directly
        setComments([commentData, ...comments]);
      }
      
      // Reset comment input
      setNewComment("");
    } catch (error) {
      console.error("Error posting comment:", error);
      Alert.alert("Error", "Failed to post comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikePost = async () => {
    if (!post) return;
    
    try {
      const response = await fetch(`https://ariesmvp-9903a26b3095.herokuapp.com/api/post/${post.id}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Toggle the liked status locally
        setLikedPosts(prevLikedPosts => {
          if (prevLikedPosts.includes(post.id)) {
            return prevLikedPosts.filter(id => id !== post.id);
          } else {
            return [...prevLikedPosts, post.id];
          }
        });
        
        // Update the post like count
        setPost(prevPost => {
          const isAlreadyLiked = likedPosts.includes(prevPost.id);
          const likesCount = isAlreadyLiked ? 
            (prevPost.likes_count > 0 ? prevPost.likes_count - 1 : 0) : 
            ((prevPost.likes_count || 0) + 1);
          
          return {
            ...prevPost,
            likes_count: likesCount
          };
        });
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const response = await fetch(`https://ariesmvp-9903a26b3095.herokuapp.com/api/comment/${commentId}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Toggle the liked status locally
        setLikedComments(prevLikedComments => {
          if (prevLikedComments.includes(commentId)) {
            return prevLikedComments.filter(id => id !== commentId);
          } else {
            return [...prevLikedComments, commentId];
          }
        });
        
        // Update the comment like count
        setComments(prevComments => {
          return prevComments.map(comment => {
            if (comment.id === commentId) {
              const isAlreadyLiked = likedComments.includes(commentId);
              const likesCount = isAlreadyLiked ? 
                (comment.likes_count > 0 ? comment.likes_count - 1 : 0) : 
                ((comment.likes_count || 0) + 1);
              
              return {
                ...comment,
                likes_count: likesCount
              };
            }
            return comment;
          });
        });
      }
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  const handleRefresh = () => {
    fetchComments();
  };

  if (loading && comments.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3366ff" />
        <Text style={styles.loadingText}>Loading comments...</Text>
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
        <Text style={styles.headerTitle}>Post</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color="#3366ff" />
        </TouchableOpacity>
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
                  <Text style={styles.postRole}>{post.user.role}</Text>
                </View>
              </View>
            </TouchableOpacity>
            
            <TextWithLinks text={post.body} />
            
            {/* Link preview for posts with links but no images */}
            {post.hasOnlyTextAndLink && post.urls.length > 0 && (
              <SafeLinkPreview url={post.urls[0]} />
            )}
            
            {post.media_link && (
              <Image 
                source={{ uri: post.media_link }} 
                style={styles.postImage} 
                resizeMode="cover"
                onError={(e) => console.log("Image loading error:", e.nativeEvent.error)}
              />
            )}
            
            {/* Post interaction counts */}
            {(post.likes_count > 0 || post.comments_count > 0) && (
              <View style={styles.interactionSummary}>
                {post.comments_count > 0 && (
                  <Text style={styles.interactionText}>
                    <Text style={styles.interactionNumbers}>{post.comments_count}</Text> Comments
                  </Text>
                )}
                {post.likes_count > 0 && (
                  <Text style={styles.interactionText}>
                    <Text style={styles.interactionNumbers}>{post.likes_count}</Text> Likes
                  </Text>
                )}
              </View>
            )}
            
            {/* Post action buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate("Comments", { postId: post.id })}
              >
                <Ionicons name="chatbubble-outline" size={24} color="#666" />
                <Text style={styles.actionText}>Comment</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleLikePost}
              >
                <Ionicons 
                  name={likedPosts.includes(post.id) ? "heart" : "heart-outline"} 
                  size={24} 
                  color={likedPosts.includes(post.id) ? "#ff4757" : "#666"} 
                />
                <Text style={[
                  styles.actionText, 
                  likedPosts.includes(post.id) && { color: '#ff4757' }
                ]}>
                  Like
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  if (Platform.OS === 'ios' || Platform.OS === 'android') {
                    const message = post.body || "";
                    const url = post.urls.length > 0 ? post.urls[0] : undefined;
                    
                    Linking.share({
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
          </View>
        )}
        
        {/* Comment Input */}
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
          />
          <TouchableOpacity 
            style={[
              styles.addCommentButton, 
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
        
        {/* Comments List */}
        <View style={styles.commentsSection}>
        <Text style={styles.commentsSectionTitle}>
          Comments {comments.length > 0 ? `(${comments.length})` : ''}
        </Text>
        
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={40} color="#ff4757" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={handleRefresh}
            >
              <Text style={styles.refreshButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : comments.length === 0 ? (
          <View style={styles.noCommentsContainer}>
            <Ionicons name="chatbubble-outline" size={40} color="#ccc" />
            <Text style={styles.noCommentsText}>No comments yet</Text>
            <Text style={styles.noCommentsSubtext}>Be the first to comment on this post</Text>
          </View>
        ) : (
          comments.map(comment => {
            if (!comment || !comment.id || !comment.user) {
              console.log("Invalid comment:", comment);
              return null;
            }
            
            const isLiked = likedComments.includes(comment.id);
              
              return (
                <View key={comment.id} style={styles.commentContainer}>
                  <TouchableOpacity onPress={() => navigation.navigate("UsersProfile", { userName: comment.user.username })}>
                    <View style={styles.commentHeader}>
                      <Image 
                        source={{ uri: comment.user?.avatar || 'https://via.placeholder.com/100' }} 
                        style={styles.commentUserAvatar} 
                      />
                      <View>
                        <Text style={styles.commentUserName}>
                          {comment.user.first_name} {comment.user.last_name}
                        </Text>
                        <Text style={styles.commentUsername}>@{comment.user.username}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  
                  <TextWithLinks text={comment.content} />
                  
                  <View style={styles.commentActions}>
                    <TouchableOpacity 
                      style={styles.commentAction}
                      onPress={() => handleLikeComment(comment.id)}
                    >
                      <Ionicons 
                        name={isLiked ? "heart" : "heart-outline"} 
                        size={18} 
                        color={isLiked ? "#ff4757" : "#666"} 
                      />
                      <Text style={[
                        styles.commentActionText,
                        isLiked && { color: '#ff4757' }
                      ]}>
                        {comment.likes_count > 0 ? comment.likes_count : ''}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.commentAction}
                      onPress={() => navigation.navigate("Comments", { 
                        postId: post.id,
                        commentId: comment.id
                      })}
                    >
                      <Ionicons name="chatbubble-outline" size={18} color="#666" />
                      <Text style={styles.commentActionText}>Reply</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
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
  refreshButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
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
    backgroundColor: "#f0f0f0",
  },
  authorName: {
    fontWeight: "bold",
    fontSize: 16,
  },
  username: {
    color: "#666",
    fontSize: 14,
  },
  postRole: {
    color: "#3366ff",
    fontSize: 12,
    marginTop: 2,
  },
  postText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  urlText: {
    color: "#3366ff",
    textDecorationLine: "underline",
  },
  linkPreviewContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  linkPreviewContent: {
    flex: 1,
    marginRight: 8,
  },
  linkPreviewUrl: {
    color: "#3366ff",
    fontSize: 14,
    marginBottom: 4,
  },
  linkPreviewText: {
    fontSize: 12,
    color: "#666",
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginTop: 12,
    backgroundColor: "#f0f0f0",
  },
  interactionSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    marginTop: 12,
  },
  interactionText: {
    color: "#666",
    fontSize: 14,
  },
  interactionNumbers: {
    fontWeight: "bold",
    color: "#333",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    marginLeft: 4,
    color: "#666",
    fontSize: 14,
  },
  commentInputContainer: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "flex-start",
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: "#f0f0f0",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  addCommentButton: {
    backgroundColor: "#3366ff",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
  },
  disabledButton: {
    backgroundColor: "#a0b4ff",
  },
  commentsSection: {
    padding: 16,
  },
  commentsSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  noCommentsContainer: {
    alignItems: "center",
    padding: 32,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
  },
  noCommentsText: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
    color: "#666",
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
  },
  commentContainer: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  commentUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#f0f0f0",
  },
  commentUserName: {
    fontWeight: "bold",
    fontSize: 14,
  },
  commentUsername: {
    color: "#666",
    fontSize: 12,
  },
  commentActions: {
    flexDirection: "row",
    marginTop: 8,
  },
  commentAction: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  commentActionText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#666",
  },
  errorContainer: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff3f3",
    borderRadius: 12,
    borderColor: "#ffdddd",
    borderWidth: 1,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
    marginBottom: 16,
    textAlign: "center",
  },
  refreshButtonText: {
    color: "#3366ff",
    fontSize: 16,
    fontWeight: "bold",
  },
});