import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator, SafeAreaView, StatusBar } from "react-native";
import { useUser } from '@/contexts/UserContext';

export default function QuickFollowScreen({ navigation }: any) {
  const [followedAccounts, setFollowedAccounts] = useState<string[]>([]);
  const { user, token } = useUser();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("https://ariesmvp-9903a26b3095.herokuapp.com/api/followOptions");
        const data = await response.json();
        setAccounts(data.users);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const toggleFollow = async (id: string) => {
    try {
      const response = await fetch(
        `https://ariesmvp-9903a26b3095.herokuapp.com/api/api/follow/${id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setFollowedAccounts((prev) =>
          prev.includes(id)
            ? prev.filter((userId) => userId !== id)
            : [...prev, id]
        );
      } else {
        const errorData = await response.json();
        console.error("Failed to follow user:", errorData.message);
      }
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  const renderAccountItem = ({ item }) => (
    <View style={styles.accountContainer}>
      <Image
        source={require('../assets/images/pfp.png')}
        style={styles.avatar}
      />
      <View style={styles.accountInfo}>
        <Text style={styles.name}>{item.username}</Text>
        <Text style={styles.bio} numberOfLines={2}>{item.bio || "No bio available."}</Text>
        {item.topics && item.topics.length > 0 && (
          <View style={styles.topicsContainer}>
            {item.topics.slice(0, 3).map((topic, index) => (
              <View key={index} style={styles.topicTag}>
                <Text style={styles.topicText}>{topic}</Text>
              </View>
            ))}
            {item.topics.length > 3 && (
              <Text style={styles.moreTopics}>+{item.topics.length - 3} more</Text>
            )}
          </View>
        )}
      </View>
      <TouchableOpacity
        style={[
          styles.followButton,
          followedAccounts.includes(item.id) && styles.followed,
        ]}
        onPress={() => toggleFollow(item.id)}
      >
        <Text style={[
          styles.followButtonText,
          followedAccounts.includes(item.id) && styles.followedText
        ]}>
          {followedAccounts.includes(item.id) ? "Following" : "Follow"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#5A67D8" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Who to Follow</Text>
          <Text style={styles.subheader}>Follow experts across topics that interest you</Text>
        </View>
        
        <FlatList
          data={accounts}
          renderItem={renderAccountItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No accounts available to follow.</Text>
          }
        />
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate("Feed")}
          >
            <Text style={styles.startButtonText}>Continue to Feed</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => navigation.navigate("Feed")}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: 15,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ffffff",
  },
  headerContainer: {
    marginBottom: 24,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    color: "#1F2937",
  },
  subheader: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 22,
  },
  list: {
    paddingBottom: 20,
  },
  accountContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    backgroundColor: "#E5E7EB",
  },
  accountInfo: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 8,
    lineHeight: 20,
  },
  topicsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  topicTag: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  topicText: {
    fontSize: 12,
    color: "#4F46E5",
    fontWeight: "500",
  },
  moreTopics: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  followButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "black",
    minWidth: 88,
    alignItems: "center",
  },
  followed: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "black",
  },
  followButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  followedText: {
    color: "black",
  },
  buttonContainer: {
    marginTop: 16,
  },
  startButton: {
    paddingVertical: 14,
    backgroundColor: "black",
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#5A67D8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 12,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  skipButton: {
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  skipButtonText: {
    color: "#4B5563",
    fontSize: 16,
    fontWeight: "600",
  },
  separator: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  emptyText: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 16,
    marginTop: 32,
  },
});