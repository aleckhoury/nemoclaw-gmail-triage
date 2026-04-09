import { isAuthenticated, runOAuthFlow } from "../gmail/auth.js";
import * as gmail from "../gmail/client.js";
import { loadProposals } from "../queue/proposals.js";

interface CommandContext {
  args: string[];
  respond: (text: string) => void;
}

export const gmailCommand = {
  name: "gmail",
  description: "Gmail Triage: /gmail status | /gmail review | /gmail setup",
  async execute(ctx: CommandContext) {
    const sub = ctx.args[0] ?? "status";

    switch (sub) {
      case "setup":
        return handleSetup(ctx);
      case "status":
        return handleStatus(ctx);
      case "review":
        return handleReview(ctx);
      default:
        ctx.respond(
          "Usage: /gmail status | /gmail review | /gmail setup"
        );
    }
  },
};

async function handleSetup(ctx: CommandContext) {
  if (isAuthenticated()) {
    ctx.respond("Gmail is already connected. Use /gmail status to check.");
    return;
  }
  ctx.respond("Starting Gmail OAuth flow... check the terminal for the authorization URL.");
  try {
    await runOAuthFlow();
    ctx.respond("Gmail connected successfully!");
  } catch (err) {
    ctx.respond(`OAuth failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function handleStatus(ctx: CommandContext) {
  if (!isAuthenticated()) {
    ctx.respond("Gmail not connected. Run /gmail setup first.");
    return;
  }

  try {
    const labels = await gmail.listLabels();
    const inbox = labels.find((l) => l.name === "INBOX");
    const triageLabels = labels.filter((l) => l.name.startsWith("AI-Triage/"));
    const proposals = await loadProposals();

    const lines = [
      `**Gmail Triage Status**`,
      `- Inbox: ${inbox?.messagesTotal ?? "?"} messages (${inbox?.messagesUnread ?? "?"} unread)`,
      `- Triage queues: ${triageLabels.length}`,
      `- Pending proposals: ${proposals.length}`,
      ``,
      `Open the [Gmail Triage Dashboard](/gmail-triage) to review queues and take action.`,
    ];

    ctx.respond(lines.join("\n"));
  } catch (err) {
    ctx.respond(`Error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function handleReview(ctx: CommandContext) {
  if (!isAuthenticated()) {
    ctx.respond("Gmail not connected. Run /gmail setup first.");
    return;
  }

  try {
    const proposals = await loadProposals();
    if (!proposals.length) {
      ctx.respond("No pending proposals. Open the [Dashboard](/gmail-triage) to review triage queues.");
      return;
    }

    const lines = [
      `**${proposals.length} Pending Proposal${proposals.length > 1 ? "s" : ""}**`,
      "",
    ];

    for (const p of proposals.slice(0, 5)) {
      if (p.type === "filter") {
        lines.push(`- **Filter**: ${p.reasoning} (matches ~${p.matchingMessageCount ?? "?"} messages)`);
      } else {
        lines.push(`- **Draft Reply** to ${p.to}: ${p.reasoning}`);
      }
    }

    if (proposals.length > 5) {
      lines.push(`- ...and ${proposals.length - 5} more`);
    }

    lines.push("", "Open the [Gmail Triage Dashboard](/gmail-triage) to approve or reject.");
    ctx.respond(lines.join("\n"));
  } catch (err) {
    ctx.respond(`Error: ${err instanceof Error ? err.message : String(err)}`);
  }
}
