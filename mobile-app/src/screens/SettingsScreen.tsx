import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { getApiBaseUrl, logout } from '../api/client'
import { AppHeader } from '../components/ui/AppHeader'
import { tabBarHeight } from '../constants/layout'
import { color, radius, shadow } from '../theme'

type Props = {
  onLogout: () => void
  onBack?: () => void
}

export function SettingsScreen({ onLogout, onBack }: Props) {
  const insets = useSafeAreaInsets()

  async function handleLogout() {
    await logout()
    onLogout()
  }

  return (
    <View style={styles.root}>
      <AppHeader title="Settings" subtitle="This device and account" showBack={!!onBack} onBack={onBack} />
      <ScrollView
        contentContainerStyle={{
          paddingBottom: tabBarHeight(insets.bottom) + 24,
        }}
        showsVerticalScrollIndicator={false}
      >

      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>A</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>Administrator</Text>
          <Text style={styles.profileMeta}>Full access · this device</Text>
        </View>
      </View>

      <Text style={styles.groupLabel}>Connection</Text>
      <View style={styles.group}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={styles.iconWrap}>
              <MaterialIcons name="cloud" size={18} color={color.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>API</Text>
              <Text style={styles.description} selectable numberOfLines={2}>
                {getApiBaseUrl()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.groupLabel}>App</Text>
      <View style={styles.group}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, styles.iconMuted]}>
              <MaterialIcons name="info-outline" size={18} color={color.textSecondary} />
            </View>
            <View>
              <Text style={styles.label}>Version</Text>
              <Text style={styles.description}>0.0.1</Text>
            </View>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, styles.iconMuted]}>
              <MaterialIcons name="smartphone" size={18} color={color.textSecondary} />
            </View>
            <View>
              <Text style={styles.label}>Platform</Text>
              <Text style={styles.description}>{Platform.OS === 'ios' ? 'iOS' : 'Android'}</Text>
            </View>
          </View>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.logout, pressed && { opacity: 0.85 }]}
        onPress={() => void handleLogout()}
      >
        <MaterialIcons name="logout" size={18} color={color.danger} />
        <Text style={styles.logoutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.bg,
  },
  profile: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: color.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...shadow.card,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: color.brandMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: color.brandText,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: color.text,
  },
  profileMeta: {
    fontSize: 13,
    color: color.textSecondary,
    marginTop: 2,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: color.textSecondary,
    marginLeft: 20,
    marginBottom: 8,
  },
  group: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: color.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    overflow: 'hidden',
  },
  row: {
    padding: 14,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: color.brandMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconMuted: {
    backgroundColor: color.surfaceMuted,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: color.text,
  },
  description: {
    fontSize: 13,
    color: color.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: color.border,
    marginLeft: 58,
  },
  logout: {
    marginHorizontal: 16,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: color.dangerMuted,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    color: color.danger,
    fontSize: 15,
    fontWeight: '600',
  },
})
