import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db, ensureSignedIn, handleFirestoreError, OperationType } from './firebase';
import { GameScoreRecord } from '../types/game';

const COLLECTION_NAME = 'shooterScores';
const LOCAL_STORAGE_CACHE_KEY = 'retro_infection_shooter_scores_cache_v2';

export interface ProcessedScore {
  rank: number;
  nickname: string;
  score: number;
  classCode: string;
  createdAt: string;
  isCurrentUser?: boolean;
}

class LeaderboardService {
  private memoryScores: GameScoreRecord[] = [];
  private listeners: Set<(scores: GameScoreRecord[]) => void> = new Set();
  private unsubscribeSnapshot: (() => void) | null = null;
  private isSubscribed: boolean = false;

  constructor() {
    this.loadLocalCache();
    this.initFirestoreListener();
  }

  private loadLocalCache() {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.memoryScores = parsed;
        }
      }
    } catch {
      // cache read fallback
    }
  }

  private saveLocalCache(scores: GameScoreRecord[]) {
    try {
      localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(scores));
    } catch {
      // cache write fallback
    }
  }

  /**
   * onSnapshot 실시간 구독 초기화
   */
  private initFirestoreListener() {
    if (this.isSubscribed) return;
    this.isSubscribed = true;

    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('score', 'desc'), limit(150));

      this.unsubscribeSnapshot = onSnapshot(
        q,
        (snapshot) => {
          const list: GameScoreRecord[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            let dateStr = new Date().toISOString();
            if (data.createdAt) {
              if (typeof data.createdAt.toDate === 'function') {
                dateStr = data.createdAt.toDate().toISOString();
              } else if (typeof data.createdAt === 'string') {
                dateStr = data.createdAt;
              }
            }

            list.push({
              id: docSnap.id,
              nickname: String(data.nickname || ''),
              score: Number(data.score || 0),
              classCode: String(data.classCode || 'all'),
              createdAt: dateStr,
            });
          });

          this.memoryScores = list;
          this.saveLocalCache(list);
          this.notifyListeners();
        },
        (error) => {
          console.warn('onSnapshot 알림:', error);
          try {
            handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
          } catch {
            // handle error logged per skill
          }
        }
      );
    } catch (e) {
      console.warn('Firestore onSnapshot 리스너 초기화 에러:', e);
    }
  }

  public getAllScores(): GameScoreRecord[] {
    return this.memoryScores;
  }

  /**
   * 점수 저장:
   * 1. 익명 로그인 완료를 기다림 (게임 시작은 막지 않고 점수 저장 시에만 대기)
   * 2. shooterScores 컬렉션에 { nickname, score, classCode, createdAt } 저장
   */
  public async saveScore(nickname: string, score: number, classCode: string): Promise<void> {
    const trimmedNick = nickname.trim();
    const clampedScore = Math.min(100000, Math.max(0, Math.floor(score)));
    const cleanClass = classCode.trim() || 'all';

    // 점수 저장 시 익명 로그인 완료 대기
    try {
      await ensureSignedIn();
    } catch (authErr) {
      console.warn('익명 로그인 대기 중 경고:', authErr);
    }

    try {
      await addDoc(collection(db, COLLECTION_NAME), {
        nickname: trimmedNick,
        score: clampedScore,
        classCode: cleanClass,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('점수 저장 에러:', error);
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
    }
  }

  /**
   * 실시간 변경 알림 구독 (UI 컴포넌트용)
   */
  public subscribe(callback: (scores: GameScoreRecord[]) => void): () => void {
    this.listeners.add(callback);
    callback(this.memoryScores);

    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    const list = [...this.memoryScores];
    this.listeners.forEach((fn) => {
      try {
        fn(list);
      } catch (err) {
        console.error('Leaderboard listener callback error:', err);
      }
    });
  }

  /**
   * 요구사항 적용:
   * 1. 반(classCode) 필터링: 'all'이면 전체 학급, 그 외에는 해당 반
   * 2. 같은 닉네임은 최고 점수 하나만 유지 (Deduplication)
   * 3. 점수 내림차순 정렬 및 TOP 10 반환
   * 4. 내 최고 기록 계산 (10위 밖이면 내 순위 한 줄 제공용)
   */
  public getProcessedLeaderboard(
    classFilter: string = 'all',
    currentNickname: string = ''
  ): {
    top10: ProcessedScore[];
    myRank: ProcessedScore | null;
    totalParticipants: number;
  } {
    const all = this.memoryScores;

    // 1. 반 필터링
    const filtered = all.filter((item) => {
      if (classFilter === 'all') return true;
      return item.classCode === classFilter;
    });

    // 2. 같은 닉네임은 최고 점수 하나만
    const map = new Map<string, GameScoreRecord>();
    for (const record of filtered) {
      const existing = map.get(record.nickname);
      if (!existing || record.score > existing.score) {
        map.set(record.nickname, record);
      }
    }

    // 3. 점수 내림차순 정렬
    const uniqueList = Array.from(map.values()).sort((a, b) => b.score - a.score);

    const processedList: ProcessedScore[] = uniqueList.map((item, idx) => ({
      rank: idx + 1,
      nickname: item.nickname,
      score: item.score,
      classCode: item.classCode,
      createdAt: item.createdAt,
      isCurrentUser: currentNickname ? item.nickname === currentNickname : false,
    }));

    const top10 = processedList.slice(0, 10);
    const myRank = currentNickname ? processedList.find((p) => p.nickname === currentNickname) || null : null;

    return {
      top10,
      myRank,
      totalParticipants: processedList.length,
    };
  }
}

export const leaderboardService = new LeaderboardService();
