import { Ico } from '../components/icons'

export function BackToMore({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      className="mb-4 inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent px-0 py-1 text-sm font-semibold text-label-2 hover:text-label"
      onClick={onBack}
    >
      {Ico.back}
      More
    </button>
  )
}
