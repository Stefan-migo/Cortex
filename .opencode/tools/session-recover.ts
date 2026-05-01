import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Recover working context from previous sessions. Reads STATE.md, log.md, and latest session summary.",
  args: {
    depth: tool.schema
      .enum(["quick", "full"])
      .optional()
      .describe("Recovery depth: quick (just STATE + log), full (includes last session and plan files)"),
  },
  async execute(_args, context) {
    const { depth = "full" } = _args
    const worktree = context.worktree

    async function readFile(path: string): Promise<string | null> {
      try {
        return await Bun.file(path).text()
      } catch {
        return null
      }
    }

    let output = "# Session Recovery\n\n"

    // Current position from STATE.md
    const stateContent = await readFile(`${worktree}/.planning/STATE.md`)
    if (stateContent) {
      output += "## Current Position\n"
      const lines = stateContent.split("\n").filter((l) => !l.startsWith("---"))
      output += lines.slice(0, 40).join("\n") + "\n\n"
    } else {
      output += "## Current Position\nNo STATE.md found. Start with `/init` or create `.planning/PROJECT.md`.\n\n"
    }

    // Roadmap for phase status
    const roadmapContent = await readFile(`${worktree}/.planning/ROADMAP.md`)
    if (roadmapContent && depth === "full") {
      output += "## Roadmap Status\n"
      const lines = roadmapContent.split("\n")
      const phases = lines.filter(
        (l) => l.match(/^\|\s*\d+/) || l.match(/^##\s+Phase/) || l.match(/\[active\]|\[done\]|\[planned\]/)
      )
      output += phases.slice(0, 20).join("\n") + "\n\n"
    }

    // Recent activity from log.md
    const logContent = await readFile(`${worktree}/wiki/log.md`)
    if (logContent) {
      output += "## Recent Activity (last 10 entries)\n"
      const entries = logContent.split(/^## /m)
      const recent = entries.filter((e) => e.trim()).slice(-10)
      for (const entry of recent) {
        const firstLine = entry.split("\n")[0].trim()
        output += `- ${firstLine}\n`
      }
      output += "\n"
    }

    // Latest session summary
    if (depth === "full") {
      const sessionDir = `${worktree}/wiki/sessions`
      let latestSession: string | null = null
      try {
        const files = await Array.fromAsync(new Bun.Glob("*.md").scan({ cwd: sessionDir }))
        const sorted = files.sort().reverse()
        if (sorted.length > 0) {
          latestSession = sorted[0]
        }
      } catch {
        // directory may not exist or be empty
      }

      if (latestSession) {
        const content = await readFile(`${sessionDir}/${latestSession}`)
        if (content) {
          output += `## Last Session: ${latestSession}\n`
          const body = content
            .split("\n")
            .filter((l) => !l.startsWith("---"))
            .join("\n")
          output += body.substring(0, 2000) + "\n\n"
        }
      }
    }

    output += "---\n"
    output += "To continue:"
    if (depth === "quick") output += '\n- Run `skill({ name: "session-memory" })` for full recovery context'

    return output
  },
})
