import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Video } from "expo-av";
import { useUser } from '@/contexts/UserContext';
import { useFocusEffect } from '@react-navigation/native';
import BottomNav from "@/components/BottomNav";
import * as FileSystem from 'expo-file-system';

interface PostData {
  user_id: string;
  text_content?: string;
  visibility: "public" | "followers";
}

export default function PostScreen({ navigation }: any) {
  const { user, access_token } = useUser();
  const [textContent, setTextContent] = useState("");
  const [mediaType, setMediaType] = useState<"text" | "image" | "video" | null>(null);
  const [mediaFile, setMediaFile] = useState<string | null>(null);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<"public" | "followers">("public");
  const [isPosting, setIsPosting] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const MAX_CHARS = 500;

  useFocusEffect(
    useCallback(() => {
      // Reset the form when screen comes into focus
      return () => {
        // Optional cleanup when leaving screen
      };
    }, [])
  );

  const handleTextChange = (text: string) => {
    if (text.length <= MAX_CHARS) {
      setTextContent(text);
      setCharacterCount(text.length);
    }
  };

  const checkMediaPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        "Permission Required",
        "Please grant media library permissions to upload photos and videos.",
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
  };

  const pickMedia = async (type: "image" | "video") => {
    const hasPermission = await checkMediaPermissions();
    if (!hasPermission) return;

    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === "image"
          ? ImagePicker.MediaTypeOptions.Images
          : ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false, // Changed to false to prevent cropping
        quality: 0.8,
      });

      if (!result.canceled) {
        setMediaType(type);
        setMediaFile(result.assets[0].uri);

        if (type === "video") {
          // In a real app, you'd generate/request a thumbnail here
          setThumbnailUri("thumbnail-placeholder.jpg");
        }
      }
    } catch (error) {
      console.error("Error picking media:", error);
      Alert.alert("Error", "Failed to select media. Please try again.");
    }
  };

  const removeMedia = () => {
    setMediaType(null);
    setMediaFile(null);
    setThumbnailUri(null);
  };

  const validatePost = () => {
    if (!textContent && !mediaFile) {
      Alert.alert("Error", "Please enter text or select media.");
      return false;
    }
    return true;
  };

  const getFileInfo = async (fileUri: string) => {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    const fileNameMatch = fileUri.match(/([^/]+)$/);
    const fileName = fileNameMatch ? fileNameMatch[1] : 'file';
    
    return {
      uri: fileUri,
      name: fileName,
      type: mediaType === 'image' ? 'image/jpeg' : 'video/mp4',
      size: fileInfo.size
    };
  };

  const handleSubmit = async () => {
    if (!validatePost()) return;
    
    setIsPosting(true);
    Keyboard.dismiss();
    
    try {
      // Create FormData object for multipart/form-data submission
      const formData = new FormData();
      
      // Add text fields
      formData.append('user_id', user?.id);
      formData.append('visibility', visibility);
      
      if (textContent) {
        formData.append('text_content', textContent);
      }
      
      // Add media file if present
      if (mediaFile) {
        formData.append('media_type', mediaType);
        
        const fileInfo = await getFileInfo(mediaFile);
        formData.append('media_file', fileInfo as any);
        
        if (thumbnailUri) {
          const thumbnailInfo = await getFileInfo(thumbnailUri);
          formData.append('media_thumbnail', thumbnailInfo as any);
        }
      }
      
      const response = await fetch("https://ariesmvp-9903a26b3095.herokuapp.com/api/post", {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${access_token}`
        },
        body: formData
      });

      if (response.ok) {
        Alert.alert(
          "Success", 
          "Post uploaded successfully!",
          [{ 
            text: "OK", 
            onPress: () => {
              resetForm();
              navigation.navigate('Feed');
            }
          }]
        );
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload post.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", error.message || "Failed to upload post.");
    } finally {
      setIsPosting(false);
    }
  };

  const resetForm = () => {
    setTextContent("");
    setMediaType(null);
    setMediaFile(null);
    setThumbnailUri(null);
    setCharacterCount(0);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Create a Post</Text>
          <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
            <Text style={styles.cancelButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.userInfo}>
          <Image 
            source={require('../assets/images/pfp.png')} 
            style={styles.profileImage} 
          />
          <View style={styles.userMetaInfo}>
            <Text style={styles.userName}>{`${user?.first_name} ${user?.last_name}` || 'User'}</Text>
            <View style={styles.visibilitySelector}>
              <Ionicons 
                name={visibility === "public" ? "globe-outline" : "people-outline"} 
                size={16} 
                color="#666" 
              />
              <TouchableOpacity 
                onPress={() => setVisibility(visibility === "public" ? "followers" : "public")}
                style={styles.visibilitySelectorButton}
              >
                <Text style={styles.visibilityOption}>
                  {visibility === "public" ? "Public" : "Followers"}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        <TextInput
          style={styles.input}
          placeholder="What's on your mind?"
          value={textContent}
          onChangeText={handleTextChange}
          multiline
          maxLength={MAX_CHARS}
        />
        
        <Text style={styles.characterCounter}>
          {characterCount}/{MAX_CHARS}
        </Text>

        {mediaFile && (
          <View style={styles.mediaPreviewContainer}>
            {mediaType === "image" && (
              <Image source={{ uri: mediaFile }} style={styles.mediaPreview} />
            )}

            {mediaType === "video" && (
              <Video 
                source={{ uri: mediaFile }} 
                style={styles.mediaPreview} 
                useNativeControls 
                resizeMode="contain"
              />
            )}
            
            <TouchableOpacity style={styles.removeMediaButton} onPress={removeMedia}>
              <Ionicons name="close-circle" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.mediaButtons}>
          <TouchableOpacity onPress={() => pickMedia("image")} style={styles.mediaButton}>
            <Ionicons name="image-outline" size={24} color="#555" />
            <Text style={styles.mediaButtonText}>Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => pickMedia("video")} style={styles.mediaButton}>
            <Ionicons name="videocam-outline" size={24} color="#555" />
            <Text style={styles.mediaButtonText}>Video</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[
            styles.postButton, 
            (!textContent && !mediaFile) ? styles.postButtonDisabled : null
          ]} 
          onPress={handleSubmit}
          disabled={isPosting || (!textContent && !mediaFile)}
        >
          {isPosting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
  },
  cancelButton: {
    padding: 5,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userMetaInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: '600',
    fontSize: 16,
  },
  visibilitySelector: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  visibilitySelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 5,
  },
  visibilityOption: {
    fontSize: 14,
    color: "#666",
    marginRight: 3,
  },
  input: {
    borderWidth: 0,
    padding: 10,
    fontSize: 18,
    marginBottom: 10,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCounter: {
    alignSelf: 'flex-end',
    color: "#999",
    fontSize: 12,
    marginBottom: 15,
  },
  mediaPreviewContainer: {
    position: 'relative',
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaPreview: {
    width: "100%",
    height: 250,
    backgroundColor: '#f1f1f1',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
  },
  mediaButtons: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingTop: 15,
    marginBottom: 20,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 25,
    padding: 5,
  },
  mediaButtonText: {
    marginLeft: 5,
    color: "#555",
    fontWeight: "500",
  },
  postButton: {
    padding: 15,
    backgroundColor: "#000",
    alignItems: "center",
    borderRadius: 30,
    marginTop: 10,
  },
  postButtonDisabled: {
    backgroundColor: "#ccc",
  },
  postButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
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