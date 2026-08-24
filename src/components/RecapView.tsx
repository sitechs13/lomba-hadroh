import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  Lock,
  Unlock,
  ShieldCheck,
  Download,
  FileSpreadsheet,
  FileText,
  Sparkles,
  Trophy,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  EventConfig,
  GroupRecapSummary,
  ParticipantGroup,
  ScoreSubmission,
  UserRole,
} from '../types/hadroh';
import { exportOfficialRecapPDF, exportWinnerCertificatePDF } from '../utils/pdfExport';
import { exportOfficialRecapExcel } from '../utils/excelExport';
import { playChimeSound, sendPushNotification } from '../utils/notifications';

interface RecapViewProps {
  eventConfig: EventConfig;
  recapList: GroupRecapSummary[];
  participants: ParticipantGroup[];
  scores: ScoreSubmission[];
  activeRole: UserRole;
  onToggleLockRecap: (isLocked: boolean) => void;
  onOpenExportTab: () => void;
}

export const RecapView: React.FC<RecapViewProps> = ({
  eventConfig,
  recapList,
  participants,
  scores,
  activeRole,
  onToggleLockRecap,
  onOpenExportTab,
}) => {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const handleCelebrateWinners = () => {
    playChimeSound('gong');
    // Launch fireworks confetti
    const duration = 3.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#059669', '#d97706', '#2563eb', '#dc2626', '#facc15'],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#059669', '#d97706', '#2563eb', '#dc2626', '#facc15'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    sendPushNotification(
      'Pengumuman Juara Hadroh!',
      `Hasil Rekapitulasi Lomba Hadroh telah disahkan. Juara 1 diraih oleh: ${recapList[0]?.participant.groupName || '-'}`
    );
  };

  const handleLockClick = () => {
    if (eventConfig.isRecapLocked) {
      if (confirm('Buka kunci rekapitulasi nilai? Dewan juri akan dapat mengubah nilai kembali.')) {
        onToggleLockRecap(false);
      }
    } else {
      if (confirm('Kunci & Sahkan Berita Acara Dewan Juri? Nilai akan dikunci permanen untuk pengumuman juara.')) {
        onToggleLockRecap(true);
        handleCelebrateWinners();
      }
    }
  };

  const totalPossibleJudges = eventConfig.judges.length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Status & Actions */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-indigo-600" />
              Rekapitulasi Nilai & Peringkat Juara
            </h2>
            {eventConfig.isRecapLocked ? (
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Berita Acara Disahkan
              </span>
            ) : (
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ⏳ Rekapitulasi Real-Time
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Total {recapList.length} Kontingen | {totalPossibleJudges} Dewan Juri | Pembobotan: Vokal (35%), Terbang (35%), Adab (15%), Fasohah (15%)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCelebrateWinners}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4" /> Umumkan Juara 🎉
          </button>

          {activeRole === 'admin' && (
            <button
              onClick={handleLockClick}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-colors ${
                eventConfig.isRecapLocked
                  ? 'bg-slate-700 hover:bg-slate-800'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {eventConfig.isRecapLocked ? (
                <>
                  <Unlock className="w-3.5 h-3.5" /> Buka Kunci
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" /> Kunci & Sahkan Nilai
                </>
              )}
            </button>
          )}

          <button
            onClick={() => exportOfficialRecapPDF(eventConfig, recapList, scores)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-xs transition-colors"
            title="Unduh Berita Acara PDF"
          >
            <FileText className="w-3.5 h-3.5 text-red-600" /> PDF Berita Acara
          </button>

          <button
            onClick={() => exportOfficialRecapExcel(eventConfig, recapList, participants, scores)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-xs transition-colors"
            title="Unduh Spreadsheet Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel
          </button>
        </div>
      </div>

      {/* Podium Top 3 Cards Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Juara 2 (Silver) */}
        {recapList[1] && (
          <div className="order-2 md:order-1 bg-gradient-to-b from-slate-100 to-white rounded-2xl p-5 shadow-xs border border-slate-300 text-center flex flex-col justify-between">
            <div>
              <span className="inline-block px-3 py-1 bg-slate-200 text-slate-800 rounded-full text-xs font-black mb-2 shadow-xs">
                🥈 JUARA 2
              </span>
              <h3 className="font-extrabold text-slate-900 text-base">{recapList[1].participant.groupName}</h3>
              <p className="text-xs text-slate-500 truncate">{recapList[1].participant.institution}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200">
              <span className="text-2xl font-black text-slate-700">{recapList[1].finalScore.toFixed(2)}</span>
              <span className="text-[10px] text-slate-400 block">Poin Akhir</span>
              {recapList[1].awardCategory && (
                <span className="text-[11px] text-indigo-700 font-bold block mt-1">
                  {recapList[1].awardCategory}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Juara 1 (Gold) */}
        {recapList[0] && (
          <div className="order-1 md:order-2 bg-gradient-to-b from-amber-50/80 to-white rounded-2xl p-6 shadow-xs border-2 border-amber-400 text-center flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-300/20 rounded-full blur-xl pointer-events-none" />
            <div>
              <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 rounded-full text-xs font-black mb-2 shadow-xs">
                🥇 JUARA 1 (UTAMA)
              </span>
              <h3 className="font-black text-slate-900 text-lg sm:text-xl">
                {recapList[0].participant.groupName}
              </h3>
              <p className="text-xs text-slate-600 font-medium">{recapList[0].participant.institution}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-200">
              <span className="text-3xl font-black text-indigo-600">{recapList[0].finalScore.toFixed(2)}</span>
              <span className="text-[10px] text-slate-500 block">Poin Akhir Terakumulasi</span>
              {recapList[0].awardCategory && (
                <span className="text-xs text-amber-800 font-extrabold block mt-1">
                  {recapList[0].awardCategory}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Juara 3 (Bronze) */}
        {recapList[2] && (
          <div className="order-3 bg-gradient-to-b from-amber-50/40 to-white rounded-2xl p-5 shadow-xs border border-amber-600/30 text-center flex flex-col justify-between">
            <div>
              <span className="inline-block px-3 py-1 bg-amber-700/20 text-amber-900 rounded-full text-xs font-black mb-2 shadow-xs">
                🥉 JUARA 3
              </span>
              <h3 className="font-extrabold text-slate-900 text-base">{recapList[2].participant.groupName}</h3>
              <p className="text-xs text-slate-500 truncate">{recapList[2].participant.institution}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200">
              <span className="text-2xl font-black text-slate-700">{recapList[2].finalScore.toFixed(2)}</span>
              <span className="text-[10px] text-slate-400 block">Poin Akhir</span>
              {recapList[2].awardCategory && (
                <span className="text-[11px] text-indigo-700 font-bold block mt-1">
                  {recapList[2].awardCategory}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Recapitulation Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm sm:text-base">
            Tabel Rekapitulasi Lengkap Nilai Seluruh Kontingen
          </h3>
          <span className="text-xs text-slate-500 italic">
            *Klik baris peserta untuk melihat rincian nilai per juri
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-3 text-center">Rank</th>
                <th className="py-3.5 px-3 text-center">No. Tampil</th>
                <th className="py-3.5 px-4">Nama Grup / Kontingen</th>
                <th className="py-3.5 px-3 text-center">Vokal (35%)</th>
                <th className="py-3.5 px-3 text-center">Terbang (35%)</th>
                <th className="py-3.5 px-3 text-center">Adab (15%)</th>
                <th className="py-3.5 px-3 text-center">Fasohah (15%)</th>
                <th className="py-3.5 px-3 text-center">Penalti</th>
                <th className="py-3.5 px-4 text-center">Skor Akhir</th>
                <th className="py-3.5 px-4">Keterangan Juara</th>
                <th className="py-3.5 px-3 text-center">Sertifikat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recapList.map((item, index) => {
                const isExpanded = expandedRowId === item.participant.id;
                const isRank1 = item.rank === 1 && item.judgeCount > 0;
                const isRank2 = item.rank === 2 && item.judgeCount > 0;
                const isRank3 = item.rank === 3 && item.judgeCount > 0;

                return (
                  <React.Fragment key={item.participant.id}>
                    <tr
                      onClick={() => setExpandedRowId(isExpanded ? null : item.participant.id)}
                      className={`hover:bg-indigo-50/40 cursor-pointer transition-colors ${
                        isRank1
                          ? 'bg-amber-50/60 font-semibold'
                          : isRank2
                          ? 'bg-slate-50/60'
                          : isRank3
                          ? 'bg-amber-50/20'
                          : index % 2 === 0
                          ? 'bg-white'
                          : 'bg-slate-50/40'
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-3 text-center font-bold">
                        {item.judgeCount > 0 ? (
                          isRank1 ? (
                            <span className="inline-block w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs leading-6">
                              1
                            </span>
                          ) : isRank2 ? (
                            <span className="inline-block w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-black text-xs leading-6">
                              2
                            </span>
                          ) : isRank3 ? (
                            <span className="inline-block w-6 h-6 rounded-full bg-amber-700/30 text-amber-900 font-black text-xs leading-6">
                              3
                            </span>
                          ) : (
                            item.rank
                          )
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Number */}
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-600">
                        #{String(item.participant.orderNumber).padStart(2, '0')}
                      </td>

                      {/* Group Name & Institution */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.participant.groupName}</div>
                        <div className="text-[11px] text-slate-500">{item.participant.institution}</div>
                      </td>

                      {/* Category scores */}
                      <td className="py-3.5 px-3 text-center font-medium text-slate-700">
                        {item.averageVokal > 0 ? item.averageVokal.toFixed(2) : '-'}
                      </td>
                      <td className="py-3.5 px-3 text-center font-medium text-slate-700">
                        {item.averageTerbang > 0 ? item.averageTerbang.toFixed(2) : '-'}
                      </td>
                      <td className="py-3.5 px-3 text-center font-medium text-slate-700">
                        {item.averageAdab > 0 ? item.averageAdab.toFixed(2) : '-'}
                      </td>
                      <td className="py-3.5 px-3 text-center font-medium text-slate-700">
                        {item.averageFasohah > 0 ? item.averageFasohah.toFixed(2) : '-'}
                      </td>

                      {/* Penalty */}
                      <td className="py-3.5 px-3 text-center font-medium text-red-600">
                        {item.totalPenalty > 0 ? `-${item.totalPenalty.toFixed(2)}` : '0'}
                      </td>

                      {/* Final Score */}
                      <td className="py-3.5 px-4 text-center font-extrabold text-indigo-600 text-sm sm:text-base">
                        {item.finalScore > 0 ? item.finalScore.toFixed(2) : 'Belum Selesai'}
                      </td>

                      {/* Award & Integrity Status */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 text-xs">
                          {item.awardCategory || (item.allJudgesSubmitted ? 'Peserta' : `Menunggu Juri (${item.judgeCount}/${totalPossibleJudges})`)}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>SHA-256 Valid</span>
                        </div>
                      </td>

                      {/* Certificate Generator */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            exportWinnerCertificatePDF(eventConfig, item);
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Cetak Piagam Penghargaan PDF"
                        >
                          <Award className="w-4 h-4 text-amber-600" />
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Row: Breakdown of every judge score */}
                    {isExpanded && (
                      <tr className="bg-slate-50/90 border-y border-slate-200">
                        <td colSpan={11} className="p-4 sm:p-5">
                          <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Rincian Penilaian Juri untuk: {item.participant.groupName}
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              {eventConfig.judges.map((judge) => {
                                const jScore = item.judgeScores[judge.id];
                                return (
                                  <div
                                    key={judge.id}
                                    className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1"
                                  >
                                    <div className="font-bold text-slate-800 truncate">{judge.name}</div>
                                    <div className="text-[10px] text-slate-500">{judge.roleTitle}</div>
                                    {jScore ? (
                                      <div className="pt-2 border-t border-slate-200 space-y-0.5">
                                        <div className="flex justify-between">
                                          <span>Vokal:</span>
                                          <span className="font-semibold">{jScore.vokalSubtotal}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Terbang:</span>
                                          <span className="font-semibold">{jScore.terbangSubtotal}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Adab:</span>
                                          <span className="font-semibold">{jScore.adabSubtotal}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Fasohah:</span>
                                          <span className="font-semibold">{jScore.fasohahSubtotal}</span>
                                        </div>
                                        <div className="flex justify-between pt-1 border-t font-bold text-emerald-800">
                                          <span>Total:</span>
                                          <span>{jScore.totalScore}</span>
                                        </div>
                                        {jScore.notes && (
                                          <p className="text-[10px] text-slate-500 italic pt-1">
                                            "{jScore.notes}"
                                          </p>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="py-3 text-center text-slate-400 italic text-[11px]">
                                        Belum memasukkan nilai
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
