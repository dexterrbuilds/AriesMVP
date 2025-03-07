import React, { useState } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert, SafeAreaView, StatusBar } from "react-native";
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
  const { user } = useUser();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [searchText, setSearchText] = useState<string>("");

  const topics = [
    { id: "1", name: "Mathematics", icon: "calculator-outline" },
    { id: "2", name: "Science", icon: "flask-outline" },
    { id: "3", name: "History", icon: "book-outline" },
    { id: "4", name: "Art", icon: "color-palette-outline" },
    { id: "5", name: "Technology", icon: "hardware-chip-outline" },
    { id: "6", name: "Music", icon: "musical-notes-outline" },
    { id: "7", name: "Programming", icon: "code-slash-outline" },
    { id: "8", name: "Literature", icon: "library-outline" },
    { id: "9", name: "Business", icon: "briefcase-outline" },
    { id: "10", name: "Health", icon: "fitness-outline" },
    { id: "11", name: "Languages", icon: "language-outline" },
  ];

  const toggleTopicSelection = (topicId: string) => {
    if (selectedTopics.includes(topicId)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topicId));
    } else {
      setSelectedTopics([...selectedTopics, topicId]);
    }
  };

  const filteredTopics = topics.filter((topic) =>
    topic.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const getTopicNameById = (id: string) => {
    const topic = topics.find(t => t.id === id);
    return topic ? topic.name : "";
  };

  const handleSubmit = async () => {
    if (selectedTopics.length === 0) {
      Alert.alert("Selection Required", "Please select at least one topic to continue.");
      return;
    }

    const user_id = user?.id;

    const selected_topic_ids = selectedTopics.map(id => parseInt(id, 10));
    

    if (selected_topic_ids.some(isNaN)) {
      Alert.alert("Error", "Invalid topic selection. Please try again.");
      return;
    }

    const payload = {
      user_id,
      role,
      selected_topic_ids
    };

    console.log("Sending payload:", JSON.stringify(payload));

    try {
      const response = await fetch('https://ariesmvp-9903a26b3095.herokuapp.com/api/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Alert.alert("Success", "Your learning preferences have been saved.");
        navigation.navigate('QuickFollow');
      } else {
        const errorData = await response.json();
        console.error("Error:", errorData);
        Alert.alert(
          "Setup Failed", 
          `We couldn't save your preferences. Error: ${JSON.stringify(errorData)}`
        );
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Connection Error", "Please check your network connection and try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <View style={styles.container}>
        <Text style={styles.header}>Personalize Your Learning</Text>
        <Text style={styles.description}>
          Choose topics you're interested in to customize your learning feed
        </Text>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Icon name="search" size={20} color="#6c757d" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search topics..."
              placeholderTextColor="#adb5bd"
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText !== "" && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <Icon name="close-circle" size={20} color="#6c757d" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Selected Topics */}
        {selectedTopics.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Selected Topics ({selectedTopics.length})</Text>
            <View style={styles.selectedTopicsContainer}>
              {selectedTopics.map((topicId) => (
                <View key={topicId} style={styles.selectedTopic}>
                  <Text style={styles.selectedTopicText}>{getTopicNameById(topicId)}</Text>
                  <TouchableOpacity 
                    onPress={() => toggleTopicSelection(topicId)}
                    hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  >
                    <Icon name="close-circle" size={18} color="#495057" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Available Topics</Text>

        {/* Topic Grid */}
        <FlatList
          data={filteredTopics}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.topicGridContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.topicTile,
                selectedTopics.includes(item.id) && styles.selectedTile,
              ]}
              onPress={() => toggleTopicSelection(item.id)}
              activeOpacity={0.7}
            >
              <Icon 
                name={item.icon} 
                size={24} 
                color={selectedTopics.includes(item.id) ? "#1971c2" : "#6c757d"} 
                style={styles.topicIcon}
              />
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="search-outline" size={48} color="#adb5bd" />
              <Text style={styles.emptyText}>No topics match your search</Text>
            </View>
          }
        />

        {/* Next Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              selectedTopics.length === 0 && styles.disabledButton
            ]}
            onPress={handleSubmit}
            disabled={selectedTopics.length === 0}
          >
            <Text style={styles.buttonText}>Continue </Text>
            <Icon name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212529",
    marginTop: 12,
    marginBottom: 4,
  },
  description: {
    fontSize: 16,
    color: "#6c757d",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#343a40",
    marginVertical: 16,
  },
  searchBarContainer: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#212529",
    paddingVertical: 0,
  },
  selectedTopicsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  selectedTopic: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e9ecef",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTopicText: {
    fontSize: 14,
    color: "#495057",
    marginRight: 8,
  },
  topicGridContainer: {
    paddingBottom: 80,
  },
  topicTile: {
    flex: 1,
    margin: 6,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 100,
  },
  selectedTile: {
    backgroundColor: "#e7f5ff",
    borderColor: "#339af0",
    borderWidth: 1,
  },
  topicIcon: {
    marginBottom: 8,
  },
  topicText: {
    fontSize: 14,
    textAlign: "center",
    color: "#495057",
  },
  selectedText: {
    color: "#1971c2",
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#868e96",
    textAlign: "center",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  nextButton: {
    backgroundColor: "#339af0",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: "#adb5bd",
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
});