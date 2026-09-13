/** Tab bar content height (icons + label), excluding system bottom inset */
export const TAB_BAR_CONTENT_HEIGHT = 56

/** Extra padding above tab icons inside the bar */
export const TAB_BAR_PADDING_TOP = 10

/** Extra padding below tab icons, added on top of safe area inset */
export const TAB_BAR_PADDING_BOTTOM = 8

export function tabBarHeight(bottomInset: number): number {
  return (
    TAB_BAR_PADDING_TOP +
    TAB_BAR_CONTENT_HEIGHT +
    TAB_BAR_PADDING_BOTTOM +
    bottomInset
  )
}
