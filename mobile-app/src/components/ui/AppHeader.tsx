import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { color, hitSlop, type } from '../../theme'

type Props = {
  title: string
  subtitle?: string
  showBack?: boolean
  onBack?: () => void
  showLogo?: boolean
}

export function AppHeader({
  title,
  subtitle,
  showBack,
  onBack,
  showLogo,
}: Props) {
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        <View style={styles.left}>
          {showBack ? (
            <Pressable
              onPress={onBack}
              hitSlop={hitSlop}
              style={styles.back}
              accessibilityLabel="Back"
            >
              <MaterialIcons name="arrow-back" size={22} color={color.text} />
            </Pressable>
          ) : null}
          {showLogo ? (
            <Image
              source={require('../../../public/amanlogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : null}
          <View style={styles.titles}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: color.bg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  back: {
    marginRight: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 28,
    height: 28,
    marginRight: 10,
  },
  titles: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...type.display,
    fontSize: 24,
  },
  subtitle: {
    ...type.meta,
    marginTop: 2,
  },
})
