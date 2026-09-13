import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { PlatformProductKey } from '../types'
import { PLATFORM_PRODUCT_BAZAR, PLATFORM_PRODUCT_KEYS } from '../types'

const STORAGE_KEY = '@amaan_workspace_product'

type WorkspaceContextValue = {
  product: PlatformProductKey
  setProduct: (product: PlatformProductKey) => void
  ready: boolean
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [product, setProductState] = useState<PlatformProductKey>(PLATFORM_PRODUCT_BAZAR)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY)
        if (stored && (PLATFORM_PRODUCT_KEYS as readonly string[]).includes(stored)) {
          setProductState(stored as PlatformProductKey)
        }
      } finally {
        setReady(true)
      }
    })()
  }, [])

  const setProduct = useCallback((next: PlatformProductKey) => {
    setProductState(next)
    void AsyncStorage.setItem(STORAGE_KEY, next)
  }, [])

  const value = useMemo(
    () => ({ product, setProduct, ready }),
    [product, setProduct, ready],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) {
    throw new Error('useWorkspace must be used within WorkspaceProvider')
  }
  return ctx
}
