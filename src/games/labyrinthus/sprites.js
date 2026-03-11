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

  ctx.clearRect(0, 0, width, height)
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

function buildSpriteSet(definition) {
  const frames = definition.frames.map((pattern) => createSpriteCanvas(pattern, definition.palette))
  const width = definition.frames[0][0].length
  const height = definition.frames[0].length
  return { frames, width, height }
}

function validateDefinitions(definitions) {
  for (const [name, definition] of Object.entries(definitions)) {
    for (const frame of definition.frames) {
      const expectedWidth = frame[0]?.length || 0
      for (const row of frame) {
        if (row.length !== expectedWidth) {
          throw new Error(`Invalid sprite width in "${name}"`)
        }
      }
    }
  }
}

const SPRITE_DEFINITIONS = {
  player: {
    palette: {
      x: '#10203a',
      a: '#eaf3ff',
      b: '#bfd8ff',
      c: '#8dc0ff',
      d: '#3e7fe6',
      e: '#f4c57f',
      f: '#2e5eb8',
    },
    frames: [
      [
        '....xxxx....',
        '...xabba....',
        '..xabccab...',
        '..xabddab...',
        '..xabccab...',
        '..xafffax...',
        '.xacfecfa...',
        '.xacffffa...',
        '.xaddddda...',
        '..xad..da...',
        '..xda..ad...',
        '...x....x...',
      ],
      [
        '....xxxx....',
        '...xabba....',
        '..xabccab...',
        '..xabddab...',
        '..xabccab...',
        '..xafffax...',
        '.xacfecfa...',
        '.xacffffa...',
        '.xaddddda...',
        '..xaddaax...',
        '..xa..aax...',
        '...x....x...',
      ],
    ],
  },
  slime: {
    palette: {
      x: '#143824',
      g: '#6fd39f',
      w: '#d8fff0',
    },
    frames: [
      [
        '............',
        '............',
        '...xxxxxx...',
        '..xggggggx..',
        '.xggggggggx.',
        '.xggwwwwggx.',
        '.xggggggggx.',
        '.xggggggggx.',
        '..xggggggx..',
        '...xx..xx...',
        '............',
        '............',
      ],
      [
        '............',
        '............',
        '............',
        '...xxxxxx...',
        '..xggggggx..',
        '.xggwwwwggx.',
        '.xggggggggx.',
        '..xggggggx..',
        '...xggggx...',
        '..xx....xx..',
        '............',
        '............',
      ],
    ],
  },
  goblin: {
    palette: {
      x: '#152317',
      h: '#87c45a',
      g: '#6ca03f',
      w: '#f6f5d9',
      y: '#7c5031',
    },
    frames: [
      [
        '....xxxx....',
        '...xhhhhx...',
        '..xhgggghx..',
        '..xhgwwghx..',
        '..xggggggx..',
        '.xggxhhxggx.',
        '.xgxxxxxxgx.',
        '.xgyyyyyygx.',
        '..xyy..yyx..',
        '..xy....yx..',
        '...x....x...',
        '............',
      ],
      [
        '....xxxx....',
        '...xhhhhx...',
        '..xhgggghx..',
        '..xhgwwghx..',
        '..xggggggx..',
        '.xggxhhxggx.',
        '.xgxxxxxxgx.',
        '.xgyyyyyygx.',
        '..xy....yx..',
        '..x.yy.yx...',
        '...x....x...',
        '............',
      ],
    ],
  },
  skeleton: {
    palette: {
      x: '#1b253d',
      w: '#f3f8ff',
      b: '#8ba7d5',
    },
    frames: [
      [
        '....xxxx....',
        '...xwwwwx...',
        '..xwxxxxwx..',
        '..xwxbbxwx..',
        '..xwxxxxwx..',
        '...xwwwwx...',
        '..xwwwwwwx..',
        '.xwwxwwxwwx.',
        '.xwwwwwwwwx.',
        '..xww..wwx..',
        '...x....x...',
        '............',
      ],
      [
        '....xxxx....',
        '...xwwwwx...',
        '..xwxxxxwx..',
        '..xwxbbxwx..',
        '..xwxxxxwx..',
        '...xwwwwx...',
        '..xwwwwwwx..',
        '.xwwwwwwwwx.',
        '..xwwwwwwx..',
        '..xw....wx..',
        '...xw..wx...',
        '....x..x....',
      ],
    ],
  },
  tank: {
    palette: {
      x: '#3f1c1c',
      r: '#d08d84',
      h: '#ffd9c8',
      t: '#945f4b',
    },
    frames: [
      [
        '...xxxxxxxx.',
        '..xrrrrrrrx.',
        '.xrrrxxrrrx.',
        '.xrrxhhxrrx.',
        '.xrrxxxxrrx.',
        '.xrrrxxrrrx.',
        '.xrrttttrrx.',
        '.xrrttttrrx.',
        '..xrrttrrx..',
        '..xrr..rrx..',
        '...x....x...',
        '............',
      ],
      [
        '...xxxxxxxx.',
        '..xrrrrrrrx.',
        '.xrrrxxrrrx.',
        '.xrrxhhxrrx.',
        '.xrrxxxxrrx.',
        '.xrrrxxrrrx.',
        '.xrrttttrrx.',
        '.xrrttttrrx.',
        '..xrrttrrx..',
        '..xr....rx..',
        '..xrr..rrx..',
        '...x....x...',
      ],
    ],
  },
  coin: {
    palette: {
      y: '#ab6d1e',
      o: '#f4be53',
      Y: '#ffe69a',
    },
    frames: [
      [
        '............',
        '....yyyy....',
        '...yoooooy..',
        '..yoooooooy.',
        '..yooYYoooy.',
        '..yooYYoooy.',
        '..yoooooooy.',
        '...yoooooy..',
        '....yyyy....',
        '............',
        '............',
        '............',
      ],
      [
        '............',
        '....yyyy....',
        '...yoYYooy..',
        '..yoooooooy.',
        '..yooYYoooy.',
        '..yoooooooy.',
        '..yooYYoooy.',
        '...yoYYooy..',
        '....yyyy....',
        '............',
        '............',
        '............',
      ],
    ],
  },
  potion: {
    palette: {
      x: '#2a2544',
      p: '#d1d9ef',
      m: '#ff6fae',
      a: '#ffc3df',
    },
    frames: [
      [
        '............',
        '.....xx.....',
        '....xppx....',
        '....xppx....',
        '...xmmmmx...',
        '..xmmppmmx..',
        '..xmmppmmx..',
        '..xmmmmmmx..',
        '...xmmmmx...',
        '...xaaaax...',
        '....xxxx....',
        '............',
      ],
      [
        '............',
        '.....xx.....',
        '....xppx....',
        '....xppx....',
        '...xmmmmx...',
        '..xmpmppmx..',
        '..xmppmmpx..',
        '..xmmmmmmx..',
        '...xmmmmx...',
        '...xaaaax...',
        '....xxxx....',
        '............',
      ],
    ],
  },
  relic: {
    palette: {
      z: '#2b315d',
      r: '#87a6ff',
      R: '#c6d6ff',
    },
    frames: [
      [
        '............',
        '.....zz.....',
        '....zrrz....',
        '...zrrrrz...',
        '..zrRrrRrz..',
        '..zrrrrrrz..',
        '..zrrrrrrz..',
        '...zrrrrz...',
        '....zrrz....',
        '.....zz.....',
        '............',
        '............',
      ],
      [
        '............',
        '.....zz.....',
        '....zRRz....',
        '...zrrrrz...',
        '..zrRrrRrz..',
        '..zrrrrrrz..',
        '..zrrRRrrz..',
        '...zrrrrz...',
        '....zrrz....',
        '.....zz.....',
        '............',
        '............',
      ],
    ],
  },
  projectile: {
    palette: {
      q: '#dce9ff',
      Q: '#ffffff',
    },
    frames: [
      [
        '............',
        '.....qq.....',
        '....qqqq....',
        '...qqQQqq...',
        '...qqQQqq...',
        '....qqqq....',
        '.....qq.....',
        '............',
        '............',
        '............',
        '............',
        '............',
      ],
    ],
  },
}

export function createLabyrinthusSprites() {
  if (typeof document === 'undefined') {
    return {}
  }

  validateDefinitions(SPRITE_DEFINITIONS)
  const library = {}
  for (const [name, definition] of Object.entries(SPRITE_DEFINITIONS)) {
    library[name] = buildSpriteSet(definition)
  }
  return library
}
