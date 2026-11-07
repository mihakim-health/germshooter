export type InfectionRoute = 'digestive' | 'respiratory' | 'skin';

export interface DiseaseItem {
  id: string;
  name: string;
  route: InfectionRoute;
  prevention: string;
  isSituation?: boolean;
}

export interface Pathogen {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  disease: DiseaseItem;
  speedX: number;
  alive: boolean;
  hp: number;
  maxHp: number;
  isBoss?: boolean;
  bossRoute?: InfectionRoute;
  bossRouteTimer?: number;
  lastShootTime: number;
  shootCooldown: number;
  animFrame: number;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  route: InfectionRoute;
  bounced?: boolean;
}

export interface Spore {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  vy: number;
  scale?: number;
}

export interface GameScoreRecord {
  id: string;
  nickname: string;
  score: number;
  classCode: string;
  createdAt: string;
  waveReached?: number;
}
