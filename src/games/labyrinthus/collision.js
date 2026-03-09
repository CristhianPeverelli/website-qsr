import { WORLD } from './config'
import { clamp } from './utils'

function resolveCircleRectCollision(circle, rect) {
  const nearestX = clamp(circle.x, rect.x, rect.x + rect.w)
  const nearestY = clamp(circle.y, rect.y, rect.y + rect.h)
  const dx = circle.x - nearestX
  const dy = circle.y - nearestY
  const distSq = dx * dx + dy * dy

  if (distSq === 0) {
    const left = Math.abs(circle.x - rect.x)
    const right = Math.abs(circle.x - (rect.x + rect.w))
    const top = Math.abs(circle.y - rect.y)
    const bottom = Math.abs(circle.y - (rect.y + rect.h))
    const min = Math.min(left, right, top, bottom)

    if (min === left) {
      circle.x = rect.x - circle.radius
    } else if (min === right) {
      circle.x = rect.x + rect.w + circle.radius
    } else if (min === top) {
      circle.y = rect.y - circle.radius
    } else {
      circle.y = rect.y + rect.h + circle.radius
    }
    return
  }

  const dist = Math.sqrt(distSq)
  if (dist < circle.radius) {
    const overlap = circle.radius - dist
    circle.x += (dx / dist) * overlap
    circle.y += (dy / dist) * overlap
  }
}

function collideWithObstacles(circle, obstacles) {
  if (!obstacles.length) {
    return
  }

  for (let step = 0; step < 2; step += 1) {
    for (const obstacle of obstacles) {
      resolveCircleRectCollision(circle, obstacle)
    }
  }
}

export function moveCircle(circle, velocityX, velocityY, deltaTime, room) {
  circle.x += velocityX * deltaTime
  circle.x = clamp(circle.x, circle.radius, WORLD.width - circle.radius)
  collideWithObstacles(circle, room.obstacles)

  circle.y += velocityY * deltaTime
  circle.y = clamp(circle.y, circle.radius, WORLD.height - circle.radius)
  collideWithObstacles(circle, room.obstacles)
}

export function circlesOverlap(a, b, padding = 0) {
  const radius = a.radius + b.radius + padding
  const dx = b.x - a.x
  const dy = b.y - a.y
  return dx * dx + dy * dy < radius * radius
}

function isInsideDoorLane(room, direction, x, y, extra = 0) {
  const halfDoor = room ? WORLD.doorWidth / 2 + extra : WORLD.doorWidth / 2

  if (direction === 'north' || direction === 'south') {
    return Math.abs(x - WORLD.width / 2) <= halfDoor
  }

  return Math.abs(y - WORLD.height / 2) <= halfDoor
}

export function detectDoorTransition(player, room, movementIntent) {
  if (!room.cleared) {
    return null
  }

  const intentX = movementIntent.x || 0
  const intentY = movementIntent.y || 0
  const threshold = player.radius + 4

  if (
    intentY < -0.15 &&
    room.doors.north &&
    player.y <= threshold &&
    isInsideDoorLane(room, 'north', player.x, player.y, -14)
  ) {
    return 'north'
  }

  if (
    intentX > 0.15 &&
    room.doors.east &&
    player.x >= WORLD.width - threshold &&
    isInsideDoorLane(room, 'east', player.x, player.y, -14)
  ) {
    return 'east'
  }

  if (
    intentY > 0.15 &&
    room.doors.south &&
    player.y >= WORLD.height - threshold &&
    isInsideDoorLane(room, 'south', player.x, player.y, -14)
  ) {
    return 'south'
  }

  if (
    intentX < -0.15 &&
    room.doors.west &&
    player.x <= threshold &&
    isInsideDoorLane(room, 'west', player.x, player.y, -14)
  ) {
    return 'west'
  }

  return null
}

export function isProjectileBlocked(projectile, room) {
  if (
    projectile.x < -projectile.radius ||
    projectile.x > WORLD.width + projectile.radius ||
    projectile.y < -projectile.radius ||
    projectile.y > WORLD.height + projectile.radius
  ) {
    return true
  }

  return room.obstacles.some((obstacle) => {
    const nearestX = clamp(projectile.x, obstacle.x, obstacle.x + obstacle.w)
    const nearestY = clamp(projectile.y, obstacle.y, obstacle.y + obstacle.h)
    const dx = projectile.x - nearestX
    const dy = projectile.y - nearestY
    return dx * dx + dy * dy < projectile.radius * projectile.radius
  })
}
