export const LABYRINTHUS_TITLE = 'Labyrinthus'

export const WORLD = {
  width: 1200,
  height: 720,
  doorWidth: 184,
}

export const PLAYER_BASE = {
  radius: 16,
  maxHp: 110,
  speed: 250,
}

export const PLAYER_DEFAULT_LOADOUT_ID = 'sword'

export const PLAYER_LOADOUTS = [
  {
    id: 'sword',
    title: 'Knight Sword',
    shortLabel: 'Sword',
    archetype: 'Warrior - Arms',
    description: 'Wide melee slash with strong close-range damage.',
    attackKind: 'melee',
    spriteKey: 'playerSword',
    weaponSpriteKey: 'sword',
    damage: 24,
    critChance: 0.11,
    attackRange: 88,
    attackArcDot: 0.18,
    attackCooldown: 0.34,
    attackFxDuration: 0.18,
    attackColor: '#93e5ff',
  },
  {
    id: 'bow',
    title: 'Ranger Bow',
    shortLabel: 'Bow',
    archetype: 'Hunter - Marksmanship',
    description: 'Precise ranged arrows with higher crit chance.',
    attackKind: 'projectile',
    spriteKey: 'playerBow',
    weaponSpriteKey: 'bow',
    damage: 15,
    critChance: 0.25,
    attackRange: 0,
    attackArcDot: -1,
    attackCooldown: 0.46,
    attackFxDuration: 0.12,
    attackColor: '#ffe9a3',
    projectile: {
      spriteKey: 'arrow',
      speed: 520,
      radius: 5,
      life: 1.2,
      color: '#ffe2a0',
      trailStyle: 'arrow',
      particleColor: '#ffe8bc',
      pierce: 0,
      splashRadius: 0,
      knockback: 0,
    },
  },
  {
    id: 'wand',
    title: 'Arcane Wand',
    shortLabel: 'Wand',
    archetype: 'Mage - Arcane',
    description: 'Rapid spell bolts that burst on impact and punish groups.',
    attackKind: 'projectile',
    spriteKey: 'playerWand',
    weaponSpriteKey: 'wand',
    damage: 15,
    critChance: 0.08,
    attackRange: 0,
    attackArcDot: -1,
    attackCooldown: 0.28,
    attackFxDuration: 0.16,
    attackColor: '#7fdcff',
    projectile: {
      spriteKey: 'magicBolt',
      speed: 360,
      radius: 8,
      life: 1.4,
      color: '#7fdcff',
      trailStyle: 'arcane',
      particleColor: '#9ee7ff',
      pierce: 0,
      splashRadius: 42,
      splashDamageMultiplier: 0.6,
      knockback: 0,
    },
  },
]

export const PLAYER_LOADOUTS_BY_ID = Object.freeze(
  PLAYER_LOADOUTS.reduce((accumulator, loadout) => {
    accumulator[loadout.id] = loadout
    return accumulator
  }, {}),
)

export const ROOM_GENERATION = {
  extraDoorChance: 0.4,
  treasureChance: 0.12,
  eliteEvery: 6,
}

export const ENEMY_ARCHETYPES = {
  slime: {
    label: 'Slime',
    radius: 14,
    hp: 34,
    speed: 70,
    damage: 9,
    attackRange: 26,
    attackCooldown: 1.25,
    color: '#7dd3a5',
  },
  goblin: {
    label: 'Goblin',
    radius: 12,
    hp: 30,
    speed: 118,
    damage: 12,
    attackRange: 22,
    attackCooldown: 0.95,
    color: '#b1df6f',
  },
  skeleton: {
    label: 'Skeleton Archer',
    radius: 13,
    hp: 36,
    speed: 82,
    damage: 9,
    attackRange: 360,
    attackCooldown: 1.75,
    projectileSpeed: 320,
    color: '#f0f3ff',
  },
  tank: {
    label: 'Skeleton Tank',
    radius: 18,
    hp: 86,
    speed: 54,
    damage: 16,
    attackRange: 27,
    attackCooldown: 1.45,
    color: '#fca38f',
  },
}

export const ENEMY_SPAWN_POOLS = [
  {
    minRooms: 0,
    entries: [
      { type: 'slime', weight: 6 },
      { type: 'goblin', weight: 4 },
    ],
  },
  {
    minRooms: 3,
    entries: [
      { type: 'slime', weight: 4 },
      { type: 'goblin', weight: 5 },
      { type: 'skeleton', weight: 3 },
    ],
  },
  {
    minRooms: 8,
    entries: [
      { type: 'slime', weight: 3 },
      { type: 'goblin', weight: 4 },
      { type: 'skeleton', weight: 4 },
      { type: 'tank', weight: 2 },
    ],
  },
]

export const LAYOUT_COLORS = {
  floorA: '#1a2740',
  floorB: '#131f35',
  border: '#2f4567',
  obstacleFill: '#213451',
  obstacleStroke: '#47648f',
  doorOpen: '#4dd3b2',
  doorLocked: '#9aa7bf',
  lootCoin: '#f3bf58',
  lootPotion: '#e55c8a',
  lootRelic: '#7ea3ff',
  player: '#f3f8ff',
  playerCore: '#2f84ff',
}
