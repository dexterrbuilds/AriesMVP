import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';

// Types based on the actual API response
interface Sender {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  role: string;
  avatar: string | null;
  verification_code: string | null;
  email: string;
  email_verified_at: string | null;
  api_token: string | null;
  created_at: string;
  updated_at: string;
  isAdmin: number;
  setup_completed: boolean;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  attachment: string | null;
  attachment_type: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sender: Sender;
}

interface OtherUser {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  role: string;
  avatar: string | null;
  verification_code: string | null;
  email: string;
  email_verified_at: string | null;
  api_token: string | null;
  created_at: string;
  updated_at: string;
  isAdmin: number;
  setup_completed: boolean;
}

interface Conversation {
  id: string;
  user_one_id: string;
  user_two_id: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  other_user: OtherUser;
  messages: Message[];
}

interface ConversationResponse {
  conversation: Conversation;
}

const ConversationScreen = ({ route, navigation }: any) => {
  // Handle both direct navigation with userName and navigation with conversation details
  const { conversationId, otherUser, userName } = route.params;
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const { user, token } = useUser();
  const flatListRef = useRef<FlatList>(null);
  const [recipientUsername, setRecipientUsername] = useState<string>(otherUser?.username || userName);
  const [recipientName, setRecipientName] = useState<string>('');
  const [isNewConversation, setIsNewConversation] = useState<boolean>(!conversationId);

  useEffect(() => {
    // If we have a userName but no otherUser, we need to fetch user info
    if (userName && !otherUser) {
      fetchUserInfo();
    } else if (otherUser) {
      // We already have user info
      setRecipientName(`${otherUser.first_name} ${otherUser.last_name}`);
      setRecipientUsername(otherUser.username);
      
      // Set up navigation header
      navigation.setOptions({
        title: `${otherUser.first_name} ${otherUser.last_name}`,
        headerLeft: () => (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <View style={styles.headerRight}>
            {otherUser.avatar ? (
              <Image source={{ uri: otherUser.avatar }} style={styles.headerAvatar} />
            ) : (
              <View style={styles.headerAvatarPlaceholder}>
                <Text style={styles.headerAvatarInitials}>
                  {otherUser.first_name.charAt(0)}
                  {otherUser.last_name.charAt(0)}
                </Text>
              </View>
            )}
          </View>
        ),
      });
    }
    
    // If we have a conversationId, fetch existing messages
    if (conversationId) {
      fetchMessages();
    } else {
      // This is a new conversation
      setIsNewConversation(true);
      setLoading(false);
    }
  }, [conversationId, userName, otherUser]);

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://ariesmvp-9903a26b3095.herokuapp.com/api/profile/${userName}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const profileData = await response.json();
      
      setRecipientName(profileData.username); // Adjust according to your API response
      setRecipientUsername(profileData.username);
      
      // Set up navigation header with minimal user info
      navigation.setOptions({
        title: profileData.username,
        headerLeft: () => (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <View style={styles.headerRight}>
            {profileData.avatar ? (
              <Image source={{ uri: profileData.avatar }} style={styles.headerAvatar} />
            ) : (
              <View style={styles.headerAvatarPlaceholder}>
                <Text style={styles.headerAvatarInitials}>
                  {profileData.username.charAt(0)}
                </Text>
              </View>
            )}
          </View>
        ),
      });
      
      // Check if there's an existing conversation with this user
      checkExistingConversation(profileData.username);
      
    } catch (err) {
      console.error('Error fetching user info:', err);
      setError('Failed to load user information. Please try again.');
      setLoading(false);
    }
  };

  const checkExistingConversation = async (username: string) => {
    try {
      // You would need an API endpoint that returns conversations by username
      // This is a hypothetical example - adjust based on your actual API
      const response = await fetch(
        `https://ariesmvp-9903a26b3095.herokuapp.com/api/messages/conversations/by-username/${username}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        // If 404, there's no existing conversation
        if (response.status === 404) {
          setIsNewConversation(true);
          setLoading(false);
          return;
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data: ConversationResponse = await response.json();
      setConversation(data.conversation);
      
      // Sort messages by creation date (oldest to newest)
      const sortedMessages = [...data.conversation.messages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setMessages(sortedMessages);
      
      setIsNewConversation(false);
      setError(null);
    } catch (err) {
      console.error('Error checking existing conversation:', err);
      // Assume it's a new conversation if there's an error
      setIsNewConversation(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://ariesmvp-9903a26b3095.herokuapp.com/api/messages/conversations/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data: ConversationResponse = await response.json();
      setConversation(data.conversation);
      
      // Sort messages by creation date (oldest to newest)
      const sortedMessages = [...data.conversation.messages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setMessages(sortedMessages);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (newMessage.trim() === '') return;
    
    try {
      setSending(true);
      
      // Use the new endpoint for sending messages
      const response = await fetch(
        'https://ariesmvp-9903a26b3095.herokuapp.com/api/messages/send',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: recipientUsername,
            message: newMessage,
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Get the response data which might contain the new conversation ID
      const responseData = await response.json();
      
      // If this was a new conversation, we need to update our state
      if (isNewConversation && responseData.conversation_id) {
        setIsNewConversation(false);
        // We could refetch to get the full conversation, but for simplicity we'll just
        // create a basic conversation object
        if (!conversation) {
          setConversation({
            id: responseData.conversation_id,
            user_one_id: user?.id || '',
            user_two_id: '', // We don't know this yet
            last_message_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            other_user: {
              id: '',
              first_name: '',
              last_name: '',
              username: recipientUsername,
              role: '',
              avatar: null,
              verification_code: null,
              email: '',
              email_verified_at: null,
              api_token: null,
              created_at: '',
              updated_at: '',
              isAdmin: 0,
              setup_completed: false
            },
            messages: []
          });
        }
      }
      
      // Create a temporary message until we fetch the updated conversation
      const tempMessage: Message = {
        id: Date.now().toString(), // Temporary ID
        conversation_id: conversation?.id || responseData.conversation_id || '',
        sender_id: user?.id || '',
        body: newMessage,
        attachment: null,
        attachment_type: null,
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        sender: {
          id: user?.id || '',
          first_name: user?.first_name || '',
          last_name: user?.last_name || '',
          username: user?.username || '',
          role: user?.role || '',
          avatar: user?.avatar || null,
          verification_code: null,
          email: user?.email || '',
          email_verified_at: null,
          api_token: null,
          created_at: '',
          updated_at: '',
          isAdmin: 0,
          setup_completed: true
        }
      };
      
      // Add the new message to the list (at the end, since messages are sorted oldest to newest)
      setMessages((prevMessages) => [...prevMessages, tempMessage]);
      setNewMessage('');
      
      // If we now have a conversation ID, use it to fetch the updated conversation
      if (conversation?.id || responseData.conversation_id) {
        setTimeout(() => {
          fetchMessages();
        }, 1000);
      }
      
      // Scroll to the bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (dateString: string) => {
    const messageDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  const renderMessageItem = ({ item, index }: { item: Message; index: number }) => {
    const isCurrentUser = item.sender_id === user?.id;
    const showDate = index === 0 || 
      formatDate(messages[index-1].created_at) !== formatDate(item.created_at);
    
    return (
      <>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
          </View>
        )}
        <View style={[
          styles.messageContainer,
          isCurrentUser ? styles.myMessage : styles.theirMessage
        ]}>
          <Text style={styles.messageText}>{item.body}</Text>
          <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
        </View>
      </>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => conversationId ? fetchMessages() : fetchUserInfo()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessageItem}
        contentContainerStyle={styles.messagesContainer}
        onLayout={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isNewConversation
                ? `Start a conversation with ${recipientName || recipientUsername}!`
                : 'No messages yet. Start the conversation!'}
            </Text>
          </View>
        }
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
          maxLength={1000}
        />
        <TouchableOpacity 
          style={[
            styles.sendButton,
            sending || newMessage.trim() === '' ? styles.sendButtonDisabled : {}
          ]}
          onPress={sendMessage}
          disabled={sending || newMessage.trim() === ''}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  backButton: {
    marginLeft: 10,
  },
  headerRight: {
    marginRight: 10,
  },
  headerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  headerAvatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarInitials: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
  },
  messagesContainer: {
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dateText: {
    fontSize: 12,
    color: '#888',
    backgroundColor: '#e5e5e5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  messageContainer: {
    padding: 12,
    marginVertical: 5,
    borderRadius: 15,
    maxWidth: '80%',
  },
  myMessage: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
  },
  theirMessage: {
    backgroundColor: '#EAEAEA',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  timeText: {
    fontSize: 11,
    color: '#888',
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: '#f9f9f9',
  },
  sendButton: {
    backgroundColor: '#1e90ff',
    borderRadius: 25,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#a0cfff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4757',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#1e90ff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});

export default ConversationScreen;