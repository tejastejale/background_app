import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Main from "./components/Main";
import { createStackNavigator } from "@react-navigation/stack";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import "react-native-gesture-handler";
import Login from "./components/Login";
import tw from "twrnc";
export default function App() {
  const stack = createStackNavigator();
  const [initialRoute, setInitialRoute] = useState("");

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const parsedThing = JSON.parse(token);
        if (parsedThing?.data?.token) setInitialRoute("Main");
        else setInitialRoute("Login");
        return;
      } catch (error) {
        setInitialRoute("Login");
        console.log(error);
      }
    };
    checkToken();
  }, []);

  if (!initialRoute) {
    // Show loading until check is done
    return (
      <View style={tw`flex-1`}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <NavigationContainer>
        <stack.Navigator
          screenOptions={{ gestureEnabled: false, headerLeft: null }}
          initialRouteName={initialRoute}
        >
          <stack.Screen component={Main} name="Main" />
          <stack.Screen component={Login} name="Login" />
        </stack.Navigator>
      </NavigationContainer>
    </View>
  );
}
