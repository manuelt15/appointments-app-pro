'use client'

/**
 * Small row with the agents a person is most likely to use, next to the
 * prompt that lets the agent do the setup for them.
 *
 * The marks are inline SVG components (`AgentLogos.tsx`), not image files:
 * they inherit the theme colour, so the row looks the same in light and dark
 * mode, and nothing draws a box, a border or a background behind them.
 *
 * The glyph is not the only thing that names the agent: every logo also
 * carries its name in the accessible tree (`role="img"` plus `aria-label`)
 * and shows it on hover as a native tooltip.
 */

import { AGENT_LOGOS } from '@/components/settings/AgentLogos'
import { useLocale } from '@/lib/i18n/client'

export function AgentIconRow() {
  const { t } = useLocale()

  return (
    <div className="space-y-2">
      {/* Small label above the marks, the way skills.sh labels its row. */}
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t('settings.icons.worksWith')}
      </p>
      <ul className="flex flex-wrap items-center gap-3">
        {AGENT_LOGOS.map((agent) => {
          const { Glyph } = agent
          return (
            <li key={agent.id} className="flex items-center">
              {/* The mark carries the name in the accessible tree, and the
                  native tooltip comes from the `<title>` inside the SVG. */}
              <Glyph
                className={`${agent.className} text-muted-foreground transition-colors hover:text-foreground`}
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
