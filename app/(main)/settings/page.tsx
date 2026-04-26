'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Copy, Trash2, Plus } from 'lucide-react'
import type { ApiKey } from '@/types'

export default function SettingsPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [newKey, setNewKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/api-keys')
      .then((r) => r.json())
      .then((d) => setKeys(d.data ?? []))
  }, [])

  async function createKey(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? 'Failed to create key')
    } else {
      setNewKey(data.data.key)
      setKeys((prev) => [...prev, data.data])
      setNewKeyName('')
    }
    setLoading(false)
  }

  async function deleteKey(id: string) {
    await fetch(`/api/api-keys/${id}`, { method: 'DELETE' })
    setKeys((prev) => prev.filter((k) => k._id !== id))
    toast.success('Key revoked')
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-[#d2d2d7] bg-white">
        <h1 className="text-xl font-semibold text-[#1d1d1f]">Settings</h1>
        <p className="text-sm text-[#6e6e73]">Manage API keys and integrations</p>
      </div>
      <div className="flex-1 p-6 max-w-2xl space-y-6">
        {newKey && (
          <div className="bg-[#f5f5f7] rounded-2xl border border-[#d2d2d7] p-4 space-y-2">
            <p className="text-sm font-medium text-[#1d1d1f]">New API key — copy it now, it won't be shown again</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-[#1d1d1f] bg-white border border-[#d2d2d7] rounded-lg px-3 py-2 truncate">{newKey}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(newKey); toast.success('Copied') }}
                className="p-2 text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <button onClick={() => setNewKey(null)} className="text-xs text-[#6e6e73] hover:text-[#1d1d1f]">Dismiss</button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-[#d2d2d7] p-6 space-y-4">
          <h2 className="text-base font-semibold text-[#1d1d1f]">API Keys</h2>
          <form onSubmit={createKey} className="flex gap-2">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              required
              placeholder="Key name (e.g. MCP Server)"
              className="flex-1 rounded-lg border border-[#86868b] px-3 py-2 text-sm text-[#1d1d1f] placeholder-[#6e6e73] focus:border-[#0071e3] focus:outline-none focus:ring-1 focus:ring-[#0071e3]"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 py-2 px-4 rounded-full bg-[#0071e3] text-white text-sm font-medium hover:bg-[#0066cc] transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Create
            </button>
          </form>

          {keys.length === 0 ? (
            <p className="text-sm text-[#6e6e73]">No API keys yet.</p>
          ) : (
            <ul className="divide-y divide-[#d2d2d7]">
              {keys.map((key) => (
                <li key={key._id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-[#1d1d1f]">{key.name}</p>
                    <p className="text-xs text-[#6e6e73]">
                      Created {new Date(key.createdAt).toLocaleDateString()}
                      {key.lastUsedAt && ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteKey(key._id)}
                    className="p-2 text-[#6e6e73] hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
