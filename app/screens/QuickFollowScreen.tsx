import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from "react-native";
import { useUser } from '@/contexts/UserContext';

export default function QuickFollowScreen({ navigation }: any) {
  const [followedAccounts, setFollowedAccounts] = useState<string[]>([]);
  const { user, access_token } = useUser();
  useEffect(() => {
    console.log("Access Token:", access_token);
  }, [access_token]);
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
    console.log("Toggling follow for user:", id);
    try {
      const response = await fetch(
        `https://ariesmvp-9903a26b3095.herokuapp.com/api/api/follow/${id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
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

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="black" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Quick Follow</Text>
      {loading ? (
        <ActivityIndicator size="large" color="black" />
      ) : (
        <ScrollView>
          {accounts.map((account) => (
            <View key={account.id} style={styles.accountContainer}>
              <Image
                source={{ uri: account.profile_image || "https://via.placeholder.com/50" }}
                style={styles.avatar}
              />
              <View style={styles.accountInfo}>
                <Text style={styles.name}>{account.username}</Text>
                <Text style={styles.bio}>{account.bio || "No bio available."}</Text>
                <Text style={styles.topics}>{account.topics?.join(", ") || "No topics listed."}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.followButton,
                  followedAccounts.includes(account.id) && styles.followed,
                ]}
                onPress={() => toggleFollow(account.id)}
              >
                <Text style={styles.followButtonText}>
                  {followedAccounts.includes(account.id) ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => navigation.navigate("Feed")}
      >
        <Text style={styles.startButtonText}>Let's Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    paddingBottom: 100,
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  accountContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  accountInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  bio: {
    fontSize: 14,
    color: "gray",
    marginTop: 4,
  },
  topics: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  followButton: {
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 5,
    backgroundColor: "black",
  },
  followed: {
    backgroundColor: "#34C759",
  },
  followButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  startButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "black",
    borderRadius: 5,
    alignItems: "center",
  },
  startButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
