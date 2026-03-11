import {
  ENEMY_SPAWN_POOLS,
  LABYRINTHUS_TITLE,
  LAYOUT_COLORS,
  WORLD,
} from './config'
import { circlesOverlap, detectDoorTransition, isProjectileBlocked, moveCircle } from './collision'
import { DungeonGraph, roomTypeLabel } from './dungeon'
import { createEnemy, createLoot, createPlayer, createProjectile, resetEntityIds } from './entities'
import { createLabyrinthusSprites } from './sprites'
import { applyUpgradeById, rollRelic, rollUpgradeChoices } from './upgrades'
import {
  circleIntersectsRect,
  createRng,
  distance,
  normalize,
  pickWeighted,
  randInt,
  randRange,
} from './utils'

function getSpawnPool(roomsCleared) {
  let activePool = ENEMY_SPAWN_POOLS[0].entries
  for (const pool of ENEMY_SPAWN_POOLS) {
    if (roomsCleared >= pool.minRooms) {
      activePool = pool.entries
    }
  }
  return activePool
}

function scoreFormula(stats) {
  return (
    stats.score +
    stats.roomsCleared * 110 +
    stats.kills * 16 +
    stats.coins * 7 +
    stats.relics * 28
  )
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

export class LabyrinthusEngine {
  constructor({ canvas, onStateChange = () => {} }) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = false
    }
    this.onStateChange = onStateChange
    this.sprites = createLabyrinthusSprites()

    this.scene = 'menu'
    this.gameOverSummary = null
    this.message = ''
    this.messageTime = 0
    this.pendingUpgrades = []
    this.recentUpgrades = []

    this.keys = new Set()
    this.attackQueued = false
    this.potionQueued = false
    this.pointer = {
      x: WORLD.width / 2,
      y: WORLD.height / 2,
      inside: false,
      down: false,
    }
    this.movementIntent = { x: 0, y: 0 }

    this.player = null
    this.dungeon = null
    this.currentRoom = null
    this.enemies = []
    this.loot = []
    this.projectiles = []

    this.stats = {
      roomsCleared: 0,
      kills: 0,
      coins: 0,
      potions: 1,
      relics: 0,
      score: 0,
    }

    this.transitionCooldown = 0
    this.loopId = null
    this.lastFrame = 0
    this.emitInterval = 0
    this.time = 0
    this.runSeed = null
    this.runRng = createRng(Date.now())
    this.particles = []
    this.cameraShake = 0
    this.damageFlash = 0

    this.handleKeydown = this.handleKeydown.bind(this)
    this.handleKeyup = this.handleKeyup.bind(this)
    this.handlePointerMove = this.handlePointerMove.bind(this)
    this.handlePointerDown = this.handlePointerDown.bind(this)
    this.handlePointerUp = this.handlePointerUp.bind(this)
    this.handlePointerLeave = this.handlePointerLeave.bind(this)
    this.frame = this.frame.bind(this)
  }

  start() {
    window.addEventListener('keydown', this.handleKeydown)
    window.addEventListener('keyup', this.handleKeyup)
    this.canvas.addEventListener('pointermove', this.handlePointerMove)
    this.canvas.addEventListener('pointerdown', this.handlePointerDown)
    window.addEventListener('pointerup', this.handlePointerUp)
    this.canvas.addEventListener('pointerleave', this.handlePointerLeave)
    this.canvas.addEventListener('contextmenu', this.preventContextMenu)

    if (!this.loopId) {
      this.lastFrame = performance.now()
      this.loopId = requestAnimationFrame(this.frame)
    }

    this.emitState(true)
  }

  destroy() {
    window.removeEventListener('keydown', this.handleKeydown)
    window.removeEventListener('keyup', this.handleKeyup)
    this.canvas.removeEventListener('pointermove', this.handlePointerMove)
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown)
    window.removeEventListener('pointerup', this.handlePointerUp)
    this.canvas.removeEventListener('pointerleave', this.handlePointerLeave)
    this.canvas.removeEventListener('contextmenu', this.preventContextMenu)

    if (this.loopId) {
      cancelAnimationFrame(this.loopId)
      this.loopId = null
    }
  }

  preventContextMenu(event) {
    event.preventDefault()
  }

  startRun() {
    const seed = Date.now()
    this.runSeed = seed
    this.runRng = createRng(seed)
    resetEntityIds()

    this.dungeon = new DungeonGraph(seed)
    this.currentRoom = this.dungeon.getRoom(0, 0)
    this.player = createPlayer(WORLD.width / 2, WORLD.height / 2)
    this.enemies = []
    this.loot = []
    this.projectiles = []
    this.particles = []
    this.pendingUpgrades = []
    this.recentUpgrades = []
    this.message = 'Enter the labyrinth and survive.'
    this.messageTime = 2.5
    this.gameOverSummary = null
    this.transitionCooldown = 0.25
    this.scene = 'playing'
    this.time = 0
    this.cameraShake = 0
    this.damageFlash = 0

    this.stats = {
      roomsCleared: 0,
      kills: 0,
      coins: 0,
      potions: 1,
      relics: 0,
      score: 0,
    }

    this.currentRoom.visited = true
    this.generateRoomContent(this.currentRoom)
    this.syncRoomEntities()
    this.emitState(true)
  }

  restartRun() {
    this.startRun()
  }

  selectUpgrade(upgradeId) {
    if (this.scene !== 'upgrade' || !this.player) {
      return false
    }

    const selected = applyUpgradeById(upgradeId, { player: this.player, stats: this.stats })
    if (!selected) {
      return false
    }

    this.recentUpgrades.push(selected.id)
    if (this.recentUpgrades.length > 5) {
      this.recentUpgrades.shift()
    }

    this.pendingUpgrades = []
    this.scene = 'playing'
    this.stats.score += 70
    this.setMessage(`${selected.title} acquired.`, 1.6)
    this.emitState(true)
    return true
  }

  usePotion() {
    if (this.scene !== 'playing' || !this.player) {
      return false
    }
    if (this.stats.potions <= 0 || this.player.hp >= this.player.maxHp) {
      return false
    }

    this.stats.potions -= 1
    const healAmount = Math.round(this.player.maxHp * 0.32)
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmount)
    this.stats.score += 14
    this.setMessage(`Potion used +${healAmount} HP`, 1.2)
    this.spawnParticles({
      x: this.player.x,
      y: this.player.y,
      count: 18,
      color: '#ff8ac8',
      speedMin: 55,
      speedMax: 180,
      sizeMin: 1.5,
      sizeMax: 3.8,
      lifeMin: 0.16,
      lifeMax: 0.42,
      gravity: -20,
      drag: 0.9,
    })
    return true
  }

  handleKeydown(event) {
    this.keys.add(event.code)

    if (event.code === 'Space' || event.code === 'KeyJ') {
      event.preventDefault()
      this.attackQueued = true
    }

    if (event.code === 'KeyF' || event.code === 'KeyE') {
      this.potionQueued = true
    }
  }

  handleKeyup(event) {
    this.keys.delete(event.code)
  }

  handlePointerMove(event) {
    const bounds = this.canvas.getBoundingClientRect()
    const scaleX = WORLD.width / bounds.width
    const scaleY = WORLD.height / bounds.height

    this.pointer.x = (event.clientX - bounds.left) * scaleX
    this.pointer.y = (event.clientY - bounds.top) * scaleY
    this.pointer.inside = true
  }

  handlePointerDown(event) {
    if (event.button !== 0) {
      return
    }

    this.pointer.down = true
    this.attackQueued = true
  }

  handlePointerUp() {
    this.pointer.down = false
  }

  handlePointerLeave() {
    this.pointer.inside = false
    this.pointer.down = false
  }

  frame(timestamp) {
    const deltaTime = Math.min(0.05, (timestamp - this.lastFrame) / 1000)
    this.lastFrame = timestamp
    this.time += deltaTime

    this.update(deltaTime)
    this.render()

    this.loopId = requestAnimationFrame(this.frame)
  }

  update(deltaTime) {
    if (this.messageTime > 0) {
      this.messageTime -= deltaTime
      if (this.messageTime <= 0) {
        this.message = ''
      }
    }

    this.cameraShake = Math.max(0, this.cameraShake - deltaTime * 2.8)
    this.damageFlash = Math.max(0, this.damageFlash - deltaTime * 2.2)
    this.updateParticles(deltaTime)

    if (this.scene === 'playing' && this.player && this.currentRoom) {
      this.updatePlaying(deltaTime)
    }

    this.emitInterval += deltaTime
    if (this.emitInterval >= 0.08) {
      this.emitInterval = 0
      this.emitState()
    }
  }

  updatePlaying(deltaTime) {
    this.transitionCooldown = Math.max(0, this.transitionCooldown - deltaTime)

    this.player.attackCooldownLeft = Math.max(0, this.player.attackCooldownLeft - deltaTime)
    this.player.invulnerability = Math.max(0, this.player.invulnerability - deltaTime)
    this.player.attackFx = Math.max(0, this.player.attackFx - deltaTime)

    const moveIntent = this.readMovementIntent()
    this.movementIntent = moveIntent

    if (moveIntent.x || moveIntent.y) {
      this.player.facingX = moveIntent.x
      this.player.facingY = moveIntent.y
    }

    if (this.pointer.inside) {
      const aim = normalize(this.pointer.x - this.player.x, this.pointer.y - this.player.y)
      if (aim.x || aim.y) {
        this.player.facingX = aim.x
        this.player.facingY = aim.y
      }
    }

    moveCircle(
      this.player,
      moveIntent.x * this.player.speed,
      moveIntent.y * this.player.speed,
      deltaTime,
      this.currentRoom,
    )

    if (this.potionQueued) {
      this.usePotion()
      this.potionQueued = false
    }

    const continuousAttack = this.pointer.down || this.keys.has('Space') || this.keys.has('KeyJ')
    if (this.attackQueued || continuousAttack) {
      this.performPlayerAttack()
    }
    this.attackQueued = false

    this.updateEnemies(deltaTime)
    this.updateProjectiles(deltaTime)
    this.updateLoot(deltaTime)
    this.checkRoomCompletion()

    if (this.transitionCooldown <= 0) {
      const direction = detectDoorTransition(this.player, this.currentRoom, this.movementIntent)
      if (direction) {
        this.travel(direction)
      }
    }
  }

  readMovementIntent() {
    let x = 0
    let y = 0

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) {
      y -= 1
    }
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) {
      y += 1
    }
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) {
      x -= 1
    }
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) {
      x += 1
    }

    return normalize(x, y)
  }

  addCameraShake(amount = 0.24) {
    this.cameraShake = Math.min(1.45, this.cameraShake + amount)
  }

  spawnParticles({
    x,
    y,
    count = 8,
    color = '#ffffff',
    speedMin = 60,
    speedMax = 190,
    sizeMin = 1.8,
    sizeMax = 4.2,
    lifeMin = 0.16,
    lifeMax = 0.44,
    angle = 0,
    spread = Math.PI * 2,
    gravity = 0,
    drag = 0.92,
  }) {
    for (let index = 0; index < count; index += 1) {
      const theta = angle + (Math.random() - 0.5) * spread
      const speed = randRange(speedMin, speedMax)
      const life = randRange(lifeMin, lifeMax)
      this.particles.push({
        x,
        y,
        velocityX: Math.cos(theta) * speed,
        velocityY: Math.sin(theta) * speed,
        radius: randRange(sizeMin, sizeMax),
        life,
        maxLife: life,
        color,
        gravity,
        drag,
      })
    }

    if (this.particles.length > 320) {
      this.particles.splice(0, this.particles.length - 320)
    }
  }

  spawnPlayerSlashFx() {
    const angle = Math.atan2(this.player.facingY, this.player.facingX)
    const centerX = this.player.x + this.player.facingX * (this.player.radius + 10)
    const centerY = this.player.y + this.player.facingY * (this.player.radius + 10)
    this.spawnParticles({
      x: centerX,
      y: centerY,
      count: 12,
      color: '#8dd8ff',
      speedMin: 80,
      speedMax: 230,
      sizeMin: 1.6,
      sizeMax: 3.8,
      lifeMin: 0.14,
      lifeMax: 0.33,
      angle,
      spread: Math.PI * 0.8,
      drag: 0.9,
    })
  }

  updateParticles(deltaTime) {
    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      const particle = this.particles[index]
      particle.velocityX *= Math.pow(particle.drag, deltaTime * 60)
      particle.velocityY *= Math.pow(particle.drag, deltaTime * 60)
      particle.velocityY += particle.gravity * deltaTime
      particle.x += particle.velocityX * deltaTime
      particle.y += particle.velocityY * deltaTime
      particle.life -= deltaTime

      if (particle.life <= 0) {
        this.particles.splice(index, 1)
      }
    }
  }

  performPlayerAttack() {
    if (this.player.attackCooldownLeft > 0) {
      return false
    }

    this.player.attackCooldownLeft = this.player.attackCooldown
    this.player.attackFx = 0.17
    this.spawnPlayerSlashFx()

    const hitIds = new Set()
    for (let index = this.enemies.length - 1; index >= 0; index -= 1) {
      const enemy = this.enemies[index]
      const dx = enemy.x - this.player.x
      const dy = enemy.y - this.player.y
      const distanceToEnemy = Math.sqrt(dx * dx + dy * dy)
      if (distanceToEnemy > this.player.attackRange + enemy.radius) {
        continue
      }

      const direction = normalize(dx, dy)
      const dot = direction.x * this.player.facingX + direction.y * this.player.facingY
      if (dot < this.player.attackArcDot) {
        continue
      }

      const critical = this.runRng() < this.player.critChance
      const rawDamage = this.player.damage * (critical ? 1.75 : 1)
      enemy.hp -= rawDamage
      enemy.hitFx = 0.12
      hitIds.add(enemy.id)
      this.spawnParticles({
        x: enemy.x,
        y: enemy.y,
        count: critical ? 14 : 8,
        color: critical ? '#fff8af' : enemy.color,
        speedMin: 70,
        speedMax: critical ? 250 : 170,
        sizeMin: 1.6,
        sizeMax: critical ? 4.8 : 3.6,
        lifeMin: 0.14,
        lifeMax: 0.35,
      })

      if (enemy.hp <= 0) {
        this.defeatEnemy(index)
      }
    }

    if (hitIds.size > 0) {
      this.stats.score += hitIds.size * 6
      this.addCameraShake(0.18)
    } else {
      this.addCameraShake(0.05)
    }

    this.syncRoomEntities()
    return hitIds.size > 0
  }

  defeatEnemy(enemyIndex) {
    const enemy = this.enemies[enemyIndex]
    if (!enemy) {
      return
    }

    this.enemies.splice(enemyIndex, 1)
    this.stats.kills += 1
    this.stats.score += 20 + Math.floor(this.stats.roomsCleared * 0.8)
    this.addCameraShake(enemy.type === 'tank' ? 0.28 : 0.14)
    this.spawnParticles({
      x: enemy.x,
      y: enemy.y,
      count: enemy.type === 'tank' ? 28 : 16,
      color: enemy.color,
      speedMin: 70,
      speedMax: enemy.type === 'tank' ? 260 : 200,
      sizeMin: 1.8,
      sizeMax: enemy.type === 'tank' ? 5 : 4,
      lifeMin: 0.16,
      lifeMax: 0.48,
      gravity: 35,
      drag: 0.89,
    })

    const lootDrops = []
    const dropRoll = this.runRng()
    if (dropRoll < 0.78) {
      lootDrops.push(createLoot('coin', enemy.x, enemy.y, randInt(1, 4, this.runRng)))
    }

    if (dropRoll > 0.48 && this.runRng() < 0.15) {
      lootDrops.push(createLoot('potion', enemy.x + 12, enemy.y - 4, 1))
    }

    if (
      enemy.type === 'tank' ||
      (this.currentRoom.type === 'elite' && this.runRng() < 0.2) ||
      this.runRng() < 0.09
    ) {
      const relic = rollRelic(this.runRng)
      lootDrops.push(createLoot('relic', enemy.x - 10, enemy.y + 8, 1, relic))
    }

    this.loot.push(...lootDrops)
  }

  updateEnemies(deltaTime) {
    for (const enemy of this.enemies) {
      enemy.attackCooldownLeft = Math.max(0, enemy.attackCooldownLeft - deltaTime)
      enemy.hitFx = Math.max(0, enemy.hitFx - deltaTime)

      if (enemy.type === 'skeleton') {
        this.updateSkeletonEnemy(enemy, deltaTime)
      } else {
        this.updateMeleeEnemy(enemy, deltaTime)
      }
    }
  }

  updateMeleeEnemy(enemy, deltaTime) {
    const toPlayerX = this.player.x - enemy.x
    const toPlayerY = this.player.y - enemy.y
    const distanceToPlayer = Math.sqrt(toPlayerX * toPlayerX + toPlayerY * toPlayerY)
    const direction = normalize(toPlayerX, toPlayerY)

    let moveX = direction.x
    let moveY = direction.y

    if (enemy.type === 'slime') {
      const wobble = Math.sin(this.time * 3 + enemy.aiSeed) * 0.45
      moveX += -direction.y * wobble
      moveY += direction.x * wobble
      const normalized = normalize(moveX, moveY)
      moveX = normalized.x
      moveY = normalized.y
    }

    if (distanceToPlayer > enemy.attackRange + this.player.radius + 6) {
      moveCircle(
        enemy,
        moveX * enemy.speed,
        moveY * enemy.speed,
        deltaTime,
        this.currentRoom,
      )
    }

    if (distanceToPlayer <= enemy.attackRange + this.player.radius && enemy.attackCooldownLeft <= 0) {
      this.damagePlayer(enemy.damage)
      enemy.attackCooldownLeft = enemy.attackCooldown
    }
  }

  updateSkeletonEnemy(enemy, deltaTime) {
    const toPlayerX = this.player.x - enemy.x
    const toPlayerY = this.player.y - enemy.y
    const dist = Math.sqrt(toPlayerX * toPlayerX + toPlayerY * toPlayerY)
    const direction = normalize(toPlayerX, toPlayerY)

    let moveX = 0
    let moveY = 0
    if (dist < 175) {
      moveX = -direction.x
      moveY = -direction.y
    } else if (dist > 290) {
      moveX = direction.x
      moveY = direction.y
    } else {
      const strafe = Math.sin(this.time * 2 + enemy.aiSeed) > 0 ? 1 : -1
      moveX = -direction.y * strafe
      moveY = direction.x * strafe
    }

    const movement = normalize(moveX, moveY)
    moveCircle(
      enemy,
      movement.x * enemy.speed,
      movement.y * enemy.speed,
      deltaTime,
      this.currentRoom,
    )

    if (enemy.attackCooldownLeft <= 0 && dist <= enemy.attackRange) {
      const projectileDir = normalize(toPlayerX, toPlayerY)
      const muzzleX = enemy.x + projectileDir.x * (enemy.radius + 8)
      const muzzleY = enemy.y + projectileDir.y * (enemy.radius + 8)
      this.projectiles.push(
        createProjectile({
          x: muzzleX,
          y: muzzleY,
          velocityX: projectileDir.x * enemy.projectileSpeed,
          velocityY: projectileDir.y * enemy.projectileSpeed,
          damage: enemy.damage,
          owner: 'enemy',
          color: '#f4f7ff',
          radius: 6,
          life: 2,
        }),
      )
      this.spawnParticles({
        x: muzzleX,
        y: muzzleY,
        count: 6,
        color: '#dbe8ff',
        speedMin: 60,
        speedMax: 130,
        sizeMin: 1.2,
        sizeMax: 2.8,
        lifeMin: 0.1,
        lifeMax: 0.26,
        angle: Math.atan2(projectileDir.y, projectileDir.x),
        spread: Math.PI * 0.65,
      })
      enemy.attackCooldownLeft = enemy.attackCooldown
    }
  }

  updateProjectiles(deltaTime) {
    for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
      const projectile = this.projectiles[index]
      projectile.prevX = projectile.x
      projectile.prevY = projectile.y
      projectile.x += projectile.velocityX * deltaTime
      projectile.y += projectile.velocityY * deltaTime
      projectile.life -= deltaTime
      projectile.trail.unshift({
        x: projectile.x,
        y: projectile.y,
        life: 0.2,
      })

      if (projectile.trail.length > 6) {
        projectile.trail.length = 6
      }

      for (const point of projectile.trail) {
        point.life -= deltaTime
      }
      projectile.trail = projectile.trail.filter((point) => point.life > 0)

      if (projectile.life <= 0 || isProjectileBlocked(projectile, this.currentRoom)) {
        this.spawnParticles({
          x: projectile.x,
          y: projectile.y,
          count: 4,
          color: toRgba(projectile.color, 1),
          speedMin: 30,
          speedMax: 90,
          sizeMin: 1,
          sizeMax: 2.4,
          lifeMin: 0.09,
          lifeMax: 0.2,
        })
        this.projectiles.splice(index, 1)
        continue
      }

      if (projectile.owner === 'enemy' && circlesOverlap(projectile, this.player, -2)) {
        this.damagePlayer(projectile.damage)
        this.spawnParticles({
          x: projectile.x,
          y: projectile.y,
          count: 14,
          color: '#ffd1d1',
          speedMin: 70,
          speedMax: 180,
          sizeMin: 1.2,
          sizeMax: 3.6,
          lifeMin: 0.12,
          lifeMax: 0.32,
        })
        this.projectiles.splice(index, 1)
      }
    }
  }

  updateLoot(deltaTime) {
    for (const loot of this.loot) {
      loot.pulse += deltaTime * 2.5
    }

    for (let index = this.loot.length - 1; index >= 0; index -= 1) {
      const loot = this.loot[index]
      const pickupDistance = this.player.radius + loot.radius + 6
      if (distance(this.player.x, this.player.y, loot.x, loot.y) > pickupDistance) {
        continue
      }

      if (loot.type === 'coin') {
        this.stats.coins += loot.value
        this.stats.score += loot.value * 6
        this.spawnParticles({
          x: loot.x,
          y: loot.y,
          count: 8,
          color: '#ffe18a',
          speedMin: 36,
          speedMax: 120,
          sizeMin: 1.2,
          sizeMax: 3.4,
          lifeMin: 0.14,
          lifeMax: 0.3,
        })
      } else if (loot.type === 'potion') {
        this.stats.potions = Math.min(9, this.stats.potions + 1)
        this.stats.score += 22
        this.spawnParticles({
          x: loot.x,
          y: loot.y,
          count: 12,
          color: '#ff89b8',
          speedMin: 50,
          speedMax: 140,
          sizeMin: 1.3,
          sizeMax: 3.8,
          lifeMin: 0.12,
          lifeMax: 0.3,
        })
      } else if (loot.type === 'relic' && loot.data) {
        this.stats.relics += 1
        loot.data.apply({ player: this.player, stats: this.stats })
        this.stats.score += 40
        this.setMessage(`${loot.data.name} found: ${loot.data.description}`, 2.3)
        this.spawnParticles({
          x: loot.x,
          y: loot.y,
          count: 18,
          color: '#8aa8ff',
          speedMin: 66,
          speedMax: 190,
          sizeMin: 1.5,
          sizeMax: 4.2,
          lifeMin: 0.2,
          lifeMax: 0.5,
        })
      }

      this.loot.splice(index, 1)
    }

    this.syncRoomEntities()
  }

  damagePlayer(amount) {
    if (this.player.invulnerability > 0 || this.scene !== 'playing') {
      return
    }

    this.player.hp = Math.max(0, this.player.hp - amount)
    this.player.invulnerability = 0.52
    this.damageFlash = Math.min(0.6, this.damageFlash + 0.32)
    this.addCameraShake(0.36)
    this.spawnParticles({
      x: this.player.x,
      y: this.player.y,
      count: 16,
      color: '#ffd0d0',
      speedMin: 80,
      speedMax: 210,
      sizeMin: 1.5,
      sizeMax: 3.5,
      lifeMin: 0.14,
      lifeMax: 0.38,
      gravity: 45,
      drag: 0.89,
    })

    if (this.player.hp <= 0) {
      this.triggerGameOver()
    }
  }

  checkRoomCompletion() {
    if (this.currentRoom.cleared || this.enemies.length > 0) {
      return
    }

    this.currentRoom.cleared = true
    this.setMessage('Room cleared. Doors unlocked.', 1.8)
    this.addCameraShake(0.2)
    this.spawnParticles({
      x: WORLD.width / 2,
      y: WORLD.height / 2,
      count: 26,
      color: '#7ef3cc',
      speedMin: 90,
      speedMax: 250,
      sizeMin: 1.7,
      sizeMax: 4.4,
      lifeMin: 0.2,
      lifeMax: 0.52,
      gravity: 25,
    })

    if (!this.currentRoom.clearCounted && this.currentRoom.type !== 'start') {
      this.currentRoom.clearCounted = true
      this.stats.roomsCleared += 1
      this.stats.score += 85 + this.stats.roomsCleared * 12

      if (this.currentRoom.type === 'elite') {
        const relic = rollRelic(this.runRng)
        this.loot.push(createLoot('relic', WORLD.width / 2, WORLD.height / 2, 1, relic))
        this.loot.push(
          createLoot(
            'coin',
            WORLD.width / 2 + 20,
            WORLD.height / 2 + 18,
            randInt(3, 6, this.runRng),
          ),
        )
      } else if (this.runRng() < 0.34) {
        this.loot.push(createLoot('coin', WORLD.width / 2, WORLD.height / 2, randInt(2, 5, this.runRng)))
      }

      if (this.stats.roomsCleared % 4 === 0) {
        this.pendingUpgrades = rollUpgradeChoices(3, this.runRng, this.recentUpgrades.slice(-2))
        this.scene = 'upgrade'
        this.setMessage('Choose your blessing.', 3)
      }
    }
  }

  travel(direction) {
    const nextRoom = this.dungeon.getConnectedRoom(this.currentRoom, direction, this.stats.roomsCleared + 1)
    if (!nextRoom) {
      return
    }

    this.transitionCooldown = 0.34
    this.currentRoom = nextRoom
    this.currentRoom.visited = true
    this.generateRoomContent(this.currentRoom)
    this.enemies = this.currentRoom.enemies
    this.loot = this.currentRoom.loot
    this.projectiles = []

    if (direction === 'north') {
      this.player.x = WORLD.width / 2
      this.player.y = WORLD.height - this.player.radius - 12
    } else if (direction === 'south') {
      this.player.x = WORLD.width / 2
      this.player.y = this.player.radius + 12
    } else if (direction === 'east') {
      this.player.x = this.player.radius + 12
      this.player.y = WORLD.height / 2
    } else if (direction === 'west') {
      this.player.x = WORLD.width - this.player.radius - 12
      this.player.y = WORLD.height / 2
    }

    if (this.currentRoom.type === 'treasure') {
      this.setMessage('Treasure vault discovered.', 2)
    }

    this.spawnParticles({
      x: this.player.x,
      y: this.player.y,
      count: 14,
      color: '#8ec6ff',
      speedMin: 70,
      speedMax: 165,
      sizeMin: 1.5,
      sizeMax: 3.4,
      lifeMin: 0.14,
      lifeMax: 0.36,
      gravity: 20,
    })

    this.stats.score += 30
    this.emitState(true)
  }

  generateRoomContent(room) {
    if (room.generated) {
      return
    }

    if (room.type === 'start') {
      room.enemies = []
      room.loot = []
      room.cleared = true
      room.generated = true
      return
    }

    if (room.type === 'treasure') {
      room.enemies = []
      room.cleared = true
      room.loot = [
        createLoot('coin', WORLD.width / 2 - 44, WORLD.height / 2 + 20, randInt(4, 8, this.runRng)),
        createLoot('coin', WORLD.width / 2 + 40, WORLD.height / 2 + 12, randInt(4, 8, this.runRng)),
      ]

      if (this.runRng() < 0.6) {
        room.loot.push(createLoot('potion', WORLD.width / 2, WORLD.height / 2 - 28, 1))
      }
      if (this.runRng() < 0.5) {
        room.loot.push(createLoot('relic', WORLD.width / 2, WORLD.height / 2 - 64, 1, rollRelic(this.runRng)))
      }

      room.generated = true
      return
    }

    const difficultyScale =
      1 + this.stats.roomsCleared * 0.08 + (room.type === 'elite' ? 0.35 : 0)
    const baseCount = 2 + Math.floor(this.stats.roomsCleared / 2)
    const enemyCount = baseCount + randInt(0, 2, this.runRng) + (room.type === 'elite' ? 2 : 0)
    const spawnPool = getSpawnPool(this.stats.roomsCleared)

    room.enemies = []
    room.loot = room.loot || []

    for (let index = 0; index < enemyCount; index += 1) {
      let type = pickWeighted(spawnPool, this.runRng).type
      if (room.type === 'elite' && index === enemyCount - 1 && this.stats.roomsCleared > 4) {
        type = 'tank'
      }

      const spawn = this.findSpawnPosition(room, 170)
      room.enemies.push(createEnemy(type, spawn.x, spawn.y, difficultyScale, this.runRng))
    }

    room.cleared = room.enemies.length === 0
    room.generated = true
  }

  findSpawnPosition(room, minDistanceFromCenter = 150) {
    for (let attempt = 0; attempt < 70; attempt += 1) {
      const x = randRange(95, WORLD.width - 95, this.runRng)
      const y = randRange(95, WORLD.height - 95, this.runRng)
      const candidate = { x, y, radius: 20 }

      const tooCloseToCenter = distance(x, y, WORLD.width / 2, WORLD.height / 2) < minDistanceFromCenter
      if (tooCloseToCenter) {
        continue
      }

      if (room.obstacles.some((obstacle) => circleIntersectsRect(candidate, obstacle))) {
        continue
      }

      if (room.enemies.some((enemy) => distance(enemy.x, enemy.y, x, y) < enemy.radius + 44)) {
        continue
      }

      return { x, y }
    }

    return {
      x: randRange(120, WORLD.width - 120, this.runRng),
      y: randRange(120, WORLD.height - 120, this.runRng),
    }
  }

  triggerGameOver() {
    this.scene = 'gameover'
    this.pendingUpgrades = []
    this.pointer.down = false
    this.addCameraShake(0.55)
    this.damageFlash = Math.min(0.72, this.damageFlash + 0.5)
    this.spawnParticles({
      x: this.player?.x || WORLD.width / 2,
      y: this.player?.y || WORLD.height / 2,
      count: 42,
      color: '#ffd2d2',
      speedMin: 100,
      speedMax: 260,
      sizeMin: 1.8,
      sizeMax: 4.8,
      lifeMin: 0.24,
      lifeMax: 0.64,
      gravity: 55,
      drag: 0.88,
    })

    this.gameOverSummary = {
      roomsCleared: this.stats.roomsCleared,
      kills: this.stats.kills,
      coins: this.stats.coins,
      relics: this.stats.relics,
      score: scoreFormula(this.stats),
    }
    this.setMessage('Your run has ended.', 2.3)
    this.emitState(true)
  }

  setMessage(text, duration = 1.6) {
    this.message = text
    this.messageTime = duration
  }

  syncRoomEntities() {
    if (!this.currentRoom) {
      return
    }
    this.currentRoom.enemies = this.enemies
    this.currentRoom.loot = this.loot
  }

  getMapSnapshot() {
    if (!this.dungeon) {
      return []
    }

    const rooms = []
    for (const room of this.dungeon.rooms.values()) {
      if (!room.visited && room !== this.currentRoom) {
        continue
      }

      rooms.push({
        x: room.x,
        y: room.y,
        type: room.type,
        visited: room.visited,
        cleared: room.cleared,
        doors: { ...room.doors },
        isCurrent: room === this.currentRoom,
      })
    }

    return rooms
  }

  emitState(force = false) {
    if (!force && !this.onStateChange) {
      return
    }

    const snapshot = {
      title: LABYRINTHUS_TITLE,
      scene: this.scene,
      message: this.message,
      runSeed: this.runSeed,
      runTime: this.time,
      enemiesRemaining: this.enemies.length,
      player: this.player
        ? {
            hp: this.player.hp,
            maxHp: this.player.maxHp,
            speed: this.player.speed,
            damage: this.player.damage,
            critChance: this.player.critChance,
            attackCooldown: this.player.attackCooldown,
          }
        : null,
      stats: {
        ...this.stats,
        totalScore: scoreFormula(this.stats),
      },
      room: this.currentRoom
        ? {
            type: this.currentRoom.type,
            typeLabel: roomTypeLabel(this.currentRoom.type),
            coords: { x: this.currentRoom.x, y: this.currentRoom.y },
            cleared: this.currentRoom.cleared,
            doors: { ...this.currentRoom.doors },
          }
        : null,
      upgrades: this.pendingUpgrades.map((upgrade) => ({
        id: upgrade.id,
        title: upgrade.title,
        description: upgrade.description,
      })),
      map: this.getMapSnapshot(),
      gameOver: this.gameOverSummary,
      canUsePotion:
        Boolean(this.player) &&
        this.scene === 'playing' &&
        this.stats.potions > 0 &&
        this.player.hp < this.player.maxHp,
    }

    this.onStateChange(snapshot)
  }

  drawSprite(name, x, y, drawSize, frame = 0, alpha = 1) {
    const sprite = this.sprites?.[name]
    if (!sprite || !sprite.frames.length) {
      return false
    }

    const spriteFrame = sprite.frames[frame % sprite.frames.length]
    const width = drawSize
    const height = drawSize * (sprite.height / sprite.width)
    const halfW = width / 2
    const halfH = height / 2

    const previousSmoothing = this.ctx.imageSmoothingEnabled
    this.ctx.imageSmoothingEnabled = false
    this.ctx.globalAlpha = alpha
    this.ctx.drawImage(spriteFrame, Math.round(x - halfW), Math.round(y - halfH), width, height)
    this.ctx.globalAlpha = 1
    this.ctx.imageSmoothingEnabled = previousSmoothing
    return true
  }

  render() {
    const ctx = this.ctx
    if (!ctx) {
      return
    }

    ctx.clearRect(0, 0, WORLD.width, WORLD.height)

    const shakeStrength = this.cameraShake * 8
    const shakeX = shakeStrength > 0 ? (Math.random() * 2 - 1) * shakeStrength : 0
    const shakeY = shakeStrength > 0 ? (Math.random() * 2 - 1) * shakeStrength : 0
    ctx.save()
    if (shakeStrength > 0) {
      ctx.translate(shakeX, shakeY)
    }

    if (!this.currentRoom) {
      this.renderBackdropOnly()
      this.renderParticles()
      ctx.restore()
      this.renderPostProcess()
      return
    }

    this.renderRoom(this.currentRoom)
    this.renderLoot()
    this.renderProjectiles()
    this.renderEnemies()
    this.renderPlayer()
    this.renderParticles()
    ctx.restore()

    this.renderPostProcess()
    this.renderRoomHints()
  }

  renderBackdropOnly() {
    const ctx = this.ctx
    const gradient = ctx.createLinearGradient(0, 0, 0, WORLD.height)
    gradient.addColorStop(0, '#1a2f4c')
    gradient.addColorStop(0.55, '#12233b')
    gradient.addColorStop(1, '#0a1427')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, WORLD.width, WORLD.height)

    ctx.fillStyle = 'rgba(146, 177, 230, 0.1)'
    for (let x = 0; x < WORLD.width; x += 56) {
      ctx.fillRect(x, 0, 1, WORLD.height)
    }
    for (let y = 0; y < WORLD.height; y += 56) {
      ctx.fillRect(0, y, WORLD.width, 1)
    }

    ctx.fillStyle = 'rgba(219, 235, 255, 0.38)'
    for (let star = 0; star < 38; star += 1) {
      const x = (star * 311 + this.time * 20) % WORLD.width
      const y = (star * 137 + this.time * 9) % WORLD.height
      const r = star % 3 === 0 ? 1.8 : 1
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  renderRoom(room) {
    const ctx = this.ctx
    const gradient = ctx.createLinearGradient(0, 0, WORLD.width, WORLD.height)
    gradient.addColorStop(0, '#1a2b46')
    gradient.addColorStop(0.55, LAYOUT_COLORS.floorA)
    gradient.addColorStop(1, '#101a2f')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, WORLD.width, WORLD.height)

    const lightPool = ctx.createRadialGradient(
      WORLD.width / 2,
      WORLD.height / 2,
      80,
      WORLD.width / 2,
      WORLD.height / 2,
      WORLD.width * 0.72,
    )
    lightPool.addColorStop(0, 'rgba(182, 215, 255, 0.09)')
    lightPool.addColorStop(1, 'rgba(23, 38, 63, 0)')
    ctx.fillStyle = lightPool
    ctx.fillRect(0, 0, WORLD.width, WORLD.height)

    ctx.fillStyle = roomTint(room.type)
    ctx.fillRect(0, 0, WORLD.width, WORLD.height)

    ctx.fillStyle = 'rgba(145, 177, 230, 0.07)'
    for (let x = 0; x < WORLD.width; x += 50) {
      ctx.fillRect(x, 0, 1, WORLD.height)
    }
    for (let y = 0; y < WORLD.height; y += 50) {
      ctx.fillRect(0, y, WORLD.width, 1)
    }

    const pulse = 0.28 + (Math.sin(this.time * 1.4) + 1) * 0.1
    ctx.strokeStyle = `rgba(125, 177, 255, ${pulse})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(WORLD.width / 2, WORLD.height / 2, 66, 0, Math.PI * 2)
    ctx.stroke()

    this.renderWalls(room)
    this.renderObstacles(room)
  }

  renderWalls(room) {
    const ctx = this.ctx
    const thickness = 28
    const doorStart = WORLD.width / 2 - WORLD.doorWidth / 2
    const doorEnd = WORLD.width / 2 + WORLD.doorWidth / 2
    const sideDoorStart = WORLD.height / 2 - WORLD.doorWidth / 2
    const sideDoorEnd = WORLD.height / 2 + WORLD.doorWidth / 2

    ctx.fillStyle = '#2b405f'
    if (room.doors.north) {
      ctx.fillRect(0, 0, doorStart, thickness)
      ctx.fillRect(doorEnd, 0, WORLD.width - doorEnd, thickness)
    } else {
      ctx.fillRect(0, 0, WORLD.width, thickness)
    }

    if (room.doors.south) {
      ctx.fillRect(0, WORLD.height - thickness, doorStart, thickness)
      ctx.fillRect(doorEnd, WORLD.height - thickness, WORLD.width - doorEnd, thickness)
    } else {
      ctx.fillRect(0, WORLD.height - thickness, WORLD.width, thickness)
    }

    if (room.doors.west) {
      ctx.fillRect(0, 0, thickness, sideDoorStart)
      ctx.fillRect(0, sideDoorEnd, thickness, WORLD.height - sideDoorEnd)
    } else {
      ctx.fillRect(0, 0, thickness, WORLD.height)
    }

    if (room.doors.east) {
      ctx.fillRect(WORLD.width - thickness, 0, thickness, sideDoorStart)
      ctx.fillRect(
        WORLD.width - thickness,
        sideDoorEnd,
        thickness,
        WORLD.height - sideDoorEnd,
      )
    } else {
      ctx.fillRect(WORLD.width - thickness, 0, thickness, WORLD.height)
    }

    ctx.strokeStyle = 'rgba(130, 167, 214, 0.38)'
    ctx.lineWidth = 3
    ctx.strokeRect(1.5, 1.5, WORLD.width - 3, WORLD.height - 3)

    this.renderDoorGates(room, { doorStart, doorEnd, sideDoorStart, sideDoorEnd, thickness })
  }

  renderDoorGates(room, dimensions) {
    const ctx = this.ctx
    const gateColor = room.cleared ? LAYOUT_COLORS.doorOpen : LAYOUT_COLORS.doorLocked
    ctx.fillStyle = gateColor
    const pulse = room.cleared ? 0.38 + (Math.sin(this.time * 4.5) + 1) * 0.1 : 0.85

    if (room.doors.north) {
      ctx.globalAlpha = pulse
      ctx.fillRect(dimensions.doorStart, 0, dimensions.doorEnd - dimensions.doorStart, 8)
    }
    if (room.doors.south) {
      ctx.globalAlpha = pulse
      ctx.fillRect(
        dimensions.doorStart,
        WORLD.height - 8,
        dimensions.doorEnd - dimensions.doorStart,
        8,
      )
    }
    if (room.doors.west) {
      ctx.globalAlpha = pulse
      ctx.fillRect(0, dimensions.sideDoorStart, 8, dimensions.sideDoorEnd - dimensions.sideDoorStart)
    }
    if (room.doors.east) {
      ctx.globalAlpha = pulse
      ctx.fillRect(
        WORLD.width - 8,
        dimensions.sideDoorStart,
        8,
        dimensions.sideDoorEnd - dimensions.sideDoorStart,
      )
    }
    ctx.globalAlpha = 1
  }

  renderObstacles(room) {
    const ctx = this.ctx
    for (const obstacle of room.obstacles) {
      const blockGradient = ctx.createLinearGradient(
        obstacle.x,
        obstacle.y,
        obstacle.x + obstacle.w,
        obstacle.y + obstacle.h,
      )
      blockGradient.addColorStop(0, '#253c5e')
      blockGradient.addColorStop(1, '#172844')
      ctx.fillStyle = blockGradient
      ctx.strokeStyle = LAYOUT_COLORS.obstacleStroke
      ctx.lineWidth = 3
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h)
      ctx.strokeRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h)

      ctx.fillStyle = 'rgba(172, 201, 239, 0.16)'
      ctx.fillRect(obstacle.x + 6, obstacle.y + 6, obstacle.w - 12, 4)
    }
  }

  renderLoot() {
    const ctx = this.ctx
    for (const loot of this.loot) {
      const pulse = 1 + Math.sin(loot.pulse) * 0.08
      const radius = loot.radius * pulse
      const bob = Math.sin(loot.pulse * 0.85) * 3

      if (loot.type === 'coin') {
        ctx.fillStyle = LAYOUT_COLORS.lootCoin
      } else if (loot.type === 'potion') {
        ctx.fillStyle = LAYOUT_COLORS.lootPotion
      } else {
        ctx.fillStyle = LAYOUT_COLORS.lootRelic
      }

      ctx.globalAlpha = 0.3
      ctx.beginPath()
      ctx.arc(loot.x, loot.y, radius + 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1

      ctx.beginPath()
      ctx.arc(loot.x, loot.y, radius, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.beginPath()
      ctx.arc(loot.x - radius * 0.2, loot.y - radius * 0.2, radius * 0.25, 0, Math.PI * 2)
      ctx.fill()

      const spriteName = loot.type === 'coin' ? 'coin' : loot.type === 'potion' ? 'potion' : 'relic'
      const spriteFrame = Math.floor((this.time + loot.pulse) * 4) % 2
      this.drawSprite(spriteName, loot.x, loot.y + bob, radius * 2.4, spriteFrame, 0.95)
    }
  }

  renderProjectiles() {
    const ctx = this.ctx
    for (const projectile of this.projectiles) {
      for (const point of projectile.trail) {
        const ratio = Math.max(0, point.life / 0.2)
        ctx.globalAlpha = ratio * 0.4
        ctx.fillStyle = projectile.color
        ctx.beginPath()
        ctx.arc(point.x, point.y, projectile.radius * 0.74 * ratio, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalAlpha = 1
      ctx.shadowColor = toRgba(projectile.color, 0.85)
      ctx.shadowBlur = 14
      ctx.fillStyle = projectile.color
      ctx.beginPath()
      ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      this.drawSprite('projectile', projectile.x, projectile.y, projectile.radius * 3.4, 0, 0.95)
    }
  }

  renderEnemies() {
    const ctx = this.ctx
    for (const enemy of this.enemies) {
      const bob = Math.sin(this.time * 6 + enemy.aiSeed) * 1.4
      const frame = Math.floor(this.time * 8 + enemy.aiSeed) % 2
      const spriteSize = enemy.radius * 2.45

      ctx.fillStyle = 'rgba(4, 10, 20, 0.5)'
      ctx.beginPath()
      ctx.ellipse(
        enemy.x,
        enemy.y + enemy.radius * 0.8,
        enemy.radius * 0.95,
        enemy.radius * 0.5,
        0,
        0,
        Math.PI * 2,
      )
      ctx.fill()

      const drewSprite = this.drawSprite(
        enemy.type,
        enemy.x,
        enemy.y + bob,
        spriteSize,
        frame,
        enemy.hitFx > 0 ? 0.72 : 1,
      )

      if (!drewSprite) {
        const bodyGradient = ctx.createRadialGradient(
          enemy.x - enemy.radius * 0.35,
          enemy.y - enemy.radius * 0.45,
          enemy.radius * 0.2,
          enemy.x,
          enemy.y,
          enemy.radius * 1.1,
        )
        bodyGradient.addColorStop(0, enemy.hitFx > 0 ? '#ffffff' : '#f3fbff')
        bodyGradient.addColorStop(1, enemy.hitFx > 0 ? '#d5ecff' : enemy.color)
        ctx.fillStyle = bodyGradient
        ctx.beginPath()
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2)
        ctx.fill()
      }

      if (enemy.type === 'skeleton') {
        ctx.strokeStyle = '#7fa4dd'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(enemy.x - enemy.radius - 2, enemy.y - enemy.radius + 2)
        ctx.lineTo(enemy.x + enemy.radius + 1, enemy.y + enemy.radius - 2)
        ctx.stroke()
      } else if (enemy.type === 'tank') {
        ctx.strokeStyle = '#ffd6c9'
        ctx.lineWidth = 2.4
        ctx.beginPath()
        ctx.arc(enemy.x, enemy.y, enemy.radius * 0.66, 0, Math.PI * 2)
        ctx.stroke()
      }

      if (enemy.hp < enemy.maxHp) {
        const barWidth = 34
        const ratio = Math.max(0, enemy.hp / enemy.maxHp)
        ctx.fillStyle = 'rgba(8, 16, 34, 0.82)'
        ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.radius - 18, barWidth, 5)
        ctx.fillStyle = '#4fe19a'
        ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.radius - 18, barWidth * ratio, 5)
      }
    }
  }

  renderPlayer() {
    const ctx = this.ctx
    if (this.player.invulnerability > 0 && Math.floor(this.time * 20) % 2 === 0) {
      ctx.globalAlpha = 0.45
    }

    const auraPulse = 0.18 + (Math.sin(this.time * 7) + 1) * 0.06
    ctx.globalAlpha = auraPulse
    ctx.fillStyle = '#a5d4ff'
    ctx.beginPath()
    ctx.arc(this.player.x, this.player.y, this.player.radius + 12, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1

    const moveIntensity = Math.abs(this.movementIntent.x) + Math.abs(this.movementIntent.y)
    const playerFrame = moveIntensity > 0.1 ? Math.floor(this.time * 10) % 2 : 0
    const drewSprite = this.drawSprite(
      'player',
      this.player.x,
      this.player.y - 1,
      this.player.radius * 2.55,
      playerFrame,
      1,
    )

    if (!drewSprite) {
      const bodyGradient = ctx.createRadialGradient(
        this.player.x - this.player.radius * 0.45,
        this.player.y - this.player.radius * 0.45,
        this.player.radius * 0.2,
        this.player.x,
        this.player.y,
        this.player.radius,
      )
      bodyGradient.addColorStop(0, '#ffffff')
      bodyGradient.addColorStop(1, LAYOUT_COLORS.player)
      ctx.fillStyle = bodyGradient
      ctx.beginPath()
      ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = LAYOUT_COLORS.playerCore
      ctx.beginPath()
      ctx.arc(this.player.x, this.player.y, this.player.radius * 0.48, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.strokeStyle = '#8bc2ff'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(this.player.x, this.player.y)
    ctx.lineTo(
      this.player.x + this.player.facingX * (this.player.radius + 11),
      this.player.y + this.player.facingY * (this.player.radius + 11),
    )
    ctx.stroke()

    if (this.player.attackFx > 0) {
      const sweep = Math.PI * 0.55
      const angle = Math.atan2(this.player.facingY, this.player.facingX)
      ctx.strokeStyle = `rgba(126, 203, 255, ${0.5 + this.player.attackFx})`
      ctx.lineWidth = 7
      ctx.beginPath()
      ctx.arc(
        this.player.x,
        this.player.y,
        this.player.attackRange - 12,
        angle - sweep,
        angle + sweep,
      )
      ctx.stroke()
    }

    ctx.globalAlpha = 1
  }

  renderParticles() {
    const ctx = this.ctx
    for (const particle of this.particles) {
      const alpha = Math.max(0, particle.life / Math.max(0.001, particle.maxLife))
      if (alpha <= 0) {
        continue
      }

      ctx.globalAlpha = alpha
      ctx.fillStyle = particle.color
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  renderPostProcess() {
    const ctx = this.ctx

    const vignette = ctx.createRadialGradient(
      WORLD.width / 2,
      WORLD.height / 2,
      WORLD.height * 0.18,
      WORLD.width / 2,
      WORLD.height / 2,
      WORLD.width * 0.68,
    )
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
    vignette.addColorStop(1, 'rgba(2, 7, 16, 0.5)')
    ctx.fillStyle = vignette
    ctx.fillRect(0, 0, WORLD.width, WORLD.height)

    if (this.damageFlash > 0) {
      ctx.fillStyle = `rgba(255, 94, 94, ${this.damageFlash * 0.32})`
      ctx.fillRect(0, 0, WORLD.width, WORLD.height)
    }
  }

  renderRoomHints() {
    const ctx = this.ctx

    if (this.scene !== 'playing' || !this.currentRoom) {
      return
    }

    ctx.fillStyle = 'rgba(5, 12, 28, 0.58)'
    ctx.fillRect(WORLD.width / 2 - 210, 14, 420, 38)
    ctx.strokeStyle = 'rgba(157, 191, 237, 0.36)'
    ctx.lineWidth = 1
    ctx.strokeRect(WORLD.width / 2 - 210, 14, 420, 38)

    const hintText = this.currentRoom.cleared
      ? 'Room cleared. Cross a glowing gate to continue'
      : `Enemies remaining: ${this.enemies.length}`

    ctx.fillStyle = '#e0edff'
    ctx.font = '600 15px "Manrope", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(hintText, WORLD.width / 2, 39)
    ctx.textAlign = 'left'
  }
}

export function createLabyrinthusEngine(options) {
  return new LabyrinthusEngine(options)
}
