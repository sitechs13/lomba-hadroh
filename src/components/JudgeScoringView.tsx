import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  ShieldCheck,
  Save,
  CheckCircle,
  AlertTriangle,
  FileSignature,
  Eraser,
  Lock,
  ChevronRight,
  Music,
  FileText,
  Volume2,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  EventConfig,
  JudgeProfile,
  ParticipantGroup,
  ScoreSubmission,
  JudgeScoreItem,
} from '../types/hadroh';
import { generateScoreIntegrityHash } from '../utils/crypto';
import { playChimeSound, sendPushNotification } from '../utils/notifications';

interface JudgeScoringViewProps {
  eventConfig: EventConfig;
  currentJudge: JudgeProfile;
  participants: ParticipantGroup[];
  scores: ScoreSubmission[];
  onSaveScore: (score: ScoreSubmission) => void;
  onUpdateParticipantStatus: (participantId: string, status: ParticipantGroup['status'], durationSec?: number) => void;
}

export const JudgeScoringView: React.FC<JudgeScoringViewProps> = ({
  eventConfig,
  currentJudge,
  participants,
  scores,
  onSaveScore,
  onUpdateParticipantStatus,
}) => {
  // Selected participant
  const [selectedPartId, setSelectedPartId] = useState<string>(participants[0]?.id || '');
  const activeParticipant = participants.find((p) => p.id === selectedPartId) || participants[0];

  // Stopwatch state
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerRef = useRef<any>(null);

  // Criteria scores state (criterionId -> score)
  const [itemScores, setItemScores] = useState<Record<string, number>>({});
  const [penalty, setPenalty] = useState<number>(0);
  const [penaltyReason, setPenaltyReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);

  // Digital Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Existing score for this participant & judge
  const existingScore = scores.find(
    (s) => s.participantId === activeParticipant?.id && s.judgeId === currentJudge.id
  );

  // Synchronize when changing active participant or judge
  useEffect(() => {
    if (existingScore) {
      const initialMap: Record<string, number> = {};
      existingScore.criteriaScores.forEach((c) => {
        initialMap[c.criterionId] = c.score;
      });
      setItemScores(initialMap);
      setPenalty(existingScore.penaltyDeduction || 0);
      setPenaltyReason(existingScore.penaltyReason || '');
      setNotes(existingScore.notes || '');
      setHasSignature(!!existingScore.signatureData);
    } else {
      // Default scores (approx 80% of maxScore as reasonable starting baseline)
      const defaultMap: Record<string, number> = {};
      eventConfig.criteria.forEach((crit) => {
        defaultMap[crit.id] = Math.round(crit.maxScore * 0.85);
      });
      setItemScores(defaultMap);
      setPenalty(0);
      setPenaltyReason('');
      setNotes('');
      setHasSignature(false);
      clearSignature();
    }

    if (activeParticipant?.performanceDurationSec && activeParticipant.performanceDurationSec > 0) {
      setTimerSeconds(activeParticipant.performanceDurationSec);
    } else {
      setTimerSeconds(0);
    }
    setIsTimerRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [activeParticipant?.id, currentJudge.id]);

  // Stopwatch interval effect
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          const next = prev + 1;
          // Target warning (e.g. at target duration)
          const targetSec = eventConfig.targetDurationMinutes * 60;
          if (next === targetSec) {
            playChimeSound('warning');
          } else if (next === targetSec + eventConfig.maxOvertimeGraceSec) {
            playChimeSound('alert');
          }
          return next;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, eventConfig.targetDurationMinutes, eventConfig.maxOvertimeGraceSec]);

  // Timer helper
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartTimer = () => {
    setIsTimerRunning(true);
    if (activeParticipant) {
      onUpdateParticipantStatus(activeParticipant.id, 'performing');
    }
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
    if (activeParticipant) {
      onUpdateParticipantStatus(activeParticipant.id, 'performing', timerSeconds);
    }
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
    if (activeParticipant) {
      onUpdateParticipantStatus(activeParticipant.id, 'waiting', 0);
    }
  };

  // Score adjustments
  const handleScoreChange = (criterionId: string, value: number, max: number) => {
    const clamped = Math.max(0, Math.min(max, value));
    setItemScores((prev) => ({ ...prev, [criterionId]: clamped }));
  };

  // Grouped Subtotals
  const vokalCrit = eventConfig.criteria.filter((c) => c.categoryKey === 'vokal');
  const terbangCrit = eventConfig.criteria.filter((c) => c.categoryKey === 'terbang');
  const adabCrit = eventConfig.criteria.filter((c) => c.categoryKey === 'adab');
  const fasohahCrit = eventConfig.criteria.filter((c) => c.categoryKey === 'fasohah');

  const calcSubtotal = (critList: typeof eventConfig.criteria) => {
    return critList.reduce((sum, c) => sum + (itemScores[c.id] || 0), 0);
  };

  const vokalSubtotal = calcSubtotal(vokalCrit);
  const terbangSubtotal = calcSubtotal(terbangCrit);
  const adabSubtotal = calcSubtotal(adabCrit);
  const fasohahSubtotal = calcSubtotal(fasohahCrit);

  // Total raw score with weights calculation
  const totalScoreRaw = vokalSubtotal * 0.35 + terbangSubtotal * 0.35 + adabSubtotal * 0.15 + fasohahSubtotal * 0.15;
  const netTotalScore = Math.max(0, Math.round((totalScoreRaw - penalty) * 100) / 100);

  // Signature canvas handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.strokeStyle = '#0f4c3a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Submit and lock score
  const handleSubmitScore = async () => {
    if (!activeParticipant) return;

    if (eventConfig.isRecapLocked) {
      alert('Rekapitulasi telah dikunci oleh Panitia. Penilaian tidak dapat diubah!');
      return;
    }

    const criteriaScoresList: JudgeScoreItem[] = eventConfig.criteria.map((c) => ({
      criterionId: c.id,
      criterionName: c.name,
      score: itemScores[c.id] || 0,
    }));

    const submittedAt = new Date().toISOString();

    // Get Signature data
    let signatureData = '';
    if (canvasRef.current && hasSignature) {
      signatureData = canvasRef.current.toDataURL();
    }

    // Generate SHA-256 integrity hash for anti-tamper security
    const dataHash = await generateScoreIntegrityHash({
      participantId: activeParticipant.id,
      judgeId: currentJudge.id,
      totalScore: netTotalScore,
      vokalSubtotal,
      terbangSubtotal,
      adabSubtotal,
      fasohahSubtotal,
      submittedAt,
    });

    const newSubmission: ScoreSubmission = {
      id: existingScore?.id || `score-${activeParticipant.id}-${currentJudge.id}`,
      participantId: activeParticipant.id,
      judgeId: currentJudge.id,
      judgeName: currentJudge.name,
      criteriaScores: criteriaScoresList,
      vokalSubtotal,
      terbangSubtotal,
      adabSubtotal,
      fasohahSubtotal,
      penaltyDeduction: penalty,
      penaltyReason,
      totalScore: netTotalScore,
      notes,
      submittedAt,
      isLocked: true,
      signatureData,
      dataHash,
      syncStatus: navigator.onLine ? 'synced' : 'offline_queued',
    };

    onSaveScore(newSubmission);
    onUpdateParticipantStatus(activeParticipant.id, 'finished', timerSeconds || activeParticipant.performanceDurationSec);

    playChimeSound('success');
    sendPushNotification(
      'Nilai Berhasil Masuk!',
      `${currentJudge.name} telah mengirimkan nilai untuk ${activeParticipant.groupName} (Skor: ${netTotalScore})`
    );

    setIsSubmittedSuccess(true);
    setTimeout(() => setIsSubmittedSuccess(false), 3000);
  };

  const targetSec = eventConfig.targetDurationMinutes * 60;
  const isOvertime = timerSeconds > targetSec;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card: Active Judge & Contestant Selector */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Judge Info Badge */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
              ⚖️
            </div>
            <div>
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                {currentJudge.roleTitle}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 mt-0.5">{currentJudge.name}</h2>
              <p className="text-xs text-slate-500">
                Spesialisasi:{' '}
                <span className="font-semibold text-slate-700 capitalize">{currentJudge.specialty}</span> | Kode PIN: ****
              </p>
            </div>
          </div>

          {/* Participant Selector */}
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Pilih Kontingen / Grup Yang Dinilai:
            </label>
            <div className="relative">
              <select
                value={activeParticipant?.id || ''}
                onChange={(e) => setSelectedPartId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
              >
                {participants.map((p) => {
                  const hasScored = scores.some((s) => s.participantId === p.id && s.judgeId === currentJudge.id);
                  return (
                    <option key={p.id} value={p.id}>
                      #{String(p.orderNumber).padStart(2, '0')} - {p.groupName} ({p.institution}){' '}
                      {hasScored ? '✅ [Telah Dinilai]' : '⏳ [Belum]'}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Selected Group Quick Glance Bar */}
        {activeParticipant && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Lagu Wajib</span>
              <span className="font-bold text-indigo-900 truncate block">🎵 {activeParticipant.songMandatory}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Lagu Pilihan</span>
              <span className="font-bold text-slate-800 truncate block">✨ {activeParticipant.songChoice}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Vokalis & Penabuh</span>
              <span className="font-medium text-slate-700 truncate block">
                🎤 {activeParticipant.leadVocalist} / 🥁 {activeParticipant.leadDrummer}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Berkas Terlampir</span>
                <span className="font-bold text-slate-800">
                  📁 {activeParticipant.attachedFiles.length} Berkas
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeParticipant.status === 'finished'
                    ? 'bg-emerald-100 text-emerald-800'
                    : activeParticipant.status === 'performing'
                    ? 'bg-amber-100 text-amber-800 animate-pulse'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {activeParticipant.status.toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Scoring Grid: Left is Scoring Rubric, Right is Timer & Live Score Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Rubric & Scoring Sliders */}
        <div className="lg:col-span-8 space-y-5">
          {/* Section 1: Bidang Vokal & Aransemen Lagu (35%) */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">🎤</span>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                    1. Bidang Vokal & Aransemen Lagu
                  </h3>
                  <p className="text-xs text-slate-500">Bobot Penilaian: 35% dari total nilai</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Subtotal</span>
                <span className="text-base font-bold text-indigo-600">{vokalSubtotal} / 100</span>
              </div>
            </div>

            <div className="space-y-4">
              {vokalCrit.map((crit) => (
                <div key={crit.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800">{crit.name}</h4>
                      <p className="text-[11px] text-slate-500">{crit.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5 pl-3">
                      <input
                        type="number"
                        min="0"
                        max={crit.maxScore}
                        value={itemScores[crit.id] || 0}
                        onChange={(e) => handleScoreChange(crit.id, parseInt(e.target.value) || 0, crit.maxScore)}
                        className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <span className="text-xs text-slate-400 font-medium">/{crit.maxScore}</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={crit.maxScore}
                    value={itemScores[crit.id] || 0}
                    onChange={(e) => handleScoreChange(crit.id, parseInt(e.target.value), crit.maxScore)}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Bidang Pukulan Terbang & Musik (35%) */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">🥁</span>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                    2. Bidang Pukulan & Variasi Terbang
                  </h3>
                  <p className="text-xs text-slate-500">Bobot Penilaian: 35% dari total nilai</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Subtotal</span>
                <span className="text-base font-bold text-indigo-600">{terbangSubtotal} / 100</span>
              </div>
            </div>

            <div className="space-y-4">
              {terbangCrit.map((crit) => (
                <div key={crit.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800">{crit.name}</h4>
                      <p className="text-[11px] text-slate-500">{crit.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5 pl-3">
                      <input
                        type="number"
                        min="0"
                        max={crit.maxScore}
                        value={itemScores[crit.id] || 0}
                        onChange={(e) => handleScoreChange(crit.id, parseInt(e.target.value) || 0, crit.maxScore)}
                        className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <span className="text-xs text-slate-400 font-medium">/{crit.maxScore}</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={crit.maxScore}
                    value={itemScores[crit.id] || 0}
                    onChange={(e) => handleScoreChange(crit.id, parseInt(e.target.value), crit.maxScore)}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Bidang Adab & Penampilan (15%) */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">👔</span>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                    3. Bidang Adab & Penampilan
                  </h3>
                  <p className="text-xs text-slate-500">Bobot Penilaian: 15% dari total nilai</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Subtotal</span>
                <span className="text-base font-bold text-indigo-600">{adabSubtotal} / 100</span>
              </div>
            </div>

            <div className="space-y-4">
              {adabCrit.map((crit) => (
                <div key={crit.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800">{crit.name}</h4>
                      <p className="text-[11px] text-slate-500">{crit.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5 pl-3">
                      <input
                        type="number"
                        min="0"
                        max={crit.maxScore}
                        value={itemScores[crit.id] || 0}
                        onChange={(e) => handleScoreChange(crit.id, parseInt(e.target.value) || 0, crit.maxScore)}
                        className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <span className="text-xs text-slate-400 font-medium">/{crit.maxScore}</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={crit.maxScore}
                    value={itemScores[crit.id] || 0}
                    onChange={(e) => handleScoreChange(crit.id, parseInt(e.target.value), crit.maxScore)}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Bidang Fasohah & Syair (15%) */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-purple-50 text-purple-700 rounded-lg">📖</span>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                    4. Bidang Fasohah & Syair Sholawat
                  </h3>
                  <p className="text-xs text-slate-500">Bobot Penilaian: 15% dari total nilai</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Subtotal</span>
                <span className="text-base font-bold text-indigo-600">{fasohahSubtotal} / 100</span>
              </div>
            </div>

            <div className="space-y-4">
              {fasohahCrit.map((crit) => (
                <div key={crit.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800">{crit.name}</h4>
                      <p className="text-[11px] text-slate-500">{crit.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5 pl-3">
                      <input
                        type="number"
                        min="0"
                        max={crit.maxScore}
                        value={itemScores[crit.id] || 0}
                        onChange={(e) => handleScoreChange(crit.id, parseInt(e.target.value) || 0, crit.maxScore)}
                        className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <span className="text-xs text-slate-400 font-medium">/{crit.maxScore}</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={crit.maxScore}
                    value={itemScores[crit.id] || 0}
                    onChange={(e) => handleScoreChange(crit.id, parseInt(e.target.value), crit.maxScore)}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Pengurangan Nilai / Penalti & Catatan Evaluasi */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Potongan Poin Penalti & Catatan Evaluasi Juri
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Poin Pengurangan (Minus)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="0.5"
                  value={penalty}
                  onChange={(e) => setPenalty(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-red-300 bg-red-50/40 text-sm font-bold text-red-700 focus:ring-2 focus:ring-red-500"
                  placeholder="0.0"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Alasan Penalti / Pelanggaran
                </label>
                <input
                  type="text"
                  value={penaltyReason}
                  onChange={(e) => setPenaltyReason(e.target.value)}
                  placeholder="Misal: Melebihi durasi waktu 45 detik, busana tidak lengkap"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Catatan & Saran Evaluasi untuk Kontingen
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Berikan masukan konstruktif untuk pembinaan grup hadroh..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Stopwatch, Total Calculation, E-Signature, and Submit */}
        <div className="lg:col-span-4 space-y-5">
          {/* Integrated Stopwatch & Stage Timer */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Pengukur Waktu Tampil
              </span>
              <span className="text-[11px] text-slate-400">Target: {eventConfig.targetDurationMinutes} Menit</span>
            </div>

            {/* Big Timer Display */}
            <div
              className={`text-center py-4 rounded-xl border my-2 font-mono text-3xl sm:text-4xl font-bold transition-all ${
                isOvertime
                  ? 'bg-red-950/60 text-red-400 border-red-800 animate-pulse'
                  : isTimerRunning
                  ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800'
                  : 'bg-slate-800/80 text-slate-200 border-slate-700'
              }`}
            >
              {formatTimer(timerSeconds)}
            </div>

            {isOvertime && (
              <p className="text-center text-xs text-red-400 font-semibold mb-2">
                ⚠️ Melebihi Batas Waktu ({formatTimer(timerSeconds - targetSec)})
              </p>
            )}

            {/* Timer Controls */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              {!isTimerRunning ? (
                <button
                  type="button"
                  onClick={handleStartTimer}
                  className="col-span-2 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  <Play className="w-3.5 h-3.5" /> Mulai Tampil
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePauseTimer}
                  className="col-span-2 flex items-center justify-center gap-1.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  <Pause className="w-3.5 h-3.5" /> Jeda Timer
                </button>
              )}

              <button
                type="button"
                onClick={handleResetTimer}
                className="flex items-center justify-center gap-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors border border-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>
          </div>

          {/* Real-time Calculation Summary Card */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2 mb-3">
              Ringkasan Nilai Juri (Real-Time)
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Vokal & Lagu (35%):</span>
                <span className="font-semibold text-slate-900">{(vokalSubtotal * 0.35).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Terbang & Tabuhan (35%):</span>
                <span className="font-semibold text-slate-900">{(terbangSubtotal * 0.35).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Adab & Penampilan (15%):</span>
                <span className="font-semibold text-slate-900">{(adabSubtotal * 0.15).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Fasohah & Syair (15%):</span>
                <span className="font-semibold text-slate-900">{(fasohahSubtotal * 0.15).toFixed(2)}</span>
              </div>

              {penalty > 0 && (
                <div className="flex justify-between items-center text-red-600 font-semibold pt-1 border-t border-slate-100">
                  <span>Potongan Penalti:</span>
                  <span>-{penalty.toFixed(2)}</span>
                </div>
              )}

              {/* Total Score Big Highlight */}
              <div className="pt-3 border-t-2 border-indigo-600 flex justify-between items-end">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-700 block">Total Nilai Akhir</span>
                  <span className="text-xs text-slate-400">Skala 0 - 100</span>
                </div>
                <div className="text-3xl font-black text-indigo-600">{netTotalScore.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Digital Signature Pad */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileSignature className="w-3.5 h-3.5 text-indigo-600" /> Tanda Tangan Digital Juri
              </span>
              <button
                type="button"
                onClick={clearSignature}
                className="text-[11px] text-slate-500 hover:text-red-600 flex items-center gap-1"
              >
                <Eraser className="w-3 h-3" /> Hapus
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 overflow-hidden relative touch-none">
              <canvas
                ref={canvasRef}
                width={320}
                height={100}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-[100px] cursor-crosshair"
              />
              {!hasSignature && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs italic">
                  Goreskan tanda tangan juri di sini
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-400 italic">
              *Tanda tangan akan diverifikasi dengan enkripsi SHA-256 Digital Seal
            </p>
          </div>

          {/* Submit & Lock Score Action Button */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleSubmitScore}
              disabled={eventConfig.isRecapLocked}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow-xs flex items-center justify-center gap-2 transition-all ${
                eventConfig.isRecapLocked
                  ? 'bg-slate-400 cursor-not-allowed'
                  : isSubmittedSuccess
                  ? 'bg-emerald-600'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
              }`}
            >
              {isSubmittedSuccess ? (
                <>
                  <CheckCircle className="w-5 h-5 text-white animate-bounce" />
                  <span>Nilai Berhasil Dikirim & Disahkan!</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-indigo-200" />
                  <span>Kunci & Kirim Nilai ({currentJudge.name.split(' ')[0]})</span>
                </>
              )}
            </button>

            {existingScore && (
              <p className="text-center text-[11px] text-emerald-600 font-medium">
                ✅ Nilai telah tersimpan pada {new Date(existingScore.submittedAt).toLocaleTimeString('id-ID')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
