import { LAYOUT_COLORS, WORLD } from './config'
import { LABYRINTHUS_TILES, getLabyrinthusTileRect } from './sprites'
import { hashToSeed } from './utils'

const TILE_SIZE = 16
const WORLD_TILE_COLUMNS = WORLD.width / TILE_SIZE
const WORLD_TILE_ROWS = WORLD.height / TILE_SIZE
const WALL_TILE_THICKNESS = 2
const WALL_PIXEL_THICKNESS = WALL_TILE_THICKNESS * TILE_SIZE
const DOOR_TILE_SPAN_X = 12
const DOOR_TILE_SPAN_Y = 12
const DOOR_TILE_START_X = Math.floor((WORLD_TILE_COLUMNS - DOOR_TILE_SPAN_X) / 2)
const DOOR_TILE_END_X = DOOR_TILE_START_X + DOOR_TILE_SPAN_X
const DOOR_TILE_START_Y = Math.floor((WORLD_TILE_ROWS - DOOR_TILE_SPAN_Y) / 2)
const DOOR_TILE_END_Y = DOOR_TILE_START_Y + DOOR_TILE_SPAN_Y

function roomTint(roomType) {
  if (roomType === 'treasure') {
    return 'rgba(243, 191, 88, 0.13)'
  }
  if (roomType === 'elite') {
    return 'rgba(255, 112, 112, 0.13)'
  }
  if (roomType === 'start') {
    return 'rgba(78, 226, 188, 0.09)'
  }
  return 'rgba(82, 144, 255, 0.07)'
}

function floorTilePool(roomType) {
  if (roomType === 'start') {
    return LABYRINTHUS_TILES.floorStart
  }
  if (roomType === 'elite') {
    return LABYRINTHUS_TILES.floorElite
  }
  if (roomType === 'treasure') {
    return LABYRINTHUS_TILES.floorTreasure
  }
  return LABYRINTHUS_TILES.floor
}

function obstacleDecorPool(roomType) {
  if (roomType === 'treasure') {
    return [
      LABYRINTHUS_TILES.chestClosed,
      LABYRINTHUS_TILES.chestTreasure,
      LABYRINTHUS_TILES.barrel,
      LABYRINTHUS_TILES.shelf,
    ]
  }

  if (roomType === 'elite') {
    return [
      LABYRINTHUS_TILES.grave,
      LABYRINTHUS_TILES.anvil,
      LABYRINTHUS_TILES.cart,
      LABYRINTHUS_TILES.ironFence,
    ]
  }

  return [
    LABYRINTHUS_TILES.grave,
    LABYRINTHUS_TILES.crate,
    LABYRINTHUS_TILES.bookshelf,
    LABYRINTHUS_TILES.barrel,
    LABYRINTHUS_TILES.fence,
  ]
}

function pickTileIndex(tilePool, seed, x, y, salt = 0) {
  if (!tilePool.length) {
    return 0
  }

  return tilePool[hashToSeed(seed, x, y, salt) % tilePool.length]
}

function healthBarColor(ratio) {
  if (ratio <= 0.3) {
    return '#ff6d6d'
  }
  if (ratio <= 0.6) {
    return '#f4c45e'
  }
  return '#5fe38e'
}

function toRgba(hexColor, alpha) {
  if (!hexColor || hexColor[0] !== '#') {
    return `rgba(255,255,255,${alpha})`
  }

  const hex = hexColor.replace('#', '')
  const normalized = hex.length === 3 ? hex.split('').map((char) => `${char}${char}`).join('') : hex
  const value = Number.parseInt(normalized, 16)

  if (!Number.isFinite(value)) {
    return `rgba(255,255,255,${alpha})`
  }

  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `rgba(${r},${g},${b},${alpha})`
}

function drawFrame(engine, frame, x, y, width, height, options = {}, frameKind = 'atlas') {
  const atlas = engine.sprites?.$atlas
  if (!frame) {
    return false
  }

  if (frameKind === 'atlas' && (!atlas?.image || !atlas.loaded)) {
    return false
  }

  const {
    alpha = 1,
    centered = false,
    rotation = 0,
    anchorX = 0.5,
    anchorY = 0.5,
    flipX = false,
    flipY = false,
  } = options

  const ctx = engine.ctx
  const drawX = centered ? Math.round(x - width * anchorX) : Math.round(x)
  const drawY = centered ? Math.round(y - height * anchorY) : Math.round(y)

  ctx.save()
  ctx.imageSmoothingEnabled = false
  ctx.globalAlpha = alpha

  if (rotation || flipX || flipY) {
    const pivotX = centered ? Math.round(x) : Math.round(x + width * anchorX)
    const pivotY = centered ? Math.round(y) : Math.round(y + height * anchorY)
    ctx.translate(pivotX, pivotY)
    ctx.rotate(rotation)
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1)
    if (frameKind === 'atlas') {
      ctx.drawImage(
        atlas.image,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        Math.round(-width * anchorX),
        Math.round(-height * anchorY),
        width,
        height,
      )
    } else {
      ctx.drawImage(frame, Math.round(-width * anchorX), Math.round(-height * anchorY), width, height)
    }
  } else {
    if (frameKind === 'atlas') {
      ctx.drawImage(atlas.image, frame.x, frame.y, frame.width, frame.height, drawX, drawY, width, height)
    } else {
      ctx.drawImage(frame, drawX, drawY, width, height)
    }
  }

  ctx.restore()
  return true
}

