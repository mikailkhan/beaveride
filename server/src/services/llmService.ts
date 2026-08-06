import { OllamaProvider } from './llm/OllamaProvider.js';
import type { LLMProvider, LLMVerificationResult } from './llm/LLMProvider.js';

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
  public async generatePlan(instruction: string, existingContent: string, fileName: string): Promise<string> {
    return this.provider.generatePlan(instruction, existingContent, fileName);
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
   * Verifies generated code against user instruction.
   */
  public async verifyCode(
    instruction: string,
    generatedCode: string,
    fileName: string
  ): Promise<LLMVerificationResult> {
    return this.provider.verifyCode(instruction, generatedCode, fileName);
  }
}

export const llmService = new LLMService();
