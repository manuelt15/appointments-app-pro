'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { Copy, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ApiKey } from '@/types'

export default function SettingsPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [newKey, setNewKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<ApiKey | null>(null)
  const [deleting, setDeleting] = useState(false)
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
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error ?? 'Failed to create key')

      setNewKey(data.data.key)
      setKeys((current) => [...current, data.data])
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

  async function copyKey() {
    if (!newKey) return
    try {
      await navigator.clipboard.writeText(newKey)
      toast.success('Copied')
    } catch {
      toast.error('Could not copy the key')
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b bg-card px-4 py-4 sm:px-6">
        <h1 className="text-xl font-semibold tracking-[-0.02em]">Settings</h1>
        <p className="text-sm text-body">API keys and integrations</p>
      </header>

      <div className="w-full max-w-2xl space-y-6 p-4 sm:p-6">
        {newKey && (
          <section className="space-y-3 rounded-lg border bg-muted p-4" aria-live="polite">
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

        <section className="space-y-5 rounded-lg border bg-card p-5 sm:p-6" aria-labelledby="api-keys-title">
          <div className="space-y-2">
            <h2 id="api-keys-title" className="text-base font-semibold">API keys</h2>
            <p className="text-sm text-body">
              An API key lets a program read and change this schedule without signing in as you.
              It is how the MCP server connects, so you can ask Claude things like who works on
              Friday or to book next week&apos;s shifts.
            </p>
          </div>

          <div className="space-y-2 rounded-md border border-dashed p-4">
            <p className="text-sm font-medium">How to use it</p>
            <p className="text-sm text-body">
              Send it in the <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-xs">x-api-key</code> header on any request:
            </p>
            <pre className="overflow-x-auto rounded-sm border bg-muted p-3 font-mono text-xs"><code>{'curl ' + origin + '/api/shifts \\\n  -H "x-api-key: YOUR_KEY"'}</code></pre>
            <p className="text-sm text-body">
              The key carries the same access as your account, so treat it like a password.
              It is shown once when created, and revoking it cuts off anything still using it.
            </p>
          </div>

          <form onSubmit={createKey} className="flex flex-col gap-2 sm:flex-row sm:items-end" aria-busy={loading}>
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="key-name">Key name</Label>
              <Input id="key-name" value={newKeyName} onChange={(event) => setNewKeyName(event.target.value)} required placeholder="MCP Server" />
            </div>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              <Plus />{loading ? 'Creating…' : 'Create key'}
            </Button>
          </form>

          {listLoading ? (
            <p className="text-sm text-body" role="status">Loading API keys…</p>
          ) : listError ? (
            <div role="alert">
              <p className="text-sm text-body">{listError}</p>
              <Button variant="outline" className="mt-3" onClick={() => { setListLoading(true); setRefreshKey((key) => key + 1) }}>Try again</Button>
            </div>
          ) : keys.length === 0 ? (
            <p className="text-sm text-body">No API keys yet.</p>
          ) : (
            <ul className="divide-y">
              {keys.map((key) => (
                <li key={key._id} className="flex min-w-0 items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{key.name}</p>
                    <p className="text-xs text-body">
                      Created {new Date(key.createdAt).toLocaleDateString()}
                      {key.lastUsedAt && ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" aria-label={`Revoke ${key.name}`} onClick={() => setDeleteTarget(key)}>
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
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
    </div>
  )
}
