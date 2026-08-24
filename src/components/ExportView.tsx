import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Upload,
  Lock,
  Unlock,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Award,
  Database,
  CloudUpload,
  AlertCircle,
} from 'lucide-react';
import {
  EventConfig,
  GroupRecapSummary,
  ParticipantGroup,
  ScoreSubmission,
} from '../types/hadroh';
import { exportOfficialRecapPDF, exportWinnerCertificatePDF } from '../utils/pdfExport';
import { exportOfficialRecapExcel } from '../utils/excelExport';
import { syncToGoogleSheets, GoogleSheetsSyncResult } from '../utils/googleSheets';
import { encryptData, decryptData } from '../utils/crypto';

interface ExportViewProps {
  eventConfig: EventConfig;
  recapList: GroupRecapSummary[];
  participants: ParticipantGroup[];
  scores: ScoreSubmission[];
  onRestoreData: (restored: {
    eventConfig: EventConfig;
    participants: ParticipantGroup[];
    scores: ScoreSubmission[];
  }) => void;
}

export const ExportView: React.FC<ExportViewProps> = ({
  eventConfig,
  recapList,
  participants,
  scores,
  onRestoreData,
}) => {
  // Google Sheets state
  const [googleAccessToken, setGoogleAccessToken] = useState('');
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [sheetsSyncResult, setSheetsSyncResult] = useState<GoogleSheetsSyncResult | null>(null);
  const [sheetsError, setSheetsError] = useState<string | null>(null);

  // Encrypted Backup state
  const [backupPassphrase, setBackupPassphrase] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);

  // Restore state
  const [restorePassphrase, setRestorePassphrase] = useState('');
  const [restoreFileContent, setRestoreFileContent] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  // Handle Google Sheets Sync
  const handleGoogleSheetsSync = async () => {
    setIsSyncingSheets(true);
    setSheetsError(null);
    setSheetsSyncResult(null);

    try {
      // In web app, prompt or use provided OAuth token
      const token = googleAccessToken.trim();
      if (!token) {
        throw new Error('Silakan masukkan Google OAuth Access Token yang valid untuk menyinkronkan ke Google Sheets Anda.');
      }

      const result = await syncToGoogleSheets(token, eventConfig, recapList);
      setSheetsSyncResult(result);
    } catch (err: any) {
      setSheetsError(err.message || 'Gagal menyinkronkan ke Google Sheets.');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Handle Encrypted Backup Export
  const handleExportEncryptedBackup = async () => {
    if (!backupPassphrase) {
      alert('Silakan tentukan kata sandi pengamanan (passphrase) untuk enkripsi backup!');
      return;
    }

    setIsEncrypting(true);
    try {
      const fullPayload = JSON.stringify({
        eventConfig,
        participants,
        scores,
        exportedAt: new Date().toISOString(),
        version: '1.0',
      });

      const encryptedCipher = await encryptData(fullPayload, backupPassphrase);

      const blob = new Blob([encryptedCipher], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Backup_Enkripsi_Hadroh_${eventConfig.eventName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.hadroh`;
      a.click();
      URL.revokeObjectURL(url);

      setBackupSuccess(true);
      setTimeout(() => setBackupSuccess(false), 3000);
    } catch (err: any) {
      alert('Gagal mengekspor data: ' + err.message);
    } finally {
      setIsEncrypting(false);
    }
  };

  // Handle File read for restore
  const handleFileSelectForRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setRestoreFileContent(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  // Handle Decrypt & Restore
  const handleExecuteRestore = async () => {
    if (!restoreFileContent || !restorePassphrase) {
      alert('Pilih file backup .hadroh dan masukkan kata sandi dekripsi!');
      return;
    }

    setRestoreError(null);
    try {
      const decryptedPlain = await decryptData(restoreFileContent, restorePassphrase);
      const parsed = JSON.parse(decryptedPlain);

      if (!parsed.eventConfig || !parsed.participants || !parsed.scores) {
        throw new Error('Format file backup tidak valid.');
      }

      onRestoreData({
        eventConfig: parsed.eventConfig,
        participants: parsed.participants,
        scores: parsed.scores,
      });

      setRestoreSuccess(true);
      setTimeout(() => setRestoreSuccess(false), 3000);
    } catch (err: any) {
      setRestoreError(err.message || 'Gagal memulihkan backup. Pastikan kata sandi benar.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
            📥
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Pusat Ekspor Dokumen & Sinkronisasi Cloud
            </h2>
            <p className="text-xs text-slate-500">
              Unduh laporan resmi PDF, spreadsheet Excel, sinkronisasi Google Sheets, dan backup terenkripsi AES-256.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: 3 Main Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Official PDF Decision Report */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Laporan Resmi PDF</h3>
              <p className="text-xs text-slate-500 mt-1">
                Berita Acara Keputusan Dewan Juri format A4 Landscape lengkap dengan kop resmi, tabel nilai 4 aspek, bobot kriteria, dan kolom tanda tangan dewan juri.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <button
              onClick={() => exportOfficialRecapPDF(eventConfig, recapList, scores)}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-700 text-white shadow-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" /> Unduh Berita Acara (PDF)
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              *Format standar untuk arsip panitia & LPJ lomba
            </p>
          </div>
        </div>

        {/* Card 2: Excel Spreadsheet (.XLSX) */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Spreadsheet Excel (.XLSX)</h3>
              <p className="text-xs text-slate-500 mt-1">
                Buku kerja Excel multi-sheet yang memuat sheet Rekapitulasi Nilai Akhir, sheet Rincian Penilaian Juri 1-4, dan sheet Data Lengkap Kontingen Peserta.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <button
              onClick={() => exportOfficialRecapExcel(eventConfig, recapList, participants, scores)}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" /> Unduh Workbook Excel (.xlsx)
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              *Kompatibel dengan Microsoft Excel, Google Sheets, LibreOffice
            </p>
          </div>
        </div>

        {/* Card 3: Winner Certificates (Piagam Penghargaan PDF) */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Piagam Penghargaan Juara</h3>
              <p className="text-xs text-slate-500 mt-1">
                Cetak piagam penghargaan berbingkai ornamen islami dengan stempel digital, nomor sertifikat, nama grup, dan tanda tangan ketua dewan juri.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <button
              onClick={() => {
                if (recapList[0]) {
                  exportWinnerCertificatePDF(eventConfig, recapList[0]);
                } else {
                  alert('Belum ada kontingen juara yang terdaftar.');
                }
              }}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Award className="w-4 h-4" /> Cetak Piagam Juara 1 (PDF)
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              *Piagam peserta lain dapat dicetak langsung pada tabel Rekapitulasi
            </p>
          </div>
        </div>
      </div>

      {/* Google Sheets Integration Section */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-md border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              📊
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white">
                Sinkronisasi Langsung ke Google Sheets & Google Drive
              </h3>
              <p className="text-xs text-slate-400">
                Buat spreadsheet baru secara otomatis di akun Google Drive Anda dengan satu klik.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-mono font-bold border border-indigo-500/30">
            OAuth 2.0 Enabled
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="md:col-span-2 space-y-2">
            <label className="block font-bold text-slate-300 uppercase">
              Google OAuth Token / Kunci Akses Google Sheets
            </label>
            <input
              type="text"
              value={googleAccessToken}
              onChange={(e) => setGoogleAccessToken(e.target.value)}
              placeholder="Masukkan OAuth Access Token (Bearer Token Google Sheets API)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400">
              *Token terhubung dengan Google Workspace Scope: <code className="text-amber-300">/auth/spreadsheets</code> dan <code className="text-amber-300">/auth/drive.file</code>.
            </p>
          </div>

          <div className="flex flex-col justify-end">
            <button
              onClick={handleGoogleSheetsSync}
              disabled={isSyncingSheets}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center justify-center gap-2 transition-all"
            >
              {isSyncingSheets ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CloudUpload className="w-4 h-4" />
              )}
              <span>{isSyncingSheets ? 'Menyinkronkan...' : 'Sinkron ke Google Sheets'}</span>
            </button>
          </div>
        </div>

        {sheetsError && (
          <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{sheetsError}</span>
          </div>
        )}

        {sheetsSyncResult && (
          <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Google Spreadsheet Berhasil Dibuat & Disinkronkan!</span>
            </div>
            <p className="text-[11px] text-slate-300">
              ID Dokumen: <span className="font-mono text-indigo-300">{sheetsSyncResult.spreadsheetId}</span>
            </p>
            <a
              href={sheetsSyncResult.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors text-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Buka di Google Sheets
            </a>
          </div>
        )}
      </div>

      {/* Encrypted Backup & Restore Section (AES-256-GCM) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                Ekspor Backup Terenkripsi (AES-256)
              </h3>
              <p className="text-[11px] text-slate-500">Amankan seluruh data lomba dengan enkripsi Web Crypto</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Kata Sandi Pengamanan Backup
              </label>
              <input
                type="password"
                value={backupPassphrase}
                onChange={(e) => setBackupPassphrase(e.target.value)}
                placeholder="Masukkan kata sandi rahasia..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none font-mono"
              />
            </div>

            <button
              onClick={handleExportEncryptedBackup}
              disabled={isEncrypting}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white shadow-xs flex items-center justify-center gap-2 transition-all ${
                backupSuccess ? 'bg-indigo-800' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {backupSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>File Backup Terenkripsi Terunduh!</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Enkripsi & Unduh File (.hadroh)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Restore */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-800">
              <Unlock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                Pulihkan Data (Dekripsi Backup)
              </h3>
              <p className="text-[11px] text-slate-500">Impor dan validasi data dari file cadangan .hadroh</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Pilih File Cadangan (.hadroh)
              </label>
              <input
                type="file"
                accept=".hadroh,application/octet-stream"
                onChange={handleFileSelectForRestore}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Kata Sandi Dekripsi
              </label>
              <input
                type="password"
                value={restorePassphrase}
                onChange={(e) => setRestorePassphrase(e.target.value)}
                placeholder="Masukkan kata sandi pembuka..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none font-mono"
              />
            </div>

            {restoreError && (
              <p className="text-[11px] text-red-600 font-medium">⚠️ {restoreError}</p>
            )}

            {restoreSuccess && (
              <p className="text-[11px] text-emerald-700 font-bold">✅ Data berhasil dipulihkan & disinkronkan!</p>
            )}

            <button
              onClick={handleExecuteRestore}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-xs flex items-center justify-center gap-2 transition-all"
            >
              <Database className="w-4 h-4" /> Dekripsi & Pulihkan Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