function drawTile(engine, index, x, y, width = TILE_SIZE, height = width, options = {}) {
  return drawFrame(engine, getLabyrinthusTileRect(index), x, y, width, height, options, 'atlas')
}

function drawSprite(engine, name, x, y, drawSize, frame = 0, alpha = 1, options = {}) {
  const sprite = engine.sprites?.[name]
  if (!sprite || !sprite.frames.length) {
    return false
  }

  const spriteFrame = sprite.frames[frame % sprite.frames.length]
  const width = options.width || drawSize
  const height = options.height || drawSize * (sprite.height / sprite.width)

  return drawFrame(
    engine,
    spriteFrame,
    x,
    y,
    width,
    height,
    {
      alpha,
      centered: options.centered ?? true,
      anchorX: options.anchorX ?? 0.5,
      anchorY: options.anchorY ?? 0.7,
      rotation: options.rotation ?? 0,
      flipX: options.flipX ?? false,
      flipY: options.flipY ?? false,
    },
    sprite.kind,
  )
}

function renderBackdropOnly(engine) {
  const ctx = engine.ctx
  ctx.fillStyle = '#0b0812'
  ctx.fillRect(0, 0, WORLD.width, WORLD.height)

  for (let row = 0; row < WORLD_TILE_ROWS; row += 1) {
    for (let col = 0; col < WORLD_TILE_COLUMNS; col += 1) {
      const tileIndex = pickTileIndex(LABYRINTHUS_TILES.floorElite, 991, col, row, 7)
      drawTile(engine, tileIndex, col * TILE_SIZE, row * TILE_SIZE)
    }
  }

  ctx.fillStyle = 'rgba(18, 10, 27, 0.34)'
  ctx.fillRect(0, 0, WORLD.width, WORLD.height)

  for (let x = 0; x < WORLD.width; x += 64) {
    ctx.fillStyle = 'rgba(140, 214, 255, 0.06)'
    ctx.fillRect(x, 0, 2, WORLD.height)
  }

  const pulse = 0.12 + (Math.sin(engine.time * 1.6) + 1) * 0.05
  ctx.fillStyle = `rgba(116, 244, 185, ${pulse})`
  ctx.fillRect(WORLD.width / 2 - 120, WORLD.height / 2 - 10, 240, 20)

  drawTile(engine, LABYRINTHUS_TILES.relic, WORLD.width / 2 - 12, WORLD.height / 2 - 14, 24, 24)
}

function renderTorch(engine, x, y, variantOffset = 0) {
  const ctx = engine.ctx
  const flicker = 0.45 + ((Math.sin(engine.time * 7.5 + variantOffset * 1.7) + 1) / 2) * 0.55
  const lift = Math.sin(engine.time * 4.2 + variantOffset) * 0.6

  ctx.globalAlpha = 0.12 + flicker * 0.18
  ctx.fillStyle = '#ff9156'
  ctx.fillRect(Math.round(x - 12), Math.round(y - 7), 24, 22)

  ctx.globalAlpha = 0.16 + flicker * 0.14
  ctx.fillStyle = '#fff0b5'
  ctx.fillRect(Math.round(x - 5), Math.round(y - 4 + lift), 10, 12)
  ctx.globalAlpha = 1

  drawTile(engine, LABYRINTHUS_TILES.torch[0], x - 8, y - 8 + lift, 16, 16)
}

