import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { getStoredToken, logout } from '../api/client'
import { DevicesScreen } from '../screens/DevicesScreen'
import { LoginScreen } from '../screens/LoginScreen'
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
  const [booting, setBooting] = useState(true)
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    void getStoredToken().then((token) => {
      setSignedIn(Boolean(token))
      setBooting(false)
    })
  }, [])

  const onLogout = useCallback(() => {
    void logout()
    setSignedIn(false)
  }, [])

  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator color="#0a6cff" />
      </View>
    )
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {signedIn ? (
        <Stack.Screen name="Main">
          {() => <MainTabs onLogout={onLogout} />}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="Login">
          {() => <LoginScreen onLoggedIn={() => setSignedIn(true)} />}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  )
}
