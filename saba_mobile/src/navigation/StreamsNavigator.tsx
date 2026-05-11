import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StreamViewerScreen } from "../screens/streams/StreamViewerScreen";
import { StreamsScreen } from "../screens/streams/StreamsScreen";
import type { StreamsStackParamList } from "./types";

const Stack = createNativeStackNavigator<StreamsStackParamList>();

export function StreamsNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="StreamsList" component={StreamsScreen} options={{ title: "Streams" }} />
      <Stack.Screen
        name="StreamViewer"
        component={StreamViewerScreen}
        options={({ route }) => ({ title: route.params.title || "Live Session" })}
      />
    </Stack.Navigator>
  );
}
