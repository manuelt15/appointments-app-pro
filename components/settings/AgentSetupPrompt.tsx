'use client'

/**
 * Block that gives the person a prompt to paste into their own agent
 * (Claude Code, Cursor, Codex, any agent that can run commands).
 *
 * The prompt does the setup work. Below it we say what the agent will be able
 * to do and what to try, so nobody has to guess if it worked.
 *
 * The prompt itself is English on purpose: it is read by an agent, not by the
 * person, and `agent-prompt.ts` keeps it that way. Only the text around it is
 * translated.
 */
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { AgentIconRow } from '@/components/settings/AgentIconRow'
import { agentPrompt } from '@/components/settings/agent-prompt'
import { useLocale } from '@/lib/i18n/client'

const WHAT_IT_CAN_DO = [
  'settings.prompt.canDo1',
  'settings.prompt.canDo2',
  'settings.prompt.canDo3',
  'settings.prompt.canDo4',
  'settings.prompt.canDo5',
  'settings.prompt.canDo6',
]

const WHAT_TO_TRY = ['settings.prompt.try1', 'settings.prompt.try2', 'settings.prompt.try3']

export function AgentSetupPrompt({ origin }: { origin: string }) {
  const { t } = useLocale()
  const prompt = agentPrompt(origin)
  const promptLabel = t('settings.prompt.label')

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt)
      toast.success(t('settings.prompt.copied'))
    } catch {
      toast.error(t('settings.prompt.copyError'))
    }
  }

  return (
    <div className="space-y-4 [&_p]:max-w-prose">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">{t('settings.prompt.title')}</h3>
        <p className="text-sm text-body">
          {t('settings.prompt.intro')}
        </p>
      </div>

      <AgentIconRow />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">{promptLabel}</p>
          <Button type="button" variant="outline" size="icon" aria-label={t('settings.prompt.copyAria')} onClick={copyPrompt}>
            <Copy />
          </Button>
        </div>
        <pre
          role="region"
          aria-label={promptLabel}
          tabIndex={0}
          className="max-h-96 overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words rounded-sm border bg-muted p-3 font-mono text-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          <code>{prompt}</code>
        </pre>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">{t('settings.prompt.canDoTitle')}</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-body">
          {WHAT_IT_CAN_DO.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">{t('settings.prompt.tryTitle')}</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-body">
          {WHAT_TO_TRY.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
      </div>

      <p className="text-sm text-body">
        {t('settings.prompt.footnote')}
      </p>
    </div>
  )
}
