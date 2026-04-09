export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export function randRange(min, max, rng = Math.random) {
  return min + (max - min) * rng()
}

export function randInt(min, max, rng = Math.random) {
  return Math.floor(randRange(min, max + 1, rng))
}

export function pickRandom(items, rng = Math.random) {
  if (!items.length) {
    return null
  }

  return items[Math.floor(rng() * items.length)]
}

export function pickWeighted(weightedItems, rng = Math.random) {
  const total = weightedItems.reduce((sum, item) => sum + item.weight, 0)
  if (total <= 0) {
    return weightedItems[0]
  }

  let pivot = rng() * total
  for (const item of weightedItems) {
    pivot -= item.weight
    if (pivot <= 0) {
      return item
    }
  }

  return weightedItems[weightedItems.length - 1]
}

export function distanceSq(ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  return dx * dx + dy * dy
}

export function distance(ax, ay, bx, by) {
  return Math.sqrt(distanceSq(ax, ay, bx, by))
}

export function normalize(x, y) {
  const len = Math.sqrt(x * x + y * y)
  if (!len) {
    return { x: 0, y: 0 }
  }

  return { x: x / len, y: y / len }
}

export function keyFromCoords(x, y) {
  return `${x},${y}`
}

export function hashToSeed(...values) {
  let hash = 2166136261
  for (const value of values) {
    const chunk = Number.isFinite(value) ? Math.floor(value) : 0
    hash ^= chunk + 0x9e3779b9 + (hash << 6) + (hash >> 2)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

export function createRng(seed) {
  let state = seed >>> 0
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function circleIntersectsRect(circle, rect) {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.w)
  const closestY = clamp(circle.y, rect.y, rect.y + rect.h)
  const dx = circle.x - closestX
  const dy = circle.y - closestY
  return dx * dx + dy * dy < circle.radius * circle.radius
}
