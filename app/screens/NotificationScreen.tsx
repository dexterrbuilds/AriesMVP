import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomNav from "@/components/BottomNav";

const notificationsData = [
    { id: "1", title: "New Course Available!", description: "Check out our new blockchain course." },
    { id: "2", title: "System Update", description: "We've updated our system for better performance." },
    { id: "3", title: "New User Joined", description: "Welcome to our newest user!" },
    { id: "4", title: "Feature Release", description: "A new feature has been released on the platform." },
];

export default function NotificationScreen({ navigation }: any) {
    const [searchQuery, setSearchQuery] = useState("");
    const filteredNotifications = notificationsData.filter((notification) =>
        notification.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                    placeholder="Search notifications"
                    value={searchQuery}
                    onChangeText={(text) => setSearchQuery(text)}
                />
            </View>

            <FlatList
                data={filteredNotifications}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.notificationItem}>
                        <Text style={styles.notificationTitle}>{item.title}</Text>
                        <Text style={styles.notificationDescription}>{item.description}</Text>
                    </View>
                )}
                contentContainerStyle={styles.notificationList}
            />
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
    notificationList: {
        paddingBottom: 10,
    },
    notificationItem: {
        backgroundColor: "#f9f9f9",
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    notificationTitle: {
        fontWeight: "bold",
        fontSize: 16,
    },
    notificationDescription: {
        fontSize: 14,
        color: "#666",
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
});
