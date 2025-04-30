import React, { useEffect, useState, useRef } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Pressable,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import tw from "twrnc";
import { Ionicons } from "@expo/vector-icons";
import { makeLogin } from "../API/Auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Login = ({ navigation }) => {
  const [data, setData] = useState({
    username: "",
    password: "",
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState("");
  const slideAnim = useRef(new Animated.Value(100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isError) {
      // Slide Up + Fade In
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.exp),
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 100,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.in(Easing.exp),
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsError("");
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isError]);

  const handleLogin = async () => {
    let body = {
      phone_number: "+91" + data?.username,
      password: data?.password,
    };
    try {
      setIsLoading(true);
      const res = await makeLogin(body);
      setIsLoading(false);
      console.log(JSON.stringify(res, null, 2));
      if (res?.code === 200) {
        try {
          await AsyncStorage.setItem("token", JSON.stringify(res));
        } catch (error) {
          console.log("object", error);
        }
        navigation.navigate("Main");
      } else setIsError("Login failed: " + res?.message || res?.code);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
      setIsError("Something went wrong");
    }
  };

  const handleChange = (name, value) => {
    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <>
      <View
        style={tw`flex bg-sky-100 justify-center items-center p-6 h-full w-full`}
      >
        <View style={tw`m-auto w-full gap-8`}>
          <View style={tw`flex gap-2`}>
            <Text style={tw`text-lg font-medium tracking-wider`}>Username</Text>
            <TextInput
              value={data?.username || ""}
              onChangeText={(e) => handleChange("username", e)}
              style={tw`w-full h-12 bg-white rounded-lg px-4 border border-blue-300`}
            />
          </View>

          <View style={tw`flex gap-2`}>
            <Text style={tw`text-lg font-medium tracking-wider`}>Password</Text>
            <View style={tw`relative`}>
              <TextInput
                onChangeText={(e) => handleChange("password", e)}
                style={tw`w-full h-12 bg-white rounded-lg px-4 pr-14 border border-blue-300`}
                secureTextEntry={!passwordVisible}
                value={data?.password || ""}
              />

              <Pressable
                onPress={() => setPasswordVisible(!passwordVisible)}
                style={tw`absolute right-4 top-3`}
              >
                <Ionicons
                  name={passwordVisible ? "eye-off" : "eye"}
                  size={26}
                  style={tw`text-blue-400`}
                />
              </Pressable>
            </View>
          </View>

          <TouchableOpacity
            disabled={isLoading}
            onPress={() => handleLogin()}
            style={tw`w-full ${
              isLoading ? "bg-gray-100" : "bg-white"
            } p-3 rounded-lg border border-blue-300 h-14`}
          >
            <Text style={tw`text-blue-400 text-center text-lg m-auto`}>
              {isLoading ? <ActivityIndicator /> : " Make a Login "}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Animated Error Message */}
      {isError !== "" && (
        <Animated.View
          style={[
            tw`absolute bg-red-600 bottom-0 p-10 pt-4 w-full`,
            {
              transform: [{ translateY: slideAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Text
            style={tw`m-auto text-lg text-white font-semibold tracking-widest`}
          >
            Something Went Wrong!
          </Text>
          <Text style={tw`m-auto text-white font-semibold tracking-widest`}>
            {isError}
          </Text>
        </Animated.View>
      )}
    </>
  );
};

export default Login;
