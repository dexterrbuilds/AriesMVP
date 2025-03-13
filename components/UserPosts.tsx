import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';

interface Post {
  id: number;
  body: string;
  media_link: string | null;
  media_type: 'text' | 'image' | 'video';
  created_at: string;
  user: {
    username: string;
    avatar: string | null;
    first_name: string;
    last_name: string;
  };
}

const UserPosts = ({ userName }: { userName: string }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { access_token } = useUser();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get('https://ariesmvp-9903a26b3095.herokuapp.com/api/feed', {
          headers: {
            Authorization: `Bearer ${access_token}`
          }
        });
        
        // Filter posts to only show those from the user being viewed
        const userPosts = response.data.posts.filter(
          (post: Post) => post.user.username === userName
        );
        
        setPosts(userPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [userName, access_token]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={48} color="#ccc" />
        <Text style={styles.emptyText}>No posts yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      nestedScrollEnabled={true}
      data={posts}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View style={styles.postContainer}>
          <View style={styles.postHeader}>
            <Image
              source={{ uri: item.user.avatar || 'https://via.placeholder.com/40' }}
              style={styles.postAvatar}
            />
            <View style={styles.postHeaderText}>
              <Text style={styles.postName}>{item.user.first_name} {item.user.last_name}</Text>
              <Text style={styles.postDate}>{formatDate(item.created_at)}</Text>
            </View>
          </View>
          
          <Text style={styles.postBody}>{item.body}</Text>
          
          {item.media_link && item.media_type === 'image' && (
            <Image
              source={{ uri: item.media_link }}
              style={styles.postImage}
              resizeMode="cover"
            />
          )}
          
          <View style={styles.postActions}>
            <TouchableOpacity style={styles.postAction}>
              <Ionicons name="heart-outline" size={24} color="#666" />
              <Text style={styles.postActionText}>Like</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.postAction}>
              <Ionicons name="chatbubble-outline" size={24} color="#666" />
              <Text style={styles.postActionText}>Comment</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.postAction}>
              <Ionicons name="share-outline" size={24} color="#666" />
              <Text style={styles.postActionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  postContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 15,
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
  postName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  postDate: {
    fontSize: 12,
    color: '#666',
  },
  postBody: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    marginTop: 5,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postActionText: {
    marginLeft: 5,
    color: '#666',
  },
});

export default UserPosts;