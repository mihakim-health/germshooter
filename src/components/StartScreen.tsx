import React, { useState, useEffect } from 'react';
import {
  Rocket,
  Trophy,
  BookOpen,
  Volume2,
  VolumeX,
  Shield,
  Utensils,
  Wind,
  Hand,
  CheckCircle2,
  Tv,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface StartScreenProps {
  initialNickname: string;
  initialClass: string;
  onStartGame: (nickname: string, classCode: string) => void;
  onOpenLeaderboard: () => void;
  onOpenGuide: () => void;
  isTvMode: boolean;
  onToggleTvMode: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  initialNickname,
  initialClass,
  onStartGame,
  onOpenLeaderboard,
  onOpenGuide,
  isTvMode,
  onToggleTvMode,
}) => {
  const [nickname, setNickname] = useState(initialNickname || '');
  const [classCode, setClassCode] = useState(initialClass || 'all');
  const [customClass, setCustomClass] = useState('');
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  // 닉네임 실시간 엄격 검증
  useEffect(() => {
    const trimmed = nickname.trim();

    if (!nickname) {
      setValidationError(null);
      setIsValid(false);
      return;
    }

    // 1. 띄어쓰기 체크
    if (/\s/.test(nickname)) {
      setValidationError('❌ 띄어쓰기는 사용할 수 없습니다! 빈칸을 지워주세요.');
      setIsValid(false);
      return;
    }

    // 2. 숫자 체크
    if (/[0-9]/.test(nickname)) {
      setValidationError('❌ 숫자는 사용할 수 없습니다! 한글 또는 영문만 입력해주세요.');
      setIsValid(false);
      return;
    }

    // 3. 특수문자 및 기호 체크
    const koreanOrEnglishOnly = /^[가-힣a-zA-Z]+$/;
    if (!koreanOrEnglishOnly.test(nickname)) {
      setValidationError('❌ 특수문자나 기호는 사용할 수 없습니다! (한글 또는 영문만 허용)');
      setIsValid(false);
      return;
    }

    // 4. 길이 체크 (2~8자)
    if (trimmed.length < 2) {
      setValidationError(`⚠️ 2자 이상 입력해주세요. (현재 ${trimmed.length}자)`);
      setIsValid(false);
      return;
    }

    if (trimmed.length > 8) {
      setValidationError(`⚠️ 최대 8자까지만 가능합니다. (현재 ${trimmed.length}자)`);
      setIsValid(false);
      return;
    }

    // 통과
    setValidationError(null);
    setIsValid(true);
  }, [nickname]);

  const handleSoundToggle = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleStart = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isValid) return;

    const finalClass = classCode === 'custom' ? (customClass.trim() || 'all') : classCode;
    sound.playLaser('digestive');
    onStartGame(nickname.trim(), finalClass);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-950 text-slate-100 overflow-hidden select-none font-sans">
      {/* Background Retro Grid & Nebula */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-black z-0" />
      <div
        className="absolute inset-0 opacity-20 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Floating Retro Germs Background Ornaments */}
      <div className="absolute top-12 left-10 text-4xl opacity-30 animate-bounce duration-1000 pointer-events-none">
        🦠
      </div>
      <div className="absolute top-24 right-14 text-4xl opacity-30 animate-pulse duration-700 pointer-events-none">
        🧫
      </div>
      <div className="absolute bottom-20 left-16 text-3xl opacity-20 pointer-events-none">
        🚀
      </div>

      {/* Top Controls Bar */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={onToggleTvMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            isTvMode
              ? 'bg-amber-500/20 text-amber-300 border-amber-400'
              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
          title="교실 TV/전자칠판 대화면 모드"
        >
          <Tv className="w-4 h-4" />
          <span className="hidden sm:inline">TV 모드</span>
        </button>

        <button
          onClick={handleSoundToggle}
          className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all cursor-pointer"
          title={isMuted ? '음소거 해제' : '음소거'}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
        </button>
      </div>

      {/* Main Content Card */}
      <div className="relative z-10 w-full max-w-xl bg-slate-900/90 border-2 border-indigo-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/80 backdrop-blur-md">
        {/* Title Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/40 rounded-full text-indigo-300 text-xs font-bold mb-3 tracking-wider">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            초등 5학년 보건 교과 연계 레트로 우주 슈팅
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-cyan-300 to-rose-300 font-['Jua'] tracking-wide drop-shadow-md">
            면역 가디언스
          </h1>
          <p className="text-lg sm:text-xl font-bold text-yellow-300 font-['Jua'] mt-1">
            ⚡ 감염병 전파 경로 격파 대작전 ⚡
          </p>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            알맞은 백신 탄으로 세균을 격파하고 예방 수칙을 정복하라!
          </p>
        </div>

        {/* 3대 백신 탄 안내 배너 */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="p-2.5 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-center">
            <span className="text-xl">🍽️</span>
            <div className="text-xs font-bold text-emerald-400 font-['Jua'] mt-0.5">[1] 소화기</div>
            <div className="text-[10px] text-emerald-200 truncate">노로·콜레라·이질</div>
          </div>
          <div className="p-2.5 bg-cyan-950/50 border border-cyan-500/40 rounded-xl text-center">
            <span className="text-xl">😷</span>
            <div className="text-xs font-bold text-cyan-400 font-['Jua'] mt-0.5">[2] 호흡기</div>
            <div className="text-[10px] text-cyan-200 truncate">독감·결핵·홍역</div>
          </div>
          <div className="p-2.5 bg-rose-950/50 border border-rose-500/40 rounded-xl text-center">
            <span className="text-xl">🖐️</span>
            <div className="text-xs font-bold text-rose-400 font-['Jua'] mt-0.5">[3] 피부접촉</div>
            <div className="text-[10px] text-rose-200 truncate">농가진·사마귀·무좀</div>
          </div>
        </div>

        {/* Form: Nickname and Class */}
        <form onSubmit={handleStart} className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>👤 조종사 닉네임 (한글 또는 영문 2~8자)</span>
              {isValid && (
                <span className="text-emerald-400 text-xs flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 사용 가능
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="예: 면역수호자 (숫자·공백 제외)"
                maxLength={10}
                className={`w-full px-4 py-3 bg-slate-950 border-2 rounded-xl text-base sm:text-lg font-bold font-['Jua'] text-white placeholder-slate-500 focus:outline-none transition-all ${
                  validationError
                    ? 'border-red-500 focus:border-red-400 focus:ring-2 focus:ring-red-500/30'
                    : isValid
                    ? 'border-emerald-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30'
                    : 'border-slate-700 focus:border-indigo-500'
                }`}
                autoFocus
              />
            </div>

            {/* 실시간 빨간색 안내 메시지 (요구사항 필수) */}
            {validationError && (
              <p className="mt-1.5 text-xs sm:text-sm font-bold text-red-400 flex items-center gap-1 animate-pulse">
                {validationError}
              </p>
            )}

            {!validationError && !isValid && nickname.length === 0 && (
              <p className="mt-1 text-[11px] text-slate-400">
                * 개인정보(실명, 전화번호 등) 없이 2~8자 닉네임만 입력하세요.
              </p>
            )}
          </div>

          {/* Class Code Selection */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5">
              🏫 소속 학급 구분 (주소 ?class=5-1 자동 연동)
            </label>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {['all', '5-1', '5-2', '5-3'].map((code) => (
                <button
                  type="button"
                  key={code}
                  onClick={() => setClassCode(code)}
                  className={`py-2 px-1 rounded-xl font-bold transition-all cursor-pointer ${
                    classCode === code
                      ? 'bg-indigo-600 text-white border-2 border-indigo-400 shadow-md shadow-indigo-950'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {code === 'all' ? '전체 학급' : `5학년 ${code.replace('5-', '')}반`}
                </button>
              ))}
            </div>
          </div>

          {/* Start Game Button */}
          <button
            type="submit"
            disabled={!isValid}
            className={`w-full py-4 mt-2 rounded-2xl font-black text-lg sm:text-xl font-['Jua'] flex items-center justify-center gap-2 transition-all shadow-xl cursor-pointer ${
              isValid
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 hover:brightness-110 shadow-emerald-500/30 active:scale-98'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-70'
            }`}
          >
            <Rocket className="w-6 h-6 animate-pulse" />
            작전 개시 (출격하기)
          </button>
        </form>

        {/* Secondary Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="py-3 px-4 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-400/50 rounded-xl font-bold font-['Jua'] text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <Trophy className="w-5 h-5 text-yellow-400" />
            🏆 실시간 리더보드 보기
          </button>

          <button
            type="button"
            onClick={onOpenGuide}
            className="py-3 px-4 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold font-['Jua'] text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <BookOpen className="w-5 h-5 text-cyan-400" />
            전파 경로 도감
          </button>
        </div>

        {/* Quick Help Footer */}
        <div className="mt-5 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          <p>
            🎮 <strong>조작법:</strong> 좌우 이동: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-amber-300">←</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-amber-300">→</kbd> / 터치 드래그 • 발사: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-amber-300">Space</kbd> / 터치
          </p>
          <p className="mt-1">
            ⚡ 백신 탄 전환: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-emerald-300">1</kbd> 소화기 • <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-cyan-300">2</kbd> 호흡기 • <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-rose-300">3</kbd> 피부
          </p>
        </div>
      </div>
    </div>
  );
};
