import {
  ENEMY_SPAWN_POOLS,
  LABYRINTHUS_TITLE,
  LAYOUT_COLORS,
  WORLD,
} from './config'
import { circlesOverlap, detectDoorTransition, isProjectileBlocked, moveCircle } from './collision'
import { DungeonGraph, roomTypeLabel } from './dungeon'
import { createEnemy, createLoot, createPlayer, createProjectile, resetEntityIds } from './entities'
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

export class LabyrinthusEngine {
  constructor({ canvas, onStateChange = () => {} }) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.onStateChange = onStateChange

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
    this.runRng = createRng(Date.now())

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
    this.runRng = createRng(seed)
    resetEntityIds()

    this.dungeon = new DungeonGraph(seed)
    this.currentRoom = this.dungeon.getRoom(0, 0)
    this.player = createPlayer(WORLD.width / 2, WORLD.height / 2)
    this.enemies = []
    this.loot = []
    this.projectiles = []
    this.pendingUpgrades = []
    this.recentUpgrades = []
    this.message = 'Enter the labyrinth and survive.'
    this.messageTime = 2.5
    this.gameOverSummary = null
    this.transitionCooldown = 0.25
    this.scene = 'playing'
    this.time = 0

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

  performPlayerAttack() {
    if (this.player.attackCooldownLeft > 0) {
      return false
    }

    this.player.attackCooldownLeft = this.player.attackCooldown
    this.player.attackFx = 0.14

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

      if (enemy.hp <= 0) {
        this.defeatEnemy(index)
      }
    }

