import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ChatNavigator } from "./ChatNavigator";
import { StreamsNavigator } from "./StreamsNavigator";
import { HomeFeedScreen } from "../screens/home/HomeFeedScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { AdminScreen } from "../screens/admin/AdminScreen";
import { AIChatScreen } from "../screens/ai/AIChatScreen";
import { useSessionStore } from "../store/session-store";
import { useAppTheme } from "../hooks/useAppTheme";

const Tab = createBottomTabNavigator();

export function MainTabs() {
  const theme = useAppTheme();
  const roles = useSessionStore((state) => state.roles);
  const isAdmin = roles.includes("ADMIN");

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.subtext,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      }}
    >
      <Tab.Screen name="Home" component={HomeFeedScreen} />
      <Tab.Screen name="Chat" component={ChatNavigator} />
      <Tab.Screen name="Streams" component={StreamsNavigator} />
      <Tab.Screen name="AI" component={AIChatScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      {isAdmin ? <Tab.Screen name="Admin" component={AdminScreen} /> : null}
    </Tab.Navigator>
  );
}
