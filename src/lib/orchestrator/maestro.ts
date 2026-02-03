import { runBrain, BrainProvider, BrainResponse } from "./providers";

export type MaestroTask = {
  workflowId: string;
  nodeId: string;
  instruction: string;
  contextSummary?: string;
  provider?: BrainProvider;
  model?: string;
};

export type MaestroResult = BrainResponse & { nodeId: string; workflowId: string };

export async function runMaestroTask(task: MaestroTask): Promise<MaestroResult> {
  const provider: BrainProvider = task.provider || (process.env.BRAIN_PROVIDER as BrainProvider) || "gemini";
  const result = await runBrain(provider, {
    instruction: task.instruction,
    contextSummary: task.contextSummary,
    model: task.model,
  });
  return { ...result, nodeId: task.nodeId, workflowId: task.workflowId };
}
