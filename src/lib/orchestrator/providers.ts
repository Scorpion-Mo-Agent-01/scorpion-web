import { execFile } from "node:child_process";
import { promisify } from "node:util";
import OpenAI from "openai";

const execFileAsync = promisify(execFile);

export type BrainProvider = "gemini" | "openai";

export interface BrainRequest {
  instruction: string;
  contextSummary?: string;
  model?: string;
}

export interface BrainResponse {
  output: string;
  provider: BrainProvider;
  model: string;
}

async function runGemini(request: BrainRequest): Promise<BrainResponse> {
  const model = request.model || process.env.GEMINI_MODEL || "gemini-2.0-flash-lite-preview-02-05";
  const prompt = `${request.instruction}
Context:${request.contextSummary || ""}`.trim();
  const { stdout } = await execFileAsync("gemini", ["--model", model, "--output-format", "text", prompt], {
    timeout: 120_000,
  });
  return { output: stdout.trim(), provider: "gemini", model };
}

async function runOpenAI(request: BrainRequest): Promise<BrainResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");
  const client = new OpenAI({ apiKey });
  const model = request.model || process.env.OPENAI_MODEL || "gpt-4o-mini";
  const completion = await client.responses.create({
    model,
    input: [{ role: "user", content: request.contextSummary ? `${request.instruction}
Context:${request.contextSummary}` : request.instruction }],
  });
  const output = completion.output_text || "";
  return { output, provider: "openai", model };
}

export async function runBrain(provider: BrainProvider, request: BrainRequest): Promise<BrainResponse> {
  if (provider === "gemini") return runGemini(request);
  if (provider === "openai") return runOpenAI(request);
  throw new Error(`Unsupported provider ${provider}`);
}
