export interface Position {
  x: number;
  y: number;
}

export interface HeroStats {
  maxHp: number;
  hp: number;
  maxMana: number;
  mana: number;
  attack: number;
  defense: number;
  speed: number;
  attackRange: number;
  attackSpeed: number; // attacks per second
  critChance: number;
}

export interface Hero {
  id: string;
  name: string;
  title: string;
  emoji: string;
  role: string;
  baseStats: HeroStats;
  abilities: Ability[];
  description: string;
  color: string;
}

export interface Ability {
  id: string;
  name: string;
  emoji: string;
  description: string;
  manaCost: number;
  cooldown: number;
  lastUsed: number;
  damage: number;
  range: number;
  aoe: number;
}

export interface Item {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  description: string;
  stats: Partial<HeroStats>;
}

export interface Creep {
  id: string;
  team: 'player' | 'enemy';
  lane: 'top' | 'mid' | 'bot';
  position: Position;
  hp: number;
  maxHp: number;
  attack: number;
  speed: number;
  target: Position | null;
  isDead: boolean;
  reward: number;
  emoji: string;
}

export interface Tower {
  id: string;
  team: 'player' | 'enemy';
  lane: 'top' | 'mid' | 'bot';
  position: Position;
  hp: number;
  maxHp: number;
  attack: number;
  range: number;
  isDead: boolean;
  emoji: string;
}

export interface Projectile {
  id: string;
  from: Position;
  to: Position;
  speed: number;
  damage: number;
  team: 'player' | 'enemy';
  emoji: string;
  progress: number;
}

export interface GameState {
  playerHero: Hero | null;
  playerStats: HeroStats;
  playerPosition: Position;
  playerLevel: number;
  playerXp: number;
  playerXpToNext: number;
  playerGold: number;
  playerInventory: Item[];
  creeps: Creep[];
  towers: Tower[];
  projectiles: Projectile[];
  enemies: EnemyHero[];
  gameTime: number;
  kills: number;
  deaths: number;
  assists: number;
  lastAttackTime: number;
  targetPosition: Position | null;
  attackTarget: string | null;
  baseHp: { player: number; enemy: number };
  gameOver: boolean;
  winner: 'player' | 'enemy' | null;
  damageNumbers: DamageNumber[];
}

export interface EnemyHero {
  id: string;
  hero: Hero;
  position: Position;
  hp: number;
  maxHp: number;
  isDead: boolean;
  respawnTime: number;
  lane: 'top' | 'mid' | 'bot';
  emoji: string;
  attack: number;
  speed: number;
}

export interface DamageNumber {
  id: string;
  position: Position;
  value: number;
  time: number;
  isCrit: boolean;
}
