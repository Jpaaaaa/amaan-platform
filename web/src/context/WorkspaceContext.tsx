import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  PLATFORM_PRODUCT_BAZAR,
  isPlatformProductKey,
  type PlatformProductKey,
} from '@shared/platform-product'

const STORAGE_KEY = 'amaan_workspace_product'

type WorkspaceContextValue = {
  product: PlatformProductKey
  setProduct: (product: PlatformProductKey) => void
  ready: boolean
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

function readStoredProduct(): PlatformProductKey {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && isPlatformProductKey(stored)) return stored
  } catch {
    /* private mode or blocked storage */
  }
  return PLATFORM_PRODUCT_BAZAR
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [product, setProductState] = useState<PlatformProductKey>(readStoredProduct)
  const ready = true

  const setProduct = useCallback((next: PlatformProductKey) => {
    setProductState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore quota / privacy errors */
    }
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
