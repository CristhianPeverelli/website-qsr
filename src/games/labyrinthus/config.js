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
  damage: 24,
  critChance: 0.11,
  attackRange: 86,
  attackArcDot: 0.2,
  attackCooldown: 0.36,
}

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
    label: 'Bone Tank',
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
  { minRooms: 0, entries: [{ type: 'slime', weight: 6 }, { type: 'goblin', weight: 4 }] },
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
