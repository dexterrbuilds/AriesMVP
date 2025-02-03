import React, { useState } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from "react-native-vector-icons/Ionicons";
import { useUser } from '@/contexts/UserContext'; 


type RootStackParamList = {
    ChooseTopic: { role: string };
    QuickFollow: undefined;
  };

type ChooseTopicsScreenProps = NativeStackScreenProps<RootStackParamList, 'ChooseTopic'>;


export default function RegisterScreen({ navigation, route }: ChooseTopicsScreenProps) {
  const { role } = route.params;
  const { user, access_token } = useUser();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [searchText, setSearchText] = useState<string>("");

  const topics = [
    { id: "1", name: "Mathematics" },
    { id: "2", name: "Science" },
    { id: "3", name: "History" },
    { id: "4", name: "Art" },
    { id: "5", name: "Technology" },
    { id: "6", name: "Music" },
    { id: "7", name: "Programming" },
    { id: "8", name: "Literature" },
    { id: "9", name: "Business" },
    { id: "10", name: "Health" },
    { id: "11", name: "Languages" },
  ];

  const toggleTopicSelection = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const filteredTopics = topics.filter((topic) =>
    topic.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSubmit = async () => {
    if (selectedTopics.length === 0) {
      Alert.alert("Please select at least one topic.");
      return;
    }

    const user_id = user?.id;

    const payload = {
      user_id,
      role,
      selected_topic_ids: selectedTopics,
    };

    try {
      const response = await fetch('https://ariesmvp-9903a26b3095.herokuapp.com/api/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Alert.alert("Setup complete!");
        navigation.navigate('QuickFollow');
      } else {
        const errorData = await response.json();
        console.error("Error:", errorData);
        Alert.alert("Failed to complete setup. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("An error occurred. Please check your network connection and try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Choose a language and topics to study</Text>

      {/* Language Selection */}
      <Text style={styles.subHeader}>Language to learn</Text>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Icon name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search topics..."
          placeholderTextColor={"grey"}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Selected Topics */}
      <View style={styles.selectedTopicsContainer}>
        {selectedTopics.map((topic, index) => (
          <View key={index} style={styles.selectedTopic}>
            <Text style={styles.selectedTopicText}>{topic}</Text>
            <TouchableOpacity onPress={() => toggleTopicSelection(topic)}>
              <Text style={styles.removeButton}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <Text style={styles.subHeaderr}>let's personalize your learning feed.</Text>

      {/* Topic Tiles */}
      <FlatList
        data={filteredTopics}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.topicTile,
              selectedTopics.includes(item.id.toString()) && styles.selectedTile,
            ]}
            onPress={() => toggleTopicSelection(item.id)}
          >
            <Text
              style={[
                styles.topicText,
                selectedTopics.includes(item.id) && styles.selectedText,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
        <TouchableOpacity
        style={styles.joinButton}
        onPress={handleSubmit}
        > 
        <Text style={styles.buttonText}>Next </Text>
        </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 100
  },
  subHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subHeaderr: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  selectedTopicsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  selectedTopic: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d9d9d9",
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    marginBottom: 10,
  },
  selectedTopicText: {
    marginRight: 5,
  },
  removeButton: {
    color: "black",
  },
  topicTile: {
    flex: 1,
    margin: 5,
    padding: 15,
    borderRadius: 5,
    backgroundColor: '#d9d9d9',
    alignItems: "center",
    justifyContent: "center",
  },
  selectedTile: {
    backgroundColor: "yellow",
  },
  topicText: {
    fontSize: 14,
  },
  selectedText: {
    color: "black",
    fontWeight: "bold",
  },
  joinButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    position: "absolute",
    bottom: 100,
    right: 40
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
  },
});

