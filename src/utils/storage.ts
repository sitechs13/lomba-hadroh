import {
  EventConfig,
  Criterion,
  JudgeProfile,
  ParticipantGroup,
  ScoreSubmission,
  SecurityAuditLog,
  GroupRecapSummary,
  ApiWebhookConfig,
} from '../types/hadroh';
import { generateScoreIntegrityHash, verifyScoreIntegrity } from './crypto';

export const DEFAULT_CRITERIA: Criterion[] = [
  // 1. BIDANG VOKAL & ARANSEMEN (35%)
  {
    id: 'crit-vokal-1',
    name: 'Keutuhan & Kualitas Vokal Utama',
    categoryKey: 'vokal',
    maxScore: 40,
    weight: 15,
    description: 'Kejernihan nada, power, kestabilan vokal, dan artikulasi suara utama.',
  },
  {
    id: 'crit-vokal-2',
    name: 'Keindahan Lagu & Cengkok/Variasi',
    categoryKey: 'vokal',
    maxScore: 35,
    weight: 12,
    description: 'Keindahan cengkok khas sholawat, variasi nada, dan penghayatan lagu.',
  },
  {
    id: 'crit-vokal-3',
    name: 'Harmonisasi & Suara Koors/Backing',
    categoryKey: 'vokal',
    maxScore: 25,
    weight: 8,
    description: 'Keselarasan nada koors/backing vocal dengan vokal utama (akor).',
  },

  // 2. BIDANG PUKULAN TERBANG & MUSIK (35%)
  {
    id: 'crit-terbang-1',
    name: 'Akurasi Pukulan Dasar (An-Nawa/Golong)',
    categoryKey: 'terbang',
    maxScore: 40,
    weight: 15,
    description: 'Ketepatan pukulan baku rebana, konsistensi ritme, dan kestabilan tempo.',
  },
  {
    id: 'crit-terbang-2',
    name: 'Variasi Rample, Kentrung & Bass/Calty',
    categoryKey: 'terbang',
    maxScore: 35,
    weight: 12,
    description: 'Kreativitas variasi rample, kentrung, sinkopasi calty, dan gebukan bass.',
  },
  {
    id: 'crit-terbang-3',
    name: 'Dinamika, Power & Sinkronisasi',
    categoryKey: 'terbang',
    maxScore: 25,
    weight: 8,
    description: 'Pengaturan tempo lambat-cepat, keras-lembut, dan kekompakan tabuhan.',
  },

  // 3. BIDANG ADAB & PENAMPILAN (15%)
  {
    id: 'crit-adab-1',
    name: 'Adab Panggung & Kerapian Busana Islami',
    categoryKey: 'adab',
    maxScore: 50,
    weight: 8,
    description: 'Kesesuaian busana muslim, kesopanan masuk & keluar panggung, etika.',
  },
  {
    id: 'crit-adab-2',
    name: 'Kekompakan, Koreografi & Formasi',
    categoryKey: 'adab',
    maxScore: 50,
    weight: 7,
    description: 'Kerapian formasi duduk/berdiri, keseragaman gerakan, dan ekspresi khusyuk.',
  },

  // 4. BIDANG FASOHAH & SYAIR (15%)
  {
    id: 'crit-fasohah-1',
    name: 'Makhorijul Huruf & Tajwid Lafadz',
    categoryKey: 'fasohah',
    maxScore: 50,
    weight: 8,
    description: 'Kebenaran pelafalan huruf hijaiyah, panjang-pendek mad, dan ghunnah.',
  },
  {
    id: 'crit-fasohah-2',
    name: 'Kefasihan & Keutuhan Syair Sholawat',
    categoryKey: 'fasohah',
    maxScore: 50,
    weight: 7,
    description: 'Kelancaran hafalan teks syair sholawat tanpa terpotong atau terbalik.',
  },
];

export const DEFAULT_JUDGES: JudgeProfile[] = [
  {
    id: 'juri-1',
    name: 'Ustadz H. Ahmad Fauzi, S.Pd.I',
    roleTitle: 'Dewan Juri I: Bidang Vokal & Aransemen',
    specialty: 'vokal',
    pinCode: '1111',
    twoFactorEnabled: false,
    twoFactorSecret: 'HADROHJURI01SECRET',
  },
  {
    id: 'juri-2',
    name: 'Ustadz Muhammad Ridwan, M.Ag',
    roleTitle: 'Dewan Juri II: Bidang Pukulan & Variasi Terbang',
    specialty: 'terbang',
    pinCode: '2222',
    twoFactorEnabled: false,
    twoFactorSecret: 'HADROHJURI02SECRET',
  },
  {
    id: 'juri-3',
    name: 'Gus Nurul Hidayat, M.H.I',
    roleTitle: 'Dewan Juri III: Bidang Adab & Penampilan',
    specialty: 'adab',
    pinCode: '3333',
    twoFactorEnabled: false,
    twoFactorSecret: 'HADROHJURI03SECRET',
  },
  {
    id: 'juri-4',
    name: 'Habib Ali Bin Assegaf',
    roleTitle: 'Dewan Juri IV: Bidang Fasohah & Syair',
    specialty: 'fasohah',
    pinCode: '4444',
    twoFactorEnabled: false,
    twoFactorSecret: 'HADROHJURI04SECRET',
  },
];

