import { WorldSetting } from '../../core/models/WorldLore.js';

export const DEFAULT_WORLD_LORE: WorldSetting = {
  worldName: 'Pilotes',
  artStylePreset:
    'Dark fantasy cinematic digital painting, chiaroscuro dramatic lighting with deep contrast shadows, warm golden glow from lanterns, torches, or magical artifacts, rich authentic textures of weathered leather, rusted metal, wet cobblestone, and aged oak wood, intricate medieval fantasy realism, 8k resolution, atmospheric mood',
  lightingAndAtmosphere:
    'Dramatic chiaroscuro, moody atmospheric fog, warm directional light sources (fire, lanterns, glowing magic) casting long deep shadows',
  characters: [
    {
      id: 'siegarth',
      name: 'Siegarth',
      aliases: ['siegarth', 'sigarth', 'esqueleto', 'no-muerto', 'el esqueleto', 'nigromante'],
      role: 'No-Muerto Encapuchado / Conjurador',
      visualPrompt:
        'A sinister skeletal figure named Siegarth, wearing a tattered ragged dark brown hooded cloak that casts deep shadows over an ancient weathered human skull face, wrapped cloth bandages on skeletal wrists, cross-chest leather harness straps with a small glass potion vial and pouch at the belt',
      keyFeatures: [
        'ancient skeletal skull face',
        'tattered ragged brown hooded cloak',
        'leather chest straps with small red potion vial',
        'bandaged skeletal wrists',
      ],
    },
    {
      id: 'velyra',
      name: 'Velyra',
      aliases: ['velyra', 'belira', 'tiefling', 'el tiefling', 'cuernos'],
      role: 'Tiefling Melancólico con Relicario',
      visualPrompt:
        'A melancholic male tiefling named Velyra with dark hair, sharp pointed ears, and two large curved ridged black horns extending from his forehead, wearing a heavy black hooded mantle fastened with a circular pentagram metal brooch, around his neck hangs a warm glowing amber locket pendant magically displaying the miniature smiling face portrait of a young child inside',
      keyFeatures: [
        'two curved ridged black horns',
        'pointed ears and intense melancholic gaze',
        'black cloak with pentagram brooch',
        'glowing amber locket displaying a child\'s smiling face',
      ],
    },
    {
      id: 'olivar',
      name: 'Olivar',
      aliases: ['olivar', 'caballero', 'el guerrero', 'olivar el caballero'],
      role: 'Guerrero Humano con Herida Pectoral',
      visualPrompt:
        'A battle-hardened human warrior named Olivar with short dark hair, focused gaze, and a trimmed dark beard, clad in heavy medieval chainmail armor and weathered steel plate pauldrons, featuring a distinct torn puncture hole wound over his chest above the heart, firmly gripping a steel broadsword vertically in one hand and a parrying dagger in the other',
      keyFeatures: [
        'short dark hair and trimmed dark beard',
        'chainmail armor with torn bleeding puncture wound over chest',
        'steel plate shoulder armor',
        'wielding broadsword and parrying dagger',
      ],
    },
    {
      id: 'timor',
      name: 'Timor',
      aliases: ['timor', 'dragonborn', 'draconido', 'el draconido', 'dragon dorado', 'paladin dorado'],
      role: 'Dracónido Paladín Dorado',
      visualPrompt:
        'A majestic and imposing golden dragonborn paladin named Timor, with gleaming golden-yellow reptile scales and horned dragon crest, wearing full polished golden bronze heavy plate armor adorned with a cross on the breastplate, a rich red crimson cloak and waist sash, holding a heavy war mace in hand and a matching golden heater shield',
      keyFeatures: [
        'golden-yellow reptilian scales and dragon head',
        'heavy golden-bronze plate armor with chest cross',
        'crimson red cape and sash',
        'war mace and heavy golden shield',
      ],
    },
    {
      id: 'chiflo',
      name: 'Chiflo',
      aliases: ['chiflo', 'malaspulgas', 'gnomo', 'el gnomo', 'wanted', 'chiflo malaspulgas'],
      role: 'Gnomo Pícaro / Forajido de Taberna',
      visualPrompt:
        'A wild mischievous rustic gnome rogue named Chiflo (also known as Malaspulgas), with an exaggerated tall pointed brown cone hat, bushy scruffy beard, wide grinning cunning expression with large crooked nose, sitting at a rustic tavern wooden table holding a frothy wooden mug of ale, with a parchment \'WANTED MALASPULGAS\' bounty poster pinned to the stone tavern wall behind him',
      keyFeatures: [
        'extremely tall pointed brown cone hat',
        'bushy scruffy beard and crooked grinning nose',
        'holding wooden mug of ale',
        'wanted poster for \'Malaspulgas\' in background',
      ],
    },
  ],
  locations: [
    {
      id: 'pilotes',
      name: 'Pilotes',
      aliases: ['pilotes', 'ciudad de pilotes', 'el reino de pilotes'],
      description: 'Gran ciudad costera medieval amurallada dividida en cuatro distritos históricos.',
      visualPrompt:
        'The fortified medieval walled coastal city of Pilotes, with ancient circular stone ramparts overlooking the sea, stone castle on the highest hill, tiered terracotta roofs, bustling harbors and surrounding green farmland',
    },
    {
      id: 'palermo',
      name: 'Palermo',
      aliases: ['palermo', 'distrito palermo', 'castillo'],
      description: 'Distrito superior y ciudadela noble junto al castillo fortificado de Pilotes.',
      visualPrompt:
        'The Palermo district of Pilotes, the upper noble citadel situated beneath the fortified stone castle, with elegant stone buildings and cobblestone alleys',
    },
    {
      id: 'opus',
      name: 'Opus',
      aliases: ['opus', 'distrito opus', 'mercado'],
      description: 'Distrito central comercial y artesanal de Pilotes con densas calles y casas.',
      visualPrompt:
        'The Opus district of Pilotes, the vibrant central trade district featuring dense terracotta-roofed artisan shops and a central guild plaza',
    },
    {
      id: 'puerto',
      name: 'Puerto',
      aliases: ['puerto', 'muelle', 'muelles', 'el puerto'],
      description: 'Distrito marítimo con muelles de madera, barcos amarrados y salida al mar abierto.',
      visualPrompt:
        'The Puerto district of Pilotes, maritime harbor docks with wooden piers, moored wooden sailing ships, salty sea breeze and stone sea walls',
    },
    {
      id: 'lafe',
      name: 'Lafe',
      aliases: ['lafe', 'distrito lafe', 'campos'],
      description: 'Distrito extramuros con granjas, campos de cultivo y casas rústicas.',
      visualPrompt:
        'The Lafe district of Pilotes, rural outskirts and lush green farmlands with thatched cottages, stone walls and rolling pastures',
    },
  ],
};
