import React, { useState, useEffect } from 'react';
import { StartScreen } from './components/StartScreen';
import { RetroGameCanvas } from './components/RetroGameCanvas';
import { GameOverModal } from './components/GameOverModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { DiseaseGuideModal } from './components/DiseaseGuideModal';
import { leaderboardService, ProcessedScore } from './services/leaderboard';

type GameScreen = 'start' | 'playing' | 'gameover';

interface GameResultData {
  isVictory: boolean;
  score: number;
  baseScore: number;
  comboBonus: number;
  lifeBonus: number;
  timeBonus: number;
  remainingLives: number;
  waveReached: number;
}

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('start');
  const [nickname, setNickname] = useState<string>('');
  const [classCode, setClassCode] = useState<string>('all');
  const [isTvMode, setIsTvMode] = useState<boolean>(false);

  // Modals
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Game Result
  const [gameResult, setGameResult] = useState<GameResultData | null>(null);
  const [myRank, setMyRank] = useState<ProcessedScore | null>(null);

  // URL Query Parameters Handling (?class=5-1, ?view=leaderboard)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlClass = params.get('class');
      if (urlClass) {
        setClassCode(urlClass);
      }

      const view = params.get('view');
      if (view === 'leaderboard') {
        setIsLeaderboardOpen(true);
      }

      const savedTv = localStorage.getItem('retro_tv_mode');
      if (savedTv === 'true') {
        setIsTvMode(true);
      }

      const savedNick = localStorage.getItem('retro_user_nickname');
      if (savedNick) {
        setNickname(savedNick);
      }
    }
  }, []);

  const handleToggleTvMode = () => {
    setIsTvMode((prev) => {
      const next = !prev;
      localStorage.setItem('retro_tv_mode', String(next));
      return next;
    });
  };

  const handleStartGame = (nick: string, cls: string) => {
    setNickname(nick);
    setClassCode(cls);
    localStorage.setItem('retro_user_nickname', nick);

    // URL 동기화 (사용자가 반을 변경했을 때)
    if (typeof window !== 'undefined' && window.history.replaceState) {
      const url = new URL(window.location.href);
      if (cls && cls !== 'all') {
        url.searchParams.set('class', cls);
      } else {
        url.searchParams.delete('class');
      }
      url.searchParams.delete('view');
      window.history.replaceState({}, '', url.toString());
    }

    setScreen('playing');
  };

  const handleGameOver = async (result: GameResultData) => {
    setGameResult(result);
    setScreen('gameover');

    // 게임 종료 시 점수 자동 저장 (요구사항: 게임이 끝나면 자동 저장)
    if (nickname) {
      await leaderboardService.saveScore(nickname, result.score, classCode);

      // 내 랭킹 갱신
      const { myRank: updatedRank } = leaderboardService.getProcessedLeaderboard(classCode, nickname);
      setMyRank(updatedRank);
    }
  };

  const handleRestart = () => {
    setGameResult(null);
    setScreen('playing');
  };

  const handleGoHome = () => {
    setGameResult(null);
    setScreen('start');
  };

  const handleClassChangeFromLeaderboard = (newClass: string) => {
    setClassCode(newClass);
    if (typeof window !== 'undefined' && window.history.replaceState) {
      const url = new URL(window.location.href);
      if (newClass && newClass !== 'all') {
        url.searchParams.set('class', newClass);
      } else {
        url.searchParams.delete('class');
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-950 font-sans text-slate-100 flex flex-col justify-center">
      {/* 1. START SCREEN */}
      {screen === 'start' && (
        <StartScreen
          initialNickname={nickname}
          initialClass={classCode}
          onStartGame={handleStartGame}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenGuide={() => setIsGuideOpen(true)}
          isTvMode={isTvMode}
          onToggleTvMode={handleToggleTvMode}
        />
      )}

      {/* 2. PLAYING CANVAS */}
      {screen === 'playing' && (
        <RetroGameCanvas
          nickname={nickname}
          classCode={classCode}
          isTvMode={isTvMode}
          onGameOver={handleGameOver}
          onOpenGuide={() => setIsGuideOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        />
      )}

      {/* 3. GAME OVER MODAL */}
      {screen === 'gameover' && gameResult && (
        <GameOverModal
          isVictory={gameResult.isVictory}
          score={gameResult.score}
          baseScore={gameResult.baseScore}
          comboBonus={gameResult.comboBonus}
          lifeBonus={gameResult.lifeBonus}
          timeBonus={gameResult.timeBonus}
          remainingLives={gameResult.remainingLives}
          waveReached={gameResult.waveReached}
          nickname={nickname}
          classCode={classCode}
          myRank={myRank}
          onRestart={handleRestart}
          onGoHome={handleGoHome}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenGuide={() => setIsGuideOpen(true)}
        />
      )}

      {/* 4. MODALS */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => {
          setIsLeaderboardOpen(false);
          // URL 파라미터에서 view=leaderboard 제거
          if (typeof window !== 'undefined' && window.history.replaceState) {
            const url = new URL(window.location.href);
            url.searchParams.delete('view');
            window.history.replaceState({}, '', url.toString());
          }
        }}
        currentNickname={nickname}
        currentClass={classCode}
        onClassChange={handleClassChangeFromLeaderboard}
      />

      <DiseaseGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
