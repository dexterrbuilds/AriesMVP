import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";

export default function QuickFollowScreen({ navigation }: any) {
  const [followedAccounts, setFollowedAccounts] = useState<string[]>([]);

  const accounts = [
    {
      id: "1",
      name: "John Doe",
      username: "@johndoe",
      avatar: "https://via.placeholder.com/50",
      bio: "Passionate about all things tech.",
    },
    {
      id: "2",
      name: "Louis",
      username: "@janesmith",
      avatar: "https://via.placeholder.com/50",
      bio: "AI enthusiast and blockchain nerd.",
    },
    {
      id: "3",
      name: "Dexterr",
      username: "@dexterr",
      avatar: "https://via.placeholder.com/50",
      bio: "Coding my way to a better future.",
    },
    {
      id: "4",
      name: "Pompey",
      username: "@ADumbCollegeBoy",
      avatar: "https://via.placeholder.com/50",
      bio: "Simplifying crypto one post at a time.",
    },
    {
      id: "5",
      name: "Dexterr",
      username: "@dexterrbuilds",
      avatar: "https://via.placeholder.com/50",
      bio: "Helping entrepreneurs level up.",
    },
  ];

  const toggleFollow = (username: string) => {
    if (followedAccounts.includes(username)) {
      setFollowedAccounts(followedAccounts.filter((user) => user !== username));
    } else {
      setFollowedAccounts([...followedAccounts, username]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Quick Follow</Text>
      <ScrollView>
        {accounts.map((account) => (
          <View key={account.id} style={styles.accountContainer}>
            <Image source={{ uri: account.avatar }} style={styles.avatar} />
            <View style={styles.accountInfo}>
              <Text style={styles.name}>{account.name}</Text>
              <Text style={styles.username}>{account.username}</Text>
              <Text style={styles.bio}>{account.bio}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.followButton,
                followedAccounts.includes(account.username) && styles.followed,
              ]}
              onPress={() => toggleFollow(account.username)}
            >
              <Text style={styles.followButtonText}>
                {followedAccounts.includes(account.username) ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
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
    marginBottom: 65,
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
  username: {
    color: "grey",
    marginBottom: 10,
  },
  bio: {
    fontSize: 14,
    color: "gray",
    marginTop: 4,
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
});
