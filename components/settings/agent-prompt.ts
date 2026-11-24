/**
 * The prompt a person copies into their agent (Claude Code, Cursor, Codex,
 * any agent that can run commands) so the agent sets the MCP server up.
 *
 * It is plain text on purpose: it is meant to be pasted as is. The only
 * variable part is the address of this app, so the agent never has to guess
 * where to point the server.
 */
export function agentPrompt(origin: string): string {
  return `Set up the MCP server for this shift schedule app. Work in the project root and do these steps in order.

1. Create a file named .mcp.json in the project root with exactly this content:

{
  "mcpServers": {
    "turnos": {
      "command": "node",
      "args": ["./mcp/dist/index.js"],
      "env": {
        "MCP_API_URL": "${origin}",
        "MCP_API_KEY": "PASTE_THE_API_KEY_HERE"
      }
    }
  }
}

MCP_API_URL is the address of this app: ${origin}. Do not add /api at the end, the server adds it.

2. The API key. I have to give it to you. Never invent it. If you do not have it, ask me for it and stop until I answer. Write it only in the MCP_API_KEY value of .mcp.json. Never put it in a commit, in a chat message, in a public file, in a screenshot or in any other place other people can read.

3. Build the server. Run this from the project root:

   cd mcp && npm ci && npm run build

4. Check the build. The file mcp/dist/index.js must exist when the build finishes. If it does not exist, the build failed: read the real error output.

5. Restart the agent, or reload the MCP servers, so it reads the new .mcp.json.

6. If any step fails, show me the real error message and stop. Do not hide it and do not carry on as if it had worked.

When you are done, tell me which tools are now available.`
}
