import { gmailSearchTool } from "./tools/search.js";
import { gmailReadThreadTool } from "./tools/read-thread.js";
import { gmailListLabelsTool, gmailCreateLabelTool, gmailApplyLabelsTool } from "./tools/labels.js";
import { gmailInboxStatsTool } from "./tools/stats.js";
import { gmailProposeFilterTool } from "./tools/propose-filter.js";
import { gmailProposeDraftReplyTool } from "./tools/propose-draft.js";
import { registerRoutes } from "./routes/ui-routes.js";
import { gmailCommand } from "./commands/gmail.js";

interface PluginApi {
  registerTool: (tool: { name: string; description: string; parameters: unknown; execute: Function }) => void;
  registerCommand: (cmd: { name: string; description: string; execute: Function }) => void;
  registerHttpRoute: (method: string, path: string, handler: Function) => void;
  getConfig: () => Record<string, unknown>;
}

export function activate(api: PluginApi): void {
  api.registerTool(gmailSearchTool);
  api.registerTool(gmailReadThreadTool);
  api.registerTool(gmailListLabelsTool);
  api.registerTool(gmailCreateLabelTool);
  api.registerTool(gmailApplyLabelsTool);
  api.registerTool(gmailInboxStatsTool);
  api.registerTool(gmailProposeFilterTool);
  api.registerTool(gmailProposeDraftReplyTool);

  registerRoutes(api as any);

  api.registerCommand(gmailCommand);
}
