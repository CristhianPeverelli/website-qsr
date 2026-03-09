import { ENEMY_ARCHETYPES, PLAYER_BASE } from './config'
import { randRange } from './utils'

let enemyId = 0
let lootId = 0
let projectileId = 0

export function resetEntityIds() {
  enemyId = 0
  lootId = 0
  projectileId = 0
}

export function createPlayer(x, y) {
  return {
    x,
    y,
    radius: PLAYER_BASE.radius,
    maxHp: PLAYER_BASE.maxHp,
    hp: PLAYER_BASE.maxHp,
    speed: PLAYER_BASE.speed,
    damage: PLAYER_BASE.damage,
    critChance: PLAYER_BASE.critChance,
    attackRange: PLAYER_BASE.attackRange,
    attackArcDot: PLAYER_BASE.attackArcDot,
    attackCooldown: PLAYER_BASE.attackCooldown,
    attackCooldownLeft: 0,
    invulnerability: 0,
    facingX: 0,
    facingY: -1,
    attackFx: 0,
  }
}

export function createEnemy(type, x, y, difficultyScale = 1, rng = Math.random) {
  const template = ENEMY_ARCHETYPES[type]
  const hpScale = 1 + (difficultyScale - 1) * 0.9
  const speedScale = 1 + (difficultyScale - 1) * 0.25
  const damageScale = 1 + (difficultyScale - 1) * 0.85
  const cooldownScale = Math.max(0.72, 1 - (difficultyScale - 1) * 0.09)

  return {
    id: `enemy-${enemyId += 1}`,
    type,
    x,
    y,
    radius: template.radius,
    maxHp: Math.round(template.hp * hpScale),
    hp: Math.round(template.hp * hpScale),
    speed: template.speed * speedScale,
    damage: Math.round(template.damage * damageScale),
    attackRange: template.attackRange,
    attackCooldown: template.attackCooldown * cooldownScale,
    attackCooldownLeft: randRange(0.12, template.attackCooldown, rng),
    projectileSpeed: template.projectileSpeed || 0,
    color: template.color,
    hitFx: 0,
    aiSeed: randRange(0, 1000, rng),
  }
}

export function createLoot(type, x, y, value = 0, data = null) {
  return {
    id: `loot-${lootId += 1}`,
    type,
    x,
    y,
    radius: 12,
    value,
    data,
    pulse: 0,
  }
}

export function createProjectile({
  x,
  y,
  velocityX,
  velocityY,
  radius = 6,
  damage = 8,
  life = 2.1,
  owner = 'enemy',
  color = '#f8f9ff',
}) {
  return {
    id: `projectile-${projectileId += 1}`,
    x,
    y,
    velocityX,
    velocityY,
    radius,
    damage,
    life,
    owner,
    color,
  }
}