function renderWalls(engine, room) {
  const ctx = engine.ctx
  const wallSeed = hashToSeed(room.seed, 71)
  const topDoorX = DOOR_TILE_START_X * TILE_SIZE
  const topDoorWidth = DOOR_TILE_SPAN_X * TILE_SIZE
  const sideDoorY = DOOR_TILE_START_Y * TILE_SIZE
  const sideDoorHeight = DOOR_TILE_SPAN_Y * TILE_SIZE

  for (let row = 0; row < WALL_TILE_THICKNESS; row += 1) {
    for (let col = 0; col < WORLD_TILE_COLUMNS; col += 1) {
      const northGap = room.doors.north && col >= DOOR_TILE_START_X && col < DOOR_TILE_END_X
      const southGap = room.doors.south && col >= DOOR_TILE_START_X && col < DOOR_TILE_END_X
      if (!northGap) {
        drawTile(engine, pickTileIndex(LABYRINTHUS_TILES.wall, wallSeed, col, row, 11), col * TILE_SIZE, row * TILE_SIZE)
      }
      if (!southGap) {
        drawTile(engine, pickTileIndex(LABYRINTHUS_TILES.wall, wallSeed, col, row, 29), col * TILE_SIZE, WORLD.height - (WALL_TILE_THICKNESS - row) * TILE_SIZE)
      }
    }
  }

  for (let col = 0; col < WALL_TILE_THICKNESS; col += 1) {
    for (let row = 0; row < WORLD_TILE_ROWS; row += 1) {
      const westGap = room.doors.west && row >= DOOR_TILE_START_Y && row < DOOR_TILE_END_Y
      const eastGap = room.doors.east && row >= DOOR_TILE_START_Y && row < DOOR_TILE_END_Y
      if (!westGap) {
        drawTile(engine, pickTileIndex(LABYRINTHUS_TILES.wallAccent, wallSeed, col, row, 41), col * TILE_SIZE, row * TILE_SIZE)
      }
      if (!eastGap) {
        drawTile(engine, pickTileIndex(LABYRINTHUS_TILES.wallAccent, wallSeed, col, row, 59), WORLD.width - (WALL_TILE_THICKNESS - col) * TILE_SIZE, row * TILE_SIZE)
      }
    }
  }

  ctx.fillStyle = 'rgba(20, 11, 23, 0.55)'
  ctx.fillRect(0, WALL_PIXEL_THICKNESS, WORLD.width, 4)
  ctx.fillRect(0, WORLD.height - WALL_PIXEL_THICKNESS - 4, WORLD.width, 4)
  ctx.fillRect(WALL_PIXEL_THICKNESS, 0, 4, WORLD.height)
  ctx.fillRect(WORLD.width - WALL_PIXEL_THICKNESS - 4, 0, 4, WORLD.height)

  if (room.doors.north) {
    renderTorch(engine, topDoorX - 24, WALL_PIXEL_THICKNESS - 12, 0)
    renderTorch(engine, topDoorX + topDoorWidth + 8, WALL_PIXEL_THICKNESS - 12, 1)
  }
  if (room.doors.south) {
    renderTorch(engine, topDoorX - 24, WORLD.height - WALL_PIXEL_THICKNESS + 4, 1)
    renderTorch(engine, topDoorX + topDoorWidth + 8, WORLD.height - WALL_PIXEL_THICKNESS + 4, 0)
  }
  if (room.doors.west) {
    renderTorch(engine, WALL_PIXEL_THICKNESS - 10, sideDoorY - 20, 1)
    renderTorch(engine, WALL_PIXEL_THICKNESS - 10, sideDoorY + sideDoorHeight + 4, 0)
  }
  if (room.doors.east) {
    renderTorch(engine, WORLD.width - WALL_PIXEL_THICKNESS + 4, sideDoorY - 20, 0)
    renderTorch(engine, WORLD.width - WALL_PIXEL_THICKNESS + 4, sideDoorY + sideDoorHeight + 4, 1)
  }

  renderDoorGates(engine, room, {
    topDoorX,
    topDoorWidth,
    sideDoorY,
    sideDoorHeight,
  })
}

