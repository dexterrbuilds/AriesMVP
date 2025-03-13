import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomNav from "@/components/BottomNav";
import { useUser } from '@/contexts/UserContext';


export default function NotificationScreen({ navigation }: any) {
    const [searchQuery, setSearchQuery] = useState("");
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("All");
    const { user, access_token } = useUser();


    // Define notification types for tabs
    const notificationTypes = {
        "All": "All Notifications",
        "Message": "Messages",
        "Like": "Likes",
        "Follow": "Follows",
        "Hire": "Hire Requests"
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await fetch('https://ariesmvp-9903a26b3095.herokuapp.com/api/notifications', {
                headers: {
                  Authorization: `Bearer ${access_token}`,
                  'Content-Type': 'application/json',
                },
              });
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            // Sort notifications by creation date (newest first)
            const sortedNotifications = data.notifications.sort((a, b) => 
                new Date(b.created_at) - new Date(a.created_at)
            );
            setNotifications(sortedNotifications);
            setError(null);
        } catch (err) {
            setError('Failed to fetch notifications');
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    // Function to format the notification message based on type
    const formatNotificationContent = (notification) => {
        const { type, data } = notification;
        
        if (type.includes("NewMessage")) {
            return {
                title: `New message from ${data.sender_name}`,
                description: data.preview,
                avatar: data.sender_avatar,
                type: "Message"
            };
        } else if (type.includes("LikeNotification")) {
            return {
                title: "Post Liked",
                description: data.message,
                avatar: data.avatar,
                type: "Like"
            };
        } else if (type.includes("followedNotification")) {
            return {
                title: "New Follower",
                description: data.message,
                avatar: data.avatar,
                type: "Follow"
            };
        } else if (type.includes("HireRequestNotification")) {
            return {
                title: "Hire Request",
                description: data.message_content,
                avatar: null,
                type: "Hire"
            };
        } else {
            return {
                title: "Notification",
                description: "You have a new notification",
                avatar: null,
                type: "Other"
            };
        }
    };

    // Filter notifications based on active tab and search query
    const getFilteredNotifications = () => {
        return notifications.filter(notification => {
            const content = formatNotificationContent(notification);
            const matchesSearch = content.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 content.description.toLowerCase().includes(searchQuery.toLowerCase());
            
            if (activeTab === "All") {
                return matchesSearch;
            } else {
                return content.type === activeTab && matchesSearch;
            }
        });
    };

    const filteredNotifications = getFilteredNotifications();

    // Format the date to a more readable format
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) {
            return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else if (diffDays < 7) {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
                    <Ionicons name="person-circle" size={30} color="black" />
                </TouchableOpacity>
                <Text style={styles.screenTitle}>Notifications</Text>
                <TouchableOpacity>
                    <Ionicons name="notifications" size={30} color="black" />
                </TouchableOpacity>
            </View>
            
            <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#888" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search notifications"
                    value={searchQuery}
                    onChangeText={(text) => setSearchQuery(text)}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                        <Ionicons name="close-circle" size={20} color="#888" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Notification Type Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
                {Object.keys(notificationTypes).map((type) => (
                    <TouchableOpacity
                        key={type}
                        style={[
                            styles.tab,
                            activeTab === type && styles.activeTab
                        ]}
                        onPress={() => setActiveTab(type)}
                    >
                        <Text style={[
                            styles.tabText,
                            activeTab === type && styles.activeTabText
                        ]}>
                            {notificationTypes[type]}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0000ff" />
                    <Text style={styles.loadingText}>Loading notifications...</Text>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchNotifications}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredNotifications}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => {
                        const content = formatNotificationContent(item);
                        return (
                            <TouchableOpacity style={[styles.notificationItem, !item.seen && styles.unreadNotification]}>
                                {content.avatar ? (
                                    <View style={styles.avatarContainer}>
                                        <TouchableOpacity>
                                            <View style={styles.avatar}>
                                                <Text style={styles.avatarText}>{content.avatar ? "👤" : "📣"}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={styles.iconContainer}>
                                        <Ionicons 
                                            name={
                                                content.type === "Message" ? "chatbubble-ellipses" :
                                                content.type === "Like" ? "heart" :
                                                content.type === "Follow" ? "person-add" :
                                                content.type === "Hire" ? "briefcase" : "notifications"
                                            } 
                                            size={24} 
                                            color="#0066cc" 
                                        />
                                    </View>
                                )}
                                <View style={styles.notificationContent}>
                                    <Text style={styles.notificationTitle}>{content.title}</Text>
                                    <Text style={styles.notificationDescription}>{content.description}</Text>
                                    <Text style={styles.notificationTimestamp}>{formatDate(item.created_at)}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    contentContainerStyle={styles.notificationList}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No notifications found</Text>
                        </View>
                    }
                    refreshing={loading}
                    onRefresh={fetchNotifications}
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
    screenTitle: {
        fontSize: 18,
        fontWeight: "bold",
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
    tabsContainer: {
        flexDirection: "row",
        marginBottom: 15,
    },
    tab: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginRight: 10,
        borderRadius: 20,
        backgroundColor: "#f5f5f5",
    },
    activeTab: {
        backgroundColor: "#0066cc",
    },
    tabText: {
        fontSize: 14,
        color: "#555",
    },
    activeTabText: {
        color: "white",
        fontWeight: "bold",
    },
    notificationList: {
        paddingBottom: 60,
    },
    notificationItem: {
        backgroundColor: "#f9f9f9",
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        flexDirection: "row",
    },
    unreadNotification: {
        borderLeftWidth: 3,
        borderLeftColor: "#0066cc",
    },
    avatarContainer: {
        marginRight: 15,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#e6f0ff",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 15,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#ccc",
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: {
        fontSize: 20,
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontWeight: "bold",
        fontSize: 16,
        marginBottom: 5,
    },
    notificationDescription: {
        fontSize: 14,
        color: "#666",
        marginBottom: 5,
    },
    notificationTimestamp: {
        fontSize: 12,
        color: "#999",
        alignSelf: "flex-end",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: "#666",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    errorText: {
        fontSize: 16,
        color: "#f00",
        textAlign: "center",
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: "#0066cc",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
    },
    retryButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        color: "#999",
        textAlign: "center",
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