import { ROOM_GENERATION, WORLD } from './config'
import { createRng, hashToSeed, keyFromCoords, pickRandom, randInt } from './utils'

export const DIRECTIONS = {
  north: { dx: 0, dy: -1, opposite: 'south' },
  east: { dx: 1, dy: 0, opposite: 'west' },
  south: { dx: 0, dy: 1, opposite: 'north' },
  west: { dx: -1, dy: 0, opposite: 'east' },
}

export const DIRECTION_KEYS = Object.keys(DIRECTIONS)

function overlapRect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

function createDoorLanes() {
  const halfDoor = WORLD.doorWidth / 2 + 24
  return [
    { x: WORLD.width / 2 - halfDoor, y: 0, w: halfDoor * 2, h: 145 },
    { x: WORLD.width / 2 - halfDoor, y: WORLD.height - 145, w: halfDoor * 2, h: 145 },
    { x: 0, y: WORLD.height / 2 - halfDoor, w: 145, h: halfDoor * 2 },
    { x: WORLD.width - 145, y: WORLD.height / 2 - halfDoor, w: 145, h: halfDoor * 2 },
  ]
}

const FORBIDDEN_ZONES = [
  { x: WORLD.width / 2 - 96, y: WORLD.height / 2 - 96, w: 192, h: 192 },
  ...createDoorLanes(),
]

function isObstacleValid(candidate, obstacles) {
  const margin = 66
  if (
    candidate.x < margin ||
    candidate.y < margin ||
    candidate.x + candidate.w > WORLD.width - margin ||
    candidate.y + candidate.h > WORLD.height - margin
  ) {
    return false
  }

  if (FORBIDDEN_ZONES.some((zone) => overlapRect(candidate, zone))) {
    return false
  }

  return !obstacles.some((obstacle) =>
    overlapRect(
      { x: candidate.x - 20, y: candidate.y - 20, w: candidate.w + 40, h: candidate.h + 40 },
      obstacle,
    ),
  )
}

function pushObstacle(obstacles, rect) {
  if (isObstacleValid(rect, obstacles)) {
    obstacles.push(rect)
  }
}

function generateObstacles(rng, roomType) {
  if (roomType === 'start') {
    return []
  }

  if (roomType === 'treasure') {
    return [
      { x: WORLD.width / 2 - 210, y: WORLD.height / 2 - 56, w: 120, h: 112 },
      { x: WORLD.width / 2 + 90, y: WORLD.height / 2 - 56, w: 120, h: 112 },
    ]
  }

  const obstacles = []
  const template = randInt(0, 3, rng)

  if (template === 0) {
    pushObstacle(obstacles, { x: 322, y: 214, w: 150, h: 128 })
    pushObstacle(obstacles, { x: 728, y: 372, w: 150, h: 128 })
  }

  if (template === 1) {
    pushObstacle(obstacles, { x: 518, y: 258, w: 164, h: 204 })
    pushObstacle(obstacles, { x: 298, y: 292, w: 130, h: 124 })
    pushObstacle(obstacles, { x: 772, y: 292, w: 130, h: 124 })
  }

  if (template === 2) {
    pushObstacle(obstacles, { x: 284, y: 188, w: 118, h: 118 })
    pushObstacle(obstacles, { x: 798, y: 188, w: 118, h: 118 })
    pushObstacle(obstacles, { x: 284, y: 414, w: 118, h: 118 })
    pushObstacle(obstacles, { x: 798, y: 414, w: 118, h: 118 })
  }

  if (template === 3) {
    pushObstacle(obstacles, { x: 420, y: 214, w: 130, h: 122 })
    pushObstacle(obstacles, { x: 610, y: 314, w: 130, h: 122 })
    pushObstacle(obstacles, { x: 320, y: 420, w: 130, h: 122 })
  }

  const bonusRocks = randInt(1, 3, rng)
  for (let index = 0; index < bonusRocks; index += 1) {
    const rock = {
      x: randInt(170, WORLD.width - 310, rng),
      y: randInt(150, WORLD.height - 270, rng),
      w: randInt(72, 122, rng),
      h: randInt(62, 114, rng),
    }
    pushObstacle(obstacles, rock)
  }

  return obstacles
}

