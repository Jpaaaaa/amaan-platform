import { useRef } from 'react'
import type { PlatformUpdateFileEntry } from '@shared/types/app-update'
import {
  bentoCard,
  bentoTitle,
  cn,
  deviceCard,
  emptyState,
  m3BtnPrimary,
  m3BtnText,
  m3BtnTonal,
} from '../lib/ui'
import { fmtBytes, fmtDateTime, isPublishable } from './format'

const Ico = {
  refresh: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"></polyline>
      <polyline points="1 20 1 14 7 14"></polyline>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
  ),
  upload: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  ),
  trash: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  ),
  copy: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  ),
  broadcast: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"></path>
      <path d="M12 5l7 7-7 7"></path>
    </svg>
  ),
}

export function ArtifactsPanel({
  feedUrl,
  files,
  loading,
  uploading,
  uploadPct,
  dragOver,
  publishing,
  deleting,
  onRefresh,
  onCopyFeedUrl,
  onDrop,
  onDragOver,
  onDragLeave,
  onUploadInput,
  onPublish,
  onDelete,
}: {
  feedUrl: string
  files: PlatformUpdateFileEntry[] | null
  loading: boolean
  uploading: boolean
  uploadPct: number | null
  dragOver: boolean
  publishing: string | null
  deleting: string | null
  onRefresh: () => void
  onCopyFeedUrl: () => void
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  onDragLeave: () => void
  onUploadInput: (files: FileList) => void
  onPublish: (name: string) => void
  onDelete: (name: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-5">
        <section className={cn(bentoCard, 'mb-0')}>
          <h3 className={bentoTitle}>Distribution Feed</h3>
          <div className="flex items-center gap-3">
            <code className="flex-1 overflow-x-auto rounded-xl border border-obsidian-border bg-[#f8fafc] px-3.5 py-2.5 font-mono text-[0.6875rem] text-on-surface-variant">
              {feedUrl}
            </code>
            <button
              className={cn(m3BtnTonal, 'h-10 w-10 rounded-xl p-0')}
              onClick={onCopyFeedUrl}
              title="Copy URL"
              type="button"
            >
              {Ico.copy}
            </button>
          </div>
        </section>

        <section
          className={cn(
            bentoCard,
            'mb-0 flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-[#e2e8f0]',
            dragOver && 'border-brand/40 bg-brand/5',
          )}
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div className="mb-2 text-brand">{Ico.upload}</div>
          <div className="text-[0.8125rem] font-extrabold uppercase tracking-wider text-label">
            {uploading ? `Uploading ${uploadPct}%` : 'Upload Artifact'}
          </div>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && onUploadInput(e.target.files)} />
        </section>
      </div>

      <section className={bentoCard}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className={cn(bentoTitle, 'mb-0')}>Storage Artifacts</h3>
          <button
            className={cn(m3BtnText, 'h-8 w-8 p-0')}
            onClick={onRefresh}
            disabled={loading}
            type="button"
          >
            {Ico.refresh}
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {files?.map((f) => (
            <div key={f.name} className={cn(deviceCard, 'cursor-default')}>
              <div className="flex flex-col gap-1">
                <span className="text-[0.9375rem] font-bold text-label">{f.name}</span>
                <span className="font-mono text-xs tracking-wide text-on-surface-variant">
                  {fmtBytes(f.sizeBytes)} · {fmtDateTime(f.modifiedAtMs)}
                </span>
              </div>
              <div className="flex gap-2">
                {isPublishable(f.name) && (
                  <button
                    type="button"
                    className={cn(m3BtnPrimary, 'h-9 rounded-[10px] px-3 text-[0.6875rem] font-extrabold')}
                    onClick={() => onPublish(f.name)}
                    disabled={publishing === f.name}
                  >
                    {Ico.broadcast} PUBLISH
                  </button>
                )}
                <button
                  type="button"
                  className={cn(m3BtnText, 'h-9 w-9 p-0 text-red-500')}
                  onClick={() => onDelete(f.name)}
                  disabled={deleting === f.name}
                >
                  {Ico.trash}
                </button>
              </div>
            </div>
          ))}
          {(!files || files.length === 0) && (
            <div className={cn(emptyState, 'py-5')}>
              <p className="text-sm text-on-surface-variant">No artifacts found in storage.</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
