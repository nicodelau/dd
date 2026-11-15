import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  CharacterProfile,
  LocationProfile,
  WorldSetting,
  DetectedLoreEntities,
} from '../../core/models/WorldLore.js';
import { DEFAULT_WORLD_LORE } from './defaultWorldLore.js';

export class WorldLoreRegistry {
  private readonly worldSetting: WorldSetting;

  constructor(customSetting?: WorldSetting) {
    if (customSetting) {
      this.worldSetting = customSetting;
    } else {
      this.worldSetting = this.loadDefaultLore();
    }
  }

  private loadDefaultLore(): WorldSetting {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const jsonPath = path.resolve(__dirname, 'worldLore.json');
      if (fs.existsSync(jsonPath)) {
        const fileContent = fs.readFileSync(jsonPath, 'utf-8');
        return JSON.parse(fileContent) as WorldSetting;
      }
    } catch {
      // ignore json read error and use default
    }
    return DEFAULT_WORLD_LORE;
  }

  public getAllCharacters(): CharacterProfile[] {
    return this.worldSetting.characters;
  }

  public getAllLocations(): LocationProfile[] {
    return this.worldSetting.locations;
  }

  public getArtStylePreset(): string {
    return this.worldSetting.artStylePreset;
  }

  public getLightingAndAtmosphere(): string {
    return this.worldSetting.lightingAndAtmosphere;
  }

  public findEntities(text: string): DetectedLoreEntities {
    if (!text || !text.trim()) {
      return { characters: [], locations: [] };
    }

    const normalizedText = text.toLowerCase();

    const detectedCharacters = this.worldSetting.characters.filter((char) => {
      const charNameMatches = normalizedText.includes(char.name.toLowerCase());
      const aliasMatches = char.aliases.some((alias) =>
        normalizedText.includes(alias.toLowerCase())
      );
      return charNameMatches || aliasMatches;
    });

    const detectedLocations = this.worldSetting.locations.filter((loc) => {
      const locNameMatches = normalizedText.includes(loc.name.toLowerCase());
      const aliasMatches = loc.aliases.some((alias) =>
        normalizedText.includes(alias.toLowerCase())
      );
      return locNameMatches || aliasMatches;
    });

    return {
      characters: detectedCharacters,
      locations: detectedLocations,
    };
  }

  public buildLorePromptContext(conversationOrPromptText: string): string {
    const { characters, locations } = this.findEntities(conversationOrPromptText);
    const sections: string[] = [];

    sections.push(
      `MASTER ART STYLE & ATMOSPHERE:\n- Style: ${this.worldSetting.artStylePreset}\n- Lighting: ${this.worldSetting.lightingAndAtmosphere}`
    );

    if (characters.length > 0) {
      sections.push(
        'RECOGNIZED CHARACTERS IN SCENE (Strict Visual Consistency):\n' +
          characters
            .map(
              (c) =>
                `* [${c.name} (${c.role})]: ${c.visualPrompt}. Key features: ${c.keyFeatures.join(', ')}`
            )
            .join('\n')
      );
    }

    if (locations.length > 0) {
      sections.push(
        'RECOGNIZED LOCATIONS IN SCENE (World of Pilotes):\n' +
          locations.map((l) => `* [${l.name}]: ${l.visualPrompt}`).join('\n')
      );
    }

    return sections.join('\n\n');
  }

  public formatCharactersMessage(): string {
    const list = this.worldSetting.characters.map((c) => {
      return `• **${c.name}** (*${c.role}*)\n  *Rasgos clave:* ${c.keyFeatures.join(', ')}\n  *Alias:* \`${c.aliases.join(', ')}\``;
    });
    return `👥 **Personajes de la Campaña (${this.worldSetting.worldName}):**\n\n${list.join('\n\n')}`;
  }

  public formatLocationsMessage(): string {
    const list = this.worldSetting.locations.map((l) => {
      return `• **${l.name}**\n  *Descripción:* ${l.description}\n  *Alias:* \`${l.aliases.join(', ')}\``;
    });
    return `🗺️ **Lugares y Distritos del Mundo (${this.worldSetting.worldName}):**\n\n${list.join('\n\n')}`;
  }
}
