export type HadrohCategory = 'banjari' | 'habsyi' | 'kontemporer' | 'marawis' | 'klasik';

export interface Criterion {
  id: string;
  name: string;
  categoryKey: 'vokal' | 'terbang' | 'adab' | 'fasohah';
  maxScore: number;
  weight: number; // in percentage e.g. 35
  description: string;
}

export interface JudgeProfile {
  id: string;
  name: string;
  roleTitle: string; // e.g. "Juri 1: Vokal & Aransemen"
  specialty: 'vokal' | 'terbang' | 'adab' | 'fasohah' | 'umum';
  pinCode: string;
  twoFactorSecret?: string;
  twoFactorEnabled?: boolean;
  avatar?: string;
  signatureData?: string; // base64 e-signature
}

export interface AttachedFile {
  id: string;
  name: string;
  type: 'syaiir' | 'audio' | 'photo' | 'document';
  size: number;
  mimeType: string;
  uploadedAt: string;
  dataUrl?: string; // base64 or blob URL
  description?: string;
}

export interface ParticipantGroup {
  id: string;
  orderNumber: number; // No. Undian / Tampil
  groupName: string;
  institution: string; // Asal Ponpes/Majelis/Sekolah/Daerah
  category: HadrohCategory;
  leadVocalist: string;
  leadDrummer: string;
  songMandatory: string; // Lagu Wajib (e.g. Ya Hanana, Ya Imamarusli)
  songChoice: string; // Lagu Pilihan
  contactPhone: string;
  status: 'waiting' | 'performing' | 'finished' | 'disqualified';
  performanceDurationSec?: number; // Realized time in seconds
  attachedFiles: AttachedFile[];
  createdAt: string;
}

export interface JudgeScoreItem {
  criterionId: string;
  criterionName: string;
  score: number; // 0 to maxScore
  notes?: string;
}

export interface ScoreSubmission {
  id: string;
  participantId: string;
  judgeId: string;
  judgeName: string;
  criteriaScores: JudgeScoreItem[];
  vokalSubtotal: number;
  terbangSubtotal: number;
  adabSubtotal: number;
  fasohahSubtotal: number;
  penaltyDeduction: number;
  penaltyReason?: string;
  totalScore: number;
  notes: string;
  submittedAt: string;
  isLocked: boolean;
  signatureData?: string;
  dataHash: string; // SHA-256 checksum for anti-tamper
  syncStatus: 'synced' | 'pending' | 'offline_queued';
}

export interface GroupRecapSummary {
  participant: ParticipantGroup;
  judgeScores: Record<string, ScoreSubmission>; // judgeId -> ScoreSubmission
  judgeCount: number;
  allJudgesSubmitted: boolean;
  averageVokal: number;
  averageTerbang: number;
  averageAdab: number;
  averageFasohah: number;
  totalPenalty: number;
  finalScore: number; // Weighted calculated final score
  rank: number;
  awardCategory?: string; // e.g. "Juara 1", "Vokal Terbaik", dll.
  integrityVerified: boolean;
}

export interface EventConfig {
  eventName: string;
  subTitle: string;
  organizer: string;
  location: string;
  eventDate: string;
  category: HadrohCategory;
  targetDurationMinutes: number;
  maxOvertimeGraceSec: number;
  isRecapLocked: boolean;
  lockedAt?: string;
  lockedBy?: string;
  judges: JudgeProfile[];
  criteria: Criterion[];
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
  ipOrDevice: string;
  hash: string;
}

export interface ApiWebhookConfig {
  enabled: boolean;
  webhookUrl: string;
  secretKey: string;
  events: string[];
  lastTriggered?: string;
  lastStatus?: number;
}

export type UserRole = 'admin' | 'judge' | 'viewer';
