'use client'

/**
 * Step by step guide to connect an agent (Claude Code, Claude Desktop, any
 * MCP client) to this schedule with an API key.
 *
 * Two paths, in this order:
 * 1. "Let your agent set it up": the copyable prompt, with the icons of the
 *    agents it works with. This is the first thing you read, because it is
 *    the shortest way to a working agent.
 * 2. "Connect it to your agent": the manual path, step by step, for whoever
 *    prefers to do it by hand.
 *
 * The guide is deliberately written for someone who has never used an API:
 * every step says what to do and why it matters, in plain words.
 *
 * The steps keep whole sentences in the dictionaries, with the emphasis marked
 * inside the entry (`richText`), so the Spanish keeps its own word order
 * instead of following the English one fragment by fragment.
 */
import { Hand } from 'lucide-react'
import { AgentSetupPrompt } from '@/components/settings/AgentSetupPrompt'
import { useLocale } from '@/lib/i18n/client'
import { richText } from '@/lib/i18n/rich'

export function ConnectAgentGuide({ origin }: { origin: string }) {
  const { t } = useLocale()

  return (
    <section className="space-y-5 rounded-lg border bg-card p-5 sm:p-6" aria-labelledby="connect-agent-title">
      <div className="space-y-2">
        <h2 id="connect-agent-title" className="text-base font-semibold">{t('settings.guide.title')}</h2>
        <p className="max-w-prose text-sm text-body">
          {t('settings.guide.intro')}
        </p>
      </div>

      <AgentSetupPrompt origin={origin} />

      <div role="separator" aria-orientation="horizontal" className="border-t border-border" />

      <div className="space-y-5">
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Hand aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            <span>{t('settings.guide.manualTitle')}</span>
          </h3>
          <p className="max-w-prose text-sm text-body">
            {t('settings.guide.manualIntro')}
          </p>
        </div>

        {/* [&_p] caps every paragraph at the same readable measure, while the
            code blocks below keep the full width of the card. */}
        <ol className="space-y-5 [&_p]:max-w-prose">
          <li className="space-y-2">
            <StepTitle step={1} title={t('settings.guide.step1Title')} />
            <p className="text-sm text-body">{richText(t('settings.guide.step1Body'))}</p>
            <p className="text-sm text-body">{t('settings.guide.step1Why')}</p>
          </li>

          <li className="space-y-2">
            <StepTitle step={2} title={t('settings.guide.step2Title')} />
            <p className="text-sm text-body">{t('settings.guide.step2Body')}</p>
            <p className="text-sm text-body">{t('settings.guide.step2Why')}</p>
          </li>

          <li className="space-y-2">
            <StepTitle step={3} title={t('settings.guide.step3Title')} />
            <p className="text-sm text-body">{richText(t('settings.guide.step3Body'))}</p>
            <pre className="overflow-x-auto rounded-sm border bg-muted p-3 font-mono text-xs"><code>{mcpJson(origin)}</code></pre>
            <p className="text-sm text-body">{t('settings.guide.step3Why')}</p>
            <p className="text-sm text-body">{richText(t('settings.guide.step3Url'))}</p>
            <p className="text-sm text-body">{richText(t('settings.guide.step3Other'))}</p>
            <p className="text-sm text-body">{t('settings.guide.step3Secret')}</p>
          </li>

          <li className="space-y-2">
            <StepTitle step={4} title={t('settings.guide.step4Title')} />
            <p className="text-sm text-body">{t('settings.guide.step4Body')}</p>
            <pre className="overflow-x-auto rounded-sm border bg-muted p-3 font-mono text-xs"><code>{'cd mcp && npm ci && npm run build && npm start'}</code></pre>
            <p className="text-sm text-body">{t('settings.guide.step4Why')}</p>
          </li>

          <li className="space-y-2">
            <StepTitle step={5} title={t('settings.guide.step5Title')} />
            <p className="text-sm text-body">{richText(t('settings.guide.step5Body'))}</p>
            <p className="text-sm text-body">{richText(t('settings.guide.step5Why'))}</p>
          </li>

          <li className="space-y-2">
            <StepTitle step={6} title={t('settings.guide.step6Title')} />
            <p className="text-sm text-body">{richText(t('settings.guide.step6Body'))}</p>
            <p className="text-sm text-body">{t('settings.guide.step6Why')}</p>
          </li>
        </ol>
      </div>
    </section>
  )
}

function StepTitle({ step, title }: { step: number; title: string }) {
  const { t } = useLocale()
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold">
      <span
        aria-hidden="true"
        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-primary-foreground"
      >
        {step}
      </span>
      <span>{t('settings.guide.stepLabel', { step, title })}</span>
    </h3>
  )
}

function mcpJson(origin: string): string {
  return JSON.stringify(
    {
      mcpServers: {
        turnos: {
          command: 'node',
          args: ['./mcp/dist/index.js'],
          env: {
            MCP_API_URL: origin,
            MCP_API_KEY: 'paste-your-key-here',
          },
        },
      },
    },
    null,
    2,
  )
}
