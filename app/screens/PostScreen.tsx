import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Alert, StyleSheet  } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Video } from "expo-av";
import { useUser } from '@/contexts/UserContext';

export default function PostScreen() {
    const { user, access_token } = useUser();
    const [textContent, setTextContent] = useState("");
    const [mediaType, setMediaType] = useState<"text" | "image" | "video" | null>(null);
    const [mediaUri, setMediaUri] = useState<string | null>(null);
    const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
    const [visibility, setVisibility] = useState<"public" | "followers">("public");

    const pickMedia = async (type: "image" | "video") => {
        const user_id = user?.id;
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: type === "image" 
                ? ImagePicker.MediaTypeOptions.Images 
                : ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            setMediaType(type);
            setMediaUri(result.assets[0].uri);

            if (type === "video") {
                // Placeholder: Generate a thumbnail (would need backend processing)
                setThumbnailUri("thumbnail-placeholder.jpg");
            }
        }
    };

    const handleSubmit = async () => {
        if (!textContent && !mediaUri) {
            Alert.alert("Error", "Please enter text or select media.");
            return;
        }

        const user_id = user?.id;

        let payload: any = {
            user_id,
            media_type: mediaType ?? "text",
            visibility,
        };

        if (textContent) payload.text_content = textContent;
        if (mediaUri) payload.media_link = mediaUri;
        if (thumbnailUri) payload.media_thumbnail = thumbnailUri;

        try {
            const response = await fetch("https://ariesmvp-9903a26b3095.herokuapp.com/api/api/post", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${access_token}`
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                Alert.alert("Success", "Post uploaded successfully!");
                setTextContent("");
                setMediaType(null);
                setMediaUri(null);
                setThumbnailUri(null);
            } else {
                throw new Error("Failed to upload post.");
            }
        } catch (error) {
            console.error("Upload error:", error);
            Alert.alert("Error", "Failed to upload post.");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Create a Post</Text>
            
            <TextInput
                style={styles.input}
                placeholder="What's on your mind?"
                value={textContent}
                onChangeText={setTextContent}
                multiline
            />

            <View style={styles.mediaButtons}>
                <TouchableOpacity onPress={() => pickMedia("image")} style={styles.button}>
                    <Text style={styles.buttonText}>Select Image</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => pickMedia("video")} style={styles.button}>
                    <Text style={styles.buttonText}>Select Video</Text>
                </TouchableOpacity>
            </View>

            {mediaUri && mediaType === "image" && (
                <Image source={{ uri: mediaUri }} style={styles.mediaPreview} />
            )}

            {mediaUri && mediaType === "video" && (
                <Video source={{ uri: mediaUri }} style={styles.mediaPreview} useNativeControls />
            )}

            <View style={styles.visibilitySelector}>
                <Text style={styles.visibilityText}>Visibility: </Text>
                <TouchableOpacity onPress={() => setVisibility("public")}>
                    <Text style={[styles.visibilityOption, visibility === "public" && styles.selectedVisibility]}>
                        Public
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setVisibility("followers")}>
                    <Text style={[styles.visibilityOption, visibility === "followers" && styles.selectedVisibility]}>
                        Followers
                    </Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.postButton} onPress={handleSubmit}>
                <Text style={styles.postButtonText}>Post</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#fff",
    },
    header: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        marginBottom: 10,
    },
    mediaButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    button: {
        flex: 1,
        padding: 10,
        backgroundColor: "#000",
        alignItems: "center",
        borderRadius: 8,
        marginHorizontal: 5,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
    },
    mediaPreview: {
        width: "100%",
        height: 200,
        borderRadius: 8,
        marginVertical: 10,
    },
    visibilitySelector: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    visibilityText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    visibilityOption: {
        marginLeft: 10,
        fontSize: 16,
        color: "#666",
    },
    selectedVisibility: {
        color: "black",
        fontWeight: "bold",
    },
    postButton: {
        padding: 10,
        backgroundColor: "black",
        alignItems: "center",
        borderRadius: 8,
    },
    postButtonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },
});
