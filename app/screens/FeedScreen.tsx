import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomNav from "@/components/BottomNav";
import { useUser } from '@/contexts/UserContext';

export default function FeedScreen({route, navigation }: any) {
    const { user, access_token } = useUser();
    const [activeTab, setActiveTab] = useState("For You");
  
    const liveEducators = [
      { id: "1", name: "Dexterr", avatar: "https://via.placeholder.com/60" },
      { id: "2", name: "Pompey", avatar: "https://via.placeholder.com/60" },
      { id: "3", name: "Louis", avatar: "https://via.placeholder.com/60" },
      { id: "4", name: "John", avatar: "https://via.placeholder.com/60" },
      { id: "5", name: "Chris", avatar: "https://via.placeholder.com/60" },
      { id: "6", name: "Alex", avatar: "https://via.placeholder.com/60" },
    ];
  
    const banners = [
      { id: "1", image: "https://via.placeholder.com/300x100" },
      { id: "2", image: "https://via.placeholder.com/300x100" },
      { id: "3", image: "https://via.placeholder.com/300x100" },
    ];
  
    const forYouPosts = [
      { id: "1", author: "John Doe", content: "Check out this project!", image: "https://via.placeholder.com/300x200" },
      { id: "2", author: "Jane Smith", content: "Tips for blockchain development." },
      { id: "3", author: "John Doe", content: "Check out this project!", image: "https://via.placeholder.com/300x200" },
      { id: "4", author: "Jane Smith", content: "Tips for blockchain development." },
    ];
  
    const coursePosts = [
      { id: "1", author: "Edu Mentor", content: "New course: Blockchain Basics", image: "https://via.placeholder.com/300x200" },
      { id: "2", author: "Learn Hub", content: "Advanced Solidity programming now available!" },
    ];
  
    const activeContent = activeTab === "For You" ? forYouPosts : coursePosts;
  
    return (
      <View style={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
            <Ionicons name="person-circle" size={30} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>Welcome, {user?.first_name}!</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
            <Ionicons name="notifications" size={30} color="black" />
          </TouchableOpacity>
        </View>

      <ScrollView style={styles.screen}>
        {/* Live Educators */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.liveEducators}>
          {liveEducators.map((educator) => (
            <View key={educator.id} style={styles.educatorContainer}>
              <View style={styles.liveIndicator}>
                <Image source={{ uri: educator.avatar }} style={styles.educatorAvatar} />
              </View>
              <Text style={styles.educatorName}>{educator.name}</Text>
            </View>
          ))}
        </ScrollView>
  
        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "For You" && styles.activeTab]}
            onPress={() => setActiveTab("For You")}
          >
            <Text style={[styles.tabText, activeTab === "For You" && styles.activeTabText]}>For You</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "Courses" && styles.activeTab]}
            onPress={() => setActiveTab("Courses")}
          >
            <Text style={[styles.tabText, activeTab === "Courses" && styles.activeTabText]}>Courses</Text>
          </TouchableOpacity>
        </View>
  
        {/* Banners */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.banners}>
          {banners.map((banner) => (
            <Image key={banner.id} source={{ uri: banner.image }} style={styles.bannerImage} />
          ))}
        </ScrollView>
  
        {/* Active Content */}
        <View style={styles.posts}>
          {activeContent.map((post) => (
            <View key={post.id} style={styles.postContainer}>
              <Text style={styles.postAuthor}>{post.author}</Text>
              <Text style={styles.postContent}>{post.content}</Text>
              {post.image && <Image source={{ uri: post.image }} style={styles.postImage} />}
            
            <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={() => console.log("Liked post", post.id)}>
              <Ionicons name="heart-outline" size={24} color="black" />
              <Text style={styles.actionText}>Like</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => console.log("Reposted post", post.id)}>
              <Ionicons name="repeat-outline" size={24} color="black" />
              <Text style={styles.actionText}>Repost</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => console.log("Comment on post", post.id)}>
              <Ionicons name="chatbubble-outline" size={24} color="black" />
              <Text style={styles.actionText}>Comment</Text>
            </TouchableOpacity>
            </View>
          </View>
          ))}
        </View>
        </ScrollView>
        <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate("Post")}
            >
                <Ionicons name="add" size={28} color="white" />
          </TouchableOpacity>
        <View style={styles.bottomnav}>
          <BottomNav navigation={navigation}/>
      </View>
      </View>
    );
  }

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    flex: 1,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  screen: {
    paddingBottom: 200,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
  },
  fab: {
    position: "absolute",
    bottom: 150,
    right: 20,
    width: 60,
    height: 60,
    backgroundColor: "black",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
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
    bottom: 80,
    left: 0,
    right: 0,
  },
  liveEducators: {
    marginVertical: 5,
    paddingLeft: 10,
  },
  educatorContainer: {
    alignItems: "center",
    marginRight: 15,
    marginBottom: 10,
  },
  liveIndicator: {
    borderWidth: 2,
    borderColor: "red",
    borderRadius: 50,
    padding: 2,
  },
  educatorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  educatorName: {
    marginTop: 5,
    fontSize: 12,
    textAlign: "center",
  },  
  tabs: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 5,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "black",
  },
  tabText: {
    fontSize: 16,
    color: "#888",
  },
  activeTabText: {
    color: "black",
    fontWeight: "bold",
  },
  banners: {
    marginTop: 20,
  },
  bannerImage: {
    width: 300,
    height: 100,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  posts: {
    paddingHorizontal: 10,
    marginTop: 10,
    paddingBottom: 100,
  },
  postContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
  },
  postAuthor: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  postContent: {
    fontSize: 14,
    marginBottom: 5,
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginTop: 5,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    marginLeft: 5,
    fontSize: 14,
    color: "black",
  },
});