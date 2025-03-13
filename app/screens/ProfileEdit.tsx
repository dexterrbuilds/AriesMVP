import React, { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator 
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useUser } from '@/contexts/UserContext';
import * as FileSystem from 'expo-file-system'; // Add this import

export default function EditProfile() {
  const { user, access_token } = useUser();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  type FormFields = "name" | "username" | "bio" | "location" | "website";
  const [formData, setFormData] = useState<Record<FormFields, string>>({
    name: user?.first_name || "",
    username: user?.username || "",
    bio: user?.bio || "",
    location: user?.location || "",
    website: user?.website || "",
  });

  const checkMediaPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant media library permissions to upload photos.",
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
  };

  const pickMedia = async () => {
    const hasPermission = await checkMediaPermissions();
    if (!hasPermission) return;

    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Enforce 1:1 crop ratio
        quality: 0.8,
      });

      if (!result.canceled) {
        setMediaUri(result.assets[0].uri); // Show preview
      }
    } catch (error) {
      console.error("Error picking media:", error);
      Alert.alert("Error", "Failed to select media. Please try again.");
    }
  };

  const uploadProfilePicture = async () => {
    if (!mediaUri) {
      Alert.alert("No Image Selected", "Please choose a profile picture first.");
      return;
    }

    setLoading(true);

    try {
      // Get file information
      const fileInfo = await FileSystem.getInfoAsync(mediaUri);
      if (!fileInfo.exists) {
        throw new Error("File doesn't exist");
      }
      
      // Get file name from URI
      const fileName = mediaUri.split('/').pop() || 'profile.jpg';
      
      // Check file type
      const fileType = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') 
        ? 'image/jpeg' 
        : fileName.endsWith('.png') 
          ? 'image/png' 
          : 'image/jpeg'; // Default to jpeg if unknown
      
      // Create form data properly for React Native
      const formData = new FormData();
      formData.append('avatar', {
        uri: mediaUri,
        name: fileName,
        type: fileType,
      } as any);
      
      console.log("Uploading image:", { uri: mediaUri, name: fileName, type: fileType });
      
      // Make the request
      const response = await fetch(
        "https://ariesmvp-9903a26b3095.herokuapp.com/api/profile/avatar", 
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access_token}`,
            Accept: 'application/json',
            // Don't set Content-Type - let it be set automatically with boundary
          },
          body: formData,
        }
      );
      
      // Debug response status
      console.log("Response status:", response.status);
      
      // Get the response data
      let responseData;
      const responseText = await response.text();
      console.log("Raw response:", responseText);
      
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.log("Couldn't parse response as JSON");
        responseData = { message: responseText };
      }
      
      if (response.ok) {
        Alert.alert("Success", "Profile picture updated successfully!");
        setProfileImage(mediaUri); // Save updated profile image
        setMediaUri(null); // Clear preview
      } else {
        Alert.alert("Error", responseData.message || `Failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", `Upload failed: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: FormFields, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <View style={styles.container}>
      {/* Profile Picture Selection */}
      <TouchableOpacity onPress={pickMedia} style={styles.imageContainer}>
        <Image
          source={mediaUri ? { uri: mediaUri } : profileImage ? { uri: profileImage } : require("../assets/images/pfp.png")}
          style={styles.profileImage}
        />
        <Text style={styles.editText}>Change Photo</Text>
      </TouchableOpacity>

      {/* Form Fields - kept for future implementation */}
      <View style={styles.form}>
        {Object.keys(formData).map((field) => (
          <View key={field} style={styles.inputContainer}>
            <Text style={styles.label}>{field.charAt(0).toUpperCase() + field.slice(1)}</Text>
            <TextInput
              style={styles.input}
              value={formData[field as FormFields]}
              placeholder={`Enter ${field}`}
              placeholderTextColor="#aaa"
              onChangeText={(text) => handleChange(field as FormFields, text)}
              editable={false} // Temporarily disabled until profile endpoint is ready
            />
          </View>
        ))}
      </View>

      {/* Upload Avatar Button */}
      <TouchableOpacity 
        onPress={uploadProfilePicture} 
        style={[styles.saveButton, (!mediaUri || loading) && styles.disabledButton]} 
        disabled={!mediaUri || loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
      </TouchableOpacity>
    </View>
  );
}

// Styles remain unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#ddd",
  },
  editText: {
    position: "absolute",
    bottom: -15,
    backgroundColor: "#eee",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
  },
  form: {
    marginTop: 10,
  },
  inputContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 8,
    fontSize: 16,
    color: "#999", // Lighter color to indicate disabled state
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: "red",
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});