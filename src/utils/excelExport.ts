import * as XLSX from 'xlsx';
import { EventConfig, GroupRecapSummary, ParticipantGroup, ScoreSubmission } from '../types/hadroh';

export function exportOfficialRecapExcel(
  eventConfig: EventConfig,
  recapList: GroupRecapSummary[],
  participants: ParticipantGroup[],
  scores: ScoreSubmission[]
): void {
  const wb = XLSX.utils.book_new();

  // 1. SHEET REKAPITULASI
  const recapData = recapList.map((item) => ({
    'Peringkat': item.judgeCount > 0 ? item.rank : '-',
    'No. Tampil': `#${String(item.participant.orderNumber).padStart(2, '0')}`,
    'Nama Grup / Kontingen': item.participant.groupName,
    'Asal Lembaga / Ponpes': item.participant.institution,
    'Kategori': item.participant.category.toUpperCase(),
    'Vokalis Utama': item.participant.leadVocalist,
    'Penabuh Utama': item.participant.leadDrummer,
    'Rata-rata Vokal (35%)': item.averageVokal,
    'Rata-rata Terbang (35%)': item.averageTerbang,
    'Rata-rata Adab (15%)': item.averageAdab,
    'Rata-rata Fasohah (15%)': item.averageFasohah,
    'Total Penalti': item.totalPenalty,
    'Skor Akhir': item.finalScore,
    'Jumlah Juri Masuk': item.judgeCount,
    'Keterangan Juara': item.awardCategory || '-',
    'Status Integritas': item.integrityVerified ? 'VALID (SHA-256)' : 'UNVERIFIED',
  }));

  const recapWs = XLSX.utils.json_to_sheet(recapData);
  XLSX.utils.book_append_sheet(wb, recapWs, 'Rekapitulasi Nilai');

  // 2. SHEET DETAIL NILAI PER JURI
  const detailedScoreData = scores.map((score) => {
    const part = participants.find((p) => p.id === score.participantId);
    return {
      'Nama Juri': score.judgeName,
      'No. Undian': part ? `#${part.orderNumber}` : '-',
      'Nama Grup': part?.groupName || score.participantId,
      'Asal Lembaga': part?.institution || '-',
      'Nilai Vokal': score.vokalSubtotal,
      'Nilai Terbang': score.terbangSubtotal,
      'Nilai Adab': score.adabSubtotal,
      'Nilai Fasohah': score.fasohahSubtotal,
      'Potongan Penalti': score.penaltyDeduction,
      'Alasan Penalti': score.penaltyReason || '-',
      'Total Nilai Juri': score.totalScore,
      'Catatan / Evaluasi Juri': score.notes || '-',
      'Waktu Input': new Date(score.submittedAt).toLocaleString('id-ID'),
      'Checksum Hash': score.dataHash,
    };
  });

  const detailWs = XLSX.utils.json_to_sheet(detailedScoreData);
  XLSX.utils.book_append_sheet(wb, detailWs, 'Detail Nilai Juri');

  // 3. SHEET DATA PESERTA
  const participantData = participants.map((p) => ({
    'No. Undian': p.orderNumber,
    'Nama Grup Hadroh': p.groupName,
    'Asal Lembaga / Pesantren': p.institution,
    'Kategori': p.category.toUpperCase(),
    'Vokalis': p.leadVocalist,
    'Penabuh Terbang': p.leadDrummer,
    'Lagu Wajib': p.songMandatory,
    'Lagu Pilihan': p.songChoice,
    'No. Kontak HP': p.contactPhone,
    'Status Tampil': p.status,
    'Durasi Tampil (Detik)': p.performanceDurationSec || 0,
    'Jumlah Berkas Terlampir': p.attachedFiles.length,
  }));

  const partWs = XLSX.utils.json_to_sheet(participantData);
  XLSX.utils.book_append_sheet(wb, partWs, 'Daftar Kontingen');

  // Generate and download XLSX
  const filename = `Rekap_Nilai_Hadroh_${eventConfig.eventName.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
}