function renderDoorGates(engine, room, dimensions) {
  const ctx = engine.ctx
  const pulse = room.cleared ? 0.22 + (Math.sin(engine.time * 4.5) + 1) * 0.08 : 0.86
  const horizontalYTop = WALL_PIXEL_THICKNESS - 8
  const horizontalYBottom = WORLD.height - WALL_PIXEL_THICKNESS
  const verticalXLeft = WALL_PIXEL_THICKNESS - 8
  const verticalXRight = WORLD.width - WALL_PIXEL_THICKNESS

  const renderLockedHorizontalGate = (y) => {
    ctx.fillStyle = 'rgba(14, 11, 18, 0.86)'
    ctx.fillRect(dimensions.topDoorX, y - 8, dimensions.topDoorWidth, 16)
    ctx.fillStyle = '#d0d7e8'
    for (let x = dimensions.topDoorX + 6; x < dimensions.topDoorX + dimensions.topDoorWidth - 4; x += 14) {
      ctx.globalAlpha = pulse
      ctx.fillRect(x, y - 8, 4, 16)
    }
    ctx.globalAlpha = 1
    ctx.fillStyle = 'rgba(235, 241, 249, 0.32)'
    ctx.fillRect(dimensions.topDoorX, y - 10, dimensions.topDoorWidth, 2)
  }

  const renderLockedVerticalGate = (x) => {
    ctx.fillStyle = 'rgba(14, 11, 18, 0.86)'
    ctx.fillRect(x - 8, dimensions.sideDoorY, 16, dimensions.sideDoorHeight)
    ctx.fillStyle = '#d0d7e8'
    for (let y = dimensions.sideDoorY + 6; y < dimensions.sideDoorY + dimensions.sideDoorHeight - 4; y += 14) {
      ctx.globalAlpha = pulse
      ctx.fillRect(x - 8, y, 16, 4)
    }
    ctx.globalAlpha = 1
    ctx.fillStyle = 'rgba(235, 241, 249, 0.32)'
    ctx.fillRect(x - 10, dimensions.sideDoorY, 2, dimensions.sideDoorHeight)
  }

  const renderOpenHorizontalGate = (y) => {
    ctx.fillStyle = `rgba(104, 255, 198, ${pulse})`
    ctx.fillRect(dimensions.topDoorX, y, dimensions.topDoorWidth, 6)
    for (let x = dimensions.topDoorX + 6; x < dimensions.topDoorX + dimensions.topDoorWidth - 4; x += 22) {
      ctx.fillRect(x, y - 4, 6, 14)
    }
  }

  const renderOpenVerticalGate = (x) => {
    ctx.fillStyle = `rgba(104, 255, 198, ${pulse})`
    ctx.fillRect(x, dimensions.sideDoorY, 6, dimensions.sideDoorHeight)
    for (let y = dimensions.sideDoorY + 6; y < dimensions.sideDoorY + dimensions.sideDoorHeight - 4; y += 22) {
      ctx.fillRect(x - 4, y, 14, 6)
    }
  }

  if (room.doors.north) {
    room.cleared ? renderOpenHorizontalGate(horizontalYTop) : renderLockedHorizontalGate(horizontalYTop)
  }
  if (room.doors.south) {
    room.cleared ? renderOpenHorizontalGate(horizontalYBottom) : renderLockedHorizontalGate(horizontalYBottom)
  }
  if (room.doors.west) {
    room.cleared ? renderOpenVerticalGate(verticalXLeft) : renderLockedVerticalGate(verticalXLeft)
  }
  if (room.doors.east) {
    room.cleared ? renderOpenVerticalGate(verticalXRight) : renderLockedVerticalGate(verticalXRight)
  }
}

function renderObstacles(engine, room) {
  const ctx = engine.ctx
  const decorPool = obstacleDecorPool(room.type)

  room.obstacles.forEach((obstacle, index) => {
    const seed = hashToSeed(room.seed, index, obstacle.x, obstacle.y)

    ctx.fillStyle = 'rgba(12, 7, 15, 0.28)'
    ctx.fillRect(obstacle.x + 6, obstacle.y + obstacle.h - 2, obstacle.w, 8)

    for (let y = obstacle.y; y < obstacle.y + obstacle.h; y += TILE_SIZE) {
      for (let x = obstacle.x; x < obstacle.x + obstacle.w; x += TILE_SIZE) {
        const tileIndex = pickTileIndex(LABYRINTHUS_TILES.wall, seed, x, y, 13)
        drawTile(engine, tileIndex, x, y)
      }
    }

    ctx.fillStyle = 'rgba(255, 244, 214, 0.1)'
    ctx.fillRect(obstacle.x + 2, obstacle.y + 2, Math.max(0, obstacle.w - 4), 4)
    ctx.strokeStyle = 'rgba(24, 14, 29, 0.85)'
    ctx.lineWidth = 2
    ctx.strokeRect(obstacle.x + 1, obstacle.y + 1, obstacle.w - 2, obstacle.h - 2)

    const decorationTile = decorPool[index % decorPool.length]
    const decorationCount = obstacle.w >= 132 ? 2 : 1
    for (let decorIndex = 0; decorIndex < decorationCount; decorIndex += 1) {
      const centerX = obstacle.x + (obstacle.w * (decorIndex + 1)) / (decorationCount + 1)
      const centerY = obstacle.y + obstacle.h / 2
      drawTile(engine, decorationTile, Math.round(centerX - 10), Math.round(centerY - 12), 20, 20)
    }
  })
}

