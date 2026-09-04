import { useCallback } from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { logout } from '../api/client'
import { DevicesScreen } from '../screens/DevicesScreen'
import { ReleasesScreen } from '../screens/ReleasesScreen'
import { SettingsScreen } from '../screens/SettingsScreen'

export type RootStackParamList = {
  Login: undefined
  Main: undefined
}

export type MainTabParamList = {
  Devices: undefined
  Releases: undefined
  Settings: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<MainTabParamList>()

function MainTabs({ onLogout }: { onLogout: () => void }) {
  const onUnauthorized = useCallback(() => {
    void logout()
    onLogout()
  }, [onLogout])

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontWeight: '700', color: '#0f172a' },
        tabBarActiveTintColor: '#0a6cff',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarIcon: ({ color, size }) => {
          const icon =
            route.name === 'Devices'
              ? 'devices'
              : route.name === 'Releases'
                ? 'system-update'
                : 'settings'
          return <MaterialIcons name={icon} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Devices" options={{ title: 'Devices' }}>
        {() => <DevicesScreen onUnauthorized={onUnauthorized} />}
      </Tab.Screen>
      <Tab.Screen name="Releases" options={{ title: 'Releases' }}>
        {() => <ReleasesScreen onUnauthorized={onUnauthorized} />}
      </Tab.Screen>
      <Tab.Screen name="Settings" options={{ title: 'Settings' }}>
        {() => <SettingsScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  )
}

export function AppNavigator() {
  // TODO: re-enable auth — restore token check, booting state, and Login screen
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Main"
    >
      {/* <Stack.Screen name="Login">
        {({ navigation }) => (
          <LoginScreen
            onLoggedIn={() => {
              setSignedIn(true)
              navigation.reset({ index: 0, routes: [{ name: 'Main' }] })
            }}
          />
        )}
      </Stack.Screen> */}
      <Stack.Screen name="Main">
        {() => (
          <MainTabs
            onLogout={() => {
              void logout()
            }}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  )
}