export const DEFAULT_EVENT: EventConfig = {
  eventName: 'Festival & Lomba Hadroh Al-Banjari Tingkat Nasional 2026',
  subTitle: 'Semarak Sholawat Nusantara Menuju Generasi Rabbani',
  organizer: 'Lembaga Seni Budaya Muslimin & Ikatan Seni Hadroh Indonesia (ISHARI)',
  location: 'Auditorium Utama Islamic Centre / Gedung Serbaguna',
  eventDate: new Date().toISOString().split('T')[0],
  category: 'banjari',
  targetDurationMinutes: 10,
  maxOvertimeGraceSec: 60,
  isRecapLocked: false,
  judges: DEFAULT_JUDGES,
  criteria: DEFAULT_CRITERIA,
};

export const SAMPLE_PARTICIPANTS: ParticipantGroup[] = [
  {
    id: 'part-01',
    orderNumber: 1,
    groupName: 'El-Musthofa Al-Banjari',
    institution: 'PP. Darul Ulum Jombang',
    category: 'banjari',
    leadVocalist: 'M. Azka Robbani',
    leadDrummer: 'Ahmad Syafiq',
    songMandatory: 'Ya Hanana',
    songChoice: 'Sholatullah Salamullah (Al-Habib)',
    contactPhone: '081234567890',
    status: 'finished',
    performanceDurationSec: 580,
    attachedFiles: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'part-02',
    orderNumber: 2,
    groupName: 'Syauqul Habib Al-Banjari',
    institution: 'Majelis Ta\'lim Ahbabul Mukhtar',
    category: 'banjari',
    leadVocalist: 'Farhan Maulana',
    leadDrummer: 'Irfan Hakim',
    songMandatory: 'Ya Imamarusli',
    songChoice: 'Padang Bulan & Sholawat Burdah',
    contactPhone: '081298765432',
    status: 'finished',
    performanceDurationSec: 595,
    attachedFiles: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'part-03',
    orderNumber: 3,
    groupName: 'Al-Mubarok Generation',
    institution: 'Universitas Islam Negeri (UIN)',
    category: 'banjari',
    leadVocalist: 'Zaidan Malik',
    leadDrummer: 'Bagas Prasetyo',
    songMandatory: 'Ya Hanana',
    songChoice: 'Thola\'al Badru \'Alayna',
    contactPhone: '085712344321',
    status: 'performing',
    performanceDurationSec: 0,
    attachedFiles: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'part-04',
    orderNumber: 4,
    groupName: 'Soutun Nida Klasik',
    institution: 'PP. Sunan Drajat',
    category: 'banjari',
    leadVocalist: 'Ilham Syarifudin',
    leadDrummer: 'Wildan Rosyid',
    songMandatory: 'Ya Imamarusli',
    songChoice: 'Al-Madad Ya Rasulullah',
    contactPhone: '087812345678',
    status: 'waiting',
    performanceDurationSec: 0,
    attachedFiles: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'part-05',
    orderNumber: 5,
    groupName: 'Nurul Musthofa Group',
    institution: 'Remaja Masjid Raya Baiturrahman',
    category: 'banjari',
    leadVocalist: 'Hafizul Ahkam',
    leadDrummer: 'Dimas Kurniawan',
    songMandatory: 'Ya Hanana',
    songChoice: 'Adfaita \'Alal Husnil Abaqo',
    contactPhone: '082199887766',
    status: 'waiting',
    performanceDurationSec: 0,
    attachedFiles: [],
    createdAt: new Date().toISOString(),
  },
];

const STORAGE_KEYS = {
  EVENT_CONFIG: 'hadroh_judge_event_config_v1',
  PARTICIPANTS: 'hadroh_judge_participants_v1',
  SCORES: 'hadroh_judge_scores_v1',
  AUDIT_LOGS: 'hadroh_judge_audit_logs_v1',
  OFFLINE_QUEUE: 'hadroh_judge_offline_queue_v1',
  ADMIN_PIN: 'hadroh_judge_admin_pin_v1',
  WEBHOOK_CONFIG: 'hadroh_judge_webhook_v1',
  AUTH_2FA_ADMIN: 'hadroh_judge_auth_2fa_admin_v1',
};

// Storage helper functions
export function loadEventConfig(): EventConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.EVENT_CONFIG);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading event config', e);
  }
  return DEFAULT_EVENT;
}

