import { Position, Creep, Tower, EnemyHero, GameState, DamageNumber, Projectile } from './types';

// Map dimensions
export const MAP_WIDTH = 2400;
export const MAP_HEIGHT = 2400;

// Lane waypoints
export const lanes = {
  top: {
    player: [
      { x: 200, y: 200 },
      { x: 200, y: 600 },
      { x: 600, y: 600 },
      { x: 1000, y: 400 },
      { x: 1400, y: 200 },
      { x: 1800, y: 200 },
      { x: 2200, y: 200 },
    ],
    enemy: [
      { x: 2200, y: 200 },
      { x: 1800, y: 200 },
      { x: 1400, y: 200 },
      { x: 1000, y: 400 },
      { x: 600, y: 600 },
      { x: 200, y: 600 },
      { x: 200, y: 200 },
    ],
  },
  mid: {
    player: [
      { x: 300, y: 300 },
      { x: 600, y: 600 },
      { x: 900, y: 900 },
      { x: 1200, y: 1200 },
      { x: 1500, y: 1500 },
      { x: 1800, y: 1800 },
      { x: 2100, y: 2100 },
    ],
    enemy: [
      { x: 2100, y: 2100 },
      { x: 1800, y: 1800 },
      { x: 1500, y: 1500 },
      { x: 1200, y: 1200 },
      { x: 900, y: 900 },
      { x: 600, y: 600 },
      { x: 300, y: 300 },
    ],
  },
  bot: {
    player: [
      { x: 200, y: 2200 },
      { x: 600, y: 2200 },
      { x: 1000, y: 2000 },
      { x: 1400, y: 2200 },
      { x: 1800, y: 2200 },
      { x: 2200, y: 2200 },
      { x: 2200, y: 1800 },
    ],
    enemy: [
      { x: 2200, y: 1800 },
      { x: 2200, y: 2200 },
      { x: 1800, y: 2200 },
      { x: 1400, y: 2200 },
      { x: 1000, y: 2000 },
      { x: 600, y: 2200 },
      { x: 200, y: 2200 },
    ],
  },
};

// Tower positions
export const towerPositions: { team: 'player' | 'enemy'; lane: 'top' | 'mid' | 'bot'; position: Position }[] = [
  // Player towers
  { team: 'player', lane: 'top', position: { x: 400, y: 400 } },
  { team: 'player', lane: 'mid', position: { x: 700, y: 700 } },
  { team: 'player', lane: 'bot', position: { x: 400, y: 2000 } },
  // Enemy towers
  { team: 'enemy', lane: 'top', position: { x: 2000, y: 400 } },
  { team: 'enemy', lane: 'mid', position: { x: 1700, y: 1700 } },
  { team: 'enemy', lane: 'bot', position: { x: 2000, y: 2000 } },
];

let creepIdCounter = 0;
let projectileIdCounter = 0;
let damageIdCounter = 0;

export function createCreep(team: 'player' | 'enemy', lane: 'top' | 'mid' | 'bot'): Creep {
  const waypoints = lanes[lane][team];
  const startPos = waypoints[0];
  return {
    id: `creep_${creepIdCounter++}`,
    team,
    lane,
    position: { x: startPos.x + (Math.random() - 0.5) * 30, y: startPos.y + (Math.random() - 0.5) * 30 },
    hp: 150,
    maxHp: 150,
    attack: 15,
    speed: 1.5,
    target: null,
    isDead: false,
    reward: 30,
    emoji: team === 'player' ? '🟢' : '🔴',
  };
}

export function createTowers(): Tower[] {
  return towerPositions.map((t, i) => ({
    id: `tower_${i}`,
    team: t.team,
    lane: t.lane,
    position: t.position,
    hp: 1500,
    maxHp: 1500,
    attack: 80,
    range: 250,
    isDead: false,
    emoji: t.team === 'player' ? '🏰' : '🏯',
  }));
}

export function createEnemyHeroes(): EnemyHero[] {
  const enemyData = [
    { id: 'enemy_1', lane: 'top' as const, emoji: '👹', name: 'Босс Гопник' },
    { id: 'enemy_2', lane: 'mid' as const, emoji: '🧛', name: 'Вампир Петрович' },
    { id: 'enemy_3', lane: 'bot' as const, emoji: '🤡', name: 'Клоун из Интернета' },
  ];
  const waypoints = {
    top: lanes.top.enemy[2],
    mid: lanes.mid.enemy[2],
    bot: lanes.bot.enemy[2],
  };
  return enemyData.map(e => ({
    id: e.id,
    hero: { id: e.id, name: e.name, title: '', emoji: e.emoji, role: '', color: '#FF0000', description: '', baseStats: { maxHp: 600, hp: 600, maxMana: 300, mana: 300, attack: 50, defense: 8, speed: 2.5, attackRange: 150, attackSpeed: 1, critChance: 0.1 }, abilities: [] },
    position: { ...waypoints[e.lane] },
    hp: 600,
    maxHp: 600,
    isDead: false,
    respawnTime: 0,
    lane: e.lane,
    emoji: e.emoji,
    attack: 50,
    speed: 2.5,
  }));
}

export function distance(a: Position, b: Position): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function moveToward(from: Position, to: Position, speed: number): Position {
  const dist = distance(from, to);
  if (dist < speed) return { ...to };
  const ratio = speed / dist;
  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio,
  };
}

export function findNearestEnemy(pos: Position, entities: { position: Position; isDead?: boolean; id: string }[], range: number, excludeId?: string): string | null {
  let nearest: string | null = null;
  let nearestDist = range;
  for (const e of entities) {
    if (e.isDead) continue;
    if (e.id === excludeId) continue;
    const d = distance(pos, e.position);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = e.id;
    }
  }
  return nearest;
}