    if (hitIds.size > 0) {
      this.stats.score += hitIds.size * 6
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
      this.projectiles.push(
        createProjectile({
          x: enemy.x + projectileDir.x * (enemy.radius + 8),
          y: enemy.y + projectileDir.y * (enemy.radius + 8),
          velocityX: projectileDir.x * enemy.projectileSpeed,
          velocityY: projectileDir.y * enemy.projectileSpeed,
          damage: enemy.damage,
          owner: 'enemy',
          color: '#f4f7ff',
          radius: 6,
          life: 2,
        }),
      )
      enemy.attackCooldownLeft = enemy.attackCooldown
    }
  }

  updateProjectiles(deltaTime) {
    for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
      const projectile = this.projectiles[index]
      projectile.x += projectile.velocityX * deltaTime
      projectile.y += projectile.velocityY * deltaTime
      projectile.life -= deltaTime

      if (projectile.life <= 0 || isProjectileBlocked(projectile, this.currentRoom)) {
        this.projectiles.splice(index, 1)
        continue
      }

      if (projectile.owner === 'enemy' && circlesOverlap(projectile, this.player, -2)) {
        this.damagePlayer(projectile.damage)
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
      } else if (loot.type === 'potion') {
        this.stats.potions = Math.min(9, this.stats.potions + 1)
        this.stats.score += 22
      } else if (loot.type === 'relic' && loot.data) {
        this.stats.relics += 1
        loot.data.apply({ player: this.player, stats: this.stats })
        this.stats.score += 40
        this.setMessage(`${loot.data.name} found: ${loot.data.description}`, 2.3)
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

  emitState(force = false) {
    if (!force && !this.onStateChange) {
      return
    }

    const snapshot = {
      title: LABYRINTHUS_TITLE,
      scene: this.scene,
      message: this.message,
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
      gameOver: this.gameOverSummary,
      canUsePotion:
        Boolean(this.player) &&
        this.scene === 'playing' &&
        this.stats.potions > 0 &&
        this.player.hp < this.player.maxHp,
    }

    this.onStateChange(snapshot)
  }

  render() {
    const ctx = this.ctx
    if (!ctx) {
      return
    }

    ctx.clearRect(0, 0, WORLD.width, WORLD.height)

    if (!this.currentRoom) {
      this.renderBackdropOnly()
      return
    }

    this.renderRoom(this.currentRoom)
    this.renderLoot()
    this.renderProjectiles()
    this.renderEnemies()
    this.renderPlayer()
    this.renderRoomHints()
  }

  renderBackdropOnly() {
    const ctx = this.ctx
    const gradient = ctx.createLinearGradient(0, 0, 0, WORLD.height)
    gradient.addColorStop(0, '#1c2f4f')
    gradient.addColorStop(1, '#101b30')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, WORLD.width, WORLD.height)

    ctx.fillStyle = 'rgba(146, 177, 230, 0.12)'
    for (let x = 0; x < WORLD.width; x += 60) {
      ctx.fillRect(x, 0, 1, WORLD.height)
    }
    for (let y = 0; y < WORLD.height; y += 60) {
      ctx.fillRect(0, y, WORLD.width, 1)
    }
  }

  renderRoom(room) {
    const ctx = this.ctx
    const gradient = ctx.createLinearGradient(0, 0, WORLD.width, WORLD.height)
    gradient.addColorStop(0, LAYOUT_COLORS.floorA)
    gradient.addColorStop(1, LAYOUT_COLORS.floorB)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, WORLD.width, WORLD.height)

    if (room.type === 'treasure') {
      ctx.fillStyle = 'rgba(243, 191, 88, 0.08)'
      ctx.fillRect(0, 0, WORLD.width, WORLD.height)
    } else if (room.type === 'elite') {
      ctx.fillStyle = 'rgba(252, 114, 114, 0.08)'
      ctx.fillRect(0, 0, WORLD.width, WORLD.height)
    }

    ctx.fillStyle = 'rgba(145, 177, 230, 0.08)'
    for (let x = 0; x < WORLD.width; x += 52) {
      ctx.fillRect(x, 0, 1, WORLD.height)
    }
    for (let y = 0; y < WORLD.height; y += 52) {
      ctx.fillRect(0, y, WORLD.width, 1)
    }

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

    ctx.fillStyle = LAYOUT_COLORS.border
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

    this.renderDoorGates(room, { doorStart, doorEnd, sideDoorStart, sideDoorEnd, thickness })
  }

  renderDoorGates(room, dimensions) {
    const ctx = this.ctx
    const gateColor = room.cleared ? LAYOUT_COLORS.doorOpen : LAYOUT_COLORS.doorLocked
    ctx.fillStyle = gateColor

    if (room.doors.north) {
      ctx.globalAlpha = room.cleared ? 0.42 : 0.85
      ctx.fillRect(dimensions.doorStart, 0, dimensions.doorEnd - dimensions.doorStart, 8)
    }
    if (room.doors.south) {
      ctx.globalAlpha = room.cleared ? 0.42 : 0.85
      ctx.fillRect(
        dimensions.doorStart,
        WORLD.height - 8,
        dimensions.doorEnd - dimensions.doorStart,
        8,
      )
    }
    if (room.doors.west) {
      ctx.globalAlpha = room.cleared ? 0.42 : 0.85
      ctx.fillRect(0, dimensions.sideDoorStart, 8, dimensions.sideDoorEnd - dimensions.sideDoorStart)
    }
    if (room.doors.east) {
      ctx.globalAlpha = room.cleared ? 0.42 : 0.85
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
      ctx.fillStyle = LAYOUT_COLORS.obstacleFill
      ctx.strokeStyle = LAYOUT_COLORS.obstacleStroke
      ctx.lineWidth = 3
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h)
      ctx.strokeRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h)
    }
  }

  renderLoot() {
    const ctx = this.ctx
    for (const loot of this.loot) {
      const pulse = 1 + Math.sin(loot.pulse) * 0.08
      const radius = loot.radius * pulse

      if (loot.type === 'coin') {
        ctx.fillStyle = LAYOUT_COLORS.lootCoin
      } else if (loot.type === 'potion') {
        ctx.fillStyle = LAYOUT_COLORS.lootPotion
      } else {
        ctx.fillStyle = LAYOUT_COLORS.lootRelic
      }

      ctx.beginPath()
      ctx.arc(loot.x, loot.y, radius, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.beginPath()
      ctx.arc(loot.x - radius * 0.2, loot.y - radius * 0.2, radius * 0.25, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  renderProjectiles() {
    const ctx = this.ctx
    for (const projectile of this.projectiles) {
      ctx.fillStyle = projectile.color
      ctx.beginPath()
      ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  renderEnemies() {
    const ctx = this.ctx
    for (const enemy of this.enemies) {
      ctx.fillStyle = enemy.hitFx > 0 ? '#ffffff' : enemy.color
      ctx.beginPath()
      ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2)
      ctx.fill()

      if (enemy.type === 'skeleton') {
        ctx.strokeStyle = '#7fa4dd'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(enemy.x - enemy.radius - 2, enemy.y - enemy.radius + 2)
        ctx.lineTo(enemy.x + enemy.radius + 1, enemy.y + enemy.radius - 2)
        ctx.stroke()
      }

      if (enemy.hp < enemy.maxHp) {
        const barWidth = 34
        const ratio = Math.max(0, enemy.hp / enemy.maxHp)
        ctx.fillStyle = 'rgba(8, 16, 34, 0.82)'
        ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.radius - 14, barWidth, 5)
        ctx.fillStyle = '#4fe19a'
        ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.radius - 14, barWidth * ratio, 5)
      }
    }
  }

  renderPlayer() {
    const ctx = this.ctx
    if (this.player.invulnerability > 0 && Math.floor(this.time * 20) % 2 === 0) {
      ctx.globalAlpha = 0.45
    }

    ctx.fillStyle = LAYOUT_COLORS.player
    ctx.beginPath()
    ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = LAYOUT_COLORS.playerCore
    ctx.beginPath()
    ctx.arc(this.player.x, this.player.y, this.player.radius * 0.48, 0, Math.PI * 2)
    ctx.fill()

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
      ctx.strokeStyle = 'rgba(126, 203, 255, 0.85)'
      ctx.lineWidth = 6
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

  renderRoomHints() {
    const ctx = this.ctx

    if (!this.currentRoom.cleared && this.scene === 'playing') {
      ctx.fillStyle = 'rgba(5, 10, 24, 0.45)'
      ctx.fillRect(WORLD.width / 2 - 170, 16, 340, 34)
      ctx.fillStyle = '#d4ddef'
      ctx.font = '600 15px "Manrope", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Defeat all enemies to unlock exits', WORLD.width / 2, 39)
    }
  }
}

export function createLabyrinthusEngine(options) {
  return new LabyrinthusEngine(options)
}
