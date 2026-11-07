import React, { useRef, useEffect, useState, useCallback } from 'react';
import { InfectionRoute, Pathogen, Bullet, Spore, Particle, FloatingText, DiseaseItem } from '../types/game';
import { ROUTE_CONFIG, DISEASES_DATABASE } from '../data/diseases';
import { sound } from '../utils/audio';
import { Heart, Trophy, Zap, AlertTriangle, Shield, Volume2, VolumeX, Pause, Play, Sparkles } from 'lucide-react';

interface RetroGameCanvasProps {
  nickname: string;
  classCode: string;
  isTvMode: boolean;
  onGameOver: (result: {
    isVictory: boolean;
    score: number;
    baseScore: number;
    comboBonus: number;
    lifeBonus: number;
    timeBonus: number;
    remainingLives: number;
    waveReached: number;
  }) => void;
  onOpenGuide: () => void;
  onOpenLeaderboard: () => void;
}

export const RetroGameCanvas: React.FC<RetroGameCanvasProps> = ({
  nickname,
  classCode,
  isTvMode,
  onGameOver,
  onOpenGuide,
  onOpenLeaderboard,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // React State for HUD & UI Overlays
  const [currentRoute, setCurrentRoute] = useState<InfectionRoute>('digestive');
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [wave, setWave] = useState<number>(1);
  const [combo, setCombo] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [activePreventionNotice, setActivePreventionNotice] = useState<{
    route: InfectionRoute;
    name: string;
    prevention: string;
  } | null>(null);

  // Mutable Game Loop State (Ref-based to avoid closure staleness and re-render lagging)
  const stateRef = useRef({
    score: 0,
    baseScore: 0,
    comboBonus: 0,
    lives: 3,
    wave: 1,
    combo: 0,
    maxCombo: 0,
    currentRoute: 'digestive' as InfectionRoute,
    isPaused: false,
    gameOverTriggered: false,

    // Timing
    waveStartTime: Date.now(),
    gameStartTime: Date.now(),
    lastFrameTime: performance.now(),

    // Player craft
    player: {
      x: 400,
      y: 640,
      width: 54,
      height: 44,
      speed: 480,
      invulnerableUntil: 0,
      isMovingLeft: false,
      isMovingRight: false,
      lastShootTime: 0,
      shootCooldown: 220,
    },

    // Formation & Enemies
    pathogens: [] as Pathogen[],
    formationDirection: 1, // 1: right, -1: left
    formationStepDownNeeded: false,
    formationSpeedX: 45,
    formationDropDistance: 18,
    lastFormationStepTime: 0,

    // Projectiles & FX
    bullets: [] as Bullet[],
    spores: [] as Spore[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    stars: [] as { x: number; y: number; size: number; speed: number; alpha: number }[],

    // Notice timeout ref
    noticeTimeoutId: null as number | null,

    // Canvas size
    width: 800,
    height: 720,
  });

  // Switch Ammo helper
  const switchAmmo = useCallback((route: InfectionRoute) => {
    stateRef.current.currentRoute = route;
    setCurrentRoute(route);
  }, []);

  // 1. Generate Starfield
  const initStars = (width: number, height: number) => {
    const stars = [];
    for (let i = 0; i < 70; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 25 + 15,
        alpha: Math.random() * 0.8 + 0.2,
      });
    }
    stateRef.current.stars = stars;
  };

  // 2. Initialize or Reset Wave (요구사항: 세균 출발 위치와 이동 타이머는 웨이브마다 완전히 초기화하고 타이머가 중복 실행되지 않게)
  const initWave = useCallback((waveNum: number) => {
    const state = stateRef.current;
    state.wave = waveNum;
    state.waveStartTime = Date.now();
    state.formationDirection = 1;
    state.bullets = [];
    state.spores = [];
    state.formationStepDownNeeded = false;
    setWave(waveNum);

    // Shuffle and pick disease items for this wave
    const shuffled = [...DISEASES_DATABASE].sort(() => Math.random() - 0.5);

    if (waveNum === 1) {
      // Wave 1: 9 Pathogens, 3 rows of 3 (넓은 카드 폭과 큼직한 글씨를 위해 한 줄에 3개 배치)
      state.formationSpeedX = 38;
      const waveItems = shuffled.slice(0, 9);
      const pathogens: Pathogen[] = [];
      const cols = 3;
      const cellWidth = 245;
      const cellHeight = 88;
      const startX = (state.width - cols * cellWidth) / 2 + 10;
      const startY = 75;

      for (let i = 0; i < waveItems.length; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        pathogens.push({
          id: i + 1,
          x: startX + col * cellWidth,
          y: startY + row * cellHeight,
          width: 228,
          height: 72,
          disease: waveItems[i],
          speedX: state.formationSpeedX,
          alive: true,
          hp: 1,
          maxHp: 1,
          lastShootTime: performance.now() + Math.random() * 3000,
          shootCooldown: 4000 + Math.random() * 3000,
          animFrame: Math.floor(Math.random() * 60),
        });
      }
      state.pathogens = pathogens;
    } else if (waveNum === 2) {
      // Wave 2: 9 Pathogens, 3 rows of 3, faster speed
      state.formationSpeedX = 52;
      const waveItems = shuffled.slice(0, 9);
      const pathogens: Pathogen[] = [];
      const cols = 3;
      const cellWidth = 245;
      const cellHeight = 88;
      const startX = (state.width - cols * cellWidth) / 2 + 10;
      const startY = 75;

      for (let i = 0; i < waveItems.length; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        pathogens.push({
          id: i + 1,
          x: startX + col * cellWidth,
          y: startY + row * cellHeight,
          width: 228,
          height: 72,
          disease: waveItems[i],
          speedX: state.formationSpeedX,
          alive: true,
          hp: 1,
          maxHp: 1,
          lastShootTime: performance.now() + Math.random() * 2000,
          shootCooldown: 3000 + Math.random() * 2500,
          animFrame: Math.floor(Math.random() * 60),
        });
      }
      state.pathogens = pathogens;
    } else {
      // Wave 3: 6 Regular Pathogens (2 rows of 3) + 1 GIANT BOSS GERM ("슈퍼 변종 복합체")
      state.formationSpeedX = 60;
      sound.playBossAlert();

      const waveItems = shuffled.slice(0, 6);
      const pathogens: Pathogen[] = [];
      const cols = 3;
      const cellWidth = 245;
      const cellHeight = 84;
      const startX = (state.width - cols * cellWidth) / 2 + 10;
      const startY = 60;

      // 6 Front guards (2 rows of 3)
      for (let i = 0; i < waveItems.length; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        pathogens.push({
          id: i + 1,
          x: startX + col * cellWidth,
          y: startY + row * cellHeight,
          width: 228,
          height: 70,
          disease: waveItems[i],
          speedX: state.formationSpeedX,
          alive: true,
          hp: 1,
          maxHp: 1,
          lastShootTime: performance.now() + Math.random() * 2000,
          shootCooldown: 2500 + Math.random() * 2000,
          animFrame: Math.floor(Math.random() * 60),
        });
      }

      // 1 Giant Boss Pathogen in Center
      const routes: InfectionRoute[] = ['digestive', 'respiratory', 'skin'];
      const initialBossRoute = routes[Math.floor(Math.random() * routes.length)];

      pathogens.push({
        id: 999,
        x: state.width / 2 - 140,
        y: startY + 145,
        width: 280,
        height: 110,
        disease: {
          id: 'boss-1',
          name: '슈퍼 변종 복합체 (보스)',
          route: initialBossRoute,
          prevention: '침투 경로를 식별하여 상극 백신으로 정밀 타격하라!',
        },
        speedX: 55,
        alive: true,
        hp: 10,
        maxHp: 10,
        isBoss: true,
        bossRoute: initialBossRoute,
        bossRouteTimer: 0,
        lastShootTime: performance.now() + 1000,
        shootCooldown: 1800,
        animFrame: 0,
      });

      state.pathogens = pathogens;
    }
  }, []);

  // Fire bullet from Immuno-Craft
  const fireBullet = useCallback(() => {
    const state = stateRef.current;
    if (state.isPaused || state.lives <= 0) return;

    const now = performance.now();
    if (now - state.player.lastShootTime < state.player.shootCooldown) return;

    state.player.lastShootTime = now;
    sound.playLaser(state.currentRoute);

    // Spawn 2 parallel vaccine beams from dual turrets
    const leftX = state.player.x + 12;
    const rightX = state.player.x + state.player.width - 12;
    const bulletY = state.player.y - 8;

    state.bullets.push(
      {
        id: Date.now() + Math.random(),
        x: leftX,
        y: bulletY,
        vx: 0,
        vy: -720,
        route: state.currentRoute,
      },
      {
        id: Date.now() + Math.random() + 1,
        x: rightX,
        y: bulletY,
        vx: 0,
        vy: -720,
        route: state.currentRoute,
      }
    );
  }, []);

  // Spawn explosion particles
  const createExplosion = (x: number, y: number, color: string, count: number = 24, isBoss: boolean = false) => {
    const state = stateRef.current;
    sound.playExplosion(isBoss);

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = Math.random() * (isBoss ? 280 : 180) + 40;
      const life = Math.random() * 0.4 + 0.3;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * (isBoss ? 6 : 4) + 2,
        color,
        alpha: 1,
        life,
        maxLife: life,
      });
    }
  };

  // Spark bounce particles (wrong vaccine hit)
  const createSparkClang = (x: number, y: number) => {
    const state = stateRef.current;
    sound.playClang();

    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI - Math.PI; // upward spray
      const speed = Math.random() * 150 + 60;
      const life = 0.25;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 50,
        size: Math.random() * 3 + 1,
        color: '#fbbf24', // yellow spark
        alpha: 1,
        life,
        maxLife: life,
      });
    }

    state.floatingTexts.push({
      id: Math.random(),
      x,
      y: y - 10,
      text: '튕겨나감! (경로 불일치)',
      color: '#f87171',
      alpha: 1,
      life: 0.8,
      maxLife: 0.8,
      vy: -35,
    });
  };

  // Trigger Prevention Notice Banner (1.5 seconds)
  const showPreventionNotice = (item: DiseaseItem) => {
    setActivePreventionNotice({
      route: item.route,
      name: item.name,
      prevention: item.prevention,
    });

    if (stateRef.current.noticeTimeoutId) {
      window.clearTimeout(stateRef.current.noticeTimeoutId);
    }
    stateRef.current.noticeTimeoutId = window.setTimeout(() => {
      setActivePreventionNotice(null);
    }, 1500);
  };

  // Player takes damage
  const damagePlayer = (cause: string = '') => {
    const state = stateRef.current;
    const now = performance.now();
    if (now < state.player.invulnerableUntil || state.lives <= 0) return;

    state.lives -= 1;
    setLives(state.lives);
    state.combo = 0;
    setCombo(0);
    state.player.invulnerableUntil = now + 2000; // 2 seconds invulnerability
    sound.playPlayerHurt();

    createExplosion(
      state.player.x + state.player.width / 2,
      state.player.y + state.player.height / 2,
      '#ef4444',
      20
    );

    state.floatingTexts.push({
      id: Math.random(),
      x: state.player.x + state.player.width / 2,
      y: state.player.y - 20,
      text: `생명 -1 (${cause})`,
      color: '#ef4444',
      alpha: 1,
      life: 1.2,
      maxLife: 1.2,
      vy: -40,
    });

    if (state.lives <= 0 && !state.gameOverTriggered) {
      state.gameOverTriggered = true;
      handleEndGame(false);
    }
  };

  // Complete game (Victory or Defeat) with tie-breaker calculation
  const handleEndGame = (isVictory: boolean) => {
    const state = stateRef.current;
    state.gameOverTriggered = true;

    // Remaining lives bonus: 1,000 pts per life
    const lifeBonus = isVictory ? state.lives * 1000 : 0;

    // Time bonus: 50 pts per remaining second (out of 180s total budget), ensures unique non-tied scores
    const elapsedSeconds = Math.max(1, Math.floor((Date.now() - state.gameStartTime) / 1000));
    const timeRemaining = Math.max(0, 180 - elapsedSeconds);
    const timeBonus = isVictory ? timeRemaining * 50 : 0;

    const finalTotal = state.score + lifeBonus + timeBonus;

    if (isVictory) {
      sound.playVictory();
    }

    onGameOver({
      isVictory,
      score: finalTotal,
      baseScore: state.baseScore,
      comboBonus: state.comboBonus,
      lifeBonus,
      timeBonus,
      remainingLives: state.lives,
      waveReached: state.wave,
    });
  };

  // Main Game Loop Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Setup canvas logical size
    const width = 800;
    const height = 720;
    canvas.width = width;
    canvas.height = height;
    stateRef.current.width = width;
    stateRef.current.height = height;
    stateRef.current.player.x = width / 2 - 27;
    stateRef.current.player.y = height - 70;

    initStars(width, height);
    initWave(1);

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = stateRef.current;
      if (e.repeat && (e.key === '1' || e.key === '2' || e.key === '3')) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        state.player.isMovingLeft = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        state.player.isMovingRight = true;
      } else if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        fireBullet();
      } else if (e.key === '1') {
        switchAmmo('digestive');
      } else if (e.key === '2') {
        switchAmmo('respiratory');
      } else if (e.key === '3') {
        switchAmmo('skin');
      } else if (e.key === 'p' || e.key === 'P') {
        state.isPaused = !state.isPaused;
        setIsPaused(state.isPaused);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const state = stateRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        state.player.isMovingLeft = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        state.player.isMovingRight = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Animation Loop
    let animId: number;
    stateRef.current.lastFrameTime = performance.now();

    const loop = (timestamp: number) => {
      const state = stateRef.current;
      const dt = Math.min((timestamp - state.lastFrameTime) / 1000, 0.05); // Cap delta to 50ms to prevent jumping
      state.lastFrameTime = timestamp;

      if (!state.isPaused && !state.gameOverTriggered) {
        // --- 1. UPDATE PLAYER MOVEMENT ---
        if (state.player.isMovingLeft) {
          state.player.x -= state.player.speed * dt;
        }
        if (state.player.isMovingRight) {
          state.player.x += state.player.speed * dt;
        }
        state.player.x = Math.max(10, Math.min(width - state.player.width - 10, state.player.x));

        // --- 2. UPDATE STARFIELD ---
        for (const star of state.stars) {
          star.y += star.speed * dt;
          if (star.y > height) {
            star.y = 0;
            star.x = Math.random() * width;
          }
        }

        // --- 3. UPDATE BULLETS ---
        for (let i = state.bullets.length - 1; i >= 0; i--) {
          const b = state.bullets[i];
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          if (b.y < -20 || b.y > height + 20) {
            state.bullets.splice(i, 1);
          }
        }

        // --- 4. UPDATE SPORES ---
        for (let i = state.spores.length - 1; i >= 0; i--) {
          const s = state.spores[i];
          s.x += s.vx * dt;
          s.y += s.vy * dt;

          // Check hit against player
          const playerCenterX = state.player.x + state.player.width / 2;
          const playerCenterY = state.player.y + state.player.height / 2;
          const dist = Math.hypot(s.x - playerCenterX, s.y - playerCenterY);

          if (dist < 26) {
            state.spores.splice(i, 1);
            damagePlayer('세균 포자 피격');
            continue;
          }

          if (s.y > height + 20) {
            state.spores.splice(i, 1);
          }
        }

        // --- 5. UPDATE FORMATION & BOSS BEHAVIOR ---
        let minX = width;
        let maxX = 0;
        let lowestY = 0;
        let anyAlive = false;

        const bossRoutes: InfectionRoute[] = ['digestive', 'respiratory', 'skin'];

        for (const p of state.pathogens) {
          if (!p.alive) continue;
          anyAlive = true;
          p.animFrame = (p.animFrame + 1) % 120;

          if (p.isBoss) {
            // Boss route aura rotation every 4.5 seconds
            p.bossRouteTimer = (p.bossRouteTimer || 0) + dt;
            if (p.bossRouteTimer > 4.5) {
              p.bossRouteTimer = 0;
              const nextRoute = bossRoutes[(bossRoutes.indexOf(p.bossRoute!) + 1) % bossRoutes.length];
              p.bossRoute = nextRoute;
              p.disease.route = nextRoute;

              // Display Boss Route Warning banner
              const routeLabel = ROUTE_CONFIG[nextRoute].name;
              state.floatingTexts.push({
                id: Math.random(),
                x: p.x + p.width / 2,
                y: p.y - 25,
                text: `⚠️ 보스 [${routeLabel}] 침투 전환!`,
                color: ROUTE_CONFIG[nextRoute].color,
                alpha: 1,
                life: 1.5,
                maxLife: 1.5,
                vy: -20,
              });
            }
          }

          // Track formation boundaries
          if (p.x < minX) minX = p.x;
          if (p.x + p.width > maxX) maxX = p.x + p.width;
          if (p.y + p.height > lowestY) lowestY = p.y + p.height;

          // Enemy Spore Firing Logic
          if (timestamp > p.lastShootTime + p.shootCooldown) {
            p.lastShootTime = timestamp;
            sound.playSpore();

            if (p.isBoss) {
              // Boss shoots 3-way spread spores
              for (const angleOffset of [-0.35, 0, 0.35]) {
                const speed = 190;
                state.spores.push({
                  id: Math.random(),
                  x: p.x + p.width / 2,
                  y: p.y + p.height - 5,
                  vx: Math.sin(angleOffset) * speed,
                  vy: Math.cos(angleOffset) * speed,
                });
              }
            } else {
              // Regular germ spore
              state.spores.push({
                id: Math.random(),
                x: p.x + p.width / 2,
                y: p.y + p.height,
                vx: (Math.random() - 0.5) * 30,
                vy: 160 + state.wave * 25,
              });
            }
          }
        }

        // Formation edge check & bouncing
        const formationMoveX = state.formationDirection * state.formationSpeedX * dt;
        let shouldReverse = false;

        if (state.formationDirection > 0 && maxX + formationMoveX >= width - 15) {
          shouldReverse = true;
        } else if (state.formationDirection < 0 && minX + formationMoveX <= 15) {
          shouldReverse = true;
        }

        if (shouldReverse) {
          state.formationDirection *= -1;
          // Shift formation down
          for (const p of state.pathogens) {
            p.y += state.formationDropDistance;
          }
        } else {
          for (const p of state.pathogens) {
            p.x += formationMoveX;
          }
        }

        // Check if any germ touched bottom defense line
        if (lowestY >= state.player.y - 15) {
          damagePlayer('방어선 침투');
          // Push formation slightly back up to prevent instant multi-death
          for (const p of state.pathogens) {
            p.y -= 45;
          }
        }

        // --- 6. BULLET VS ENEMY COLLISION ---
        for (let bi = state.bullets.length - 1; bi >= 0; bi--) {
          const b = state.bullets[bi];

          for (const p of state.pathogens) {
            if (!p.alive) continue;

            // Simple box collision
            if (
              b.x >= p.x &&
              b.x <= p.x + p.width &&
              b.y >= p.y &&
              b.y <= p.y + p.height
            ) {
              const targetRoute = p.isBoss ? p.bossRoute! : p.disease.route;

              // Remove this bullet
              state.bullets.splice(bi, 1);

              if (b.route === targetRoute) {
                // MATCH! Correct Vaccine Shot!
                p.hp -= 1;

                if (p.hp <= 0) {
                  // Fully Destroyed!
                  p.alive = false;
                  state.combo += 1;
                  state.maxCombo = Math.max(state.maxCombo, state.combo);
                  setCombo(state.combo);

                  // Combo chime
                  sound.playCombo(state.combo);

                  // Scoring: Base 100 + Combo Bonus (+20 * combo)
                  const baseGain = p.isBoss ? 1500 : 100;
                  const comboGain = p.isBoss ? 500 : (state.combo - 1) * 20;

                  state.baseScore += baseGain;
                  state.comboBonus += comboGain;
                  state.score = state.baseScore + state.comboBonus;
                  setScore(state.score);

                  // Create huge particle burst
                  const routeColor = ROUTE_CONFIG[targetRoute].color;
                  createExplosion(
                    p.x + p.width / 2,
                    p.y + p.height / 2,
                    routeColor,
                    p.isBoss ? 50 : 28,
                    p.isBoss
                  );

                  // Floating point indicator
                  state.floatingTexts.push({
                    id: Math.random(),
                    x: p.x + p.width / 2,
                    y: p.y,
                    text: `+${baseGain + comboGain}점! (콤보 x${state.combo})`,
                    color: '#facc15',
                    alpha: 1,
                    life: 1.0,
                    maxLife: 1.0,
                    vy: -30,
                  });

                  // Show prevention message banner
                  showPreventionNotice(p.disease);
                } else {
                  // Boss hit but still alive
                  sound.playLaser(b.route);
                  createExplosion(b.x, b.y, ROUTE_CONFIG[targetRoute].color, 8);

                  state.floatingTexts.push({
                    id: Math.random(),
                    x: p.x + p.width / 2,
                    y: p.y - 10,
                    text: `보스 타격! HP ${p.hp}/${p.maxHp}`,
                    color: '#67e8f9',
                    alpha: 1,
                    life: 0.6,
                    maxLife: 0.6,
                    vy: -25,
                  });
                }
              } else {
                // MISMATCH! Wrong Vaccine Shot!
                // Bullet bounced, combo broken!
                state.combo = 0;
                setCombo(0);
                createSparkClang(b.x, b.y);
              }

              break; // Proceed to next bullet
            }
          }
        }

        // --- 7. WAVE CLEAR CHECK ---
        if (!anyAlive && !state.gameOverTriggered) {
          if (state.wave < 3) {
            sound.playWaveClear();
            state.floatingTexts.push({
              id: Math.random(),
              x: width / 2,
              y: height / 2 - 40,
              text: `✨ WAVE ${state.wave} 격파 완료! ✨`,
              color: '#34d399',
              alpha: 1,
              life: 2.0,
              maxLife: 2.0,
              vy: -15,
              scale: 1.5,
            });

            // Transition to next wave
            initWave(state.wave + 1);
          } else {
            // All 3 Waves Cleared! VICTORY!
            handleEndGame(true);
          }
        }

        // --- 8. UPDATE PARTICLES & FLOATING TEXTS ---
        for (let i = state.particles.length - 1; i >= 0; i--) {
          const pt = state.particles[i];
          pt.x += pt.vx * dt;
          pt.y += pt.vy * dt;
          pt.life -= dt;
          pt.alpha = Math.max(0, pt.life / pt.maxLife);
          if (pt.life <= 0) {
            state.particles.splice(i, 1);
          }
        }

        for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
          const ft = state.floatingTexts[i];
          ft.y += ft.vy * dt;
          ft.life -= dt;
          ft.alpha = Math.max(0, ft.life / ft.maxLife);
          if (ft.life <= 0) {
            state.floatingTexts.splice(i, 1);
          }
        }
      }

      // ==========================================
      // --- RENDERING CANVAS ENGINE ---
      // ==========================================
      ctx.clearRect(0, 0, width, height);

      // Deep space backdrop
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#090d16');
      bgGrad.addColorStop(0.5, '#0b0f19');
      bgGrad.addColorStop(1, '#05070e');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Render Starfield
      for (const star of state.stars) {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      }

      // Defense perimeter line at bottom
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(10, state.player.y - 12);
      ctx.lineTo(width - 10, state.player.y - 12);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.font = '10px sans-serif';
      ctx.fillText('최종 면역 방어선 (DEFENSE LINE)', 15, state.player.y - 16);

      // Render Enemies (Pathogens)
      for (const p of state.pathogens) {
        if (!p.alive) continue;

        const targetRoute = p.isBoss ? p.bossRoute! : p.disease.route;
        const config = ROUTE_CONFIG[targetRoute];

        // Germ Card Container
        ctx.save();
        ctx.translate(p.x, p.y);

        if (p.isBoss) {
          // --- GIANT BOSS DRAWING ---
          const pulse = Math.sin(p.animFrame * 0.1) * 3;

          // Boss glow aura
          ctx.shadowColor = config.color;
          ctx.shadowBlur = 18;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
          ctx.strokeStyle = config.color;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.roundRect(0, 0, p.width, p.height, 14);
          ctx.fill();
          ctx.stroke();

          // Boss Health Bar
          const hpRatio = Math.max(0, p.hp / p.maxHp);
          ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
          ctx.fillRect(15, 10, p.width - 30, 8);
          ctx.fillStyle = config.color;
          ctx.fillRect(15, 10, (p.width - 30) * hpRatio, 8);

          // Boss Route Icon & Name
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 22px "Jua", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`⚡ ${p.disease.name} ⚡`, p.width / 2, 42);

          // Active infection route prompt
          ctx.fillStyle = config.lightColor;
          ctx.font = 'bold 17px "Jua", sans-serif';
          ctx.fillText(
            `침투 전파: ${config.icon} [${config.name}] 모드!`,
            p.width / 2,
            68
          );

          ctx.font = 'bold 14px "Jua", sans-serif';
          ctx.fillStyle = '#fef08a';
          ctx.fillText(
            `🎯 대응 탄: [${config.keyNumber}]번 ${config.shortLabel}로 타격!`,
            p.width / 2,
            88
          );
        } else {
          // --- REGULAR GERM DRAWING (교실 TV 최적화: 1.5배 큰 글씨 및 두 줄 줄바꿈) ---
          ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
          ctx.strokeStyle = config.color;
          ctx.lineWidth = 3;

          ctx.beginPath();
          ctx.roundRect(0, 0, p.width, p.height, 10);
          ctx.fill();
          ctx.stroke();

          // Left icon tag
          ctx.fillStyle = config.color;
          ctx.fillRect(0, 0, 42, p.height);

          ctx.font = '22px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(config.icon, 21, p.height / 2);

          // Text layout
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';

          const text = p.disease.name;
          const isSituation = p.disease.isSituation || text.length > 7;

          if (isSituation) {
            // 긴 상황 문제는 2줄로 분할하여 잘림 없이 표시
            let line1 = text;
            let line2 = '';

            const words = text.split(' ');
            if (words.length >= 2) {
              const mid = Math.ceil(words.length / 2);
              line1 = words.slice(0, mid).join(' ');
              line2 = words.slice(mid).join(' ');
            } else if (text.length > 7) {
              line1 = text.slice(0, Math.ceil(text.length / 2));
              line2 = text.slice(Math.ceil(text.length / 2));
            }

            // 1.5배 커진 굵은 폰트 (16~17px)
            ctx.fillStyle = '#fef08a'; // 선명한 형광 노랑으로 교실 TV 시인성 극대화
            ctx.font = 'bold 16px "Jua", sans-serif';
            ctx.fillText(line1, 48, p.height / 2 - 12);
            if (line2) {
              ctx.fillText(line2, 48, p.height / 2 + 12);
            }
          } else {
            // 단일 감염병 명칭: 1.5배 커진 20px 초대형 굵은 폰트
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px "Jua", sans-serif';
            ctx.fillText(text, 48, p.height / 2);
          }
        }

        ctx.restore();
      }

      // Render Bullets (Vaccine Beams)
      for (const b of state.bullets) {
        const config = ROUTE_CONFIG[b.route];

        ctx.save();
        ctx.shadowColor = config.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = config.lightColor;

        // Pill / Capsule shape beam
        ctx.beginPath();
        ctx.roundRect(b.x - 3, b.y - 12, 6, 20, 3);
        ctx.fill();

        // Beam particle tail
        ctx.fillStyle = config.color;
        ctx.fillRect(b.x - 1.5, b.y + 8, 3, 10);
        ctx.restore();
      }

      // Render Spores (Enemy Toxic Bubbles)
      for (const s of state.spores) {
        ctx.save();
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#581c87';
        ctx.beginPath();
        ctx.arc(s.x + 2, s.y - 2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Render Particles
      for (const pt of state.particles) {
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.alpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Render Immuno-Craft (Player Ship)
      const now = performance.now();
      const isInvulnerable = now < state.player.invulnerableUntil;
      const isFlickerVisible = !isInvulnerable || Math.floor(now / 100) % 2 === 0;

      if (isFlickerVisible) {
        const px = state.player.x;
        const py = state.player.y;
        const pw = state.player.width;
        const ph = state.player.height;
        const activeCfg = ROUTE_CONFIG[state.currentRoute];

        ctx.save();
        ctx.translate(px, py);

        // Booster Thruster Flame
        const flameH = Math.random() * 12 + 10;
        const flameGrad = ctx.createLinearGradient(0, ph - 4, 0, ph + flameH);
        flameGrad.addColorStop(0, '#38bdf8');
        flameGrad.addColorStop(0.6, '#f97316');
        flameGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(pw / 2 - 8, ph - 2);
        ctx.lineTo(pw / 2 + 8, ph - 2);
        ctx.lineTo(pw / 2, ph + flameH);
        ctx.closePath();
        ctx.fill();

        // Ship Body (Original Retro Guardian Craft)
        ctx.shadowColor = activeCfg.color;
        ctx.shadowBlur = 12;

        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = activeCfg.color;
        ctx.lineWidth = 2.5;

        // Sleek triangular hull
        ctx.beginPath();
        ctx.moveTo(pw / 2, 0); // nose
        ctx.lineTo(pw, ph - 10);
        ctx.lineTo(pw - 10, ph);
        ctx.lineTo(pw / 2 + 6, ph - 6);
        ctx.lineTo(pw / 2 - 6, ph - 6);
        ctx.lineTo(10, ph);
        ctx.lineTo(0, ph - 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cockpit Dome (Glows with active ammo color)
        ctx.fillStyle = activeCfg.lightColor;
        ctx.beginPath();
        ctx.ellipse(pw / 2, ph / 2 - 4, 8, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Active Vaccine Ammo Core Icon
        ctx.shadowBlur = 0;
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(activeCfg.icon, pw / 2, ph / 2 - 3);

        ctx.restore();
      }

      // Render Floating Texts
      for (const ft of state.floatingTexts) {
        ctx.save();
        ctx.globalAlpha = ft.alpha;
        ctx.fillStyle = ft.color;
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        const scale = ft.scale || 1;
        ctx.font = `bold ${Math.round(15 * scale)}px "Jua", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      // TV Scanlines Overlay Effect (If TV Mode Active)
      if (isTvMode) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        for (let y = 0; y < height; y += 4) {
          ctx.fillRect(0, y, width, 1.5);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (stateRef.current.noticeTimeoutId) {
        clearTimeout(stateRef.current.noticeTimeoutId);
      }
    };
  }, [initWave, switchAmmo, fireBullet, isTvMode]);

  // Touch Drag handler for Mobile / Tablet / Interactive Whiteboard
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const clientX = touch.clientX - rect.left;
    const canvasX = (clientX / rect.width) * stateRef.current.width;

    stateRef.current.player.x = Math.max(
      10,
      Math.min(stateRef.current.width - stateRef.current.player.width - 10, canvasX - stateRef.current.player.width / 2)
    );
  };

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleTogglePause = () => {
    stateRef.current.isPaused = !stateRef.current.isPaused;
    setIsPaused(stateRef.current.isPaused);
  };

  return (
    <div className="relative w-full min-h-screen bg-slate-950 flex flex-col items-center justify-between p-2 sm:p-4 select-none font-sans overflow-x-hidden">
      {/* TOP HUD BAR (Classroom TV Optimized) */}
      <div className="w-full max-w-4xl bg-slate-900/95 border border-slate-700/80 rounded-2xl p-2.5 sm:p-3 mb-2 flex items-center justify-between shadow-lg text-slate-100">
        {/* Left: Wave & Nickname */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-indigo-600 border border-indigo-400/50 rounded-xl font-['Jua'] font-black text-sm sm:text-base text-yellow-300 shadow">
            WAVE {wave} / 3
          </div>
          <div className="hidden sm:block">
            <span className="text-xs text-slate-400">조종사:</span>{' '}
            <strong className="text-cyan-300 font-bold">{nickname}</strong>
            <span className="text-xs text-slate-500 ml-1">
              ({classCode === 'all' ? '전체' : `${classCode}반`})
            </span>
          </div>
        </div>

        {/* Center: Score & Combo */}
        <div className="flex items-center gap-4 text-center">
          <div>
            <span className="text-[10px] sm:text-xs text-yellow-400 font-bold uppercase tracking-wider block">
              SCORE
            </span>
            <span className="text-xl sm:text-2xl font-black text-yellow-300 font-mono tracking-tight">
              {score.toLocaleString()}
            </span>
          </div>

          <div className="w-px h-8 bg-slate-700" />

          <div>
            <span className="text-[10px] sm:text-xs text-emerald-400 font-bold uppercase tracking-wider block">
              COMBO
            </span>
            <span
              className={`text-xl sm:text-2xl font-black font-mono transition-transform ${
                combo > 0 ? 'text-emerald-400 scale-110' : 'text-slate-500'
              }`}
            >
              x{combo}
            </span>
          </div>
        </div>

        {/* Right: Lives & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hearts */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            {[1, 2, 3].map((idx) => (
              <Heart
                key={idx}
                className={`w-5 h-5 sm:w-6 sm:h-6 transition-all ${
                  idx <= lives
                    ? 'text-rose-500 fill-rose-500 animate-pulse'
                    : 'text-slate-700 fill-slate-800'
                }`}
              />
            ))}
          </div>

          {/* Sound & Pause */}
          <button
            onClick={handleToggleSound}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 cursor-pointer"
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={handleTogglePause}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 cursor-pointer"
            title={isPaused ? '계속하기' : '일시정지'}
          >
            {isPaused ? <Play className="w-4 h-4 text-yellow-400" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* GAME CANVAS CONTAINER */}
      <div className="relative w-full max-w-4xl flex items-center justify-center flex-1">
        <canvas
          ref={canvasRef}
          onTouchMove={handleTouchMove}
          onTouchStart={() => fireBullet()}
          className="w-full max-h-[72vh] aspect-[800/720] rounded-2xl border-2 border-indigo-500/40 shadow-2xl shadow-indigo-950 bg-black cursor-crosshair touch-none"
        />

        {/* 1.5초 정답 경로 & 예방 수칙 팝업 배너 (요구사항: 격파하면 정답 경로와 예방 수칙 한 줄이 1.5초 떠, 교실 TV에서 보이게 크게) */}
        {activePreventionNotice && (
          <div className="absolute top-8 left-4 right-4 sm:left-12 sm:right-12 z-30 animate-bounce transition-all">
            <div
              className="p-4 sm:p-5 rounded-2xl shadow-2xl border-2 backdrop-blur-md flex items-center gap-4"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderColor: ROUTE_CONFIG[activePreventionNotice.route].color,
              }}
            >
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-3xl sm:text-4xl shrink-0 shadow-lg"
                style={{
                  backgroundColor: ROUTE_CONFIG[activePreventionNotice.route].glowColor,
                }}
              >
                {ROUTE_CONFIG[activePreventionNotice.route].icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 text-xs font-black rounded font-['Jua']"
                    style={{
                      backgroundColor: ROUTE_CONFIG[activePreventionNotice.route].color,
                      color: '#0f172a',
                    }}
                  >
                    정답 경로: {ROUTE_CONFIG[activePreventionNotice.route].name}
                  </span>
                  <span className="text-sm font-bold text-slate-200 truncate">
                    [{activePreventionNotice.name}] 격파 성공!
                  </span>
                </div>
                <p className="text-base sm:text-xl font-black text-yellow-300 font-['Jua'] mt-1 tracking-wide">
                  💡 {activePreventionNotice.prevention}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pause Overlay */}
        {isPaused && (
          <div className="absolute inset-0 bg-black/80 rounded-2xl flex flex-col items-center justify-center z-40 text-slate-100">
            <h3 className="text-3xl font-black font-['Jua'] text-yellow-300 mb-2">작전 일시 정지</h3>
            <p className="text-sm text-slate-400 mb-6">호흡을 가다듬고 세균의 전파 경로를 파악하세요.</p>
            <div className="flex gap-3">
              <button
                onClick={handleTogglePause}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl font-['Jua'] cursor-pointer shadow-lg"
              >
                작전 재개
              </button>
              <button
                onClick={onOpenGuide}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl font-['Jua'] cursor-pointer"
              >
                도감 확인
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM CONTROLS & WEAPON SELECTOR (교실 TV 및 태블릿 터치 친화형) */}
      <div className="w-full max-w-4xl mt-2 grid grid-cols-12 gap-2 text-slate-100">
        {/* Weapon 1: Digestive */}
        <button
          onClick={() => switchAmmo('digestive')}
          className={`col-span-3 sm:col-span-3 py-3 sm:py-4 px-2 rounded-2xl font-bold font-['Jua'] transition-all flex flex-col items-center justify-center cursor-pointer border-2 ${
            currentRoute === 'digestive'
              ? 'bg-emerald-950/95 border-emerald-400 text-emerald-300 shadow-xl shadow-emerald-950 ring-2 ring-emerald-400/60 scale-102'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-2xl sm:text-3xl">🍽️</span>
            <span className="text-base sm:text-lg font-black text-emerald-300 tracking-wide">[1] 소화기</span>
          </div>
          <span className="text-xs sm:text-sm font-extrabold text-emerald-200 mt-1 tracking-tight text-center">
            💡 손 씻기·익혀먹기
          </span>
        </button>

        {/* Weapon 2: Respiratory */}
        <button
          onClick={() => switchAmmo('respiratory')}
          className={`col-span-3 sm:col-span-3 py-3 sm:py-4 px-2 rounded-2xl font-bold font-['Jua'] transition-all flex flex-col items-center justify-center cursor-pointer border-2 ${
            currentRoute === 'respiratory'
              ? 'bg-cyan-950/95 border-cyan-400 text-cyan-300 shadow-xl shadow-cyan-950 ring-2 ring-cyan-400/60 scale-102'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-2xl sm:text-3xl">😷</span>
            <span className="text-base sm:text-lg font-black text-cyan-300 tracking-wide">[2] 호흡기</span>
          </div>
          <span className="text-xs sm:text-sm font-extrabold text-cyan-200 mt-1 tracking-tight text-center">
            💡 마스크·기침예절·환기
          </span>
        </button>

        {/* Weapon 3: Skin */}
        <button
          onClick={() => switchAmmo('skin')}
          className={`col-span-3 sm:col-span-3 py-3 sm:py-4 px-2 rounded-2xl font-bold font-['Jua'] transition-all flex flex-col items-center justify-center cursor-pointer border-2 ${
            currentRoute === 'skin'
              ? 'bg-rose-950/95 border-rose-400 text-rose-300 shadow-xl shadow-rose-950 ring-2 ring-rose-400/60 scale-102'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-2xl sm:text-3xl">🖐️</span>
            <span className="text-base sm:text-lg font-black text-rose-300 tracking-wide">[3] 피부</span>
          </div>
          <span className="text-xs sm:text-sm font-extrabold text-rose-200 mt-1 tracking-tight text-center">
            💡 접촉피하기·소독
          </span>
        </button>

        {/* Big Fire Button (Touch & Mobile Friendly) */}
        <button
          onClick={fireBullet}
          className="col-span-3 sm:col-span-3 py-3 sm:py-4 bg-gradient-to-r from-yellow-500 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 font-black font-['Jua'] text-base sm:text-lg md:text-xl rounded-2xl flex items-center justify-center gap-1.5 shadow-xl shadow-yellow-950/80 cursor-pointer border-2 border-yellow-300"
        >
          <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-slate-950" />
          발사 (SPACE)
        </button>
      </div>

      {/* FOOTER QUICK ACTIONS */}
      <div className="w-full max-w-4xl mt-2 flex items-center justify-between text-xs text-slate-400 px-1">
        <div className="flex items-center gap-2">
          <span>🎮 조작: ← → 이동 / 1·2·3 탄 교체</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenGuide}
            className="hover:text-cyan-300 underline cursor-pointer"
          >
            📖 전파 경로 도감
          </button>
          <span>•</span>
          <button
            onClick={onOpenLeaderboard}
            className="hover:text-yellow-300 underline cursor-pointer"
          >
            🏆 리더보드
          </button>
        </div>
      </div>
    </div>
  );
};
