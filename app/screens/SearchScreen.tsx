import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  TextInput, 
  FlatList, 
  Text, 
  StyleSheet, 
  Image, 
  ActivityIndicator, 
  Alert,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
  Animated,
  Dimensions,
  Keyboard
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import BottomNav from "@/components/BottomNav";
import { useUser } from '@/contexts/UserContext';
import { debounce } from 'lodash';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.7;

const HireModal = ({ visible, onClose, educator }) => {
  const { user, access_token } = useUser();
  const [topic, setTopic] = useState('');
  const [medium, setMedium] = useState('');
  const [duration, setDuration] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      // Slide up
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      // Slide down
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!topic || !medium || !duration || !message) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    console.log(`"Access token:" ${access_token}`)
    try {
      const response = await fetch('https://ariesmvp-9903a26b3095.herokuapp.com/api/api/hire-request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tutor_id: educator.id,
          topic,
          medium,
          message,
          duration
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send hire request');
      }

      Alert.alert('Success', 'Hire request sent successfully!');
      onClose();
      setTopic('');
      setMedium('');
      setDuration('');
      setMessage('');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const mediumOptions = ['Online', 'Physical'];
  const durationOptions = ['30 minutes', '1 hour', '2 hours', '3 hours'];

  const renderDropdown = (title, value, setValue, options) => (
    <View style={styles.dropdownContainer}>
      <Text style={styles.inputLabel}>{title}</Text>
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.option,
              value === option && styles.selectedOption
            ]}
            onPress={() => setValue(option)}
          >
            <Text style={[
              styles.optionText,
              value === option && styles.selectedOptionText
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <Animated.View 
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={() => Keyboard.dismiss()}
            style={styles.modalInner}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hire {educator?.first_name}</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>What do you want to learn?</Text>
                <TextInput
                    style={styles.hireInput}
                    value={topic}
                    onChangeText={setTopic}
                    placeholder="Enter topic"
                />
                </View>

                {renderDropdown('Select Medium', medium, setMedium, mediumOptions)}
                {renderDropdown('Select Duration', duration, setDuration, durationOptions)}

                <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Message</Text>
                <TextInput
                    style={[styles.hireInput, styles.messageInput]}
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Enter your message"
                    multiline
                    numberOfLines={4}
                />
                </View>

                <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.submitButtonText}>Send Request</Text>
                )}
                </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const SearchScreen = ({ navigation }: any) => {
    const { user, access_token } = useUser();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ posts: [], users: [] });
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [noResults, setNoResults] = useState(false);
    const [selectedEducator, setSelectedEducator] = useState(null);
    const [hireModalVisible, setHireModalVisible] = useState(false);

    const debouncedSearch = useCallback(
      debounce(async (searchQuery) => {
        if (!searchQuery.trim()) {
          setResults({ posts: [], users: [] });
          setNoResults(false);
          return;
        }
        
        await performSearch(searchQuery);
      }, 500),
      [access_token]
    );

    useEffect(() => {
      debouncedSearch(query);
      
      return () => {
        debouncedSearch.cancel();
      };
    }, [query, debouncedSearch]);

    const isPost = (item) => {
        return item.hasOwnProperty('body') && item.hasOwnProperty('user');
    };

    const performSearch = async (searchQuery) => {
        setLoading(true);
        setNoResults(false);
        
        try {
            const url = `https://ariesmvp-9903a26b3095.herokuapp.com/api/api/search?query=${encodeURIComponent(searchQuery)}`;
    
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                },
            });
    
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(`API Error: ${data.message || 'Unknown error'}`);
            }
    
            const posts = data.results.filter(isPost);
            const users = data.results.filter(item => !isPost(item));
            
            setResults({ posts, users });
            setNoResults(posts.length === 0 && users.length === 0);
    
        } catch (error) {
            console.error('(NOBRIDGE) ERROR', error);
            Alert.alert(
                'Search Error',
                'An error occurred while searching. Please try again later.',
                [{ text: 'OK' }]
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    
    const onRefresh = () => {
        setRefreshing(true);
        performSearch(query);
    };

    const handleClearSearch = () => {
        setQuery('');
        setResults({ posts: [], users: [] });
        setNoResults(false);
    };

    const handleResultPress = (item) => {
        if (isPost(item)) {
            navigation.navigate('PostDetail', { postId: item.id });
        } else {
            navigation.navigate('UserProfile', { userId: item.id });
        }
    };

    const renderUserItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.resultItem}
            onPress={() => handleResultPress(item)}
        >
            <View style={styles.userInfo}>
                <Image
                    source={
                        item.avatar 
                        ? { uri: item.avatar } 
                        : require('../assets/images/pfp.png')
                    }
                    style={styles.profileImage}
                />
                <View style={styles.userDetails}>
                    <Text style={styles.postAuthor}>
                        {item.first_name} {item.last_name}
                    </Text>
                    <Text style={styles.userName}>@{item.username}</Text>
                    <Text style={styles.role}>
                        {item.role || 'Member'}
                    </Text>
                </View>
                {item.role === 'educator' && (
                    <TouchableOpacity
                        style={styles.hireButton}
                        onPress={() => {
                            setSelectedEducator(item);
                            setHireModalVisible(true);
                        }}
                    >
                        <Text style={styles.hireButtonText}>Hire</Text>
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );

    const renderPostItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.resultItem}
            onPress={() => handleResultPress(item)}
        >
            <View style={styles.userInfo}>
                <Image
                    source={
                        item.user?.avatar 
                        ? { uri: item.user.avatar } 
                        : require('../assets/images/pfp.png')
                    }
                    style={styles.profileImage}
                />
                <View style={styles.userDetails}>
                    <Text style={styles.postAuthor}>
                        {item.user?.first_name} {item.user?.last_name}
                    </Text>
                    <Text style={styles.userName}>@{item.user?.username}</Text>
                    <Text style={styles.role}>
                        {item.user?.role || 'Member'}
                    </Text>
                </View>
            </View>
            <Text style={styles.body}>{item.body}</Text>
            {item.media_link && (
                <Image 
                    source={{ uri: item.media_link }}
                    style={styles.mediaImage}
                    resizeMode="cover"
                />
            )}
        </TouchableOpacity>
    );

    const renderResults = () => {
        const { users, posts } = results;
        const hasResults = users.length > 0 || posts.length > 0;

        if (!hasResults && query.trim() === '') {
            return renderEmptyState();
        }

        return (
            <>
                {users.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Users</Text>
                        <FlatList
                            data={users}
                            renderItem={renderUserItem}
                            keyExtractor={(item) => `user-${item.id}`}
                            scrollEnabled={false}
                        />
                    </View>
                )}
                {posts.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Posts</Text>
                        <FlatList
                            data={posts}
                            renderItem={renderPostItem}
                            keyExtractor={(item) => `post-${item.id}`}
                            scrollEnabled={false}
                        />
                    </View>
                )}
            </>
        );
    };

    const renderEmptyState = () => {
        if (noResults && query.trim() !== '') {
            return (
                <View style={styles.emptyState}>
                    <Ionicons name="search-outline" size={50} color="#ccc" />
                    <Text style={styles.emptyStateText}>No results found for "{query}"</Text>
                    <Text style={styles.emptyStateSubtext}>Try different keywords or check your spelling</Text>
                </View>
            );
        } else if (query.trim() === '') {
            return (
                <View style={styles.emptyState}>
                    <Ionicons name="search" size={50} color="#ccc" />
                    <Text style={styles.emptyStateText}>Start typing to search</Text>
                    <Text style={styles.emptyStateSubtext}>Search for people, posts, and more</Text>
                </View>
            );
        }
        
        return null;
    };

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Search..."
                    value={query}
                    onChangeText={setQuery}
                    returnKeyType="search"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={handleClearSearch}>
                        <Ionicons name="close-circle" size={20} color="#666" style={styles.clearIcon} />
                    </TouchableOpacity>
                )}
            </View>
            
            {loading && !refreshing ? (
                <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
            ) : (
                <FlatList
                    data={[{ key: 'results' }]}
                    renderItem={() => renderResults()}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#0000ff']}
                            tintColor="#0000ff"
                        />
                    }
                />
            )}
            
            <HireModal
                visible={hireModalVisible}
                onClose={() => {
                    setHireModalVisible(false);
                    setSelectedEducator(null);
                }}
                educator={selectedEducator}
                access_token={access_token}
            />
            
            <View style={styles.bottomNav}>
                <BottomNav navigation={navigation} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 25,
        marginVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: '#f5f5f5',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    searchIcon: {
        marginRight: 8,
    },
    clearIcon: {
        marginLeft: 8,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
    },
    loader: {
        marginTop: 50,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    resultItem: {
        padding: 16,
        backgroundColor: '#f9f9f9',
        marginBottom: 12,
        borderRadius: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    userDetails: {
        flex: 1,
    },
    username: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'black',
    },
    role: {
        fontSize: 12,
        color: "#888",
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    body: {
        fontSize: 16,
        color: '#333',
        lineHeight: 20,
    },
    postAuthor: {
        fontWeight: "bold",
        fontSize: 16,
    },
    profileImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
        backgroundColor: '#eee',
    },
    userName: {
        fontSize: 14,
        color: '#666',
    },
    mediaImage: {
        width: '100%',
        height: 200,
        marginTop: 10,
        borderRadius: 8,
        backgroundColor: '#eee',
    },
    bottomNav: {
        backgroundColor: "white",
        borderStyle: "solid",
        borderTopWidth: 1,
        borderTopColor: "#eaeaea",
        height: 50,
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 15,
        alignItems: "center",
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 20,
        textAlign: 'center',
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
    },
    hireButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginLeft: 'auto',
    },
    hireButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: MODAL_HEIGHT,
        padding: 20,
    },
    modalInner: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    hireInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    messageInput: {
        height: 100,
        textAlignVertical: 'top',
    },
    dropdownContainer: {
        marginBottom: 20,
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
        gap: 8,
    },
    option: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#f9f9f9',
    },
    selectedOption: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    optionText: {
        color: '#333',
        fontSize: 14,
    },
    selectedOptionText: {
        color: '#fff',
    },
    submitButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default SearchScreen;