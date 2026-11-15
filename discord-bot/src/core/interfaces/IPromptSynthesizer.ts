import { GenerationRequest } from '../models/GenerationRequest.js';

export interface SynthesizedPrompt {
  prompt: string;
  summary: string;
}

export interface IPromptSynthesizer {
  /**
   * Synthesizes an artistic visual prompt and a short summary based on recent voice transcripts and user instruction.
   * @param request Context including recent transcripts and optional user prompt.
   */
  synthesize(request: GenerationRequest): Promise<SynthesizedPrompt>;
}
