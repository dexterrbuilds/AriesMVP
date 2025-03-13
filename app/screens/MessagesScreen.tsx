import React, { useState, useEffect, useContext } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomNav from "@/components/BottomNav";
import { useUser } from '@/contexts/UserContext';

// Types for the API response
interface User {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  role: string;
  avatar: string | null;
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
}

interface Conversation {
  id: string;
  user_one_id: string;
  user_two_id: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  other_user: User;
  unread_count: number;
  latest_message: Message;
}

interface ConversationsResponse {
  conversations: Conversation[];
}

export default function MessagesScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, access_token } = useUser();


  // Format the date relative to now (e.g. "Today", "Yesterday", or "MM/DD/YYYY")
  const formatDate = (dateString: string) => {
    const messageDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  // Format the message preview (truncate if too long)
  const formatMessagePreview = (message: string) => {
    return message.length > 30 ? message.substring(0, 30) + "..." : message;
  };

  // Fetch conversations from the API
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch("https://ariesmvp-9903a26b3095.herokuapp.com/api/messages/conversations", {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Sort conversations by last_message_at in descending order (newest first)
      const sortedConversations = data.conversations.sort((a: Conversation, b: Conversation) => {
        return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
      });
      
      setConversations(sortedConversations);
      setError(null);
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError("Failed to load conversations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch conversations when component mounts
  useEffect(() => {
    fetchConversations();
  }, []);

  // Filter conversations based on search query
  const filteredConversations = conversations.filter((conversation) => {
    const fullName = `${conversation.other_user.first_name} ${conversation.other_user.last_name}`;
    return fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           conversation.other_user.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const navigateToChat = (conversationId: string, otherUser: User) => {
    navigation.navigate("Conversation", {
      conversationId,
      otherUser
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
          <Ionicons name="person-circle" size={30} color="black" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
          <Ionicons name="notifications" size={30} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages"
          value={searchQuery}
          onChangeText={(text) => setSearchQuery(text)}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchConversations}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.messageItem}
              onPress={() => navigateToChat(item.id, item.other_user)}
            >
              <View style={styles.avatarContainer}>
                {item.other_user.avatar ? (
                  <Image source={{ uri: item.other_user.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitials}>
                      {item.other_user.first_name.charAt(0)}
                      {item.other_user.last_name.charAt(0)}
                    </Text>
                  </View>
                )}
                {item.unread_count > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>{item.unread_count}</Text>
                  </View>
                )}
              </View>
              <View style={styles.messageContent}>
                <View style={styles.messageHeader}>
                  <Text style={styles.messageSender}>
                    {item.other_user.first_name} {item.other_user.last_name}
                  </Text>
                  <Text style={styles.messageDate}>
                    {formatDate(item.last_message_at)}
                  </Text>
                </View>
                <Text 
                  style={[
                    styles.messageText,
                    item.unread_count > 0 && styles.unreadMessageText
                  ]}
                >
                  {formatMessagePreview(item.latest_message.body)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              <Text style={styles.emptyListText}>No conversations found</Text>
            </View>
          }
        />
      )}
      <View style={styles.bottomnav}>
        <BottomNav navigation={navigation}/>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 40,
    paddingHorizontal: 10,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#555",
  },
  messageList: {
    paddingBottom: 70, // Extra space for bottom nav
  },
  messageItem: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  avatarContainer: {
    marginRight: 12,
    position: "relative",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#555",
  },
  unreadBadge: {
    position: "absolute",
    right: -5,
    top: -5,
    backgroundColor: "#ff4757",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadCount: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  messageSender: {
    fontWeight: "bold",
    fontSize: 16,
  },
  messageDate: {
    fontSize: 12,
    color: "#888",
  },
  messageText: {
    fontSize: 14,
    color: "#666",
  },
  unreadMessageText: {
    fontWeight: "bold",
    color: "#333",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#ff4757",
    textAlign: "center",
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: "#1e90ff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyListText: {
    fontSize: 16,
    color: "#888",
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
});