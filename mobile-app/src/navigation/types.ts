import type { NavigatorScreenParams } from '@react-navigation/native'
import type { WorkspaceIntent } from '../lib/workspace-intent'

export type RootStackParamList = {
  Login: undefined
  Main: undefined
}

export type MainTabParamList = {
  Deck: undefined
  Workspaces: WorkspaceIntent | undefined
  More: NavigatorScreenParams<MoreStackParamList> | undefined
}

export type MoreStackParamList = {
  MoreHome: undefined
  Releases: undefined
  Zones: undefined
  Settings: undefined
}

export type InboxStatus = 'pending' | 'declined' | 'approved'
