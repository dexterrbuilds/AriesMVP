import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BottomNav = ({ navigation }: any) => {
  return (
    <View style={styles.bottomnav}>
      <TouchableOpacity onPress={() => navigation.navigate("Feed")}>
        <Ionicons name="home-outline" size={30} color="black" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Feed")}>
        <Ionicons name="grid-outline" size={30} color="black" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Messages")}>
        <Ionicons name="chatbox-ellipses-outline" size={30} color="black" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => { navigation.navigate("Profile");}}>
        <Ionicons name="person-outline" size={30} color="black" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomnav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
});

export default BottomNav;
