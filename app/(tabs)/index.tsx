import React from 'react';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { UserProvider } from '@/contexts/UserContext';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import InfoScreen from '../screens/InfoScreen';
import RegisterScreen from '../screens/RegisterScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChooseTopicsScreen from '../screens/ChooseTopicScreen';
import QuickFollowScreen from '../screens/QuickFollowScreen';
import FeedScreen from '../screens/FeedScreen';
import MessagesScreen from '../screens/MessagesScreen';
import NotificationScreen from '../screens/NotificationScreen';
import LoginScreen from '../screens/LoginScreen';
import PostScreen from '../screens/PostScreen';
import UsersProfile from '../screens/UsersProfileScreen';
import SearchScreen from '../screens/SearchScreen';
import EditProfile from '../screens/ProfileEdit';
import SettingsScreen from '../screens/SettingsScreen';
import ConversationScreen from '../screens/ConversationScreen';
import CommentsScreen from '../screens/CommentScreen';
import PostDetailsScreen from '../screens/PostDetailsScreen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';


export type RootStackParamList = {
  Home: undefined;
  Info: undefined;
  Register: undefined;
  Login: undefined;
  RoleSelection: undefined;
  Profile: { user: { first_name: string; last_name: string; avatar?: string; username: string } };
  ChooseTopic: undefined;
  QuickFollow: undefined;
  Feed: undefined;
  Messages: undefined;
  Notifications: undefined;
  Post: undefined;
  UsersProfile: undefined;
  Search: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Conversation: { userName: string };
  Comments: { postId: number };
  PostDetails: { postId: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <UserProvider>
      <NavigationIndependentTree>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Home">
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Info" component={InfoScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }}  />
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }}  />
            <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} options={{ headerShown: false }}  />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }}  />
            <Stack.Screen name="UsersProfile" component={UsersProfile} options={{ headerShown: false }}  />
            <Stack.Screen name="ChooseTopic" component={ChooseTopicsScreen} options={{ headerShown: false }}  />
            <Stack.Screen name="QuickFollow" component={QuickFollowScreen} options={{ headerShown: false }}  />
            <Stack.Screen name="Feed" component={FeedScreen} options={{ headerShown: false }}  />
            <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }}  />
            <Stack.Screen name="Messages" component={MessagesScreen} options={{ headerShown: false }}  />
            <Stack.Screen name="Notifications" component={NotificationScreen} options={{ headerShown: false }}  />
            <Stack.Screen name="Post" component={PostScreen} options={{ headerShown: false }}  />
            <Stack.Screen name="EditProfile" component={EditProfile} options={{ headerShown: false }}  />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }}  />
            <Stack.Screen name="Conversation" component={ConversationScreen} options={{ headerShown: false }}  />
            <Stack.Screen name="Comments" component={CommentsScreen} options={{ headerShown: false }}  />
            <Stack.Screen name="PostDetails" component={PostDetailsScreen} options={{ headerShown: false
            }} />
          </Stack.Navigator>
        </NavigationContainer>
      </NavigationIndependentTree>
    </UserProvider>
    </GestureHandlerRootView>
  );
}