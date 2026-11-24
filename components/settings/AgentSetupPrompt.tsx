'use client'

/**
 * Block that gives the person a prompt to paste into their own agent
 * (Claude Code, Cursor, Codex, any agent that can run commands).
 *
 * The prompt does the setup work. Below it we say what the agent will be able
 * to do and what to try, so nobody has to guess if it worked.
 */
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { agentPrompt } from '@/components/settings/agent-prompt'

const WHAT_IT_CAN_DO = [
  'See the shifts of a day, a week or one employee',
  'Create a shift',
  'Move a shift to another time or another person',
  'Delete a shift',
  'Check who covers a time range',
  'List the employees',
]

const WHAT_TO_TRY = [
  'Ask who works on Friday',
  'Ask it to create a test shift, then ask it to delete that same shift',
  'Come back to this page, press Refresh and check that the key says it was used',
]

export function AgentSetupPrompt({ origin }: { origin: string }) {
  const prompt = agentPrompt(origin)

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt)
      toast.success('Copied')
    } catch {
      toast.error('Could not copy the prompt. Select the text and copy it by hand.')
    }
  }

  return (
    <div className="space-y-4 border-t pt-5">
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Let your agent set it up</h4>
        <p className="text-sm text-body">
          Do not want to follow the steps yourself? Copy the text below and paste it into your agent.
          The agent does the setup for you.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">Prompt to paste in your agent</p>
          <Button type="button" variant="outline" size="icon" aria-label="Copy the setup prompt" onClick={copyPrompt}>
            <Copy />
          </Button>
        </div>
        <pre
          role="region"
          aria-label="Prompt to paste in your agent"
          tabIndex={0}
          className="max-h-96 overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words rounded-sm border bg-muted p-3 font-mono text-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          <code>{prompt}</code>
        </pre>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">What you can do once it works</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-body">
          {WHAT_IT_CAN_DO.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">How to try it</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-body">
          {WHAT_TO_TRY.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <p className="text-sm text-body">
        The agent has the same access to the schedule as your account. That is why the key expires on its
        own and why you can revoke it from this page.
      </p>
    </div>
  )
}
