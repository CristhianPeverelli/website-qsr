import { clamp, pickRandom } from './utils'

const UPGRADE_LIBRARY = [
  {
    id: 'keen-edge',
    title: 'Keen Edge',
    description: '+10% melee damage',
    apply: ({ player }) => {
      player.damage *= 1.1
    },
  },
  {
    id: 'iron-heart',
    title: 'Iron Heart',
    description: '+14 max HP and heal 14',
    apply: ({ player }) => {
      player.maxHp += 14
      player.hp = Math.min(player.maxHp, player.hp + 14)
    },
  },
  {
    id: 'wind-step',
    title: 'Wind Step',
    description: '+9% movement speed',
    apply: ({ player }) => {
      player.speed *= 1.09
    },
  },
  {
    id: 'battle-rhythm',
    title: 'Battle Rhythm',
    description: '-12% attack cooldown',
    apply: ({ player }) => {
      player.attackCooldown = Math.max(0.16, player.attackCooldown * 0.88)
    },
  },
  {
    id: 'lucky-sigil',
    title: 'Lucky Sigil',
    description: '+6% crit chance',
    apply: ({ player }) => {
      player.critChance = clamp(player.critChance + 0.06, 0, 0.55)
    },
  },
  {
    id: 'alchemist-kit',
    title: 'Alchemist Kit',
    description: '+1 potion and +4 max HP',
    apply: ({ player, stats }) => {
      player.maxHp += 4
      player.hp = Math.min(player.maxHp, player.hp + 4)
      stats.potions = Math.min(9, stats.potions + 1)
    },
  },
]

const RELIC_LIBRARY = [
  {
    id: 'ember-fang',
    name: 'Ember Fang',
    description: '+6% damage',
    apply: ({ player }) => {
      player.damage *= 1.06
    },
  },
  {
    id: 'moon-feather',
    name: 'Moon Feather',
    description: '+5% speed',
    apply: ({ player }) => {
      player.speed *= 1.05
    },
  },
  {
    id: 'clock-shard',
    name: 'Clock Shard',
    description: '-5% attack cooldown',
    apply: ({ player }) => {
      player.attackCooldown = Math.max(0.15, player.attackCooldown * 0.95)
    },
  },
  {
    id: 'ivy-core',
    name: 'Ivy Core',
    description: '+6 max HP',
    apply: ({ player }) => {
      player.maxHp += 6
      player.hp = Math.min(player.maxHp, player.hp + 6)
    },
  },
]

export function rollUpgradeChoices(count, rng = Math.random, recentIds = []) {
  const freshPool = UPGRADE_LIBRARY.filter((upgrade) => !recentIds.includes(upgrade.id))
  const workingPool = freshPool.length >= count ? [...freshPool] : [...UPGRADE_LIBRARY]
  const picks = []

  while (picks.length < count && workingPool.length) {
    const index = Math.floor(rng() * workingPool.length)
    picks.push(workingPool.splice(index, 1)[0])
  }

  return picks
}

export function applyUpgradeById(id, context) {
  const upgrade = UPGRADE_LIBRARY.find((item) => item.id === id)
  if (!upgrade) {
    return null
  }

  upgrade.apply(context)
  return upgrade
}

export function rollRelic(rng = Math.random) {
  return pickRandom(RELIC_LIBRARY, rng)
}
