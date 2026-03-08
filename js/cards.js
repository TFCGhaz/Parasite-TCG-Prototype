/* ════════════════════════════════════════════════════
   cards.js — Card definitions and starter deck lists
   ════════════════════════════════════════════════════ */

const CARDS = {

  // ── THE WEAVE ──────────────────────────────────────────────────────────────

  mycelian_crawler: {
    id: 'mycelian_crawler',
    name: 'Mycelian Crawler',
    faction: 'weave',
    type: 'unit',
    cost: 1, atk: 1, def: 2,
    icon: '🕸️', art: '🍄',
    tags: ['Organism', 'HIVE'],
    ability: 'End of your turn: +1 Growth Token. Mutation (3 tokens): becomes Mycelian Horror (ATK 4 / DEF 5).',
    flavour: 'It arrived as a spore. You gave it warmth. You gave it time.',
  },

  spore_node: {
    id: 'spore_node',
    name: 'Spore Node',
    faction: 'weave',
    type: 'unit',
    cost: 2, atk: 0, def: 4,
    icon: '🕸️', art: '🌑',
    tags: ['Organism'],
    ability: 'While on field: Corruption Gauge +1 each Weave upkeep. Units that attack this gain 1 Infection token.',
    flavour: 'It breathes for the whole.',
  },

  tendril_lurker: {
    id: 'tendril_lurker',
    name: 'Tendril Lurker',
    faction: 'weave',
    type: 'unit',
    cost: 2, atk: 3, def: 2,
    icon: '🕸️', art: '🦑',
    tags: ['Organism', 'SURGE'],
    ability: 'SURGE. On attack: place 1 Infection token on target.',
    flavour: 'Speed was never a feature. Until it needed to be.',
  },

  hive_guardian: {
    id: 'hive_guardian',
    name: 'Hive Guardian',
    faction: 'weave',
    type: 'unit',
    cost: 3, atk: 2, def: 5,
    icon: '🕸️', art: '🐚',
    tags: ['Organism', 'HIVE'],
    ability: 'HIVE. While you control 2+ other HIVE units: this unit gains REGENERATE.',
    flavour: 'Alone it is armour. Together it is unbreakable.',
  },

  parasitic_drone: {
    id: 'parasitic_drone',
    name: 'Parasitic Drone',
    faction: 'weave',
    type: 'unit',
    cost: 1, atk: 2, def: 1,
    icon: '🕸️', art: '🦠',
    tags: ['Organism', 'HIVE'],
    ability: 'HIVE. When destroyed: place 1 Infection token on a random enemy unit.',
    flavour: 'The death of one is always the birth of something else.',
  },

  spore_burst: {
    id: 'spore_burst',
    name: 'Spore Burst',
    faction: 'weave',
    type: 'action',
    cost: 2,
    icon: '🕸️', art: '💥',
    tags: ['Action'],
    ability: 'Destroy one of your own Weave units. Place 2 Infection tokens on any enemy unit.',
    flavour: 'Every ending is a beginning.',
  },

  biomass_surge: {
    id: 'biomass_surge',
    name: 'Biomass Surge',
    faction: 'weave',
    type: 'action',
    cost: 0,
    icon: '🕸️', art: '🌿',
    tags: ['Action'],
    ability: 'Gain 3 Biomass this turn.',
    flavour: 'The root network never sleeps.',
  },

  creeping_rot: {
    id: 'creeping_rot',
    name: 'Creeping Rot',
    faction: 'weave',
    type: 'action',
    cost: 3,
    icon: '🕸️', art: '☠️',
    tags: ['Action'],
    ability: 'Place 1 Infection token on ALL enemy field units. Corruption Gauge +1.',
    flavour: 'Given enough time, everything submits.',
  },

  mycelian_horror: {
    id: 'mycelian_horror',
    name: 'Mycelian Horror',
    faction: 'weave',
    type: 'unit',
    cost: 0, atk: 4, def: 5,
    icon: '🕸️', art: '👾',
    tags: ['Organism', 'HIVE', 'VOLATILE'],
    ability: 'VOLATILE. HIVE. Cannot be played from hand — only via Mycelian Crawler Mutation.',
    flavour: 'The mask is gone. What remains is hunger.',
  },

  // ── THE REMNANTS ───────────────────────────────────────────────────────────

  scrap_engineer: {
    id: 'scrap_engineer',
    name: 'Scrap Engineer',
    faction: 'remnants',
    type: 'unit',
    cost: 2, atk: 2, def: 3,
    icon: '⚡', art: '🔧',
    tags: ['Human', 'Mechanical', 'PURIFIER'],
    ability: 'PURIFIER (enter: remove 1 Infection from a friendly unit). On kill: gain 2 Scrap.',
    flavour: 'The enemy built its own defeat into every circuit.',
  },

  militia_grunt: {
    id: 'militia_grunt',
    name: 'Militia Grunt',
    faction: 'remnants',
    type: 'unit',
    cost: 1, atk: 2, def: 2,
    icon: '⚡', art: '🪖',
    tags: ['Human'],
    ability: 'When destroyed: gain 1 Scrap.',
    flavour: 'They stopped asking for reasons a long time ago.',
  },

  rigged_turret: {
    id: 'rigged_turret',
    name: 'Rigged Turret',
    faction: 'remnants',
    type: 'unit',
    cost: 2, atk: 4, def: 1,
    icon: '⚡', art: '🎯',
    tags: ['Mechanical', 'PIERCING'],
    ability: 'PIERCING. Cannot move zones. Immune to Infection.',
    flavour: 'Ugly. Immobile. Devastatingly effective.',
  },

  combat_medic: {
    id: 'combat_medic',
    name: 'Combat Medic',
    faction: 'remnants',
    type: 'unit',
    cost: 2, atk: 1, def: 3,
    icon: '⚡', art: '➕',
    tags: ['Human', 'PURIFIER'],
    ability: 'PURIFIER. Once per turn: pay 1 Scrap → restore 2 DEF to a friendly unit.',
    flavour: 'Keep them alive long enough to keep you alive.',
  },

  salvage_runner: {
    id: 'salvage_runner',
    name: 'Salvage Runner',
    faction: 'remnants',
    type: 'unit',
    cost: 1, atk: 1, def: 2,
    icon: '⚡', art: '💨',
    tags: ['Human', 'SURGE'],
    ability: 'SURGE. When enters play: draw 1 card.',
    flavour: 'Fast feet over armour. Always.',
  },

  last_stand: {
    id: 'last_stand',
    name: 'Last Stand',
    faction: 'remnants',
    type: 'action',
    cost: 3,
    icon: '⚡', art: '🔥',
    tags: ['Action'],
    ability: 'Only playable if Life ≤ 8. All friendly units gain +3 ATK and SURGE this turn. Draw 2.',
    flavour: 'They stopped counting the odds a long time ago.',
  },

  overclock: {
    id: 'overclock',
    name: 'Overclock',
    faction: 'remnants',
    type: 'action',
    cost: 1,
    icon: '⚡', art: '⚡',
    tags: ['Action'],
    ability: 'Target friendly Mechanical unit gains +3 ATK until end of turn. It takes 1 damage after combat.',
    flavour: 'The machine screams. You pretend not to hear it.',
  },

  purge_protocol: {
    id: 'purge_protocol',
    name: 'Purge Protocol',
    faction: 'remnants',
    type: 'action',
    cost: 2,
    icon: '⚡', art: '🛡️',
    tags: ['Action'],
    ability: 'Remove ALL Infection tokens from all friendly units. Corruption Gauge -2.',
    flavour: 'Burn it out. All of it. Right now.',
  },
};

// ── STARTER DECK LISTS ─────────────────────────────────────────────────────

const WEAVE_DECK = [
  'mycelian_crawler', 'mycelian_crawler', 'mycelian_crawler',
  'spore_node',       'spore_node',
  'tendril_lurker',   'tendril_lurker',   'tendril_lurker',
  'hive_guardian',    'hive_guardian',
  'parasitic_drone',  'parasitic_drone',  'parasitic_drone',
  'spore_burst',      'spore_burst',      'spore_burst',
  'biomass_surge',    'biomass_surge',
  'creeping_rot',
];

const REMNANTS_DECK = [
  'scrap_engineer',  'scrap_engineer',  'scrap_engineer',
  'militia_grunt',   'militia_grunt',   'militia_grunt',
  'rigged_turret',   'rigged_turret',
  'combat_medic',    'combat_medic',
  'salvage_runner',  'salvage_runner',  'salvage_runner',
  'last_stand',      'last_stand',
  'overclock',       'overclock',       'overclock',
  'purge_protocol',  'purge_protocol',
];
