import React, { useState, useEffect } from 'react';
import {
  Maximize,
  Minimize,
  Radio,
  Clock,
  Music,
  Award,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import {
  EventConfig,
  GroupRecapSummary,
  ParticipantGroup,
} from '../types/hadroh';

interface LiveBoardViewProps {
  eventConfig: EventConfig;
  recapList: GroupRecapSummary[];
  participants: ParticipantGroup[];
}

export const LiveBoardView: React.FC<LiveBoardViewProps> = ({
  eventConfig,
  recapList,
  participants,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const currentlyPerforming = participants.find((p) => p.status === 'performing');
  const nextGroup = participants.find((p) => p.status === 'waiting');

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-xs">
            📺
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base sm:text-lg text-white">
                Papan Layar Panggung & Proyektor Live
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold animate-pulse flex items-center gap-1">
                <Radio className="w-3 h-3" /> LIVE ON AIR
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Tampilan dirancang khusus resolusi tinggi untuk layar proyektor / LED panggung
            </p>
          </div>
        </div>

        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          <span className="hidden sm:inline">{isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh (F11)'}</span>
        </button>
      </div>

      {/* Hero Board: Current Stage Performer & Next Lineup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Current Stage Act */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-indigo-500/30 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-3.5 py-1 bg-amber-500 text-slate-950 font-black rounded-full text-xs sm:text-sm tracking-wider uppercase shadow-xs flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-slate-950 animate-ping" /> SEDANG TAMPIL DI PANGGUNG
              </span>
              <span className="font-mono text-xs text-indigo-300 font-bold">
                {currentTime.toLocaleTimeString('id-ID')} WIB
              </span>
            </div>

            {currentlyPerforming ? (
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">
                    No. Undian #{String(currentlyPerforming.orderNumber).padStart(2, '0')}
                  </span>
                  <h1 className="text-2xl sm:text-4xl font-black text-amber-300 tracking-tight">
                    {currentlyPerforming.groupName}
                  </h1>
                  <p className="text-sm sm:text-base text-slate-300 font-medium mt-1">
                    📍 {currentlyPerforming.institution}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Lagu Wajib</span>
                    <span className="text-sm font-bold text-indigo-200">🎵 {currentlyPerforming.songMandatory}</span>
                  </div>
                  <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Lagu Pilihan</span>
                    <span className="text-sm font-bold text-amber-200">✨ {currentlyPerforming.songChoice}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <p className="text-lg font-bold text-slate-300">Panggung Sedang Bersiap</p>
                <p className="text-xs text-slate-400 mt-1">Menunggu grup hadroh berikutnya naik panggung</p>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>{eventConfig.eventName}</span>
            <span>Target Durasi: {eventConfig.targetDurationMinutes} Menit</span>
          </div>
        </div>

        {/* Right Column: Next Up Lineup */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-800 mb-4 pb-3 border-b border-slate-100">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-base">Kontingen Bersiap Berikutnya</h3>
            </div>

            {nextGroup ? (
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                <span className="px-2.5 py-0.5 bg-indigo-600 text-white rounded-md text-[10px] font-bold">
                  No. Undian #{String(nextGroup.orderNumber).padStart(2, '0')}
                </span>
                <h4 className="text-lg font-black text-slate-900">{nextGroup.groupName}</h4>
                <p className="text-xs text-slate-600">{nextGroup.institution}</p>
                <div className="text-xs text-slate-700 pt-2 border-t border-indigo-200/50">
                  <p className="font-semibold">🎵 Lagu Wajib: {nextGroup.songMandatory}</p>
                  <p className="font-medium text-slate-600">✨ Lagu Pilihan: {nextGroup.songChoice}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-6">
                Seluruh kontingen telah tampil
              </p>
            )}
          </div>

          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
            <span className="font-bold text-slate-700 block mb-1">📋 Petunjuk Dewan Hakim:</span>
            Pemberian nilai dilakukan langsung secara real-time melalui lembar digital juri masing-masing.
          </div>
        </div>
      </div>

      {/* Live Board Leaderboard Rankings */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="font-black text-lg text-white">
              Papan Skor Peringkat Sementara Lomba Hadroh
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {recapList.filter((r) => r.judgeCount > 0).length} Kontingen Dinilai
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recapList
            .filter((r) => r.judgeCount > 0)
            .map((item) => (
              <div
                key={item.participant.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                  item.rank === 1
                    ? 'bg-gradient-to-r from-amber-950/70 to-slate-900 border-amber-500/60 shadow-xs'
                    : item.rank === 2
                    ? 'bg-slate-800/80 border-slate-600/50'
                    : item.rank === 3
                    ? 'bg-amber-950/30 border-amber-700/40'
                    : 'bg-slate-800/40 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                      item.rank === 1
                        ? 'bg-amber-400 text-slate-950'
                        : item.rank === 2
                        ? 'bg-slate-300 text-slate-950'
                        : item.rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.rank}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">{item.participant.groupName}</h4>
                    <p className="text-[11px] text-slate-400">{item.participant.institution}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black text-amber-300">{item.finalScore.toFixed(2)}</div>
                  {item.awardCategory && (
                    <span className="text-[10px] font-bold text-amber-400 block truncate max-w-[130px]">
                      {item.awardCategory.split('•')[0]}
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
