import atlasUrl from 'src/assets/labyrinthus/kenney-tiny-dungeon-tilemap.png'

const TILE_SIZE = 16
const TILE_SPACING = 1
const TILE_COLUMNS = 12

function createSpriteCanvas(pattern, palette) {
  const height = pattern.length
  const width = pattern[0]?.length || 0
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return canvas
  }

  for (let y = 0; y < pattern.length; y += 1) {
    const row = pattern[y]
    for (let x = 0; x < row.length; x += 1) {
      const token = row[x]
      if (token === '.') {
        continue
      }

      const color = palette[token]
      if (!color) {
        continue
      }

      ctx.fillStyle = color
      ctx.fillRect(x, y, 1, 1)
    }
  }

  return canvas
}

export const LABYRINTHUS_TILES = Object.freeze({
  floor: [48, 49, 50, 51, 52, 53],
  floorStart: [30, 42, 48, 49],
  floorElite: [36, 37, 38, 39, 40],
  floorTreasure: [30, 42, 48, 50, 51],
  wall: [57, 58, 59],
  wallAccent: [28, 40],
  torch: [29],
  grave: 65,
  crate: 66,
  shelf: 63,
  anvil: 74,
  bookshelf: 75,
  fence: 76,
  ironFence: 78,
  cart: 79,
  barrel: 82,
  chestClosed: 90,
  chestTreasure: 92,
  relic: 56,
  coinBag: 82,
  potion: 115,
  potionAlt: 116,
  playerSword: 97,
  playerBow: 109,
  playerWand: 84,
  slime: 108,
  goblin: 109,
  skeleton: 98,
  tank: 122,
  projectile: 126,
  sword: 104,
  wand: 130,
  axe: 118,
})

function tileRect(index) {
  const column = index % TILE_COLUMNS
  const row = Math.floor(index / TILE_COLUMNS)

  return {
    x: column * (TILE_SIZE + TILE_SPACING),
    y: row * (TILE_SIZE + TILE_SPACING),
    width: TILE_SIZE,
    height: TILE_SIZE,
  }
}

function createAtlasSprite(frameIndexes) {
  return {
    kind: 'atlas',
    frames: frameIndexes.map((index) => tileRect(index)),
    width: TILE_SIZE,
    height: TILE_SIZE,
  }
}

function createCanvasSprite(patterns, palette) {
  const frames = patterns.map((pattern) => createSpriteCanvas(pattern, palette))
  return {
    kind: 'canvas',
    frames,
    width: patterns[0][0].length,
    height: patterns[0].length,
  }
}

function createAtlasImage() {
  if (typeof Image === 'undefined') {
    return null
  }

  const image = new Image()
  image.decoding = 'async'
  image.src = atlasUrl
  return image
}

export function getLabyrinthusTileRect(index) {
  return tileRect(index)
}

export function createLabyrinthusSprites() {
  const atlasImage = createAtlasImage()

  return {
    $atlas: {
      image: atlasImage,
      tileSize: TILE_SIZE,
      spacing: TILE_SPACING,
      columns: TILE_COLUMNS,
      loaded: Boolean(atlasImage?.complete && atlasImage?.naturalWidth),
    },
    $tiles: LABYRINTHUS_TILES,
    playerSword: createAtlasSprite([LABYRINTHUS_TILES.playerSword]),
    playerBow: createAtlasSprite([LABYRINTHUS_TILES.playerBow]),
    playerWand: createAtlasSprite([LABYRINTHUS_TILES.playerWand]),
    slime: createAtlasSprite([LABYRINTHUS_TILES.slime]),
    goblin: createAtlasSprite([LABYRINTHUS_TILES.goblin]),
    skeleton: createAtlasSprite([LABYRINTHUS_TILES.skeleton]),
    tank: createAtlasSprite([LABYRINTHUS_TILES.tank]),
    coin: createAtlasSprite([LABYRINTHUS_TILES.coinBag]),
    potion: createAtlasSprite([LABYRINTHUS_TILES.potion, LABYRINTHUS_TILES.potionAlt]),
    relic: createAtlasSprite([LABYRINTHUS_TILES.relic]),
    projectile: createAtlasSprite([LABYRINTHUS_TILES.projectile]),
    sword: createAtlasSprite([LABYRINTHUS_TILES.sword]),
    wand: createAtlasSprite([LABYRINTHUS_TILES.wand]),
    axe: createAtlasSprite([LABYRINTHUS_TILES.axe]),
    bow: createCanvasSprite(
      [
        [
          '...xx...',
          '..xyyx..',
          '.xy..yx.',
          '.xy..yx.',
          '.xy..yx.',
          '.xy..yx.',
          '..xyyx..',
          '...xx...',
        ],
      ],
      {
        x: '#5b372b',
        y: '#d9c7a6',
      },
    ),
    arrow: createCanvasSprite(
      [
        [
          '....m.......',
          '...mmm......',
          'xxxyyyzzzz..',
          '...mmm......',
          '....m.......',
        ],
      ],
      {
        x: '#f4e9d2',
        y: '#8d5d3b',
        z: '#cfd6e6',
        m: '#e0c27a',
      },
    ),
    magicBolt: createCanvasSprite(
      [
        [
          '....aa....',
          '..aabbcc..',
          '.aabddc...',
          '..abddc...',
          '...bcc....',
        ],
        [
          '....aa....',
          '...abbc...',
          '..abddcc..',
          '...abdc...',
          '....cc....',
        ],
      ],
      {
        a: '#f4fdff',
        b: '#92ebff',
        c: '#55c0ff',
        d: '#2e7cff',
      },
    ),
  }
}
