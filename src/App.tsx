/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation, AppTab } from './components/Navigation';
import { JudgeScoringView } from './components/JudgeScoringView';
import { ParticipantsView } from './components/ParticipantsView';
import { RecapView } from './components/RecapView';
import { AnalyticsView } from './components/AnalyticsView';
import { LiveBoardView } from './components/LiveBoardView';
import { ExportView } from './components/ExportView';
import { SecurityView } from './components/SecurityView';
import { EventConfigModal } from './components/EventConfigModal';
import { Auth2FAModal } from './components/Auth2FAModal';
import { NotificationToast, ToastMessage } from './components/NotificationToast';

import {
  EventConfig,
  JudgeProfile,
  ParticipantGroup,
  ScoreSubmission,
  UserRole,
  SecurityAuditLog,
  ApiWebhookConfig,
} from './types/hadroh';

import {
  loadEventConfig,
  saveEventConfig,
  loadParticipants,
  saveParticipants,
  loadScores,
  saveScores,
  loadAuditLogs,
  addAuditLog,
  loadOfflineQueue,
  saveOfflineQueue,
  loadWebhookConfig,
  saveWebhookConfig,
  loadAdmin2FA,
  saveAdmin2FA,
  computeRecapSummaries,
  seedSampleScores,
} from './utils/storage';

import {
  requestNotificationPermission,
  sendPushNotification,
  playChimeSound,
} from './utils/notifications';