export function createDamageNumber(pos: Position, value: number, isCrit: boolean): DamageNumber {
  return {
    id: `dmg_${damageIdCounter++}`,
    position: { x: pos.x + (Math.random() - 0.5) * 20, y: pos.y - 20 },
    value,
    time: Date.now(),
    isCrit,
  };
}

export function createProjectile(from: Position, to: Position, damage: number, team: 'player' | 'enemy', emoji: string): Projectile {
  return {
    id: `proj_${projectileIdCounter++}`,
    from: { ...from },
    to: { ...to },
    speed: 8,
    damage,
    team,
    emoji,
    progress: 0,
  };
}

export function updateCreeps(state: GameState, deltaTime: number): void {
  for (const creep of state.creeps) {
    if (creep.isDead) continue;

    const waypoints = lanes[creep.lane][creep.team];
    let currentTarget: Position | null = null;

    // Find next waypoint
    for (const wp of waypoints) {
      if (distance(creep.position, wp) > 30) {
        currentTarget = wp;
        break;
      }
    }

    if (!currentTarget) {
      // Reached end - damage base
      if (creep.team === 'player') {
        state.baseHp.enemy = Math.max(0, state.baseHp.enemy - 5);
      } else {
        state.baseHp.player = Math.max(0, state.baseHp.player - 5);
      }
      creep.isDead = true;
      continue;
    }

    // Check for nearby enemies to fight
    const enemies = creep.team === 'player'
      ? [...state.creeps.filter(c => c.team === 'enemy' && !c.isDead), ...state.enemies.filter(e => !e.isDead)]
      : [...state.creeps.filter(c => c.team === 'player' && !c.isDead)];

    let fighting = false;
    for (const enemy of enemies) {
      if (distance(creep.position, enemy.position) < 100) {
        fighting = true;
        enemy.hp -= creep.attack * deltaTime * 0.01;
        if (enemy.hp <= 0 && !enemy.isDead) {
          enemy.isDead = true;
          if ('reward' in enemy) {
            state.playerGold += (enemy as Creep).reward;
          }
        }
        break;
      }
    }

    if (!fighting) {
      creep.position = moveToward(creep.position, currentTarget, creep.speed * deltaTime * 0.06);
    }
  }
}

export function updateTowers(state: GameState, deltaTime: number): void {
  for (const tower of state.towers) {
    if (tower.isDead) continue;

    // Find targets
    const targets = tower.team === 'player'
      ? [
          ...state.creeps.filter(c => c.team === 'enemy' && !c.isDead),
          ...state.enemies.filter(e => !e.isDead),
        ]
      : [
          ...state.creeps.filter(c => c.team === 'player' && !c.isDead),
        ];

    for (const target of targets) {
      if (distance(tower.position, target.position) < tower.range) {
        target.hp -= tower.attack * deltaTime * 0.005;
        if (target.hp <= 0) {
          target.isDead = true;
          if ('reward' in target) {
            state.playerGold += (target as Creep).reward;
          }
        }
        break;
      }
    }
  }
}

export function updateEnemies(state: GameState, deltaTime: number): void {
  for (const enemy of state.enemies) {
    if (enemy.isDead) {
      enemy.respawnTime -= deltaTime;
      if (enemy.respawnTime <= 0) {
        enemy.isDead = false;
        enemy.hp = enemy.maxHp;
        const waypoints = lanes[enemy.lane].enemy;
        enemy.position = { ...waypoints[0] };
      }
      continue;
    }

    // Enemy AI: move toward player base or fight player
    const distToPlayer = distance(enemy.position, state.playerPosition);

    if (distToPlayer < 300) {
      // Attack player
      enemy.position = moveToward(enemy.position, state.playerPosition, enemy.speed * deltaTime * 0.04);
      if (distToPlayer < 150) {
        const dmg = Math.max(1, enemy.attack - state.playerStats.defense * 0.5);
        state.playerStats.hp -= dmg * deltaTime * 0.005;
        if (Math.random() < 0.01) {
          state.damageNumbers.push(createDamageNumber(state.playerPosition, Math.round(dmg), false));
        }
      }
    } else {
      // Move along lane
      const waypoints = lanes[enemy.lane].enemy;
      for (const wp of waypoints) {
        if (distance(enemy.position, wp) > 50) {
          enemy.position = moveToward(enemy.position, wp, enemy.speed * deltaTime * 0.04);
          break;
        }
      }
    }

    // Fight player creeps nearby
    const nearbyCreeps = state.creeps.filter(c => c.team === 'player' && !c.isDead && distance(c.position, enemy.position) < 150);
    if (nearbyCreeps.length > 0 && distToPlayer > 300) {
      const target = nearbyCreeps[0];
      target.hp -= enemy.attack * deltaTime * 0.005;
      if (target.hp <= 0) {
        target.isDead = true;
      }
    }
  }
}

export function updateProjectiles(state: GameState, deltaTime: number): void {
  for (const proj of state.projectiles) {
    proj.progress += proj.speed * deltaTime * 0.01;
    if (proj.progress >= 1) {
      proj.progress = 1;
    }
  }
  state.projectiles = state.projectiles.filter(p => p.progress < 1);
}

export function checkGameOver(state: GameState): void {
  if (state.baseHp.player <= 0) {
    state.gameOver = true;
    state.winner = 'enemy';
  }
  if (state.baseHp.enemy <= 0) {
    state.gameOver = true;
    state.winner = 'player';
  }
  if (state.playerStats.hp <= 0) {
    state.deaths++;
    state.playerStats.hp = state.playerStats.maxHp;
    state.playerPosition = { x: 200, y: 2200 };
  }
}
