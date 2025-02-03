import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomNav from "@/components/BottomNav";

const messagesData = [
    { id: "1", sender: "John Doe", message: "Hey, check out this new project!" },
    { id: "2", sender: "Jane Smith", message: "Let's catch up soon!" },
    { id: "3", sender: "Alex", message: "I have an update on the task." },
    { id: "4", sender: "Pompey", message: "Can you help me with the new feature?" },
];

export default function MessagesScreen({ navigation }: any) {
    const [searchQuery, setSearchQuery] = useState("");
    const filteredMessages = messagesData.filter((message) =>
        message.sender.toLowerCase().includes(searchQuery.toLowerCase())
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
                    placeholder="Search messages"
                    value={searchQuery}
                    onChangeText={(text) => setSearchQuery(text)}
                />
            </View>

            <FlatList
                data={filteredMessages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.messageItem}>
                        <Text style={styles.messageSender}>{item.sender}</Text>
                        <Text style={styles.messageText}>{item.message}</Text>
                    </View>
                )}
                contentContainerStyle={styles.messageList}
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
    messageList: {
        paddingBottom: 10,
    },
    messageItem: {
        backgroundColor: "#f9f9f9",
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    messageSender: {
        fontWeight: "bold",
        fontSize: 16,
    },
    messageText: {
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