export function saveEventConfig(config: EventConfig): void {
  localStorage.setItem(STORAGE_KEYS.EVENT_CONFIG, JSON.stringify(config));
}

export function loadParticipants(): ParticipantGroup[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PARTICIPANTS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading participants', e);
  }
  return SAMPLE_PARTICIPANTS;
}

export function saveParticipants(participants: ParticipantGroup[]): void {
  localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(participants));
}

export function loadScores(): ScoreSubmission[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SCORES);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading scores', e);
  }
  return [];
}

export function saveScores(scores: ScoreSubmission[]): void {
  localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(scores));
}

export function loadAuditLogs(): SecurityAuditLog[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading audit logs', e);
  }
  return [];
}

export function addAuditLog(action: string, actor: string, details: string): void {
  try {
    const logs = loadAuditLogs();
    const newLog: SecurityAuditLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
      action,
      actor,
      details,
      ipOrDevice: navigator.userAgent.substring(0, 50),
      hash: 'sha256_' + Math.random().toString(36).substr(2, 9),
    };
    logs.unshift(newLog);
    // Keep max 100 logs
    const trimmed = logs.slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Error adding audit log', e);
  }
}

export function loadOfflineQueue(): ScoreSubmission[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading offline queue', e);
  }
  return [];
}

export function saveOfflineQueue(queue: ScoreSubmission[]): void {
  localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
}

export function loadWebhookConfig(): ApiWebhookConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.WEBHOOK_CONFIG);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading webhook config', e);
  }
  return {
    enabled: false,
    webhookUrl: 'https://api.pesantren-hub.org/v1/hadroh-sync',
    secretKey: 'hd_secret_' + Math.random().toString(36).substring(2, 10),
    events: ['score_submitted', 'recap_finalized', 'participant_updated'],
  };
}

export function saveWebhookConfig(config: ApiWebhookConfig): void {
  localStorage.setItem(STORAGE_KEYS.WEBHOOK_CONFIG, JSON.stringify(config));
}

export function loadAdmin2FA(): { enabled: boolean; secret: string; backupPin: string } {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH_2FA_ADMIN);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading admin 2FA', e);
  }
  return {
    enabled: false,
    secret: 'HADROHADMIN2FASECRET',
    backupPin: '9999',
  };
}

export function saveAdmin2FA(config: { enabled: boolean; secret: string; backupPin: string }): void {
  localStorage.setItem(STORAGE_KEYS.AUTH_2FA_ADMIN, JSON.stringify(config));
}

