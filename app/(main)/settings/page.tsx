'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { AlertTriangle, Copy, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingState } from '@/components/ui/loading-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConnectAgentGuide } from '@/components/settings/ConnectAgentGuide'
import { expiryLabel, lastUsedLabel } from '@/components/settings/api-key-status'
import { t as translate } from '@/lib/i18n/translate'
import { useLocale } from '@/lib/i18n/client'
import type { ApiKey } from '@/types'

const EXPIRY_OPTIONS = [
  {
    value: '30',
    labelKey: 'settings.apiKeys.expiry30Label',
    hintKey: 'settings.apiKeys.expiry30Hint',
  },
  {
    value: '90',
    labelKey: 'settings.apiKeys.expiry90Label',
    hintKey: 'settings.apiKeys.expiry90Hint',
  },
  {
    value: '365',
    labelKey: 'settings.apiKeys.expiry365Label',
    hintKey: 'settings.apiKeys.expiry365Hint',
  },
] as const

const DEFAULT_EXPIRY_DAYS = '90'

// A few minutes of margin so a key created for 365 days is never rejected by
// the server for crossing its own 365 day limit by a few seconds.
const SAFETY_MARGIN_MS = 5 * 60 * 1000

export default function SettingsPage() {
  const { locale, t } = useLocale()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [newKey, setNewKey] = useState<string | null>(null)
  const [expiryDays, setExpiryDays] = useState<string>(DEFAULT_EXPIRY_DAYS)
  const [loading, setLoading] = useState(false)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<ApiKey | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [revokeAllOpen, setRevokeAllOpen] = useState(false)
  const [revokingAll, setRevokingAll] = useState(false)
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => 'https://your-app.example'
  )

  useEffect(() => {
    const controller = new AbortController()
    // `t` changes identity on every render of the provider, so the effect
    // depends on the locale string instead: a stable value for the request.
    const errorLabel = translate(locale, 'settings.apiKeys.loadError')

    async function loadKeys() {
      try {
        const response = await fetch('/api/api-keys', { signal: controller.signal })
        if (!response.ok) throw new Error(errorLabel)
        const data = await response.json()
        setKeys(data.data ?? [])
        setListError('')
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setListError(error instanceof Error ? error.message : errorLabel)
      } finally {
        if (!controller.signal.aborted) setListLoading(false)
      }
    }

    loadKeys()
    return () => controller.abort()
  }, [refreshKey, locale])

  async function createKey(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)

    try {
      const expiresAt = new Date(
        Date.now() + Number(expiryDays) * 24 * 60 * 60 * 1000 - SAFETY_MARGIN_MS,
      ).toISOString()
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName, expiresAt }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error ?? t('settings.apiKeys.createError'))

      // The create response also carries the stored hash; it never goes to the list.
      const created = { ...data.data }
      delete created.key
      delete created.keyHash
      setNewKey(data.data.key)
      setKeys((current) => [...current, created])
      setNewKeyName('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('settings.apiKeys.createError'))
    } finally {
      setLoading(false)
    }
  }

  async function deleteKey() {
    if (!deleteTarget) return
    setDeleting(true)

    try {
      const response = await fetch(`/api/api-keys/${deleteTarget._id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(t('settings.apiKeys.revokeError'))
      setKeys((current) => current.filter((key) => key._id !== deleteTarget._id))
      setDeleteTarget(null)
      toast.success(t('settings.apiKeys.revoked'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('settings.apiKeys.revokeError'))
    } finally {
      setDeleting(false)
    }
  }

  async function revokeAllKeys() {
    setRevokingAll(true)

    try {
      const response = await fetch('/api/api-keys?all=1', { method: 'DELETE' })
      if (!response.ok) throw new Error(t('settings.apiKeys.revokeAllError'))
      setKeys([])
      setRevokeAllOpen(false)
      setNewKey(null)
      toast.success(t('settings.apiKeys.revokedAll'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('settings.apiKeys.revokeAllError'))
    } finally {
      setRevokingAll(false)
    }
  }

  async function copyKey() {
    if (!newKey) return
    try {
      await navigator.clipboard.writeText(newKey)
      toast.success(t('settings.apiKeys.copied'))
    } catch {
      toast.error(t('settings.apiKeys.copyError'))
    }
  }

  function refreshKeys() {
    setListLoading(true)
    setRefreshKey((key) => key + 1)
  }

  const expiryHint = t(
    EXPIRY_OPTIONS.find((option) => option.value === expiryDays)?.hintKey ?? 'settings.apiKeys.expiry90Hint',
  )

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b bg-card px-4 py-4 sm:px-6">
        <h1 className="text-xl font-semibold tracking-[-0.02em]">{t('settings.title')}</h1>
        <p className="text-sm text-body">{t('settings.subtitle')}</p>
      </header>

      <div className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
        <p role="status" className="sr-only">{newKey ? t('settings.apiKeys.announceGenerated') : ''}</p>

        {newKey && (
          <section className="mb-6 space-y-3 rounded-lg border bg-muted p-4">
            <div>
              <h2 className="text-sm font-medium">{t('settings.apiKeys.newKeyTitle')}</h2>
              <p className="text-sm text-body">{t('settings.apiKeys.newKeyBody')}</p>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-sm border bg-card px-3 py-2 font-mono text-xs">{newKey}</code>
              <Button type="button" variant="outline" size="icon" aria-label={t('settings.apiKeys.copyNewAria')} onClick={copyKey}>
                <Copy />
              </Button>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setNewKey(null)}>{t('settings.apiKeys.dismiss')}</Button>
          </section>
        )}

        {/* From lg up the two cards sit side by side: the short API keys card on
            the left, the long connection guide on the right. Below lg they stack
            in the same DOM order, so the reading order does not change.
            grid-cols-1 keeps the single column shrinkable, so no text can push
            the page sideways on a narrow screen. */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start">
          <section className="space-y-5 rounded-lg border bg-card p-5 sm:p-6" aria-labelledby="api-keys-title">
            <div className="space-y-2">
              <h2 id="api-keys-title" className="text-base font-semibold">{t('settings.apiKeys.title')}</h2>
              <p className="max-w-prose text-sm text-body">
                {t('settings.apiKeys.intro')}
              </p>
            </div>

            <div role="note" className="flex gap-3 rounded-md border border-warning/40 bg-warning/10 p-4">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-sm font-medium">{t('settings.apiKeys.warningTitle')}</p>
                <p className="max-w-prose text-sm text-body">
                  {t('settings.apiKeys.warningBody')}
                </p>
              </div>
            </div>

            <form onSubmit={createKey} className="max-w-prose space-y-4" aria-busy={loading}>
              <div className="space-y-2">
                <Label htmlFor="key-name">{t('settings.apiKeys.nameLabel')}</Label>
                <Input id="key-name" value={newKeyName} onChange={(event) => setNewKeyName(event.target.value)} required placeholder={t('settings.apiKeys.namePlaceholder')} />
                <p className="text-sm text-body">{t('settings.apiKeys.nameHint')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="key-expiry" id="key-expiry-label">{t('settings.apiKeys.expiryLabel')}</Label>
                <Select value={expiryDays} onValueChange={setExpiryDays}>
                  <SelectTrigger id="key-expiry" aria-labelledby="key-expiry-label" className="w-full sm:w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {EXPIRY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{t(option.labelKey)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-body" aria-live="polite">{expiryHint}</p>
              </div>

              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                <Plus />{loading ? t('settings.apiKeys.creating') : t('settings.apiKeys.create')}
              </Button>
            </form>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-medium">{t('settings.apiKeys.listTitle')}</h3>
                <Button type="button" variant="ghost" size="sm" onClick={refreshKeys} disabled={listLoading}>
                  <RefreshCw />{t('settings.apiKeys.refresh')}
                </Button>
              </div>

              {listLoading ? (
                <LoadingState label={t('settings.apiKeys.listLoading')} />
              ) : listError ? (
                <div role="alert">
                  <p className="text-sm text-body">{listError}</p>
                  <Button variant="outline" className="mt-3" onClick={refreshKeys}>{t('settings.apiKeys.retry')}</Button>
                </div>
              ) : keys.length === 0 ? (
                <p className="text-sm text-body">{t('settings.apiKeys.empty')}</p>
              ) : (
                <ul className="divide-y">
                  {keys.map((key) => {
                    const expiry = expiryLabel(key.expiresAt, locale)
                    return (
                      <li key={key._id} className="flex min-w-0 items-start justify-between gap-4 py-3">
                        <div className="min-w-0 space-y-1">
                          <p className="truncate text-sm font-medium">{key.name}</p>
                          <p className="text-xs text-body">
                            {t('settings.apiKeys.created', { date: new Date(key.createdAt).toLocaleDateString() })}
                          </p>
                          <p className="text-xs text-body">
                            {key.expiresAt
                              ? `${expiry.label} (${new Date(key.expiresAt).toLocaleDateString()})`
                              : expiry.label}
                          </p>
                          <p className="text-xs text-body">{lastUsedLabel(key.lastUsedAt, locale)}</p>
                          {expiry.expired && (
                            <p className="text-xs font-medium text-destructive">{t('settings.apiKeys.expiredNote')}</p>
                          )}
                        </div>
                        <Button type="button" variant="ghost" size="icon" aria-label={t('settings.apiKeys.revokeAria', { name: key.name })} onClick={() => setDeleteTarget(key)}>
                          <Trash2 />
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              )}

              {keys.length > 0 && (
                <div className="flex flex-col gap-2 border-t pt-4">
                  <Button type="button" variant="destructive" size="sm" className="w-full sm:w-auto" onClick={() => setRevokeAllOpen(true)}>
                    {t('settings.apiKeys.revokeAll')}
                  </Button>
                  <p className="max-w-prose text-sm text-body">
                    {t('settings.apiKeys.revokeAllBody')}
                  </p>
                </div>
              )}
            </div>
          </section>

          <ConnectAgentGuide origin={origin} />
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('settings.apiKeys.revokeTitle')}
        description={t('settings.apiKeys.revokeDescription', { name: deleteTarget?.name ?? t('settings.apiKeys.thisKey') })}
        confirmLabel={t('settings.apiKeys.revokeConfirm')}
        loading={deleting}
        onConfirm={deleteKey}
      />

      <ConfirmDialog
        open={revokeAllOpen}
        onOpenChange={(open) => !open && setRevokeAllOpen(false)}
        title={t('settings.apiKeys.revokeAllTitle')}
        description={t('settings.apiKeys.revokeAllDescription')}
        confirmLabel={t('settings.apiKeys.revokeAllConfirm')}
        loading={revokingAll}
        onConfirm={revokeAllKeys}
      />
    </div>
  )
}
