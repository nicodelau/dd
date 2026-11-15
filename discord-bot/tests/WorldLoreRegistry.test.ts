import { describe, it, expect } from 'vitest';
import { WorldLoreRegistry } from '../src/infrastructure/lore/WorldLoreRegistry.js';

describe('WorldLoreRegistry', () => {
  const registry = new WorldLoreRegistry();

  it('should load all initial campaign characters', () => {
    const characters = registry.getAllCharacters();
    expect(characters.length).toBeGreaterThanOrEqual(5);

    const names = characters.map((c) => c.name.toLowerCase());
    expect(names).toContain('siegarth');
    expect(names).toContain('velyra');
    expect(names).toContain('olivar');
    expect(names).toContain('timor');
    expect(names).toContain('chiflo');
  });

  it('should load all initial Pilotes locations', () => {
    const locations = registry.getAllLocations();
    expect(locations.length).toBeGreaterThanOrEqual(4);

    const names = locations.map((l) => l.name.toLowerCase());
    expect(names).toContain('pilotes');
    expect(names).toContain('palermo');
    expect(names).toContain('opus');
    expect(names).toContain('puerto');
    expect(names).toContain('lafe');
  });

  it('should detect characters and locations from conversation text', () => {
    const text = 'Ayer vimos a Timor y a Siegarth caminando cerca del distrito de Puerto en Pilotes.';
    const detected = registry.findEntities(text);

    expect(detected.characters.map((c) => c.name.toLowerCase())).toEqual(
      expect.arrayContaining(['timor', 'siegarth'])
    );
    expect(detected.locations.map((l) => l.name.toLowerCase())).toEqual(
      expect.arrayContaining(['puerto', 'pilotes'])
    );
  });

  it('should detect characters by their aliases (e.g. Malaspulgas for Chiflo)', () => {
    const text = 'Dicen que Malaspulgas causó revuelo en la taberna.';
    const detected = registry.findEntities(text);

    expect(detected.characters.map((c) => c.name.toLowerCase())).toContain('chiflo');
  });

  it('should provide the master art style and lighting preset', () => {
    const style = registry.getArtStylePreset();
    expect(style.toLowerCase()).toContain('dark fantasy');
    expect(style.toLowerCase()).toContain('chiaroscuro');
  });

  it('should format clean discord messages for !characters and !locations', () => {
    const charMsg = registry.formatCharactersMessage();
    expect(charMsg).toContain('**Siegarth**');
    expect(charMsg).toContain('**Velyra**');
    expect(charMsg).toContain('**Timor**');
    expect(charMsg).toContain('**Olivar**');
    expect(charMsg).toContain('**Chiflo**');

    const locMsg = registry.formatLocationsMessage();
    expect(locMsg).toContain('**Pilotes**');
    expect(locMsg).toContain('**Palermo**');
    expect(locMsg).toContain('**Puerto**');
  });
});
