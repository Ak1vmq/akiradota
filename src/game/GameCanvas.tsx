import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Hero, GameState, Item } from './types';
import { items } from './items';
import {
  MAP_WIDTH, MAP_HEIGHT,
  createCreep, createTowers, createEnemyHeroes,
  distance, moveToward, updateCreeps, updateTowers,
  updateEnemies, updateProjectiles, checkGameOver,
  createDamageNumber, createProjectile,
} from './gameEngine';

interface Props {
  hero: Hero;
  onBack: () => void;
}

const VIEWPORT_WIDTH = 900;
const VIEWPORT_HEIGHT = 600;

export const GameCanvas: React.FC<Props> = ({ hero, onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>(initGameState(hero));
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const creepSpawnRef = useRef<number>(0);
  const [showShop, setShowShop] = useState(false);
  const [, forceUpdate] = useState(0);
  const [gameMessage, setGameMessage] = useState('');

  function initGameState(h: Hero): GameState {
    return {
      playerHero: h,
      playerStats: { ...h.baseStats },
      playerPosition: { x: 200, y: 2200 },
      playerLevel: 1,
      playerXp: 0,
      playerXpToNext: 100,
      playerGold: 500,
      playerInventory: [],
      creeps: [],
      towers: createTowers(),
      projectiles: [],
      enemies: createEnemyHeroes(),
      gameTime: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      lastAttackTime: 0,
      targetPosition: null,
      attackTarget: null,
      baseHp: { player: 3000, enemy: 3000 },
      gameOver: false,
      winner: null,
      damageNumbers: [],
    };
  }

  const getCamera = useCallback(() => {
    const state = gameStateRef.current;
    const camX = Math.max(0, Math.min(MAP_WIDTH - VIEWPORT_WIDTH, state.playerPosition.x - VIEWPORT_WIDTH / 2));
    const camY = Math.max(0, Math.min(MAP_HEIGHT - VIEWPORT_HEIGHT, state.playerPosition.y - VIEWPORT_HEIGHT / 2));
    return { x: camX, y: camY };
  }, []);

  const render = useCallback((ctx: CanvasRenderingContext2D) => {
    const state = gameStateRef.current;
    const cam = getCamera();

    // Clear
    ctx.fillStyle = '#1a3a1a';
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

    // Draw map background
    ctx.save();
    ctx.translate(-cam.x, -cam.y);

    // Grass pattern with variation
    ctx.fillStyle = '#2d5a2d';
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    
    // Draw river through middle
    ctx.strokeStyle = '#1a4a6a';
    ctx.lineWidth = 60;
    ctx.beginPath();
    ctx.moveTo(0, 1200);
    ctx.quadraticCurveTo(600, 1000, 1200, 1200);
    ctx.quadraticCurveTo(1800, 1400, 2400, 1200);
    ctx.stroke();
    ctx.strokeStyle = '#2a6a9a';
    ctx.lineWidth = 30;
    ctx.beginPath();
    ctx.moveTo(0, 1200);
    ctx.quadraticCurveTo(600, 1000, 1200, 1200);
    ctx.quadraticCurveTo(1800, 1400, 2400, 1200);
    ctx.stroke();
    
    // Draw some bushes (jungle)
    const bushes = [
      {x: 600, y: 900}, {x: 1800, y: 1500}, {x: 900, y: 1500},
      {x: 1500, y: 900}, {x: 400, y: 1500}, {x: 2000, y: 900},
    ];
    ctx.font = '28px Arial';
    for (const bush of bushes) {
      ctx.fillText('🌿', bush.x, bush.y);
    }

    // Draw lanes (paths)
    ctx.strokeStyle = '#4a3a2a';
    ctx.lineWidth = 40;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Top lane
    ctx.beginPath();
    ctx.moveTo(200, 200);
    ctx.lineTo(200, 600);
    ctx.lineTo(1200, 400);
    ctx.lineTo(2200, 200);
    ctx.stroke();

    // Mid lane
    ctx.beginPath();
    ctx.moveTo(300, 300);
    ctx.lineTo(2100, 2100);
    ctx.stroke();

    // Bot lane
    ctx.beginPath();
    ctx.moveTo(200, 2200);
    ctx.lineTo(1200, 2000);
    ctx.lineTo(2200, 2200);
    ctx.lineTo(2200, 1800);
    ctx.stroke();

    // Draw bases
    // Player base
    ctx.fillStyle = '#2255aa';
    ctx.beginPath();
    ctx.arc(200, 2200, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🏠 БАЗА', 200, 2205);

    // Enemy base
    ctx.fillStyle = '#aa2222';
    ctx.beginPath();
    ctx.arc(2200, 200, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText('💀 ВРАГ', 2200, 205);

    // Draw towers
    for (const tower of state.towers) {
      if (tower.isDead) continue;
      ctx.font = '32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(tower.emoji, tower.position.x, tower.position.y + 10);

      // Tower HP bar
      const hpPercent = tower.hp / tower.maxHp;
      ctx.fillStyle = '#333';
      ctx.fillRect(tower.position.x - 25, tower.position.y - 30, 50, 6);
      ctx.fillStyle = tower.team === 'player' ? '#44ff44' : '#ff4444';
      ctx.fillRect(tower.position.x - 25, tower.position.y - 30, 50 * hpPercent, 6);
    }

    // Draw creeps
    for (const creep of state.creeps) {
      if (creep.isDead) continue;
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(creep.emoji, creep.position.x, creep.position.y + 5);

      // HP bar
      const hpPercent = creep.hp / creep.maxHp;
      ctx.fillStyle = '#333';
      ctx.fillRect(creep.position.x - 12, creep.position.y - 15, 24, 4);
      ctx.fillStyle = creep.team === 'player' ? '#44ff44' : '#ff4444';
      ctx.fillRect(creep.position.x - 12, creep.position.y - 15, 24 * hpPercent, 4);
    }

    // Draw enemies
    for (const enemy of state.enemies) {
      if (enemy.isDead) continue;
      ctx.font = '36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(enemy.emoji, enemy.position.x, enemy.position.y + 12);

      // HP bar
      const hpPercent = enemy.hp / enemy.maxHp;
      ctx.fillStyle = '#333';
      ctx.fillRect(enemy.position.x - 25, enemy.position.y - 30, 50, 6);
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(enemy.position.x - 25, enemy.position.y - 30, 50 * hpPercent, 6);

      // Name
      ctx.fillStyle = '#ff6666';
      ctx.font = '11px Arial';
      ctx.fillText(enemy.hero.name, enemy.position.x, enemy.position.y - 35);
    }

    // Draw player
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(hero.emoji, state.playerPosition.x, state.playerPosition.y + 14);

    // Player selection circle
    ctx.strokeStyle = '#44ff44';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(state.playerPosition.x, state.playerPosition.y, 25, 0, Math.PI * 2);
    ctx.stroke();

    // Draw projectiles
    for (const proj of state.projectiles) {
      const x = proj.from.x + (proj.to.x - proj.from.x) * proj.progress;
      const y = proj.from.y + (proj.to.y - proj.from.y) * proj.progress;
      ctx.font = '16px Arial';
      ctx.fillText(proj.emoji, x, y);
    }

    // Draw damage numbers
    const now = Date.now();
    for (const dn of state.damageNumbers) {
      const age = now - dn.time;
      if (age > 1500) continue;
      const alpha = 1 - age / 1500;
      const yOffset = age * 0.03;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = dn.isCrit ? '#ffff00' : '#ff4444';
      ctx.font = dn.isCrit ? 'bold 18px Arial' : '14px Arial';
      ctx.fillText(`-${dn.value}`, dn.position.x, dn.position.y - yOffset);
      ctx.globalAlpha = 1;
    }

    // Draw move target indicator
    if (state.targetPosition) {
      ctx.strokeStyle = 'rgba(68, 255, 68, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(state.targetPosition.x, state.targetPosition.y, 10, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw trees/decorations
    const trees = [
      { x: 800, y: 200 }, { x: 1600, y: 300 }, { x: 400, y: 1200 },
      { x: 1800, y: 1000 }, { x: 1000, y: 1600 }, { x: 600, y: 1800 },
      { x: 1400, y: 800 }, { x: 2000, y: 1400 }, { x: 300, y: 800 },
      { x: 1200, y: 600 }, { x: 800, y: 1400 }, { x: 1600, y: 1800 },
    ];
    ctx.font = '24px Arial';
    for (const tree of trees) {
      ctx.fillText('🌲', tree.x, tree.y);
    }

    // Draw some funny decorations
    ctx.font = '20px Arial';
    ctx.fillText('🐄', 500, 1000);
    ctx.fillText('🐔', 1500, 500);
    ctx.fillText('🌻', 900, 1800);
    ctx.fillText('🍄', 1700, 1200);

    ctx.restore();

    // Draw minimap
    const minimapSize = 150;
    const minimapX = VIEWPORT_WIDTH - minimapSize - 10;
    const minimapY = VIEWPORT_HEIGHT - minimapSize - 10;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize);
    ctx.strokeStyle = '#666';
    ctx.strokeRect(minimapX, minimapY, minimapSize, minimapSize);

    const scale = minimapSize / MAP_WIDTH;

    // Player on minimap
    ctx.fillStyle = '#44ff44';
    ctx.beginPath();
    ctx.arc(minimapX + state.playerPosition.x * scale, minimapY + state.playerPosition.y * scale, 3, 0, Math.PI * 2);
    ctx.fill();

    // Enemies on minimap
    for (const enemy of state.enemies) {
      if (enemy.isDead) continue;
      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.arc(minimapX + enemy.position.x * scale, minimapY + enemy.position.y * scale, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Towers on minimap
    for (const tower of state.towers) {
      if (tower.isDead) continue;
      ctx.fillStyle = tower.team === 'player' ? '#4444ff' : '#ff8844';
      ctx.fillRect(minimapX + tower.position.x * scale - 2, minimapY + tower.position.y * scale - 2, 4, 4);
    }

    // Bases on minimap
    ctx.fillStyle = '#4444ff';
    ctx.fillRect(minimapX + 200 * scale - 4, minimapY + 2200 * scale - 4, 8, 8);
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(minimapX + 2200 * scale - 4, minimapY + 200 * scale - 4, 8, 8);

  }, [getCamera, hero]);

  const gameLoop = useCallback((timestamp: number) => {
    const state = gameStateRef.current;
    if (state.gameOver) {
      setGameMessage(state.winner === 'player' ? '🎉 ПОБЕДА! Вражеская база разрушена!' : '💀 ПОРАЖЕНИЕ! Ваша база уничтожена!');
      return;
    }

    const deltaTime = lastTimeRef.current ? Math.min(timestamp - lastTimeRef.current, 50) : 16;
    lastTimeRef.current = timestamp;
    state.gameTime += deltaTime;

    // Spawn creeps every 20 seconds (initial spawn at start)
    creepSpawnRef.current += deltaTime;
    if (creepSpawnRef.current > 20000 || (state.gameTime < 100 && state.creeps.length === 0)) {
      creepSpawnRef.current = 0;
      const lanesArr: ('top' | 'mid' | 'bot')[] = ['top', 'mid', 'bot'];
      for (const lane of lanesArr) {
        for (let i = 0; i < 3; i++) {
          state.creeps.push(createCreep('player', lane));
          state.creeps.push(createCreep('enemy', lane));
        }
      }
    }

    // Player movement toward target
    if (state.targetPosition) {
      const dist = distance(state.playerPosition, state.targetPosition);
      if (dist > 5) {
        state.playerPosition = moveToward(state.playerPosition, state.targetPosition, state.playerStats.speed * deltaTime * 0.06);
      } else {
        state.targetPosition = null;
      }
    }

    // Auto attack
    const now = Date.now();
    const attackInterval = 1000 / state.playerStats.attackSpeed;
    if (now - state.lastAttackTime > attackInterval) {
      // Find nearest enemy in range
      const allEnemies = [
        ...state.creeps.filter(c => c.team === 'enemy' && !c.isDead),
        ...state.enemies.filter(e => !e.isDead),
        ...state.towers.filter(t => t.team === 'enemy' && !t.isDead),
      ];

      let nearestEnemy: typeof allEnemies[0] | null = null;
      let nearestDist = state.playerStats.attackRange;

      for (const enemy of allEnemies) {
        const d = distance(state.playerPosition, enemy.position);
        if (d < nearestDist) {
          nearestDist = d;
          nearestEnemy = enemy;
        }
      }

      if (nearestEnemy) {
        state.lastAttackTime = now;
        const isCrit = Math.random() < state.playerStats.critChance;
        let damage = state.playerStats.attack;
        if (isCrit) damage *= 2;
        damage = Math.max(1, damage - 2);

        nearestEnemy.hp -= damage;
        state.damageNumbers.push(createDamageNumber(nearestEnemy.position, Math.round(damage), isCrit));

        if (nearestEnemy.hp <= 0) {
          nearestEnemy.isDead = true;
          if ('reward' in nearestEnemy) {
            state.playerGold += (nearestEnemy as any).reward;
            state.playerXp += 30;
          } else if ('hero' in nearestEnemy) {
            state.kills++;
            state.playerGold += 200;
            state.playerXp += 100;
            (nearestEnemy as any).respawnTime = 10000;
          }
        }

        // Create projectile for ranged attacks
        if (state.playerStats.attackRange > 150) {
          state.projectiles.push(createProjectile(
            { ...state.playerPosition },
            { ...nearestEnemy.position },
            damage,
            'player',
            '💫'
          ));
        }
      }
    }

    // Level up
    if (state.playerXp >= state.playerXpToNext) {
      state.playerXp -= state.playerXpToNext;
      state.playerLevel++;
      state.playerXpToNext = Math.floor(state.playerXpToNext * 1.5);
      state.playerStats.maxHp += 50;
      state.playerStats.hp = Math.min(state.playerStats.hp + 50, state.playerStats.maxHp);
      state.playerStats.attack += 5;
      state.playerStats.maxMana += 30;
      state.playerStats.mana = Math.min(state.playerStats.mana + 30, state.playerStats.maxMana);
    }

    // Mana regen
    state.playerStats.mana = Math.min(state.playerStats.maxMana, state.playerStats.mana + deltaTime * 0.01);

    // HP regen
    state.playerStats.hp = Math.min(state.playerStats.maxHp, state.playerStats.hp + deltaTime * 0.005);

    // Update game entities
    updateCreeps(state, deltaTime);
    updateTowers(state, deltaTime);
    updateEnemies(state, deltaTime);
    updateProjectiles(state, deltaTime);
    checkGameOver(state);

    // Clean up old damage numbers
    state.damageNumbers = state.damageNumbers.filter(d => Date.now() - d.time < 1500);

    // Clean up dead creeps after delay
    state.creeps = state.creeps.filter(c => !c.isDead || Math.random() > 0.01);

    // Render
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        render(ctx);
      }
    }

    forceUpdate(v => v + 1);
    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [render]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [gameLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());

      const state = gameStateRef.current;

      // Shop
      if (e.key.toLowerCase() === 'b') {
        setShowShop(prev => !prev);
      }

      // Abilities
      if (e.key.toLowerCase() === 'q' && state.playerHero) {
        useAbility(0);
      }
      if (e.key.toLowerCase() === 'w' && state.playerHero) {
        useAbility(1);
      }
      if (e.key.toLowerCase() === 'e' && state.playerHero) {
        useAbility(2);
      }
      if (e.key.toLowerCase() === 'r' && state.playerHero) {
        useAbility(3);
      }

      // Stop
      if (e.key === 's') {
        state.targetPosition = null;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const useAbility = (index: number) => {
    const state = gameStateRef.current;
    if (!state.playerHero) return;
    const ability = state.playerHero.abilities[index];
    if (!ability) return;

    const now = Date.now() / 1000;
    if (now - ability.lastUsed < ability.cooldown) return;
    if (state.playerStats.mana < ability.manaCost) return;

    ability.lastUsed = now;
    state.playerStats.mana -= ability.manaCost;

    // Apply ability effects
    if (ability.damage < 0) {
      // Healing
      state.playerStats.hp = Math.min(state.playerStats.maxHp, state.playerStats.hp - ability.damage);
      state.damageNumbers.push(createDamageNumber(state.playerPosition, Math.round(-ability.damage), false));
    } else if (ability.damage > 0) {
      // Damage ability
      const cam = getCamera();
      const targetPos = state.targetPosition || {
        x: state.playerPosition.x + (mouseRef.current.x - VIEWPORT_WIDTH / 2),
        y: state.playerPosition.y + (mouseRef.current.y - VIEWPORT_HEIGHT / 2),
      };

      // Find enemies in range
      const allEnemies = [
        ...state.creeps.filter(c => c.team === 'enemy' && !c.isDead),
        ...state.enemies.filter(e => !e.isDead),
      ];

      for (const enemy of allEnemies) {
        const d = distance(state.playerPosition, enemy.position);
        if (d < ability.range) {
          if (ability.aoe > 0) {
            const dToTarget = distance(enemy.position, targetPos);
            if (dToTarget < ability.aoe) {
              enemy.hp -= ability.damage;
              state.damageNumbers.push(createDamageNumber(enemy.position, ability.damage, true));
              if (enemy.hp <= 0) {
                enemy.isDead = true;
                if ('reward' in enemy) {
                  state.playerGold += (enemy as any).reward;
                  state.kills++;
                } else {
                  state.kills++;
                  state.playerGold += 200;
                  (enemy as any).respawnTime = 10000;
                }
              }
            }
          } else {
            enemy.hp -= ability.damage;
            state.damageNumbers.push(createDamageNumber(enemy.position, ability.damage, true));
            if (enemy.hp <= 0) {
              enemy.isDead = true;
              if ('reward' in enemy) {
                state.playerGold += (enemy as any).reward;
                state.kills++;
              } else {
                state.kills++;
                state.playerGold += 200;
                (enemy as any).respawnTime = 10000;
              }
            }
            if (ability.aoe === 0) break; // Single target
          }
        }
      }

      // Create projectile
      if (ability.range > 0) {
        state.projectiles.push(createProjectile(
          { ...state.playerPosition },
          { ...targetPos },
          ability.damage,
          'player',
          ability.emoji
        ));
      }
    }

    // Special effects for certain abilities
    if (ability.id === 'ded_w' || ability.id === 'shkol_w' || ability.id === 'shkol_r') {
      // Shield/heal buff
      state.playerStats.defense += 5;
      setTimeout(() => { state.playerStats.defense -= 5; }, 5000);
    }
    if (ability.id === 'kot_w') {
      // Invisibility - can't be targeted
    }
    if (ability.id === 'batya_r') {
      // Golden fish - all crits
      const origCrit = state.playerStats.critChance;
      state.playerStats.critChance = 1.0;
      setTimeout(() => { state.playerStats.critChance = origCrit; }, 10000);
    }
    if (ability.id === 'ded_r') {
      // Pension rage - double damage and defense
      state.playerStats.attack *= 2;
      state.playerStats.defense *= 2;
      setTimeout(() => {
        state.playerStats.attack /= 2;
        state.playerStats.defense /= 2;
      }, 8000);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cam = getCamera();
    const worldX = x + cam.x;
    const worldY = y + cam.y;

    gameStateRef.current.targetPosition = { x: worldX, y: worldY };
  };

  const handleCanvasRightClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cam = getCamera();
    const worldX = x + cam.x;
    const worldY = y + cam.y;

    // Attack move
    const state = gameStateRef.current;
    const allEnemies = [
      ...state.creeps.filter(c => c.team === 'enemy' && !c.isDead),
      ...state.enemies.filter(e => !e.isDead),
      ...state.towers.filter(t => t.team === 'enemy' && !t.isDead),
    ];

    for (const enemy of allEnemies) {
      if (distance({ x: worldX, y: worldY }, enemy.position) < 30) {
        state.targetPosition = { ...enemy.position };
        return;
      }
    }

    state.targetPosition = { x: worldX, y: worldY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const buyItem = (item: Item) => {
    const state = gameStateRef.current;
    if (state.playerGold < item.cost) return;
    if (state.playerInventory.length >= 6) return;

    state.playerGold -= item.cost;
    state.playerInventory.push(item);

    // Apply stats
    if (item.stats.attack) state.playerStats.attack += item.stats.attack;
    if (item.stats.defense) state.playerStats.defense += item.stats.defense;
    if (item.stats.maxHp) {
      state.playerStats.maxHp += item.stats.maxHp;
      state.playerStats.hp += item.stats.maxHp;
    }
    if (item.stats.maxMana) {
      state.playerStats.maxMana += item.stats.maxMana;
      state.playerStats.mana += item.stats.maxMana;
    }
    if (item.stats.speed) state.playerStats.speed += item.stats.speed;
    if (item.stats.critChance) state.playerStats.critChance += item.stats.critChance;
  };

  const state = gameStateRef.current;
  const hpPercent = (state.playerStats.hp / state.playerStats.maxHp) * 100;
  const manaPercent = (state.playerStats.mana / state.playerStats.maxMana) * 100;
  const xpPercent = (state.playerXp / state.playerXpToNext) * 100;

  return (
    <div className="relative w-full h-screen bg-gray-900 flex flex-col items-center justify-center overflow-hidden">
      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={VIEWPORT_WIDTH}
        height={VIEWPORT_HEIGHT}
        onClick={handleCanvasClick}
        onContextMenu={handleCanvasRightClick}
        onMouseMove={handleMouseMove}
        className="border-2 border-gray-700 rounded-lg cursor-crosshair"
      />

      {/* HUD - Top */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex gap-4 items-center">
        <div className="bg-black/80 rounded px-3 py-1 text-yellow-400 font-bold">
          ⏱️ {Math.floor(state.gameTime / 60000)}:{String(Math.floor((state.gameTime % 60000) / 1000)).padStart(2, '0')}
        </div>
        <div className="bg-black/80 rounded px-3 py-1 text-green-400 font-bold">
          K/D/A: {state.kills}/{state.deaths}/{state.assists}
        </div>
        <div className="bg-black/80 rounded px-3 py-1 text-yellow-400 font-bold">
          💰 {state.playerGold}
        </div>
        <div className="bg-black/80 rounded px-3 py-1 text-purple-400 font-bold">
          ⭐ Ур. {state.playerLevel}
        </div>
      </div>

      {/* HUD - Bottom */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-1">
        {/* HP/Mana bars */}
        <div className="flex gap-2 items-center w-96">
          <span className="text-red-400 text-sm w-8">❤️</span>
          <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden border border-gray-600">
            <div className="bg-gradient-to-r from-red-600 to-red-400 h-full transition-all" style={{ width: `${hpPercent}%` }} />
          </div>
          <span className="text-red-400 text-xs w-20">{Math.round(state.playerStats.hp)}/{state.playerStats.maxHp}</span>
        </div>
        <div className="flex gap-2 items-center w-96">
          <span className="text-blue-400 text-sm w-8">💧</span>
          <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden border border-gray-600">
            <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-full transition-all" style={{ width: `${manaPercent}%` }} />
          </div>
          <span className="text-blue-400 text-xs w-20">{Math.round(state.playerStats.mana)}/{state.playerStats.maxMana}</span>
        </div>
        <div className="flex gap-2 items-center w-96">
          <span className="text-purple-400 text-sm w-8">⭐</span>
          <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden border border-gray-600">
            <div className="bg-gradient-to-r from-purple-600 to-purple-400 h-full transition-all" style={{ width: `${xpPercent}%` }} />
          </div>
          <span className="text-purple-400 text-xs w-20">{state.playerXp}/{state.playerXpToNext}</span>
        </div>

        {/* Abilities */}
        <div className="flex gap-2 mt-1">
          {state.playerHero?.abilities.map((ability, i) => {
            const now = Date.now() / 1000;
            const cd = Math.max(0, ability.cooldown - (now - ability.lastUsed));
            const onCooldown = cd > 0;
            const noMana = state.playerStats.mana < ability.manaCost;
            const key = ['Q', 'W', 'E', 'R'][i];

            return (
              <button
                key={ability.id}
                onClick={() => useAbility(i)}
                disabled={onCooldown || noMana}
                className={`relative w-14 h-14 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                  onCooldown ? 'border-gray-600 bg-gray-800 opacity-50' :
                  noMana ? 'border-blue-900 bg-gray-800 opacity-70' :
                  'border-yellow-500 bg-gray-700 hover:bg-gray-600 hover:scale-110'
                }`}
                title={`${ability.name}: ${ability.description} (${ability.manaCost} маны)`}
              >
                <span className="text-xl">{ability.emoji}</span>
                <span className="text-[10px] text-gray-400">{key}</span>
                {onCooldown && (
                  <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm bg-black/50 rounded-lg">
                    {Math.ceil(cd)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Inventory */}
        <div className="flex gap-1 mt-1">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-10 h-10 border border-gray-600 rounded bg-gray-800/80 flex items-center justify-center text-lg">
              {state.playerInventory[i] ? (
                <span title={state.playerInventory[i].name}>{state.playerInventory[i].emoji}</span>
              ) : null}
            </div>
          ))}
          <button
            onClick={() => setShowShop(!showShop)}
            className="w-10 h-10 border border-yellow-600 rounded bg-yellow-900/50 flex items-center justify-center text-lg hover:bg-yellow-800/50"
            title="Магазин (B)"
          >
            🛒
          </button>
        </div>
      </div>

      {/* Base HP indicators */}
      <div className="absolute top-12 left-4 flex flex-col gap-1">
        <div className="bg-black/80 rounded px-2 py-1">
          <div className="text-blue-400 text-xs">🏠 Ваша база</div>
          <div className="w-32 bg-gray-800 rounded-full h-3 overflow-hidden">
            <div className="bg-blue-500 h-full" style={{ width: `${(state.baseHp.player / 3000) * 100}%` }} />
          </div>
          <div className="text-blue-300 text-xs">{state.baseHp.player}/3000</div>
        </div>
        <div className="bg-black/80 rounded px-2 py-1">
          <div className="text-red-400 text-xs">💀 Вражеская база</div>
          <div className="w-32 bg-gray-800 rounded-full h-3 overflow-hidden">
            <div className="bg-red-500 h-full" style={{ width: `${(state.baseHp.enemy / 3000) * 100}%` }} />
          </div>
          <div className="text-red-300 text-xs">{state.baseHp.enemy}/3000</div>
        </div>
      </div>

      {/* Stats panel */}
      <div className="absolute top-12 right-4 bg-black/80 rounded p-2 text-xs">
        <div className="text-gray-400">⚔️ Атака: {Math.round(state.playerStats.attack)}</div>
        <div className="text-gray-400">🛡️ Защита: {Math.round(state.playerStats.defense)}</div>
        <div className="text-gray-400">💨 Скорость: {state.playerStats.speed.toFixed(1)}</div>
        <div className="text-gray-400">🎯 Крит: {Math.round(state.playerStats.critChance * 100)}%</div>
      </div>

      {/* Shop */}
      {showShop && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-gray-900 border-2 border-yellow-600 rounded-xl p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-yellow-400">🛒 Магазин Бати</h2>
              <div className="flex items-center gap-4">
                <span className="text-yellow-400 font-bold">💰 {state.playerGold}</span>
                <button onClick={() => setShowShop(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => buyItem(item)}
                  disabled={state.playerGold < item.cost || state.playerInventory.length >= 6}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    state.playerGold >= item.cost && state.playerInventory.length < 6
                      ? 'border-gray-600 bg-gray-800 hover:border-yellow-500 hover:bg-gray-700'
                      : 'border-gray-700 bg-gray-800/50 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="text-white font-bold text-sm">{item.name}</span>
                  </div>
                  <p className="text-gray-400 text-xs mb-1">{item.description}</p>
                  <p className="text-yellow-400 text-sm font-bold">💰 {item.cost}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Game Over */}
      {state.gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="text-center">
            <h2 className={`text-5xl font-bold mb-4 ${state.winner === 'player' ? 'text-yellow-400' : 'text-red-400'}`}>
              {gameMessage}
            </h2>
            <p className="text-white text-xl mb-2">K/D/A: {state.kills}/{state.deaths}/{state.assists}</p>
            <p className="text-gray-400 mb-6">Время: {Math.floor(state.gameTime / 60000)}:{String(Math.floor((state.gameTime % 60000) / 1000)).padStart(2, '0')}</p>
            <button
              onClick={onBack}
              className="bg-yellow-500 text-black font-bold py-3 px-8 rounded-lg text-xl hover:bg-yellow-400"
            >
              🏠 В МЕНЮ
            </button>
          </div>
        </div>
      )}

      {/* Controls hint */}
      <div className="absolute bottom-2 right-4 text-gray-500 text-xs text-right">
        <div>ЛКМ - идти | ПКМ - атака/идти</div>
        <div>Q/W/E/R - способности | B - магазин</div>
        <div>S - стоп</div>
      </div>
    </div>
  );
};
