'use client'

/**
 * Step by step guide to connect an agent (Claude Code, Claude Desktop, any
 * MCP client) to this schedule with an API key.
 *
 * The guide is deliberately written for someone who has never used an API:
 * every step says what to do and why it matters, in plain words.
 */
import { AgentSetupPrompt } from '@/components/settings/AgentSetupPrompt'

export function ConnectAgentGuide({ origin }: { origin: string }) {
  return (
    <section className="space-y-5 rounded-lg border bg-card p-5 sm:p-6" aria-labelledby="connect-agent-title">
      <div className="space-y-2">
        <h3 id="connect-agent-title" className="text-base font-semibold">Connect an agent</h3>
        <p className="text-sm text-body">
          An agent is a program like Claude Code that reads and changes your schedule for you.
          It needs an API key to know which schedule is yours. Follow these steps in order.
        </p>
      </div>

      <ol className="space-y-5">
        <li className="space-y-2">
          <StepTitle step={1} title="Create the key" />
          <p className="text-sm text-body">
            Scroll up to <strong>Create a key</strong>, give it a name that says where the key will live
            (for example <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-xs">Claude Code on my laptop</code>)
            and choose how long it should last.
          </p>
          <p className="text-sm text-body">
            Why: one key per agent. If two programs share a key, revoking it stops both, and you cannot
            tell which one was the problem.
          </p>
        </li>

        <li className="space-y-2">
          <StepTitle step={2} title="Copy the key right away" />
          <p className="text-sm text-body">
            The new key appears in a box at the top of this page with a copy button. Copy it now.
          </p>
          <p className="text-sm text-body">
            Why: the app shows the key only once, at the moment you create it. Nobody, not even support,
            can show it again later. If you lose it, you create a new one.
          </p>
        </li>

        <li className="space-y-2">
          <StepTitle step={3} title="Save it where the agent reads it" />
          <p className="text-sm text-body">
            In the project where the agent runs, create a file called <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-xs">.mcp.json</code>
            with this content, and paste the key you just copied:
          </p>
          <pre className="overflow-x-auto rounded-sm border bg-muted p-3 font-mono text-xs"><code>{mcpJson(origin)}</code></pre>
          <p className="text-sm text-body">
            Why: the agent reads its settings from that file when it starts. It is a local file on your
            own machine, and this project already ignores it in git, so it never goes to the repository.
          </p>
          <p className="text-sm text-body">
            <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-xs">MCP_API_URL</code> is the
            address of this app. The endpoints live under{' '}
            <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-xs">https://&lt;your-domain&gt;/api</code>
            and the server adds that part by itself, so the address above goes without{' '}
            <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-xs">/api</code>.
          </p>
          <p className="text-sm text-body">
            If the agent runs on another computer, replace the address with your own domain, for example{' '}
            <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-xs">https://your-domain.example</code>.
          </p>
          <p className="text-sm text-body">
            Never put the key in the code, in a commit, in a chat or in a screenshot. A key in a chat is a
            key in a place many people can read.
          </p>
        </li>

        <li className="space-y-2">
          <StepTitle step={4} title="Build and start the server" />
          <p className="text-sm text-body">
            From the root of this repository, run:
          </p>
          <pre className="overflow-x-auto rounded-sm border bg-muted p-3 font-mono text-xs"><code>{'cd mcp && npm ci && npm run build && npm start'}</code></pre>
          <p className="text-sm text-body">
            Why: the agent needs this server to translate what you ask into calls to your schedule.
            It is not published with the repository on purpose, so you compile it yourself and it always
            runs code you have seen.
          </p>
        </li>

        <li className="space-y-2">
          <StepTitle step={5} title="Try it and check it worked" />
          <p className="text-sm text-body">
            Ask the agent something about the schedule, for example <em>&quot;who works on Friday?&quot;</em>,
            then come back to this page and press <strong>Refresh</strong> in the key list.
          </p>
          <p className="text-sm text-body">
            Why: the key records when it was last used. If you see <strong>Last used</strong> instead of
            <strong> Never used</strong>, the agent is connected correctly.
          </p>
        </li>

        <li className="space-y-2">
          <StepTitle step={6} title="If the key leaks" />
          <p className="text-sm text-body">
            Revoke that key with the bin icon next to it and create a new one. If you cannot tell which
            key leaked, use <strong>Revoke all keys</strong>: every agent stops at the same time and you
            give each one a fresh key.
          </p>
          <p className="text-sm text-body">
            Why: a leaked key works like a password that someone else has. Revoking it takes the access
            away immediately, and the key expires on its own after a while as a second safety net.
          </p>
        </li>
      </ol>

      <AgentSetupPrompt origin={origin} />
    </section>
  )
}

function StepTitle({ step, title }: { step: number; title: string }) {
  return (
    <h4 className="flex items-center gap-2 text-sm font-semibold">
      <span
        aria-hidden="true"
        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-primary-foreground"
      >
        {step}
      </span>
      <span>
        Step {step}: {title}
      </span>
    </h4>
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