// Calculate full Recap Summary for all participants
export function computeRecapSummaries(
  participants: ParticipantGroup[],
  scores: ScoreSubmission[],
  eventConfig: EventConfig
): GroupRecapSummary[] {
  const summaries: GroupRecapSummary[] = participants.map((participant) => {
    const participantScores = scores.filter((s) => s.participantId === participant.id);
    const judgeScoresMap: Record<string, ScoreSubmission> = {};
    let sumVokal = 0;
    let sumTerbang = 0;
    let sumAdab = 0;
    let sumFasohah = 0;
    let sumPenalty = 0;
    let totalScoreSum = 0;
    let allIntegrityValid = true;

    participantScores.forEach((score) => {
      judgeScoresMap[score.judgeId] = score;
      sumVokal += score.vokalSubtotal;
      sumTerbang += score.terbangSubtotal;
      sumAdab += score.adabSubtotal;
      sumFasohah += score.fasohahSubtotal;
      sumPenalty += score.penaltyDeduction;
      totalScoreSum += score.totalScore;
    });

    const judgeCount = participantScores.length;
    const allJudgesSubmitted = judgeCount > 0 && judgeCount >= eventConfig.judges.length;

    const avgVokal = judgeCount > 0 ? sumVokal / judgeCount : 0;
    const avgTerbang = judgeCount > 0 ? sumTerbang / judgeCount : 0;
    const avgAdab = judgeCount > 0 ? sumAdab / judgeCount : 0;
    const avgFasohah = judgeCount > 0 ? sumFasohah / judgeCount : 0;
    const finalScore = judgeCount > 0 ? Math.max(0, totalScoreSum / judgeCount - sumPenalty / judgeCount) : 0;

    return {
      participant,
      judgeScores: judgeScoresMap,
      judgeCount,
      allJudgesSubmitted,
      averageVokal: Math.round(avgVokal * 100) / 100,
      averageTerbang: Math.round(avgTerbang * 100) / 100,
      averageAdab: Math.round(avgAdab * 100) / 100,
      averageFasohah: Math.round(avgFasohah * 100) / 100,
      totalPenalty: Math.round(sumPenalty * 100) / 100,
      finalScore: Math.round(finalScore * 100) / 100,
      rank: 0,
      integrityVerified: allIntegrityValid,
    };
  });

  // Sort by finalScore DESC, then tiebreaker: averageVokal DESC, then averageTerbang DESC
  const sorted = [...summaries].sort((a, b) => {
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
    if (b.averageVokal !== a.averageVokal) return b.averageVokal - a.averageVokal;
    return b.averageTerbang - a.averageTerbang;
  });

  // Assign ranks & award titles
  sorted.forEach((item, index) => {
    item.rank = index + 1;
    if (item.judgeCount > 0) {
      if (item.rank === 1) item.awardCategory = 'Juara 1 (Utama)';
      else if (item.rank === 2) item.awardCategory = 'Juara 2 (Utama)';
      else if (item.rank === 3) item.awardCategory = 'Juara 3 (Utama)';
      else if (item.rank === 4) item.awardCategory = 'Juara Harapan 1';
      else if (item.rank === 5) item.awardCategory = 'Juara Harapan 2';
      else if (item.rank === 6) item.awardCategory = 'Juara Harapan 3';
    }
  });

  // Find best categories
  if (sorted.length > 0) {
    const bestVocal = [...sorted].sort((a, b) => b.averageVokal - a.averageVokal)[0];
    const bestTerbang = [...sorted].sort((a, b) => b.averageTerbang - a.averageTerbang)[0];
    const bestAdab = [...sorted].sort((a, b) => b.averageAdab - a.averageAdab)[0];

    sorted.forEach((item) => {
      const extraBadges: string[] = [];
      if (item.participant.id === bestVocal?.participant.id && item.averageVokal > 0) {
        extraBadges.push('Vokal Terbaik');
      }
      if (item.participant.id === bestTerbang?.participant.id && item.averageTerbang > 0) {
        extraBadges.push('Terbang Terbaik');
      }
      if (item.participant.id === bestAdab?.participant.id && item.averageAdab > 0) {
        extraBadges.push('Adab Terbaik');
      }
      if (extraBadges.length > 0 && item.awardCategory) {
        item.awardCategory += ` • (${extraBadges.join(', ')})`;
      } else if (extraBadges.length > 0) {
        item.awardCategory = extraBadges.join(', ');
      }
    });
  }

  return sorted;
}

// Initial sample seed scores for demo
export function seedSampleScores(participants: ParticipantGroup[], judges: JudgeProfile[]): ScoreSubmission[] {
  const submissions: ScoreSubmission[] = [];
  const now = new Date().toISOString();

  // Seed scores for participant 1
  if (participants[0]) {
    judges.forEach((judge, idx) => {
      const vokalScore = 90 + idx * 1.5;
      const terbangScore = 88 + idx * 2;
      const adabScore = 92 - idx;
      const fasohahScore = 91 + idx;
      const total = (vokalScore * 0.35) + (terbangScore * 0.35) + (adabScore * 0.15) + (fasohahScore * 0.15);

      submissions.push({
        id: `score-part01-${judge.id}`,
        participantId: participants[0].id,
        judgeId: judge.id,
        judgeName: judge.name,
        criteriaScores: [],
        vokalSubtotal: vokalScore,
        terbangSubtotal: terbangScore,
        adabSubtotal: adabScore,
        fasohahSubtotal: fasohahScore,
        penaltyDeduction: 0,
        totalScore: Math.round(total * 100) / 100,
        notes: 'Penampilan sangat rapi, vokal bulat, pukulan kompak dan bertenaga.',
        submittedAt: now,
        isLocked: true,
        dataHash: 'sha256_mock_valid_' + judge.id,
        syncStatus: 'synced',
      });
    });
  }

  // Seed scores for participant 2
  if (participants[1]) {
    judges.forEach((judge, idx) => {
      const vokalScore = 87 + idx;
      const terbangScore = 89 + idx * 1.2;
      const adabScore = 88 + idx;
      const fasohahScore = 89 - idx * 0.5;
      const total = (vokalScore * 0.35) + (terbangScore * 0.35) + (adabScore * 0.15) + (fasohahScore * 0.15);

      submissions.push({
        id: `score-part02-${judge.id}`,
        participantId: participants[1].id,
        judgeId: judge.id,
        judgeName: judge.name,
        criteriaScores: [],
        vokalSubtotal: vokalScore,
        terbangSubtotal: terbangScore,
        adabSubtotal: adabScore,
        fasohahSubtotal: fasohahScore,
        penaltyDeduction: 0,
        totalScore: Math.round(total * 100) / 100,
        notes: 'Harmonisasi koors sangat padu, dinamika lagu pilihan memukau.',
        submittedAt: now,
        isLocked: true,
        dataHash: 'sha256_mock_valid_p2_' + judge.id,
        syncStatus: 'synced',
      });
    });
  }

  return submissions;
}