export default function App() {
  // Core State
  const [eventConfig, setEventConfig] = useState<EventConfig>(loadEventConfig());
  const [participants, setParticipants] = useState<ParticipantGroup[]>(loadParticipants());
  const [scores, setScores] = useState<ScoreSubmission[]>(() => {
    const existing = loadScores();
    if (existing.length === 0) {
      const seeded = seedSampleScores(loadParticipants(), loadEventConfig().judges);
      saveScores(seeded);
      return seeded;
    }
    return existing;
  });

  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>(loadAuditLogs());
  const [offlineQueue, setOfflineQueue] = useState<ScoreSubmission[]>(loadOfflineQueue());
  const [admin2FAConfig, setAdmin2FAConfig] = useState(loadAdmin2FA());
  const [webhookConfig, setWebhookConfig] = useState<ApiWebhookConfig>(loadWebhookConfig());

  // UI State
  const [activeTab, setActiveTab] = useState<AppTab>('scoring');
  const [activeRole, setActiveRole] = useState<UserRole>('judge');
  const [selectedJudge, setSelectedJudge] = useState<JudgeProfile>(eventConfig.judges[0] || null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(admin2FAConfig.enabled);
  const [notificationEnabled, setNotificationEnabled] = useState<boolean>(
    'Notification' in window && Notification.permission === 'granted'
  );

  // Modals & Toasts
  const [isEventConfigOpen, setIsEventConfigOpen] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Show Toast Helper
  const triggerToast = (title: string, body: string) => {
    const newToast: ToastMessage = {
      id: 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title,
      body,
      timestamp: new Date().toISOString(),
    };
    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 5000);
  };

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerToast('Koneksi Pulih', 'Aplikasi kembali Online. Menyinkronkan antrian nilai offline...');
      // Sync offline queue
      if (offlineQueue.length > 0) {
        setScores((prev) => {
          const updated = [...prev];
          offlineQueue.forEach((queued) => {
            const idx = updated.findIndex((s) => s.id === queued.id);
            if (idx >= 0) updated[idx] = { ...queued, syncStatus: 'synced' };
            else updated.push({ ...queued, syncStatus: 'synced' });
          });
          saveScores(updated);
          return updated;
        });
        setOfflineQueue([]);
        saveOfflineQueue([]);
        addAuditLog('SYNC_OFFLINE_QUEUE', 'System', `Menyinkronkan ${offlineQueue.length} data antrian offline`);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      triggerToast('Mode Offline Aktif', 'Koneksi internet terputus. Penilaian tetap berjalan aman di perangkat.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineQueue]);

  // Request push notification
  const handleToggleNotification = async () => {
    const granted = await requestNotificationPermission();
    setNotificationEnabled(granted);
    if (granted) {
      triggerToast('Notifikasi Aktif', 'Pembaruan skor dan pengumuman juara akan muncul seketika.');
      sendPushNotification('E-Hadroh Judge', 'Notifikasi pembaruan skor live telah aktif!');
    } else {
      triggerToast('Izin Ditolak', 'Notifikasi browser dinonaktifkan di pengaturan browser Anda.');
    }
  };

  // Save Score from Judge
  const handleSaveScore = (submission: ScoreSubmission) => {
    setScores((prev) => {
      const idx = prev.findIndex((s) => s.id === submission.id);
      let updated: ScoreSubmission[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = submission;
      } else {
        updated = [submission, ...prev];
      }
      saveScores(updated);
      return updated;
    });

    if (!isOnline) {
      setOfflineQueue((prev) => {
        const nextQ = [...prev, submission];
        saveOfflineQueue(nextQ);
        return nextQ;
      });
    }

    addAuditLog(
      'SUBMIT_SCORE',
      submission.judgeName,
      `Nilai dikirim untuk peserta ID ${submission.participantId} (Total: ${submission.totalScore})`
    );

    triggerToast(
      'Nilai Berhasil Masuk!',
      `${submission.judgeName} telah mengesahkan nilai untuk peserta #${submission.participantId.replace('part-', '')}`
    );
  };

  // Participant Operations
  const handleAddParticipant = (part: ParticipantGroup) => {
    const updated = [...participants, part];
    setParticipants(updated);
    saveParticipants(updated);
    addAuditLog('ADD_PARTICIPANT', activeRole, `Menambahkan kontingen "${part.groupName}"`);
    triggerToast('Kontingen Ditambahkan', `Grup ${part.groupName} berhasil didaftarkan dengan No. Tampil #${part.orderNumber}`);
  };

  const handleUpdateParticipant = (part: ParticipantGroup) => {
    const updated = participants.map((p) => (p.id === part.id ? part : p));
    setParticipants(updated);
    saveParticipants(updated);
    addAuditLog('UPDATE_PARTICIPANT', activeRole, `Memperbarui data kontingen "${part.groupName}"`);
  };

  const handleDeleteParticipant = (id: string) => {
    const updated = participants.filter((p) => p.id !== id);
    setParticipants(updated);
    saveParticipants(updated);
    addAuditLog('DELETE_PARTICIPANT', activeRole, `Menghapus kontingen ID ${id}`);
    triggerToast('Kontingen Dihapus', 'Data kontingen telah dihapus dari daftar peserta.');
  };

  const handleUpdateParticipantStatus = (
    participantId: string,
    status: ParticipantGroup['status'],
    durationSec?: number
  ) => {
    setParticipants((prev) => {
      const nextParts = prev.map((p) =>
        p.id === participantId
          ? {
              ...p,
              status,
              performanceDurationSec: durationSec !== undefined ? durationSec : p.performanceDurationSec,
            }
          : p
      );
      saveParticipants(nextParts);
      return nextParts;
    });
  };

  // Event Config Operations
  const handleSaveEventConfig = (config: EventConfig) => {
    setEventConfig(config);
    saveEventConfig(config);
    if (config.judges[0] && (!selectedJudge || !config.judges.some((j) => j.id === selectedJudge.id))) {
      setSelectedJudge(config.judges[0]);
    }
    addAuditLog('UPDATE_EVENT_CONFIG', activeRole, `Memperbarui konfigurasi acara "${config.eventName}"`);
    triggerToast('Konfigurasi Disimpan', 'Nama lomba, juri, dan kriteria penilaian telah diperbarui.');
  };

  const handleToggleLockRecap = (isLocked: boolean) => {
    const updated = {
      ...eventConfig,
      isRecapLocked: isLocked,
      lockedAt: isLocked ? new Date().toISOString() : undefined,
      lockedBy: isLocked ? activeRole : undefined,
    };
    setEventConfig(updated);
    saveEventConfig(updated);
    addAuditLog(
      isLocked ? 'LOCK_RECAP' : 'UNLOCK_RECAP',
      activeRole,
      isLocked ? 'Mengunci & mengesahkan Berita Acara Dewan Juri' : 'Membuka kunci Berita Acara'
    );
    triggerToast(
      isLocked ? 'Berita Acara Disahkan!' : 'Kunci Rekapitulasi Dibuka',
      isLocked
        ? 'Seluruh nilai telah dikunci resmi untuk pengumuman juara.'
        : 'Dewan juri dapat mengubah nilai kembali.'
    );
  };

  // 2FA Operations
  const handleToggle2FA = (enabled: boolean) => {
    setIs2FAEnabled(enabled);
    const updated = { ...admin2FAConfig, enabled };
    setAdmin2FAConfig(updated);
    saveAdmin2FA(updated);
    addAuditLog('TOGGLE_2FA', activeRole, `2FA ${enabled ? 'Diaktifkan' : 'Dinonaktifkan'}`);
    triggerToast('Pengaturan Keamanan', `Autentikasi 2FA sekarang ${enabled ? 'Aktif' : 'Nonaktif'}.`);
  };

  // Full Restore Data
  const handleRestoreData = (restored: {
    eventConfig: EventConfig;
    participants: ParticipantGroup[];
    scores: ScoreSubmission[];
  }) => {
    setEventConfig(restored.eventConfig);
    saveEventConfig(restored.eventConfig);
    setParticipants(restored.participants);
    saveParticipants(restored.participants);
    setScores(restored.scores);
    saveScores(restored.scores);
    if (restored.eventConfig.judges[0]) {
      setSelectedJudge(restored.eventConfig.judges[0]);
    }
    addAuditLog('RESTORE_DATA', activeRole, `Memulihkan database cadangan terenkripsi`);
    triggerToast('Data Dipulihkan', 'Seluruh data lomba hadroh berhasil didekripsi & dipulihkan.');
  };

  // Webhook Update
  const handleUpdateWebhook = (config: ApiWebhookConfig) => {
    setWebhookConfig(config);
    saveWebhookConfig(config);
    addAuditLog('UPDATE_WEBHOOK', activeRole, `Memperbarui konfigurasi webhook URL`);
  };

  // Compute live recap list
  const recapList = computeRecapSummaries(participants, scores, eventConfig);

  // Unscored count for active judge
  const unscoredCount = participants.filter(
    (p) => !scores.some((s) => s.participantId === p.id && s.judgeId === selectedJudge?.id)
  ).length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-indigo-200 selection:text-indigo-900">
      {/* Top Navbar */}
      <Header
        eventConfig={eventConfig}
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        selectedJudge={selectedJudge}
        setSelectedJudge={setSelectedJudge}
        isOnline={isOnline}
        pendingSyncCount={offlineQueue.length}
        is2FAEnabled={is2FAEnabled}
        onOpen2FAModal={() => setIs2FAModalOpen(true)}
        onOpenEventConfig={() => setIsEventConfigOpen(true)}
        notificationEnabled={notificationEnabled}
        onToggleNotification={handleToggleNotification}
      />

      {/* Main Tab Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unscoredCount={unscoredCount}
        totalParticipants={participants.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'scoring' && (
          <JudgeScoringView
            eventConfig={eventConfig}
            currentJudge={selectedJudge || eventConfig.judges[0]}
            participants={participants}
            scores={scores}
            onSaveScore={handleSaveScore}
            onUpdateParticipantStatus={handleUpdateParticipantStatus}
          />
        )}

        {activeTab === 'participants' && (
          <ParticipantsView
            participants={participants}
            eventConfig={eventConfig}
            onAddParticipant={handleAddParticipant}
            onUpdateParticipant={handleUpdateParticipant}
            onDeleteParticipant={handleDeleteParticipant}
          />
        )}

        {activeTab === 'recap' && (
          <RecapView
            eventConfig={eventConfig}
            recapList={recapList}
            participants={participants}
            scores={scores}
            activeRole={activeRole}
            onToggleLockRecap={handleToggleLockRecap}
            onOpenExportTab={() => setActiveTab('export')}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            eventConfig={eventConfig}
            recapList={recapList}
            participants={participants}
            scores={scores}
          />
        )}

        {activeTab === 'liveboard' && (
          <LiveBoardView
            eventConfig={eventConfig}
            recapList={recapList}
            participants={participants}
          />
        )}

        {activeTab === 'export' && (
          <ExportView
            eventConfig={eventConfig}
            recapList={recapList}
            participants={participants}
            scores={scores}
            onRestoreData={handleRestoreData}
          />
        )}

        {activeTab === 'security' && (
          <SecurityView
            eventConfig={eventConfig}
            scores={scores}
            auditLogs={auditLogs}
            is2FAEnabled={is2FAEnabled}
            onToggle2FA={handleToggle2FA}
            admin2FAConfig={admin2FAConfig}
            webhookConfig={webhookConfig}
            onUpdateWebhook={handleUpdateWebhook}
          />
        )}
      </main>

      {/* Status Bar / Footer (Sleek Interface) */}
      <footer className="bg-[#1e293b] border-t border-slate-700/60 text-white text-xs py-3 px-4 sm:px-6 mt-auto shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-4 text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span>{isOnline ? 'Sistem Online' : 'Mode Offline Aktif'}</span>
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300 hidden sm:inline">Data Terenkripsi (AES-256 / SHA-256)</span>
            <span className="text-slate-500 hidden sm:inline">|</span>
            <span className="text-slate-300 truncate max-w-xs">{eventConfig.eventName}</span>
          </div>

          <div className="flex items-center gap-3 text-slate-300">
            <span className="text-[11px] text-slate-400">Total Kontingen: {participants.length}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${is2FAEnabled ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-slate-600 bg-slate-800 text-slate-400'}`}>
              {is2FAEnabled ? '2FA Verified' : '2FA Standby'}
            </span>
          </div>
        </div>
      </footer>

      {/* Modals & Popups */}
      <EventConfigModal
        isOpen={isEventConfigOpen}
        onClose={() => setIsEventConfigOpen(false)}
        eventConfig={eventConfig}
        onSave={handleSaveEventConfig}
      />

      <Auth2FAModal
        isOpen={is2FAModalOpen}
        onClose={() => setIs2FAModalOpen(false)}
        is2FAEnabled={is2FAEnabled}
        onToggle2FA={handleToggle2FA}
        admin2FAConfig={admin2FAConfig}
        onUpdateConfig={(cfg) => {
          setAdmin2FAConfig(cfg);
          saveAdmin2FA(cfg);
        }}
      />

      {/* In-app Push Notification Toasts */}
      <NotificationToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}
