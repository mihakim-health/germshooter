import React, { useState, useEffect } from 'react';
import { Trophy, Medal, X, RefreshCw, Users, Sparkles, AlertCircle } from 'lucide-react';
import { leaderboardService, ProcessedScore } from '../services/leaderboard';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNickname: string;
  currentClass: string;
  onClassChange?: (newClass: string) => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentNickname,
  currentClass,
  onClassChange,
}) => {
  const [activeClass, setActiveClass] = useState<string>(currentClass || 'all');
  const [top10, setTop10] = useState<ProcessedScore[]>([]);
  const [myRank, setMyRank] = useState<ProcessedScore | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    setActiveClass(currentClass || 'all');
  }, [currentClass]);

  // 실시간 구독
  useEffect(() => {
    if (!isOpen) return;

    const refreshData = () => {
      const { top10: newTop10, myRank: newMyRank, totalParticipants } =
        leaderboardService.getProcessedLeaderboard(activeClass, currentNickname);
      setTop10(newTop10);
      setMyRank(newMyRank);
      setTotalCount(totalParticipants);
    };

    refreshData();
    const unsubscribe = leaderboardService.subscribe(() => {
      refreshData();
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, activeClass, currentNickname]);

  if (!isOpen) return null;

  const handleSelectClass = (cls: string) => {
    setActiveClass(cls);
    if (onClassChange) {
      onClassChange(cls);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-400 font-extrabold rounded-lg text-sm shadow-md shadow-amber-500/20">
          <span className="text-lg">🥇</span> 1위
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-300/20 text-slate-200 border border-slate-300 font-extrabold rounded-lg text-sm">
          <span className="text-lg">🥈</span> 2위
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-700/20 text-amber-500 border border-amber-600 font-extrabold rounded-lg text-sm">
          <span className="text-lg">🥉</span> 3위
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 bg-slate-800 text-slate-400 font-bold rounded text-xs border border-slate-700">
        {rank}위
      </span>
    );
  };

  const isMyRankOutsideTop10 = myRank && myRank.rank > 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-slate-900 border-2 border-yellow-500/70 rounded-2xl shadow-2xl shadow-yellow-950/70 overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-800/90 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-500/20 border border-yellow-400/50 rounded-xl text-yellow-400 shadow-inner">
              <Trophy className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-yellow-300 font-['Jua'] tracking-wide">
                  🏆 감염병 격파 실시간 명예의 전당 TOP 10
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] bg-red-600/30 border border-red-500/40 text-red-300 font-bold rounded-full">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                동일 닉네임 최고 점수 반영 • 교실 실시간 동기화
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/80 rounded-xl transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Class Selection Tabs */}
        <div className="px-5 py-3 bg-slate-950/70 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs scrollbar-thin">
          <span className="text-slate-400 font-semibold shrink-0 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> 학급 필터:
          </span>
          {['all', '5-1', '5-2', '5-3', '5-4'].map((code) => {
            const label = code === 'all' ? '전체 학급' : `5학년 ${code.replace('5-', '')}반`;
            const isSelected = activeClass === code;
            return (
              <button
                key={code}
                onClick={() => handleSelectClass(code)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Notice Banner */}
        <div className="px-5 py-2 bg-indigo-950/40 border-b border-indigo-800/30 flex items-center justify-between text-xs text-indigo-300">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            현재 학급 등록 인원: <strong>{totalCount}명</strong>
          </span>
          {currentNickname && (
            <span className="text-slate-400">
              내 닉네임: <strong className="text-cyan-300 font-semibold">{currentNickname}</strong>
            </span>
          )}
        </div>

        {/* Top 10 Table */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2 flex-1">
          {top10.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <AlertCircle className="w-10 h-10 mx-auto text-slate-500 mb-2" />
              <p>아직 등록된 기록이 없습니다.</p>
              <p className="text-xs text-slate-500 mt-1">지금 바로 출격하여 1위에 도전해보세요!</p>
            </div>
          ) : (
            top10.map((record) => {
              const isMe = currentNickname && record.nickname === currentNickname;
              return (
                <div
                  key={`${record.nickname}-${record.rank}`}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isMe
                      ? 'bg-cyan-950/60 border-cyan-400 shadow-md shadow-cyan-900/50 ring-1 ring-cyan-400/50'
                      : record.rank === 1
                      ? 'bg-amber-950/30 border-amber-500/50 shadow-sm'
                      : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-16 shrink-0">{getRankBadge(record.rank)}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-slate-100 font-['Jua'] tracking-wide">
                          {record.nickname}
                        </span>
                        {isMe && (
                          <span className="px-1.5 py-0.2 text-[10px] bg-cyan-500 text-slate-950 font-black rounded">
                            나
                          </span>
                        )}
                        <span className="text-[11px] px-1.5 py-0.5 bg-slate-700/60 text-slate-400 rounded">
                          {record.classCode === 'all' ? '전체' : `${record.classCode}반`}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(record.createdAt).toLocaleDateString()} {new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-lg sm:text-xl font-black text-yellow-300 font-mono tracking-tight">
                      {record.score.toLocaleString()}
                    </span>
                    <span className="text-xs text-yellow-500/90 ml-1">점</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 10위 밖 내 순위 표시 (요구사항: 10위 밖이면 내 순위 한 줄만) */}
        {isMyRankOutsideTop10 && myRank && (
          <div className="px-5 py-3 bg-cyan-950/80 border-t-2 border-cyan-500 flex items-center justify-between text-sm shadow-inner">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-cyan-500 text-slate-950 font-black text-xs rounded">
                내 순위
              </span>
              <span className="font-bold text-cyan-200">
                {myRank.rank}위 ({myRank.nickname})
              </span>
            </div>
            <div className="text-right font-mono font-bold text-cyan-300 text-base">
              {myRank.score.toLocaleString()}점
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-800/90 border-t border-slate-700 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            * 주소창 <code className="text-amber-300 font-mono">?class=5-1</code>로 반 전용 리더보드 링크 공유 가능
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black rounded-xl transition-all shadow-md shadow-yellow-600/40 cursor-pointer font-['Jua'] text-sm"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
