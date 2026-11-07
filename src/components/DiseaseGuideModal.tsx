import React from 'react';
import { X, ShieldCheck, Utensils, Wind, Hand, Sparkles } from 'lucide-react';
import { ROUTE_CONFIG, DISEASES_DATABASE } from '../data/diseases';

interface DiseaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiseaseGuideModal: React.FC<DiseaseGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const digestiveItems = DISEASES_DATABASE.filter((d) => d.route === 'digestive');
  const respiratoryItems = DISEASES_DATABASE.filter((d) => d.route === 'respiratory');
  const skinItems = DISEASES_DATABASE.filter((d) => d.route === 'skin');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-900 border-2 border-emerald-500/60 rounded-2xl shadow-2xl shadow-emerald-950/80 overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 border border-emerald-400/40 rounded-lg text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-wide text-emerald-300 font-['Jua']">
                📖 감염병 전파 경로 & 백신 대응 매뉴얼
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                초등 5학년 보건 교육 필수 3대 감염 경로와 예방 수칙
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Guide tip */}
          <div className="p-4 bg-indigo-950/50 border border-indigo-700/50 rounded-xl flex items-start gap-3 text-indigo-200">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed">
              <strong>게임 공략 팁:</strong> 다가오는 세균에 표시된 이름이나 상황을 보고,
              그 감염병이 전파되는 경로와 일치하는 백신 탄(1번 소화기 / 2번 호흡기 / 3번 피부)으로
              정확히 맞혀야 격파할 수 있습니다!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. 소화기계 */}
            <div className="flex flex-col bg-slate-800/80 border-2 border-emerald-500/50 rounded-xl p-4 shadow-lg shadow-emerald-950/40">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-emerald-500/30">
                <span className="text-2xl">🍽️</span>
                <div>
                  <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded-full">
                    [1]번 탄
                  </span>
                  <h3 className="text-lg font-bold text-emerald-400 font-['Jua']">
                    {ROUTE_CONFIG.digestive.name}
                  </h3>
                </div>
              </div>

              <div className="mb-3 p-2.5 bg-emerald-950/40 border border-emerald-600/40 rounded-lg text-emerald-200 text-xs font-medium">
                💡 <strong>예방 수칙:</strong>
                <p className="mt-1 text-slate-200 font-bold">
                  {ROUTE_CONFIG.digestive.preventionSummary}
                </p>
              </div>

              <div className="flex-1 space-y-1.5">
                <span className="text-xs text-slate-400 font-semibold">출현 감염병 & 상황:</span>
                <ul className="space-y-1">
                  {digestiveItems.map((item) => (
                    <li
                      key={item.id}
                      className="text-xs px-2.5 py-1.5 bg-slate-900/60 rounded border border-slate-700/50 flex items-center justify-between"
                    >
                      <span className={item.isSituation ? 'text-amber-300' : 'text-slate-100 font-medium'}>
                        {item.name}
                      </span>
                      {item.isSituation && (
                        <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1 py-0.2 rounded border border-amber-600/40">
                          상황
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 2. 호흡기계 */}
            <div className="flex flex-col bg-slate-800/80 border-2 border-cyan-500/50 rounded-xl p-4 shadow-lg shadow-cyan-950/40">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-cyan-500/30">
                <span className="text-2xl">😷</span>
                <div>
                  <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-300 font-bold rounded-full">
                    [2]번 탄
                  </span>
                  <h3 className="text-lg font-bold text-cyan-400 font-['Jua']">
                    {ROUTE_CONFIG.respiratory.name}
                  </h3>
                </div>
              </div>

              <div className="mb-3 p-2.5 bg-cyan-950/40 border border-cyan-600/40 rounded-lg text-cyan-200 text-xs font-medium">
                💡 <strong>예방 수칙:</strong>
                <p className="mt-1 text-slate-200 font-bold">
                  {ROUTE_CONFIG.respiratory.preventionSummary}
                </p>
              </div>

              <div className="flex-1 space-y-1.5">
                <span className="text-xs text-slate-400 font-semibold">출현 감염병 & 상황:</span>
                <ul className="space-y-1">
                  {respiratoryItems.map((item) => (
                    <li
                      key={item.id}
                      className="text-xs px-2.5 py-1.5 bg-slate-900/60 rounded border border-slate-700/50 flex items-center justify-between"
                    >
                      <span className={item.isSituation ? 'text-amber-300' : 'text-slate-100 font-medium'}>
                        {item.name}
                      </span>
                      {item.isSituation && (
                        <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1 py-0.2 rounded border border-amber-600/40">
                          상황
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 3. 피부 */}
            <div className="flex flex-col bg-slate-800/80 border-2 border-rose-500/50 rounded-xl p-4 shadow-lg shadow-rose-950/40">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-rose-500/30">
                <span className="text-2xl">🖐️</span>
                <div>
                  <span className="text-xs px-2 py-0.5 bg-rose-500/20 text-rose-300 font-bold rounded-full">
                    [3]번 탄
                  </span>
                  <h3 className="text-lg font-bold text-rose-400 font-['Jua']">
                    {ROUTE_CONFIG.skin.name}
                  </h3>
                </div>
              </div>

              <div className="mb-3 p-2.5 bg-rose-950/40 border border-rose-600/40 rounded-lg text-rose-200 text-xs font-medium">
                💡 <strong>예방 수칙:</strong>
                <p className="mt-1 text-slate-200 font-bold">
                  {ROUTE_CONFIG.skin.preventionSummary}
                </p>
              </div>

              <div className="flex-1 space-y-1.5">
                <span className="text-xs text-slate-400 font-semibold">출현 감염병 & 상황:</span>
                <ul className="space-y-1">
                  {skinItems.map((item) => (
                    <li
                      key={item.id}
                      className="text-xs px-2.5 py-1.5 bg-slate-900/60 rounded border border-slate-700/50 flex items-center justify-between"
                    >
                      <span className={item.isSituation ? 'text-amber-300' : 'text-slate-100 font-medium'}>
                        {item.name}
                      </span>
                      {item.isSituation && (
                        <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1 py-0.2 rounded border border-amber-600/40">
                          상황
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-800/90 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/50 cursor-pointer font-['Jua'] text-base tracking-wide"
          >
            확인 및 게임으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};
