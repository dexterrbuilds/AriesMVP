import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import * as ImagePicker from "expo-image-picker";

export default function EditProfile() {
  const [profileImage, setProfileImage] = useState(null);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    bio: "",
    location: "",
    website: "",
  });

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

  const pickMedia = async (type: "image") => {
    const hasPermission = await checkMediaPermissions();
    if (!hasPermission) return;

    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === "image"
          ? ImagePicker.MediaTypeOptions.Images
          : ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setMediaUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking media:", error);
      Alert.alert("Error", "Failed to select media. Please try again.");
    }
  };

  const removeMedia = () => {
    setMediaUri(null);
  };

  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickMedia} style={styles.imageContainer}>
        <Image
          source={profileImage ? { uri: profileImage } : require('../assets/images/pfp.png')}
          style={styles.profileImage}
        />
        <Text style={styles.editText}>Edit picture</Text>
      </TouchableOpacity>

      <View style={styles.form}>
        {["Name", "Username", "Bio", "Location", "Website"].map((field) => (
          <View key={field} style={styles.inputContainer}>
            <Text style={styles.label}>{field}</Text>
            <TextInput
              style={styles.input}
              placeholder={field}
              placeholderTextColor="#aaa"
              value={formData[field.toLowerCase()]}
              onChangeText={(text) => handleChange(field.toLowerCase(), text)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editText: {
    color: "red",
    marginTop: 8,
    fontSize: 14,
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
    color: "#333",
  },
});
