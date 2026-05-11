import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ChatThreadScreen } from "../screens/chat/ChatThreadScreen";
import { ChatThreadsScreen } from "../screens/chat/ChatThreadsScreen";
import { StreamViewerScreen } from "../screens/streams/StreamViewerScreen";
import type { ChatStackParamList } from "./types";

const Stack = createNativeStackNavigator<ChatStackParamList>();

export function ChatNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ChatThreads" component={ChatThreadsScreen} options={{ title: "Chats" }} />
      <Stack.Screen
        name="ChatThread"
        component={ChatThreadScreen}
        options={({ route }) => ({ title: route.params.title || "Conversation" })}
      />
      <Stack.Screen
        name="CallSession"
        component={StreamViewerScreen}
        options={({ route }) => ({ title: route.params.title || "Live Session" })}
      />
    </Stack.Navigator>
  );
}
