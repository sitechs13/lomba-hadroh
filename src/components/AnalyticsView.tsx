import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { BarChart3, TrendingUp, Users, Award, ShieldAlert, Clock } from 'lucide-react';
import {
  EventConfig,
  GroupRecapSummary,
  ParticipantGroup,
  ScoreSubmission,
} from '../types/hadroh';

interface AnalyticsViewProps {
  eventConfig: EventConfig;
  recapList: GroupRecapSummary[];
  participants: ParticipantGroup[];
  scores: ScoreSubmission[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  eventConfig,
  recapList,
  participants,
  scores,
}) => {
  // 1. Radar Chart Data: 4 Core Aspects Comparison for Top 3 Groups
  const topGroups = recapList.filter((r) => r.judgeCount > 0).slice(0, 3);
  const radarData = [
    {
      aspect: 'Vokal & Aransemen (35%)',
      ...topGroups.reduce((acc, curr, idx) => ({ ...acc, [`group${idx + 1}`]: curr.averageVokal }), {}),
    },
    {
      aspect: 'Pukulan Terbang (35%)',
      ...topGroups.reduce((acc, curr, idx) => ({ ...acc, [`group${idx + 1}`]: curr.averageTerbang }), {}),
    },
    {
      aspect: 'Adab & Busana (15%)',
      ...topGroups.reduce((acc, curr, idx) => ({ ...acc, [`group${idx + 1}`]: curr.averageAdab }), {}),
    },
    {
      aspect: 'Fasohah & Syair (15%)',
      ...topGroups.reduce((acc, curr, idx) => ({ ...acc, [`group${idx + 1}`]: curr.averageFasohah }), {}),
    },
  ];

  // 2. Bar Chart Data: Leaderboard distribution
  const barData = recapList
    .filter((r) => r.judgeCount > 0)
    .map((r) => ({
      name: r.participant.groupName.length > 14 ? r.participant.groupName.substring(0, 14) + '...' : r.participant.groupName,
      'Skor Akhir': r.finalScore,
      'Vokal': r.averageVokal,
      'Terbang': r.averageTerbang,
    }));

  // 3. Judge Consistency & Scoring Average Comparison
  const judgeStats = eventConfig.judges.map((judge) => {
    const judgeSubmissions = scores.filter((s) => s.judgeId === judge.id);
    const avgScore =
      judgeSubmissions.length > 0
        ? judgeSubmissions.reduce((acc, s) => acc + s.totalScore, 0) / judgeSubmissions.length
        : 0;
    return {
      name: judge.name.split(' ')[0] + ' ' + (judge.name.split(' ')[1] || ''),
      role: judge.roleTitle.split(':')[0],
      'Rata-rata Nilai': Math.round(avgScore * 100) / 100,
      'Total Dinilai': judgeSubmissions.length,
    };
  });

  // Calculate high level stats
  const scoredCount = recapList.filter((r) => r.judgeCount > 0).length;
  const overallAvgScore =
    scoredCount > 0
      ? recapList.filter((r) => r.judgeCount > 0).reduce((acc, r) => acc + r.finalScore, 0) / scoredCount
      : 0;

  const highestScore = recapList[0]?.finalScore || 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Kontingen</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{participants.length} Grup</div>
          <p className="text-[11px] text-indigo-600 font-medium mt-1">
            {scoredCount} telah dinilai juri
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Skor Tertinggi</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{highestScore.toFixed(2)}</div>
          <p className="text-[11px] text-slate-500 truncate mt-1">
            {recapList[0]?.participant.groupName || '-'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Rata-Rata Acara</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{overallAvgScore.toFixed(2)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Dari {scores.length} lembar nilai juri</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Dewan Juri</span>
            <BarChart3 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{eventConfig.judges.length} Juri</div>
          <p className="text-[11px] text-slate-500 mt-1">4 Bidang Keahlian Hadroh</p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart: 4 Aspects Analysis for Top 3 Groups */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Visualisasi Analitik Radar: 4 Aspek Penilaian Hadroh (Top 3)
            </h3>
            <p className="text-xs text-slate-500">
              Membandingkan kekuatan bidang Vokal, Pukulan Terbang, Adab, dan Fasohah
            </p>
          </div>

          <div className="h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="aspect" tick={{ fill: '#475569', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[60, 100]} />
                {topGroups[0] && (
                  <Radar
                    name={topGroups[0].participant.groupName}
                    dataKey="group1"
                    stroke="#4f46e5"
                    fill="#4f46e5"
                    fillOpacity={0.35}
                  />
                )}
                {topGroups[1] && (
                  <Radar
                    name={topGroups[1].participant.groupName}
                    dataKey="group2"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.25}
                  />
                )}
                {topGroups[2] && (
                  <Radar
                    name={topGroups[2].participant.groupName}
                    dataKey="group3"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.2}
                  />
                )}
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Leaderboard & Category Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Distribusi Skor Akhir & Komparasi Bidang Utama
            </h3>
            <p className="text-xs text-slate-500">
              Perbandingan Skor Akhir vs Komponen Vokal & Pukulan Terbang
            </p>
          </div>

          <div className="h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" />
                <YAxis domain={[60, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Skor Akhir" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Vokal" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Terbang" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Judge Consistency Analysis Bar Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
            Analisis Konsistensi & Deviasi Nilai Dewan Juri
          </h3>
          <p className="text-xs text-slate-500">
            Mengevaluasi rata-rata pemberian nilai per juri untuk menjamin transparansi & objektivitas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {judgeStats.map((judge, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase block">{judge.role}</span>
                <h4 className="font-bold text-slate-800 text-sm">{judge.name}</h4>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200 flex items-end justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block">Rata-rata Nilai:</span>
                  <span className="text-xl font-black text-slate-800">{judge['Rata-rata Nilai']}</span>
                </div>
                <span className="text-xs text-slate-500 font-medium">{judge['Total Dinilai']} kontingen</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