function renderRoom(engine, room) {
  const ctx = engine.ctx
  ctx.fillStyle = '#140d11'
  ctx.fillRect(0, 0, WORLD.width, WORLD.height)

  const floorPool = floorTilePool(room.type)
  for (let row = 0; row < WORLD_TILE_ROWS; row += 1) {
    for (let col = 0; col < WORLD_TILE_COLUMNS; col += 1) {
      const tileIndex = pickTileIndex(floorPool, room.seed, col, row, room.depth)
      drawTile(engine, tileIndex, col * TILE_SIZE, row * TILE_SIZE)

      if (hashToSeed(room.seed, col, row, 301) % 23 === 0) {
        ctx.fillStyle = 'rgba(67, 41, 27, 0.14)'
        ctx.fillRect(col * TILE_SIZE + 3, row * TILE_SIZE + 10, 4, 4)
      }
    }
  }

  ctx.fillStyle = roomTint(room.type)
  ctx.fillRect(0, 0, WORLD.width, WORLD.height)

  const centerGlow = ctx.createRadialGradient(
    WORLD.width / 2,
    WORLD.height / 2,
    40,
    WORLD.width / 2,
    WORLD.height / 2,
    WORLD.width * 0.42,
  )
  centerGlow.addColorStop(0, 'rgba(255, 244, 199, 0.12)')
  centerGlow.addColorStop(1, 'rgba(255, 244, 199, 0)')
  ctx.fillStyle = centerGlow
  ctx.fillRect(0, 0, WORLD.width, WORLD.height)

  renderWalls(engine, room)
  renderObstacles(engine, room)

  if (room.type === 'treasure') {
    ctx.fillStyle = `rgba(255, 225, 125, ${0.14 + (Math.sin(engine.time * 4) + 1) * 0.04})`
    ctx.fillRect(WORLD.width / 2 - 26, WORLD.height / 2 - 26, 52, 52)
    drawTile(engine, LABYRINTHUS_TILES.chestTreasure, WORLD.width / 2 - 14, WORLD.height / 2 - 18, 28, 28)
  }
}

function renderLoot(engine) {
  const ctx = engine.ctx
  for (const loot of engine.loot) {
    const bob = Math.sin(loot.pulse * 0.85) * 3
    let glowColor = '#f6dc73'
    let spriteName = 'coin'
    let spriteSize = 26

    if (loot.type === 'potion') {
      glowColor = '#ff8faf'
      spriteName = 'potion'
    } else if (loot.type === 'relic') {
      glowColor = '#8cc2ff'
      spriteName = 'relic'
      spriteSize = 28
    }

    ctx.globalAlpha = 0.2
    ctx.fillStyle = glowColor
    ctx.fillRect(Math.round(loot.x - 12), Math.round(loot.y - 8 + bob), 24, 24)
    ctx.globalAlpha = 1

    const spriteFrame = loot.type === 'potion' ? Math.floor((engine.time + loot.pulse) * 4) % 2 : 0
    drawSprite(engine, spriteName, loot.x, loot.y + bob, spriteSize, spriteFrame, 1, { anchorY: 0.68 })

    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.fillRect(Math.round(loot.x - 2), Math.round(loot.y - 10 + bob), 4, 4)
  }
}

function renderProjectileTrail(ctx, projectile) {
  const angle = Math.atan2(projectile.velocityY, projectile.velocityX)
  const trailColor = projectile.particleColor || projectile.color
  const trailDuration =
    projectile.trailStyle === 'arcane' ? 0.24 : projectile.trailStyle === 'arrow' ? 0.14 : 0.2

  for (const point of projectile.trail) {
    const ratio = Math.max(0, point.life / trailDuration)
    if (ratio <= 0) {
      continue
    }

    ctx.globalAlpha = Math.min(1, ratio * 0.55)

    if (projectile.trailStyle === 'arrow') {
      const width = Math.max(6, Math.round(projectile.radius * 4 * ratio))
      const height = Math.max(2, Math.round(projectile.radius))
      ctx.save()
      ctx.translate(Math.round(point.x), Math.round(point.y))
      ctx.rotate(angle)
      ctx.fillStyle = trailColor
      ctx.fillRect(Math.round(-width * 0.55), Math.round(-height / 2), width, height)
      ctx.restore()
      continue
    }

    if (projectile.trailStyle === 'arcane') {
      const size = Math.max(3, Math.round(projectile.radius * 1.7 * ratio))
      ctx.fillStyle = trailColor
      ctx.fillRect(Math.round(point.x - size / 2), Math.round(point.y - size / 2), size, size)
      ctx.fillStyle = '#f5fdff'
      ctx.fillRect(Math.round(point.x - 1), Math.round(point.y - 1), 2, 2)
      continue
    }

    const size = Math.max(2, Math.round(projectile.radius * ratio))
    ctx.fillStyle = projectile.color
    ctx.fillRect(Math.round(point.x - size / 2), Math.round(point.y - size / 2), size, size)
  }

  ctx.globalAlpha = 1
}