function createRoomBase({
  x,
  y,
  depth,
  type,
  seed,
  doors = { north: false, east: false, south: false, west: false },
}) {
  return {
    key: keyFromCoords(x, y),
    x,
    y,
    depth,
    type,
    seed,
    doors,
    obstacles: [],
    enemies: [],
    loot: [],
    visited: false,
    generated: false,
    cleared: false,
    clearCounted: false,
  }
}

function resolveRoomType(depth, roomsCleared, rng) {
  if (depth === 0 && roomsCleared <= 0) {
    return 'start'
  }

  if (roomsCleared > 0 && roomsCleared % ROOM_GENERATION.eliteEvery === 0 && rng() < 0.58) {
    return 'elite'
  }

  if (rng() < ROOM_GENERATION.treasureChance) {
    return 'treasure'
  }

  return 'normal'
}

export function roomTypeLabel(roomType) {
  if (roomType === 'start') {
    return 'Sanctuary'
  }
  if (roomType === 'treasure') {
    return 'Treasure Vault'
  }
  if (roomType === 'elite') {
    return 'Elite Crypt'
  }
  return 'Dungeon Chamber'
}

export class DungeonGraph {
  constructor(seed = Date.now()) {
    this.seed = seed
    this.rooms = new Map()
    this.rootRng = createRng(seed)
    this.createStartRoom()
  }

  createStartRoom() {
    const room = createRoomBase({
      x: 0,
      y: 0,
      depth: 0,
      type: 'start',
      seed: hashToSeed(this.seed, 0, 0),
      doors: { north: true, east: true, south: true, west: true },
    })

    room.cleared = true
    room.generated = true
    room.visited = true
    room.obstacles = []
    this.rooms.set(room.key, room)
    return room
  }

  getRoom(x, y) {
    return this.rooms.get(keyFromCoords(x, y))
  }

  ensureRoom(x, y, entryDirection, roomsCleared = 0) {
    const key = keyFromCoords(x, y)
    let room = this.rooms.get(key)

    if (room) {
      if (entryDirection) {
        room.doors[entryDirection] = true
      }
      this.syncRoomDoors(room)
      return room
    }

    const seed = hashToSeed(this.seed, x * 92821, y * 68917, roomsCleared * 79)
    const rng = createRng(seed)
    const depth = Math.abs(x) + Math.abs(y) + Math.floor(roomsCleared * 0.35)
    const type = resolveRoomType(depth, roomsCleared, rng)

    room = createRoomBase({ x, y, depth, type, seed })
    if (entryDirection) {
      room.doors[entryDirection] = true
    }

    DIRECTION_KEYS.forEach((direction) => {
      if (direction !== entryDirection && rng() < ROOM_GENERATION.extraDoorChance) {
        room.doors[direction] = true
      }
    })

    if (!Object.values(room.doors).some(Boolean)) {
      room.doors[pickRandom(DIRECTION_KEYS, rng)] = true
    }

    this.rooms.set(key, room)
    this.syncRoomDoors(room)
    room.obstacles = generateObstacles(rng, type)

    if (type === 'treasure') {
      room.cleared = true
    }

    return room
  }

  getConnectedRoom(currentRoom, direction, roomsCleared = 0) {
    if (!currentRoom || !currentRoom.doors[direction]) {
      return null
    }

    const delta = DIRECTIONS[direction]
    const nextX = currentRoom.x + delta.dx
    const nextY = currentRoom.y + delta.dy

    const nextRoom = this.ensureRoom(nextX, nextY, delta.opposite, roomsCleared)
    nextRoom.doors[delta.opposite] = true
    currentRoom.doors[direction] = true
    this.syncRoomDoors(nextRoom)

    return nextRoom
  }

  syncRoomDoors(room) {
    for (const direction of DIRECTION_KEYS) {
      const delta = DIRECTIONS[direction]
      const neighbor = this.getRoom(room.x + delta.dx, room.y + delta.dy)
      if (!neighbor) {
        continue
      }

      const opposite = delta.opposite
      if (room.doors[direction] || neighbor.doors[opposite]) {
        room.doors[direction] = true
        neighbor.doors[opposite] = true
      }
    }
  }
}
