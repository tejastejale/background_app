import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  BackHandler,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";
import * as a from "react-native-background-actions";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notification from "expo-notifications";

const Main = ({ navigation }) => {
  const BackgroundService = a.default;
  const options = {
    taskName: "Background App",
    taskTitle: "Transmitting Location",
    taskDesc: "",
    taskIcon: {
      name: "ic_launcher",
      type: "mipmap",
    },
    // color: "#ff00ff",
    // linkingURI: "yourSchemeHere://chat/jane", // See Deep Linking for more info
    parameters: {
      delay: 3000,
    },
  };
  const [location, setLocation] = useState(null);
  const [userData, setUserData] = useState({});
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    notificationPermission();
    getCurrentLocation();
    getUserData();
    checkService();
  }, []);

  useEffect(() => {
    const backAction = async () => {
      const token = await AsyncStorage.getItem("token"); // Get token from AsyncStorage
      const parsedToken = JSON.parse(token);
      if (parsedToken.data?.token) {
        // If token exists, exit the app
        BackHandler.exitApp();
        return true; // Prevent default back action
      } else {
        return false; // Proceed with default back action
      }
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove(); // Cleanup the listener on unmount
  }, []);

  const checkService = async () => {
    const running = await BackgroundService.isRunning();
    setIsRunning(running);
  };

  const getUserData = async () => {
    try {
      const data = await AsyncStorage.getItem("token");
      const parsedThing = JSON.parse(data);
      if (data) setUserData(parsedThing);
    } catch (error) {
      console.log(error);
    }
  };

  const notificationPermission = async () => {
    try {
      const { status } = await Notification.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Please do enable notifications!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }

      const { status: backgroundStatus } =
        await Location.getBackgroundPermissionsAsync();
      console.log(backgroundStatus);
      if (backgroundStatus !== "granted") Linking.openURL("app-settings:");

      // Watch for location changes continuously
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (newLocation) => {
          setLocation(newLocation.coords);
        }
      );
    } catch (error) {
      console.log(error);
    }
  };

  const sleep = (time) =>
    new Promise((resolve) => setTimeout(() => resolve(), time));

  const veryIntensiveTask = async (taskDataArguments) => {
    const { delay } = taskDataArguments;

    const ws = new WebSocket(
      `wss://api-emergency.mooo.com/ws/user/${userData?.data?.profile?.username}/?token=${userData?.data?.token}`
    );

    ws.onopen = () => {
      console.log("WebSocket connection opened inside background task.");
    };

    ws.onerror = (e) => {
      console.log("WebSocket error:", e.message);
    };

    ws.onclose = (e) => {
      console.log("WebSocket closed.");
    };

    await new Promise(async (resolve) => {
      console.log("object");

      let currentCoords = null;

      // Start location watcher
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (newLocation) => {
          currentCoords = newLocation.coords;
        }
      );

      for (let i = 0; BackgroundService.isRunning(); i++) {
        console.log(i);
        if (ws.readyState === WebSocket.OPEN && currentCoords) {
          const message = JSON.stringify({
            latitude: `${currentCoords.latitude}`,
            longitude: `${currentCoords.longitude}`,
          });
          console.log("Sending :", message);
          ws.send(message);
        } else {
          console.log("WebSocket not open or location not available");
        }

        await sleep(delay);
      }

      if (subscription) subscription.remove();

      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close();
      }

      resolve(); // end the task when done
    });
  };

  const startBG = async () => {
    try {
      if (
        !BackgroundService.isRunning() &&
        userData?.data?.profile?.username &&
        userData?.data?.token &&
        location
      ) {
        await BackgroundService.start(veryIntensiveTask, options);
        await BackgroundService.updateNotification({
          taskDesc: "Service started!",
        });
        setIsRunning(true);
      } else if (!location)
        alert("Unable to get location, Please restart the service!");
      else
        alert("User data has not been loaded or Service is running already!");
    } catch (e) {
      console.error("Start Error:", e);
    }
  };

  const stopBG = async () => {
    try {
      if (BackgroundService.isRunning()) {
        await BackgroundService.stop();
        setIsRunning(false);
        console.log("Service Stoped");
      }
    } catch (e) {
      console.error("Stop Error:", e);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await AsyncStorage.removeItem("token");
      navigation.navigate("Login");
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <View style={tw`flex justify-between gap-10 w-full p-4`}>
      <Text>Is service running: {isRunning ? "Yes" : "No"} </Text>
      <TouchableOpacity
        disabled={isRunning}
        onPress={() => startBG()}
        style={tw`${
          isRunning ? "opacity-50" : ""
        } bg-green-400 w-full rounded-md p-3.5`}
      >
        <Text style={tw`text-white m-auto font-bold text-lg`}>On</Text>
      </TouchableOpacity>
      <TouchableOpacity
        disabled={!isRunning}
        onPress={() => stopBG()}
        style={tw`${
          !isRunning ? "opacity-50" : "opacity-100"
        } w-full rounded-md p-3.5 bg-red-500`}
      >
        <Text style={tw`text-white m-auto font-bold text-lg`}>Off</Text>
      </TouchableOpacity>
      <TouchableOpacity
        disabled={isRunning}
        onPress={() => handleLogout()}
        style={tw`${
          isRunning ? "opacity-50" : "opacity-100"
        } bg-white text-blue-400 border border-blue-400 w-full rounded-md p-3.5`}
      >
        <Text style={tw`text-blue-400 m-auto font-bold text-lg`}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Main;