function renderProjectiles(engine) {
  const ctx = engine.ctx
  for (const projectile of engine.projectiles) {
    renderProjectileTrail(ctx, projectile)
    const angle = Math.atan2(projectile.velocityY, projectile.velocityX) + Math.PI / 2
    const spriteFrame = projectile.trailStyle === 'arcane' ? Math.floor(engine.time * 10) % 2 : 0
    const spriteKey = projectile.spriteKey || 'projectile'
    const glowSize = projectile.trailStyle === 'arcane' ? 16 : projectile.trailStyle === 'arrow' ? 10 : 14

    ctx.globalAlpha = projectile.trailStyle === 'arrow' ? 0.42 : 0.78
    ctx.fillStyle = toRgba(projectile.color, 1)
    ctx.fillRect(
      Math.round(projectile.x - glowSize / 2),
      Math.round(projectile.y - glowSize / 2),
      glowSize,
      glowSize,
    )
    ctx.globalAlpha = 1

    drawSprite(engine, spriteKey, projectile.x, projectile.y, projectile.radius * 3.8, spriteFrame, 0.96, {
      rotation: angle,
      anchorY: 0.5,
    })
  }
}

function renderEnemies(engine) {
  const ctx = engine.ctx

  for (const enemy of engine.enemies) {
    const bob = Math.sin(engine.time * 5 + enemy.aiSeed) * (enemy.type === 'slime' ? 2.2 : 1.5)
    const frame = Math.floor(engine.time * 6 + enemy.aiSeed) % 2
    const spriteSize =
      enemy.type === 'tank' ? 42 : enemy.type === 'slime' ? 30 : enemy.type === 'skeleton' ? 34 : 32
    const weaponAngle = Math.atan2(engine.player.y - enemy.y, engine.player.x - enemy.x) + Math.PI / 2
    const weaponName = enemy.type === 'tank' ? 'axe' : enemy.type === 'skeleton' ? 'bow' : 'sword'

    ctx.fillStyle = 'rgba(7, 5, 11, 0.5)'
    ctx.beginPath()
    ctx.ellipse(enemy.x, enemy.y + enemy.radius * 0.85, enemy.radius * 0.9, enemy.radius * 0.45, 0, 0, Math.PI * 2)
    ctx.fill()

    const drewSprite = drawSprite(engine, enemy.type, enemy.x, enemy.y + bob, spriteSize, frame, enemy.hitFx > 0 ? 0.72 : 1, {
      anchorY: enemy.type === 'slime' ? 0.62 : 0.74,
    })

    if (!drewSprite) {
      ctx.fillStyle = enemy.color
      ctx.beginPath()
      ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2)
      ctx.fill()
    }

    if (enemy.type !== 'slime') {
      const weaponOffset = enemy.type === 'tank' ? enemy.radius + 4 : enemy.radius + 2
      drawSprite(
        engine,
        weaponName,
        enemy.x + Math.cos(weaponAngle - Math.PI / 2) * weaponOffset,
        enemy.y + Math.sin(weaponAngle - Math.PI / 2) * weaponOffset,
        enemy.type === 'tank' ? 20 : 16,
        0,
        0.95,
        {
          rotation: weaponAngle,
          anchorY: weaponName === 'bow' ? 0.5 : 0.84,
        },
      )
    }

    if (enemy.hp < enemy.maxHp) {
      const barWidth = enemy.type === 'tank' ? 42 : 34
      const ratio = Math.max(0, enemy.hp / enemy.maxHp)
      ctx.fillStyle = 'rgba(20, 11, 24, 0.92)'
      ctx.fillRect(Math.round(enemy.x - barWidth / 2), Math.round(enemy.y - enemy.radius - 19), barWidth, 6)
      ctx.fillStyle = healthBarColor(ratio)
      ctx.fillRect(
        Math.round(enemy.x - barWidth / 2 + 1),
        Math.round(enemy.y - enemy.radius - 18),
        Math.max(0, Math.round((barWidth - 2) * ratio)),
        4,
      )
    }
  }
}

function renderSwordAttackFx(engine, player, attackAngle, attackProgress) {
  if (attackProgress <= 0) {
    return
  }

  const ctx = engine.ctx
  const sweep = Math.PI * 0.52
  const radius = player.attackRange - 16 + attackProgress * 8
  ctx.fillStyle = toRgba(player.weapon.attackColor, 0.28 + attackProgress * 0.42)

  for (let step = 0; step < 7; step += 1) {
    const theta = attackAngle - sweep + (step / 6) * sweep * 2
    const x = player.x + Math.cos(theta) * radius
    const y = player.y + Math.sin(theta) * radius
    const size = step % 2 === 0 ? 6 : 4
    ctx.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size)
  }
}

