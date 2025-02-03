import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { useUser } from '@/contexts/UserContext';

// Define types for navigation


export default function RegisterScreen({ navigation }: any) {
  const { setUser, setAccessToken } = useUser();
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

    const saveToSecureStore = async (key: string, value: string) => {
      try {
        await SecureStore.setItemAsync(key, value);
      } catch (error) {
        console.error('Error saving to SecureStore', error);
      }
    };

  const handleRegister = async () => {
    if (email && password && password === confirmPassword) {
      const requestData = {
        first_name: firstName,
        last_name: lastName,
        username: username,
        email: email,
        password: password,
        password_confirmation: confirmPassword,
      };

      try {
        const response = await fetch('https://ariesmvp-9903a26b3095.herokuapp.com/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });

        const responseData = await response.json();

        if (response.ok) {
          const { user, access_token } = responseData;

          // Save userId and Bearer token to SecureStore
          await saveToSecureStore('userId', user.id.toString());
          await saveToSecureStore('access_token', access_token);
          await saveToSecureStore('user', JSON.stringify(user));  // Save the full user object

          setUser(user);  // Update context
          setAccessToken(access_token);  // Update context

          Alert.alert('Success', `Welcome, ${user.first_name}!`);

          navigation.navigate('RoleSelection', { user });
        } else {
          // Registration failed, show error message
          Alert.alert('Error', responseData.message || 'Registration failed. Please try again.');
        }
      } catch (error) {
        console.error('Error during registration:', error);
        Alert.alert('Error', 'An error occurred. Please try again later.');
      }
    } else {
      Alert.alert('Validation Error', 'Please fill out all fields correctly and make sure passwords match.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create your account</Text>
      <TextInput
        style={styles.input}
        placeholder="First Name"
        placeholderTextColor={"grey"}
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        placeholderTextColor={"grey"}
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor={"grey"}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={"grey"}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={"grey"}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
        <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor={"grey"}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
      >
        <Text style={styles.text}>Sign up </Text>
      </TouchableOpacity>
      <View>
        <Text>Already have an account?        
          <TouchableOpacity
          onPress={() => {
            navigation.navigate("Login");
          }}
          >
          <Text style={styles.loginText}> Login </Text>
          </TouchableOpacity>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 600,
  },
  input: {
    width: '80%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    elevation: 3,
    backgroundColor: 'black',
    width: "80%"
  },
  text: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: 'bold',
    letterSpacing: 0.25,
    color: 'white',
  },
  loginText: {
    fontSize: 14
  }
});
