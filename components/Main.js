import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import * as a from "react-native-background-actions";
import * as Location from "expo-location";

const Main = () => {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  async function getCurrentLocation() {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }

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
  }

  const BackgroundService = a.default;

  const options = {
    taskName: "Example",
    taskTitle: "ExampleTask title",
    taskDesc: "ExampleTask description",
    taskIcon: {
      name: "ic_launcher",
      type: "mipmap",
    },
    color: "#ff00ff",
    linkingURI: "yourSchemeHere://chat/jane", // See Deep Linking for more info
    parameters: {
      delay: 3000,
    },
  };

  const sleep = (time) =>
    new Promise((resolve) => setTimeout(() => resolve(), time));

  const veryIntensiveTask = async (taskDataArguments) => {
    const { delay } = taskDataArguments;

    const ws = new WebSocket("wss://echo.websocket.org/");

    ws.onopen = () => {
      console.log("WebSocket connection opened inside background task.");
    };

    ws.onmessage = (e) => {
      console.log("Received:   ", e.data);
      BackgroundService.updateNotification({
        taskDesc: "Received: " + e.data,
      });
    };

    ws.onerror = (e) => {
      console.log("WebSocket error:", e.message);
    };

    ws.onclose = (e) => {
      console.log("WebSocket closed.");
    };

    await new Promise(async (resolve) => {
      let counter = 0;
      for (let i = 0; BackgroundService.isRunning(); i++) {
        console.log(i);
        if (ws.readyState === WebSocket.OPEN && location) {
          const message = JSON.stringify({
            latitude: location.latitude,
            longitude: location.longitude,
            message: `Sending location #${counter++}`,
          });
          console.log("Sending :", message);
          ws.send(message);
        } else {
          console.log("WebSocket not open yet or no location data.");
        }

        await sleep(delay);
      }

      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close();
      }
    });
  };

  const startBG = async () => {
    try {
      if (!BackgroundService.isRunning()) {
        await BackgroundService.start(veryIntensiveTask, options);
        await BackgroundService.updateNotification({
          taskDesc: "Service started!",
        });
      }
    } catch (e) {
      console.error("Start Error:", e);
    }
  };

  const stopBG = async () => {
    try {
      if (BackgroundService.isRunning()) {
        await BackgroundService.stop();
      }
    } catch (e) {
      console.error("Stop Error:", e);
    }
  };

  return (
    <View style={tw`flex justify-center gap-10 w-full p-4`}>
      <TouchableOpacity
        onPress={() => startBG()}
        style={tw`bg-green-400 w-full rounded-md p-3.5`}
      >
        <Text style={tw`text-white m-auto font-bold text-lg`}>On</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => stopBG()}
        style={tw`bg-red-400 w-full rounded-md p-3.5`}
      >
        <Text style={tw`text-white m-auto font-bold text-lg`}>Off</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({});

export default Main;