function renderBowAttackFx(engine, player, attackAngle, attackProgress) {
  if (attackProgress <= 0) {
    return
  }

  const ctx = engine.ctx
  const sideX = Math.cos(attackAngle + Math.PI / 2)
  const sideY = Math.sin(attackAngle + Math.PI / 2)
  const bowX = player.x + player.facingX * (player.radius + 8)
  const bowY = player.y + player.facingY * (player.radius + 8)
  const stringX = player.x - player.facingX * (4 + attackProgress * 7)
  const stringY = player.y - player.facingY * (4 + attackProgress * 7)

  ctx.globalAlpha = 0.42 + attackProgress * 0.45
  ctx.strokeStyle = '#ffe6a8'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(Math.round(bowX - sideX * 6), Math.round(bowY - sideY * 6))
  ctx.lineTo(Math.round(stringX), Math.round(stringY))
  ctx.lineTo(Math.round(bowX + sideX * 6), Math.round(bowY + sideY * 6))
  ctx.stroke()

  ctx.fillStyle = '#fff4ca'
  ctx.fillRect(
    Math.round(player.x + player.facingX * (player.radius + 14) - 5),
    Math.round(player.y + player.facingY * (player.radius + 14) - 1),
    10,
    2,
  )
  ctx.globalAlpha = 1
}

function renderWandAttackFx(engine, player, attackAngle, attackProgress) {
  if (attackProgress <= 0) {
    return
  }

  const ctx = engine.ctx
  const centerX = player.x + player.facingX * (player.radius + 14)
  const centerY = player.y + player.facingY * (player.radius + 14)
  const pulse = 0.35 + attackProgress * 0.45

  ctx.globalAlpha = pulse
  ctx.fillStyle = player.weapon.attackColor
  ctx.fillRect(Math.round(centerX - 8), Math.round(centerY - 8), 16, 16)

  for (let index = 0; index < 5; index += 1) {
    const theta = attackAngle + engine.time * 4.5 + index * ((Math.PI * 2) / 5)
    const x = centerX + Math.cos(theta) * (9 + attackProgress * 4)
    const y = centerY + Math.sin(theta) * (9 + attackProgress * 4)
    ctx.fillRect(Math.round(x - 2), Math.round(y - 2), 4, 4)
  }

  ctx.globalAlpha = 1
}

function renderPlayer(engine) {
  const ctx = engine.ctx
  const player = engine.player
  const moveIntensity = Math.abs(engine.movementIntent.x) + Math.abs(engine.movementIntent.y)
  const bob = moveIntensity > 0.1 ? Math.sin(engine.time * 9) * 1.6 : 0
  const attackAngle = Number.isFinite(player.lastAttackAngle)
    ? player.lastAttackAngle
    : Math.atan2(player.facingY, player.facingX)
  const weaponAngle = attackAngle + Math.PI / 2
  const attackDuration = player.weapon?.attackFxDuration || 0.16
  const attackProgress = attackDuration > 0 ? Math.min(1, player.attackFx / attackDuration) : 0
  const playerSprite = player.weapon?.spriteKey || 'playerSword'
  const weaponSprite = player.weapon?.weaponSpriteKey || 'sword'
  const facingLeft = player.facingX < -0.12
  const playerAlpha = player.invulnerability > 0 && Math.floor(engine.time * 20) % 2 === 0 ? 0.48 : 1

  const auraPulse = 0.14 + (Math.sin(engine.time * 7) + 1) * 0.05
  ctx.globalAlpha = auraPulse
  ctx.fillStyle = player.weapon?.attackColor || '#8fd6ff'
  ctx.fillRect(Math.round(player.x - 18), Math.round(player.y - 18), 36, 36)
  ctx.globalAlpha = 1

  ctx.fillStyle = 'rgba(7, 5, 11, 0.52)'
  ctx.beginPath()
  ctx.ellipse(player.x, player.y + player.radius * 0.9, player.radius * 0.95, player.radius * 0.48, 0, 0, Math.PI * 2)
  ctx.fill()

  const drewSprite = drawSprite(engine, playerSprite, player.x, player.y + bob, 36, 0, playerAlpha, {
    anchorY: 0.74,
    flipX: facingLeft,
  })

  if (!drewSprite) {
    ctx.fillStyle = LAYOUT_COLORS.player
    ctx.beginPath()
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2)
    ctx.fill()
  }

  const weaponReach = player.radius + (weaponSprite === 'bow' ? 7 : 8) + attackProgress * (weaponSprite === 'sword' ? 6 : 3)
  const weaponRotationJitter =
    weaponSprite === 'sword' ? Math.sin(attackProgress * Math.PI) * 0.42 : attackProgress * 0.08
  const weaponSize = weaponSprite === 'bow' ? 22 : attackProgress > 0 ? 22 : 18
  drawSprite(
    engine,
    weaponSprite,
    player.x + player.facingX * weaponReach,
    player.y + player.facingY * weaponReach,
    weaponSize,
    0,
    playerAlpha,
    {
      rotation: weaponAngle + weaponRotationJitter,
      anchorY: weaponSprite === 'bow' ? 0.5 : 0.86,
    },
  )

  if (weaponSprite === 'bow') {
    renderBowAttackFx(engine, player, attackAngle, attackProgress)
  } else if (weaponSprite === 'wand') {
    renderWandAttackFx(engine, player, attackAngle, attackProgress)
  } else {
    renderSwordAttackFx(engine, player, attackAngle, attackProgress)
  }

  ctx.globalAlpha = 1
}

