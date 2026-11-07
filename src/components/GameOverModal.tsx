import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, BookOpen, Heart, Clock, Award, ShieldAlert } from 'lucide-react';
import { ProcessedScore } from '../services/leaderboard';

interface GameOverModalProps {
  isVictory: boolean;
  score: number;
  baseScore: number;
  comboBonus: number;
  lifeBonus: number;
  timeBonus: number;
  remainingLives: number;
  waveReached: number;
  nickname: string;
  classCode: string;
  myRank: ProcessedScore | null;
  onRestart: () => void;
  onGoHome: () => void;
  onOpenLeaderboard: () => void;
  onOpenGuide: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isVictory,
  score,
  baseScore,
  comboBonus,
  lifeBonus,
  timeBonus,
  remainingLives,
  waveReached,
  nickname,
  classCode,
  myRank,
  onRestart,
  onGoHome,
  onOpenLeaderboard,
  onOpenGuide,
}) => {
  useEffect(() => {
    if (isVictory) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }
  }, [isVictory]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none font-sans">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden text-slate-100 flex flex-col items-center text-center">
        {/* Glow border according to victory / defeat */}
        <div
          className={`absolute inset-0 pointer-events-none opacity-20 ${
            isVictory ? 'bg-gradient-to-b from-yellow-500 to-transparent' : 'bg-gradient-to-b from-red-600 to-transparent'
          }`}
        />

        {/* Top Badge Icon */}
        <div
          className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-3 shadow-xl ${
            isVictory
              ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-400 animate-bounce'
              : 'bg-red-500/20 text-red-400 border-2 border-red-500'
          }`}
        >
          {isVictory ? <Award className="w-12 h-12" /> : <ShieldAlert className="w-12 h-12" />}
        </div>

        {/* Title */}
        <h2
          className={`text-2xl sm:text-3xl font-black font-['Jua'] tracking-wide mb-1 ${
            isVictory ? 'text-yellow-300' : 'text-red-400'
          }`}
        >
          {isVictory ? '🎉 감염병 전파 경로 완전 격파 성공!' : '⚠️ 면역 방어선 침투 (게임 종료)'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mb-4">
          {isVictory
            ? '최종 변종 세균 보스를 물리치고 학교를 지켜냈습니다!'
            : `웨이브 ${waveReached}단계에서 방어선이 무너졌습니다. 다시 도전해보세요!`}
        </p>

        {/* Total Score Box */}
        <div className="w-full bg-slate-950/80 border-2 border-yellow-500/50 rounded-2xl p-4 mb-4 shadow-inner">
          <span className="text-xs text-yellow-400/80 font-bold uppercase tracking-wider block">
            최종 격파 점수
          </span>
          <div className="text-4xl sm:text-5xl font-black text-yellow-300 font-mono tracking-tight my-1 drop-shadow">
            {score.toLocaleString()}
            <span className="text-base text-yellow-500 ml-1">점</span>
          </div>

          {/* Leaderboard Rank notification */}
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs px-2">
            <span className="text-slate-400">
              조종사: <strong className="text-cyan-300">{nickname}</strong> ({classCode === 'all' ? '전체' : `${classCode}반`})
            </span>
            <span className="text-yellow-400 font-bold">
              {myRank ? (
                <>🏆 현재 학급 순위: <strong>{myRank.rank}위</strong></>
              ) : (
                '🏆 점수 자동 기록 완료'
              )}
            </span>
          </div>
        </div>

        {/* Score Breakdown (동점 방지 투명 공개) */}
        <div className="w-full bg-slate-800/50 rounded-xl p-3 mb-5 text-xs text-slate-300 space-y-1.5 border border-slate-700/50">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">세균 격파 기본 점수:</span>
            <span className="font-mono font-bold text-slate-200">{baseScore.toLocaleString()}점</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">연속 격파 콤보 보너스:</span>
            <span className="font-mono font-bold text-emerald-400">+{comboBonus.toLocaleString()}점</span>
          </div>
          {isVictory && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" /> 잔여 생명 보너스 ({remainingLives}개):
                </span>
                <span className="font-mono font-bold text-rose-300">+{lifeBonus.toLocaleString()}점</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> 신속 클리어 시간 보너스:
                </span>
                <span className="font-mono font-bold text-cyan-300">+{timeBonus.toLocaleString()}점</span>
              </div>
            </>
          )}
        </div>

        {/* Primary Action Buttons */}
        <div className="w-full space-y-2.5">
          <button
            onClick={onRestart}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:brightness-110 text-slate-950 font-black font-['Jua'] text-lg rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 cursor-pointer transition-all active:scale-98"
          >
            <RotateCcw className="w-5 h-5" />
            다시 출격하기 (재도전)
          </button>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onOpenLeaderboard}
              className="py-2.5 px-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-400/40 rounded-xl font-bold font-['Jua'] text-xs sm:text-sm flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-yellow-400" />
              리더보드
            </button>

            <button
              onClick={onOpenGuide}
              className="py-2.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl font-bold font-['Jua'] text-xs sm:text-sm flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              오답 복습
            </button>

            <button
              onClick={onGoHome}
              className="py-2.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl font-bold font-['Jua'] text-xs sm:text-sm flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4 text-slate-400" />
              첫 화면
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
