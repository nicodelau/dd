export interface CharacterProfile {
  id: string;
  name: string;
  aliases: string[];
  role: string;
  visualPrompt: string;
  keyFeatures: string[];
}

export interface LocationProfile {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  visualPrompt: string;
}

export interface WorldSetting {
  worldName: string;
  artStylePreset: string;
  lightingAndAtmosphere: string;
  characters: CharacterProfile[];
  locations: LocationProfile[];
}

export interface DetectedLoreEntities {
  characters: CharacterProfile[];
  locations: LocationProfile[];
}