function renderParticles(engine) {
  const ctx = engine.ctx
  for (const particle of engine.particles) {
    const alpha = Math.max(0, particle.life / Math.max(0.001, particle.maxLife))
    if (alpha <= 0) {
      continue
    }

    const size = Math.max(2, Math.round(particle.radius * 1.25))
    ctx.globalAlpha = alpha
    ctx.fillStyle = particle.color
    ctx.fillRect(Math.round(particle.x - size / 2), Math.round(particle.y - size / 2), size, size)
  }
  ctx.globalAlpha = 1
}

function renderPostProcess(engine) {
  const ctx = engine.ctx

  const vignette = ctx.createRadialGradient(
    WORLD.width / 2,
    WORLD.height / 2,
    WORLD.height * 0.18,
    WORLD.width / 2,
    WORLD.height / 2,
    WORLD.width * 0.68,
  )
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(1, 'rgba(3, 2, 8, 0.54)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, WORLD.width, WORLD.height)

  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
  for (let y = 0; y < WORLD.height; y += 4) {
    ctx.fillRect(0, y, WORLD.width, 1)
  }

  if (engine.damageFlash > 0) {
    ctx.fillStyle = `rgba(255, 84, 84, ${engine.damageFlash * 0.28})`
    ctx.fillRect(0, 0, WORLD.width, WORLD.height)
  }
}

function renderRoomHints(engine) {
  const ctx = engine.ctx
  if (engine.scene !== 'playing' || !engine.currentRoom) {
    return
  }

  const boxWidth = 470
  const boxHeight = 42
  const boxX = WORLD.width / 2 - boxWidth / 2
  const boxY = 14
  const hintText = engine.currentRoom.cleared
    ? 'Room cleared. Cross a glowing gate to continue'
    : `Enemies remaining: ${engine.enemies.length}`

  ctx.fillStyle = 'rgba(17, 12, 24, 0.82)'
  ctx.fillRect(boxX, boxY, boxWidth, boxHeight)
  ctx.strokeStyle = engine.currentRoom.cleared ? 'rgba(111, 238, 180, 0.72)' : 'rgba(236, 210, 128, 0.72)'
  ctx.lineWidth = 2
  ctx.strokeRect(boxX + 1, boxY + 1, boxWidth - 2, boxHeight - 2)

  ctx.fillStyle = '#f6ead4'
  ctx.font = '700 12px "Silkscreen", monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(hintText, WORLD.width / 2, boxY + boxHeight / 2 + 1)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

export function renderLabyrinthusScene(engine) {
  const ctx = engine.ctx
  if (!ctx) {
    return
  }

  ctx.clearRect(0, 0, WORLD.width, WORLD.height)

  const shakeStrength = engine.cameraShake * 8
  const shakeX = shakeStrength > 0 ? (Math.random() * 2 - 1) * shakeStrength : 0
  const shakeY = shakeStrength > 0 ? (Math.random() * 2 - 1) * shakeStrength : 0
  ctx.save()
  if (shakeStrength > 0) {
    ctx.translate(shakeX, shakeY)
  }

  if (!engine.currentRoom) {
    renderBackdropOnly(engine)
    renderParticles(engine)
    ctx.restore()
    renderPostProcess(engine)
    return
  }

  renderRoom(engine, engine.currentRoom)
  renderLoot(engine)
  renderProjectiles(engine)
  renderEnemies(engine)
  renderPlayer(engine)
  renderParticles(engine)
  ctx.restore()

  renderPostProcess(engine)
  renderRoomHints(engine)
}
