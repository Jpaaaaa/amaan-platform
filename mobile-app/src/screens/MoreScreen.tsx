import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { AppHeader } from '../components/ui/AppHeader'
import { tabBarHeight } from '../constants/layout'
import { PRODUCT_META } from '../constants/products'
import { useWorkspace } from '../context/WorkspaceContext'
import { isAmanatProduct } from '../types'
import { color, radius, shadow } from '../theme'

type Module = {
  key: string
  title: string
  subtitle: string
  icon: string
  route?: 'Releases' | 'Zones' | 'Settings'
  soon?: boolean
}

function modulesForProduct(amanat: boolean): { heading: string; items: Module[] }[] {
  return [
  {
    heading: 'Operations',
    items: amanat
      ? [
          {
            key: 'zones',
            title: 'Zones',
            subtitle: 'Neighborhoods · edit on web',
            icon: 'map',
            route: 'Zones',
          },
        ]
      : [
          {
            key: 'releases',
            title: 'Releases',
            subtitle: 'Update packages',
            icon: 'system-update',
            route: 'Releases',
          },
        ],
  },
  {
    heading: 'Coming later',
    items: [
      { key: 'users', title: 'Users & roles', subtitle: 'Permissions', icon: 'people-outline', soon: true },
      { key: 'reports', title: 'Reports', subtitle: 'Exports and summaries', icon: 'bar-chart', soon: true },
      { key: 'finance', title: 'Finance', subtitle: 'Invoices and billing', icon: 'account-balance-wallet', soon: true },
    ],
  },
  {
    heading: 'This device',
    items: [
      {
        key: 'settings',
        title: 'Settings',
        subtitle: 'Account and sign out',
        icon: 'settings',
        route: 'Settings',
      },
    ],
  },
]
}

type MoreRoute = 'Releases' | 'Zones' | 'Settings'

type Props = {
  onOpen: (route: MoreRoute) => void
}

export function MoreScreen({ onOpen }: Props) {
  const insets = useSafeAreaInsets()
  const { product } = useWorkspace()
  const workspace = PRODUCT_META[product]
  const groups = modulesForProduct(isAmanatProduct(product))

  return (
    <View style={styles.root}>
      <AppHeader title="More" subtitle="Modules and settings" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: tabBarHeight(insets.bottom) + 24 }}
        showsVerticalScrollIndicator={false}
      >

      <View style={styles.workspace}>
        <View style={[styles.wsIcon, { backgroundColor: `${workspace.accent}14` }]}>
          <MaterialIcons name={workspace.icon} size={20} color={workspace.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.wsLabel}>Current workspace</Text>
          <Text style={styles.wsName}>{workspace.label}</Text>
          <Text style={styles.wsHint}>Switch this on the Workspaces tab</Text>
        </View>
      </View>

      {groups.map((group) => (
        <View key={group.heading}>
          <Text style={styles.heading}>{group.heading}</Text>
          <View style={styles.group}>
            {group.items.map((item, i) => (
              <Pressable
                key={item.key}
                onPress={() => {
                  if (item.route) onOpen(item.route)
                }}
                disabled={item.soon}
                style={[
                  styles.row,
                  i < group.items.length - 1 && styles.rowBorder,
                  item.soon && { opacity: 0.55 },
                ]}
              >
                <View style={styles.iconWrap}>
                  <MaterialIcons name={item.icon} size={20} color={color.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.sub}>{item.subtitle}</Text>
                </View>
                {item.soon ? (
                  <Text style={styles.soon}>Soon</Text>
                ) : (
                  <MaterialIcons name="chevron-right" size={20} color={color.textTertiary} />
                )}
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.bg,
  },
  workspace: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: color.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...shadow.card,
  },
  wsIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wsLabel: {
    fontSize: 12,
    color: color.textSecondary,
    fontWeight: '500',
  },
  wsName: {
    fontSize: 16,
    fontWeight: '700',
    color: color.text,
    marginTop: 2,
  },
  wsHint: {
    fontSize: 12,
    color: color.textTertiary,
    marginTop: 4,
  },
  heading: {
    fontSize: 12,
    fontWeight: '600',
    color: color.textSecondary,
    marginLeft: 20,
    marginBottom: 8,
    marginTop: 4,
  },
  group: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: color.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    minHeight: 56,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: color.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: color.text,
  },
  sub: {
    fontSize: 12,
    color: color.textSecondary,
    marginTop: 2,
  },
  soon: {
    fontSize: 11,
    fontWeight: '700',
    color: color.textTertiary,
    letterSpacing: 0.4,
  },
})
