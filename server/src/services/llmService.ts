import { OllamaProvider } from './llm/OllamaProvider.js';
import type { LLMProvider, LLMVerificationResult, AgentPlanResult } from './llm/LLMProvider.js';

export class LLMService {
  private provider: LLMProvider;

  constructor(provider: LLMProvider = new OllamaProvider()) {
    this.provider = provider;
  }

  /**
   * Dynamically swaps the active LLM provider implementation at runtime.
   */
  public setProvider(provider: LLMProvider): void {
    this.provider = provider;
  }

  /**
   * Gets the currently active LLM provider instance.
   */
  public getProvider(): LLMProvider {
    return this.provider;
  }

  /**
   * Generates a 1-3 sentence plan for fulfilling an instruction on a target file.
   */
  public async generatePlan(instruction: string, existingContent: string, fileName: string): Promise<AgentPlanResult> {
    let graphifyContext = '';
    try {
      const res = await fetch(`http://graphify:8000/query?q=${encodeURIComponent(instruction)}`);
      if (res.ok) {
        const data = await res.json() as { results: any };
        graphifyContext = `\n\n--- Graphify Repository Context ---\n${JSON.stringify(data.results)}\n---------------------------------\n`;
      }
    } catch (e) {
      console.warn('[Graphify] Failed to fetch context:', e);
    }
    
    const enrichedInstruction = `${instruction}${graphifyContext}`;
    return this.provider.generatePlan(enrichedInstruction, existingContent, fileName);
  }

  /**
   * Generates updated full file content based on instruction and plan summary.
   */
  public async generateCode(
    instruction: string,
    existingContent: string,
    fileName: string,
    planSummary: string
  ): Promise<string> {
    return this.provider.generateCode(instruction, existingContent, fileName, planSummary);
  }

  /**
   * Evaluates the generated code against the user instruction and execution plan.
   */
  public async verifyCode(
    instruction: string,
    generatedCode: string,
    fileName: string,
    planSummary: string
  ): Promise<LLMVerificationResult> {
    return this.provider.verifyCode(instruction, generatedCode, fileName, planSummary);
  }
}

export const llmService = new LLMService();
