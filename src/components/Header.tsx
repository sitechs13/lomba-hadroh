import React from 'react';
import {
  Shield,
  Wifi,
  WifiOff,
  Bell,
  BellRing,
  Award,
  Users,
  Settings,
  Lock,
  Radio,
  FileSpreadsheet,
} from 'lucide-react';
import { EventConfig, JudgeProfile, UserRole } from '../types/hadroh';

interface HeaderProps {
  eventConfig: EventConfig;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  selectedJudge: JudgeProfile | null;
  setSelectedJudge: (judge: JudgeProfile) => void;
  isOnline: boolean;
  pendingSyncCount: number;
  is2FAEnabled: boolean;
  onOpen2FAModal: () => void;
  onOpenEventConfig: () => void;
  notificationEnabled: boolean;
  onToggleNotification: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  eventConfig,
  activeRole,
  setActiveRole,
  selectedJudge,
  setSelectedJudge,
  isOnline,
  pendingSyncCount,
  is2FAEnabled,
  onOpen2FAModal,
  onOpenEventConfig,
  notificationEnabled,
  onToggleNotification,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-xs">
      {/* Top Banner / Event Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center shadow-xs border border-indigo-400/30 text-white font-bold">
            <span className="text-xl">🕌</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                E-Hadroh Judge
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30 tracking-wider">
                  PRO
                </span>
              </h1>
              {eventConfig.isRecapLocked && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Nilai Terkunci
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 truncate max-w-[280px] sm:max-w-md">
              {eventConfig.eventName}
            </p>
          </div>
        </div>

        {/* Right Status & Controls */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* Online / Offline Status */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
              isOnline
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                : 'bg-amber-950/70 text-amber-400 border-amber-800 animate-pulse'
            }`}
            title={isOnline ? 'Terhubung Online' : 'Mode Offline Aktif - Data disimpan lokal'}
          >
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span>{isOnline ? 'Online' : 'Offline'}</span>
            {pendingSyncCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-slate-950 font-bold rounded-full text-[10px]">
                {pendingSyncCount} antrian
              </span>
            )}
          </div>

          {/* 2FA Security Badge */}
          <button
            onClick={onOpen2FAModal}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              is2FAEnabled
                ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800 hover:bg-indigo-900/60'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
            title="Kelola Autentikasi Dua Faktor (2FA)"
          >
            <Shield className={`w-3.5 h-3.5 ${is2FAEnabled ? 'text-indigo-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">2FA:</span>
            <span>{is2FAEnabled ? 'Aktif' : 'Nonaktif'}</span>
          </button>

          {/* Push Notification Toggle */}
          <button
            onClick={onToggleNotification}
            className={`p-1.5 rounded-lg border transition-colors ${
              notificationEnabled
                ? 'bg-amber-950/50 text-amber-300 border-amber-800/80 hover:bg-amber-900/50'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
            title={notificationEnabled ? 'Notifikasi Push Aktif' : 'Aktifkan Notifikasi Push'}
          >
            {notificationEnabled ? <BellRing className="w-4 h-4 text-amber-400" /> : <Bell className="w-4 h-4" />}
          </button>

          {/* Edit Event Config Button */}
          <button
            onClick={onOpenEventConfig}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
            title="Ubah Nama Lomba, Juri & Kriteria"
          >
            <Settings className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Konfigurasi</span>
          </button>
        </div>
      </div>

      {/* Role & Judge Selection Sub-bar */}
      <div className="bg-slate-950/90 border-t border-slate-800 px-4 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Role switcher */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Peran Akses:</span>
            <div className="inline-flex p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
              <button
                onClick={() => setActiveRole('judge')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeRole === 'judge'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Dewan Juri
              </button>
              <button
                onClick={() => setActiveRole('admin')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeRole === 'admin'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Panitia / Admin
              </button>
              <button
                onClick={() => setActiveRole('viewer')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeRole === 'viewer'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Monitor Peserta
              </button>
            </div>
          </div>

          {/* Active Judge selector (only visible when in Judge role) */}
          {activeRole === 'judge' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Juri Aktif:</span>
              <select
                value={selectedJudge?.id || ''}
                onChange={(e) => {
                  const j = eventConfig.judges.find((judge) => judge.id === e.target.value);
                  if (j) setSelectedJudge(j);
                }}
                className="bg-slate-900 border border-slate-700 text-indigo-200 font-medium rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {eventConfig.judges.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name} ({j.roleTitle.split(':')[0]})
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeRole === 'admin' && (
            <div className="text-indigo-400 font-medium flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Akses Penuh: Manajemen Peserta, Kunci Rekapitulasi & Ekspor Dokumen</span>
            </div>
          )}

          {activeRole === 'viewer' && (
            <div className="text-amber-400 font-medium flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Mode Live Board: Menampilkan Papan Skor & Status Peserta</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
