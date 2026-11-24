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
import type { ApiKey } from '@/types'

const EXPIRY_OPTIONS = [
  { value: '30', label: '30 days', hint: 'Shortest. Good for a test or a one-off agent.' },
  { value: '90', label: '90 days', hint: 'Recommended. Long enough for daily use, short enough to limit the damage if the key leaks.' },
  { value: '365', label: '365 days', hint: 'Longest. Use it only for an agent that runs every day.' },
] as const

const DEFAULT_EXPIRY_DAYS = '90'

// A few minutes of margin so a key created for 365 days is never rejected by
// the server for crossing its own 365 day limit by a few seconds.
const SAFETY_MARGIN_MS = 5 * 60 * 1000

export default function SettingsPage() {
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

    async function loadKeys() {
      try {
        const response = await fetch('/api/api-keys', { signal: controller.signal })
        if (!response.ok) throw new Error('API keys could not be loaded.')
        const data = await response.json()
        setKeys(data.data ?? [])
        setListError('')
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setListError(error instanceof Error ? error.message : 'API keys could not be loaded.')
      } finally {
        if (!controller.signal.aborted) setListLoading(false)
      }
    }

    loadKeys()
    return () => controller.abort()
  }, [refreshKey])

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
      if (!response.ok) throw new Error(data?.error ?? 'Failed to create key')

      // The create response also carries the stored hash; it never goes to the list.
      const created = { ...data.data }
      delete created.key
      delete created.keyHash
      setNewKey(data.data.key)
      setKeys((current) => [...current, created])
      setNewKeyName('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create key')
    } finally {
      setLoading(false)
    }
  }

  async function deleteKey() {
    if (!deleteTarget) return
    setDeleting(true)

    try {
      const response = await fetch(`/api/api-keys/${deleteTarget._id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to revoke key')
      setKeys((current) => current.filter((key) => key._id !== deleteTarget._id))
      setDeleteTarget(null)
      toast.success('Key revoked')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to revoke key')
    } finally {
      setDeleting(false)
    }
  }

  async function revokeAllKeys() {
    setRevokingAll(true)

    try {
      const response = await fetch('/api/api-keys?all=1', { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to revoke all keys')
      setKeys([])
      setRevokeAllOpen(false)
      setNewKey(null)
      toast.success('All API keys revoked')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to revoke all keys')
    } finally {
      setRevokingAll(false)
    }
  }

  async function copyKey() {
    if (!newKey) return
    try {
      await navigator.clipboard.writeText(newKey)
      toast.success('Copied')
    } catch {
      toast.error('Could not copy the key')
    }
  }

  function refreshKeys() {
    setListLoading(true)
    setRefreshKey((key) => key + 1)
  }

  const expiryHint = EXPIRY_OPTIONS.find((option) => option.value === expiryDays)?.hint ?? ''

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b bg-card px-4 py-4 sm:px-6">
        <h1 className="text-xl font-semibold tracking-[-0.02em]">Settings</h1>
        <p className="text-sm text-body">API keys and integrations</p>
      </header>

      <div className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
        <p role="status" className="sr-only">{newKey ? 'API key generated.' : ''}</p>

        {newKey && (
          <section className="mb-6 space-y-3 rounded-lg border bg-muted p-4">
            <div>
              <h2 className="text-sm font-medium">New API key</h2>
              <p className="text-sm text-body">Copy it now. It won&apos;t be shown again.</p>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-sm border bg-card px-3 py-2 font-mono text-xs">{newKey}</code>
              <Button type="button" variant="outline" size="icon" aria-label="Copy new API key" onClick={copyKey}>
                <Copy />
              </Button>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setNewKey(null)}>Dismiss</Button>
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
              <h2 id="api-keys-title" className="text-base font-semibold">API keys</h2>
              <p className="max-w-prose text-sm text-body">
                An API key is a password for a program, not for a person. A program that has it can read and
                change this schedule without signing in as you. That is how an agent like Claude Code connects,
                so you can ask it who works on Friday or to book next week&apos;s shifts.
              </p>
            </div>

            <div role="note" className="flex gap-3 rounded-md border border-warning/40 bg-warning/10 p-4">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Treat this key like a password</p>
                <p className="max-w-prose text-sm text-body">
                  An API key gives the same access as your account: whoever holds it can read and change the
                  schedule. It is shown only once, when you create it, and it expires on its own. Never paste it
                  into a chat, a commit or a screenshot.
                </p>
              </div>
            </div>

            <form onSubmit={createKey} className="max-w-prose space-y-4" aria-busy={loading}>
              <div className="space-y-2">
                <Label htmlFor="key-name">Key name</Label>
                <Input id="key-name" value={newKeyName} onChange={(event) => setNewKeyName(event.target.value)} required placeholder="Claude Code on my laptop" />
                <p className="text-sm text-body">One key per agent. The name tells you later which one to revoke.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="key-expiry" id="key-expiry-label">Expires after</Label>
                <Select value={expiryDays} onValueChange={setExpiryDays}>
                  <SelectTrigger id="key-expiry" aria-labelledby="key-expiry-label" className="w-full sm:w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {EXPIRY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-body" aria-live="polite">{expiryHint}</p>
              </div>

              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                <Plus />{loading ? 'Creating…' : 'Create key'}
              </Button>
            </form>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-medium">Your keys</h3>
                <Button type="button" variant="ghost" size="sm" onClick={refreshKeys} disabled={listLoading}>
                  <RefreshCw />Refresh
                </Button>
              </div>

              {listLoading ? (
                <LoadingState label="Checking your keys" />
              ) : listError ? (
                <div role="alert">
                  <p className="text-sm text-body">{listError}</p>
                  <Button variant="outline" className="mt-3" onClick={refreshKeys}>Try again</Button>
                </div>
              ) : keys.length === 0 ? (
                <p className="text-sm text-body">No API keys yet. Create one above to connect an agent.</p>
              ) : (
                <ul className="divide-y">
                  {keys.map((key) => {
                    const expiry = expiryLabel(key.expiresAt)
                    return (
                      <li key={key._id} className="flex min-w-0 items-start justify-between gap-4 py-3">
                        <div className="min-w-0 space-y-1">
                          <p className="truncate text-sm font-medium">{key.name}</p>
                          <p className="text-xs text-body">
                            Created {new Date(key.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-body">
                            {key.expiresAt
                              ? `${expiry.label} (${new Date(key.expiresAt).toLocaleDateString()})`
                              : expiry.label}
                          </p>
                          <p className="text-xs text-body">{lastUsedLabel(key.lastUsedAt)}</p>
                          {expiry.expired && (
                            <p className="text-xs font-medium text-destructive">Expired. This key no longer works.</p>
                          )}
                        </div>
                        <Button type="button" variant="ghost" size="icon" aria-label={`Revoke ${key.name}`} onClick={() => setDeleteTarget(key)}>
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
                    Revoke all keys
                  </Button>
                  <p className="max-w-prose text-sm text-body">
                    Use this only when you do not know which key leaked. It cuts off every agent at once, so
                    each one needs a new key afterwards.
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
        title="Revoke API key?"
        description={`${deleteTarget?.name ?? 'This key'} will stop working immediately.`}
        confirmLabel="Revoke key"
        loading={deleting}
        onConfirm={deleteKey}
      />

      <ConfirmDialog
        open={revokeAllOpen}
        onOpenChange={(open) => !open && setRevokeAllOpen(false)}
        title="Revoke all API keys?"
        description="Every key will stop working immediately. All the agents using them lose access at the same time and each one needs a new key."
        confirmLabel="Revoke all keys"
        loading={revokingAll}
        onConfirm={revokeAllKeys}
      />
    </div>
  )
}
