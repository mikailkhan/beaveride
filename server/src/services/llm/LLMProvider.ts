export interface LLMVerificationResult {
  isValid: boolean;
  issues: string[];
}

export interface LLMProvider {
  /**
   * Generates a brief 1-3 sentence plan for fulfilling the instruction on the target file.
   */
  generatePlan(instruction: string, existingContent: string, fileName: string): Promise<string>;

  /**
   * Generates complete updated file content based on the instruction and plan.
   * MUST return full raw file text without markdown formatting or wrapping code fences.
   */
  generateCode(
    instruction: string,
    existingContent: string,
    fileName: string,
    planSummary: string
  ): Promise<string>;

  /**
   * Evaluates the generated code against the user instruction.
   * Returns a structured verification result.
   */
  verifyCode(
    instruction: string,
    generatedCode: string,
    fileName: string
  ): Promise<LLMVerificationResult>;
}
