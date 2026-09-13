import type { NavigatorScreenParams } from '@react-navigation/native'
import type { DeviceHealth } from '../utils/deviceDisplay'

export type RootStackParamList = {
  Login: undefined
  Main: undefined
}

export type MainTabParamList = {
  Deck: undefined
  Workspaces: { filter?: DeviceHealth; create?: boolean; inbox?: boolean } | undefined
  More: NavigatorScreenParams<MoreStackParamList> | undefined
}

export type MoreStackParamList = {
  MoreHome: undefined
  Releases: undefined
  Settings: undefined
}

export type InboxStatus = 'pending' | 'declined' | 'approved'
