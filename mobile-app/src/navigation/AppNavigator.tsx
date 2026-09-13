import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import {
  TAB_BAR_CONTENT_HEIGHT,
  TAB_BAR_PADDING_BOTTOM,
  TAB_BAR_PADDING_TOP,
} from '../constants/layout'
import { getStoredToken, logout } from '../api/client'
import { DevicesScreen } from '../screens/DevicesScreen'
import { HomeScreen } from '../screens/HomeScreen'
import { LoginScreen } from '../screens/LoginScreen'
import { MoreScreen } from '../screens/MoreScreen'
import { ReleasesScreen } from '../screens/ReleasesScreen'
import { SettingsScreen } from '../screens/SettingsScreen'
import { ZonesScreen } from '../screens/ZonesScreen'
import { color } from '../theme'
import type { MainTabParamList, MoreStackParamList, RootStackParamList } from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<MainTabParamList>()
const MoreStack = createNativeStackNavigator<MoreStackParamList>()

function MoreStackNav({
  onLogout,
  onUnauthorized,
}: {
  onLogout: () => void
  onUnauthorized: () => void
}) {
  return (
    <MoreStack.Navigator screenOptions={{ headerShown: false }}>
      <MoreStack.Screen name="MoreHome">
        {({ navigation }) => (
          <MoreScreen onOpen={(route) => navigation.navigate(route)} />
        )}
      </MoreStack.Screen>
      <MoreStack.Screen name="Releases">
        {({ navigation }) => (
          <ReleasesScreen
            onUnauthorized={onUnauthorized}
            onBack={() => navigation.goBack()}
          />
        )}
      </MoreStack.Screen>
      <MoreStack.Screen name="Zones">
        {({ navigation }) => <ZonesScreen onBack={() => navigation.goBack()} />}
      </MoreStack.Screen>
      <MoreStack.Screen name="Settings">
        {({ navigation }) => (
          <SettingsScreen onLogout={onLogout} onBack={() => navigation.goBack()} />
        )}
      </MoreStack.Screen>
    </MoreStack.Navigator>
  )
}

function MainTabs({ onLogout }: { onLogout: () => void }) {
  const insets = useSafeAreaInsets()
  const onUnauthorized = useCallback(() => {
    void logout()
    onLogout()
  }, [onLogout])

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: color.brand,
        tabBarInactiveTintColor: color.textTertiary,
        tabBarStyle: {
          backgroundColor: color.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: color.border,
          height:
            TAB_BAR_PADDING_TOP +
            TAB_BAR_CONTENT_HEIGHT +
            TAB_BAR_PADDING_BOTTOM +
            insets.bottom,
          paddingBottom: insets.bottom + TAB_BAR_PADDING_BOTTOM,
          paddingTop: TAB_BAR_PADDING_TOP,
        },
        tabBarLabel: ({ focused, color: tint }) => (
          <Text
            style={[
              styles.tabLabel,
              { color: tint, fontWeight: focused ? '700' : '500' },
            ]}
          >
            {route.name}
          </Text>
        ),
        tabBarIcon: ({ color: tint }) => {
          const icons: Record<string, string> = {
            Deck: 'dashboard',
            Workspaces: 'layers',
            More: 'apps',
          }
          return <MaterialIcons name={icons[route.name] ?? 'circle'} size={22} color={tint} />
        },
      })}
    >
      <Tab.Screen name="Deck" options={{ title: 'Deck' }}>
        {() => <HomeScreen onUnauthorized={onUnauthorized} />}
      </Tab.Screen>
      <Tab.Screen name="Workspaces" options={{ title: 'Workspaces' }}>
        {() => <DevicesScreen onUnauthorized={onUnauthorized} />}
      </Tab.Screen>
      <Tab.Screen name="More" options={{ title: 'More' }}>
        {() => <MoreStackNav onLogout={onLogout} onUnauthorized={onUnauthorized} />}
      </Tab.Screen>
    </Tab.Navigator>
  )
}

export function AppNavigator() {
  const insets = useSafeAreaInsets()
  const [booting, setBooting] = useState(true)
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    void (async () => {
      const started = Date.now()
      const token = await getStoredToken()
      const wait = 400 - (Date.now() - started)
      if (wait > 0) await new Promise<void>((resolve) => setTimeout(resolve, wait))
      setSignedIn(!!token)
      setBooting(false)
    })()
  }, [])

  const handleLogout = useCallback(() => {
    setSignedIn(false)
  }, [])

  if (booting) {
    return (
      <View style={[styles.boot, { paddingTop: insets.top }]}>
        <Image
          source={require('../../public/amanlogo.png')}
          style={styles.bootLogo}
          resizeMode="contain"
        />
        <ActivityIndicator size="small" color={color.brand} style={{ marginTop: 20 }} />
      </View>
    )
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={signedIn ? 'Main' : 'Login'}
    >
      <Stack.Screen name="Login">
        {({ navigation }) => (
          <LoginScreen
            onLoggedIn={() => {
              setSignedIn(true)
              navigation.reset({ index: 0, routes: [{ name: 'Main' }] })
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Main">
        {({ navigation }) => (
          <MainTabs
            onLogout={() => {
              handleLogout()
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
            }}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  )
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.bg,
  },
  bootLogo: {
    width: 72,
    height: 72,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
  },
})
