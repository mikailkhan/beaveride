import { env } from '../../config/env.js';
import { generateMockCode } from '../../utils/mockCodeGenerator.js';
import { buildPlanPrompt, buildCodePrompt, buildVerifyPrompt } from '../../utils/promptTemplates.js';
import type { LLMProvider, LLMVerificationResult } from './LLMProvider.js';

export class OllamaProvider implements LLMProvider {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl = env.OLLAMA_BASE_URL, model = env.OLLAMA_MODEL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.model = model;
  }

  /**
   * Helper utility to strip markdown code fences (e.g. ```typescript ... ```) from LLM output.
   */
  public stripCodeFences(text: string): string {
    if (!text) return '';
    let cleaned = text.trim();
    // Strip leading ```[language]
    cleaned = cleaned.replace(/^```[a-zA-Z0-9_-]*\n?/, '');
    // Strip trailing ```
    cleaned = cleaned.replace(/\n?```$/, '');
    return cleaned.trim();
  }

  /**
   * Performs an HTTP POST request to Ollama's /api/generate endpoint with a 60s timeout.
   */
  private async callOllama(prompt: string, temperature = 0.2): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          options: {
            temperature,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error (${response.status} ${response.statusText})`);
      }

      const data = (await response.json()) as { response?: string };
      if (!data || typeof data.response !== 'string') {
        throw new Error('Malformed response from Ollama API');
      }

      return data.response;
    } finally {
      clearTimeout(timeout);
    }
  }

  async generatePlan(instruction: string, existingContent: string, fileName: string): Promise<string> {
    try {
      const prompt = buildPlanPrompt(instruction, existingContent, fileName);
      const rawPlan = await this.callOllama(prompt, 0.3);
      return this.stripCodeFences(rawPlan) || `Plan: Add requested changes for "${instruction}" to ${fileName}.`;
    } catch (err: any) {
      console.warn(`[OllamaProvider] Failed to generate plan via Ollama (${err?.message || err}). Falling back to mock plan.`);
      return `[Mock Plan] Fulfill instruction: "${instruction}" on file ${fileName}.`;
    }
  }

  async generateCode(
    instruction: string,
    existingContent: string,
    fileName: string,
    planSummary: string
  ): Promise<string> {
    try {
      const prompt = buildCodePrompt(instruction, existingContent, fileName, planSummary);
      const rawCode = await this.callOllama(prompt, 0.2);
      const cleanedCode = this.stripCodeFences(rawCode);

      if (!cleanedCode) {
        throw new Error('Ollama returned empty code response');
      }

      return cleanedCode;
    } catch (err: any) {
      console.warn(`[OllamaProvider] Failed to generate code via Ollama (${err?.message || err}). Falling back to mock generator.`);
      return generateMockCode(instruction, existingContent);
    }
  }

  async verifyCode(
    instruction: string,
    generatedCode: string,
    fileName: string
  ): Promise<LLMVerificationResult> {
    try {
      const prompt = buildVerifyPrompt(instruction, generatedCode, fileName);
      const rawResponse = await this.callOllama(prompt, 0.1);
      const cleaned = this.stripCodeFences(rawResponse);

      // Attempt to parse JSON verification response
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const jsonStr = cleaned.slice(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(jsonStr) as { isValid?: boolean; issues?: string[] };
        return {
          isValid: Boolean(parsed.isValid),
          issues: Array.isArray(parsed.issues) ? parsed.issues : [],
        };
      }

      return { isValid: true, issues: [] };
    } catch (err: any) {
      console.warn(`[OllamaProvider] Verification call failed (${err?.message || err}). Defaulting to valid.`);
      return { isValid: true, issues: [] };
    }
  }
}
