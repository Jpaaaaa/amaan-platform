import { useState } from 'react'
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { PRODUCT_META, PRODUCT_OPTIONS } from '../constants/products'
import { useWorkspace } from '../context/WorkspaceContext'
import { color, radius } from '../theme'
import type { PlatformProductKey } from '../types'

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

function animate() {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
}

export function WorkspaceSwitcher() {
  const { product, setProduct } = useWorkspace()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const meta = PRODUCT_META[product]
  const showSearch = PRODUCT_OPTIONS.length > 5
  const q = query.trim().toLowerCase()
  const options = PRODUCT_OPTIONS.filter((opt) => {
    if (!q) return true
    return (
      opt.label.toLowerCase().includes(q) ||
      opt.short.toLowerCase().includes(q) ||
      opt.blurb.toLowerCase().includes(q)
    )
  })

  function toggle() {
    animate()
    setOpen((v) => {
      if (v) setQuery('')
      return !v
    })
  }

  function choose(key: PlatformProductKey) {
    setProduct(key)
    animate()
    setOpen(false)
    setQuery('')
  }

  return (
    <View style={styles.card}>
      <Pressable
        onPress={toggle}
        style={styles.trigger}
        accessibilityRole="button"
        accessibilityLabel={`Workspace ${meta.label}`}
        accessibilityState={{ expanded: open }}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${meta.accent}14` }]}>
          <MaterialIcons name={meta.icon} size={18} color={meta.accent} />
        </View>
        <View style={styles.triggerText}>
          <Text style={styles.kicker}>Workspace</Text>
          <Text style={styles.triggerLabel}>{meta.label}</Text>
        </View>
        <MaterialIcons
          name={open ? 'expand-less' : 'expand-more'}
          size={24}
          color={color.textTertiary}
        />
      </Pressable>

      {open ? (
        <View style={styles.panel}>
          {showSearch ? (
            <View style={styles.search}>
              <MaterialIcons name="search" size={16} color={color.textTertiary} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Search workspaces"
                placeholderTextColor={color.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          ) : null}
          {options.map((opt) => {
            const active = opt.key === product
            return (
              <Pressable
                key={opt.key}
                onPress={() => choose(opt.key)}
                style={[styles.option, active && styles.optionActive]}
              >
                <View style={[styles.iconWrap, { backgroundColor: `${opt.accent}14` }]}>
                  <MaterialIcons name={opt.icon} size={18} color={opt.accent} />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionLabel}>{opt.label}</Text>
                  <Text style={styles.optionBlurb}>{opt.blurb}</Text>
                </View>
                {active ? (
                  <MaterialIcons name="check" size={20} color={color.brand} />
                ) : null}
              </Pressable>
            )
          })}
          {options.length === 0 ? (
            <Text style={styles.empty}>No matching workspaces</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    overflow: 'hidden',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    minHeight: 56,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerText: {
    flex: 1,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '600',
    color: color.textTertiary,
    marginBottom: 1,
  },
  triggerLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: color.text,
  },
  panel: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.border,
    padding: 8,
    gap: 4,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: color.surfaceMuted,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    marginBottom: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: color.text,
    padding: 0,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 10,
  },
  optionActive: {
    backgroundColor: color.brandMuted,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: color.text,
  },
  optionBlurb: {
    fontSize: 12,
    color: color.textSecondary,
    marginTop: 2,
  },
  empty: {
    fontSize: 13,
    color: color.textTertiary,
    textAlign: 'center',
    paddingVertical: 12,
  },
})
