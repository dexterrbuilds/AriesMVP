import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useUser } from '@/contexts/UserContext';
import { AntDesign, Feather } from '@expo/vector-icons';

export default function RegisterScreen({ navigation }: any) {
  const { setUser, setAccessToken } = useUser();
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleRegister = async () => {
    if (email && password && password === confirmPassword) {
      setIsLoading(true);
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
          const { user, token } = responseData;

          // Create a new user object including the token
          const userWithToken = { ...user, token };

          // Save the full user object to SecureStore as a string
          await SecureStore.setItemAsync('user', JSON.stringify(userWithToken));
          await SecureStore.setItemAsync('token', JSON.stringify(token)); // Also save token separately

          // Update context
          setUser(userWithToken);
          setAccessToken(token);
          
          Alert.alert('Success', `Welcome, ${user.first_name}!`);
          navigation.navigate('RoleSelection', { user });
        } else {
          // Registration failed, show error message
          Alert.alert('Error', responseData.message || 'Registration failed. Please try again.');
        }
      } catch (error) {
        console.error('Error during registration:', error);
        Alert.alert('Error', 'An error occurred. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    } else {
      Alert.alert('Validation Error', 'Please fill out all fields correctly and make sure passwords match.');
    }
  };

  const renderInputIcon = (iconName: string) => {
    return <AntDesign name={iconName} size={20} color="black" style={styles.inputIcon} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.header}>Create your account</Text>
            <Text style={styles.subheader}>Please fill in the details below to get started</Text>
          </View>
          
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              {renderInputIcon("user")}
              <TextInput
                style={styles.input}
                placeholder="First Name"
                placeholderTextColor={"#999"}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
            </View>
            
            <View style={styles.inputContainer}>
              {renderInputIcon("user")}
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                placeholderTextColor={"#999"}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>
            
            <View style={styles.inputContainer}>
              {renderInputIcon("idcard")}
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor={"#999"}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputContainer}>
              {renderInputIcon("mail")}
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={"#999"}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputContainer}>
              {renderInputIcon("lock")}
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={"#999"}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity 
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputContainer}>
              {renderInputIcon("lock")}
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor={"#999"}
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity 
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <Text style={styles.buttonText}>Creating account...</Text>
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("Login");
              }}
            >
              <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  header: {
    fontSize: 28,
    marginBottom: 8,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  subheader: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 56,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
  },
  passwordToggle: {
    padding: 8,
  },
  button: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#4a90e2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#a0c5f2',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 16,
    color: '#666',
  },
  loginText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a90e2',
    marginLeft: 6,
  },
});