export interface IImageGenerator {
  /**
   * Generates an image based on a prompt.
   * @param prompt English visual description of the scene.
   * @returns URL of the generated image.
   */
  generate(prompt: string): Promise<string>;
}
