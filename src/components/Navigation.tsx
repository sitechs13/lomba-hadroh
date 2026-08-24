import React from 'react';
import {
  FileText,
  Users,
  Award,
  BarChart3,
  Tv,
  Download,
  ShieldCheck,
} from 'lucide-react';

export type AppTab =
  | 'scoring'
  | 'participants'
  | 'recap'
  | 'analytics'
  | 'liveboard'
  | 'export'
  | 'security';

interface NavigationProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  unscoredCount?: number;
  totalParticipants: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  unscoredCount = 0,
  totalParticipants,
}) => {
  const tabs: { id: AppTab; label: string; icon: React.FC<{ className?: string }>; badge?: string | number }[] = [
    { id: 'scoring', label: 'Penilaian Juri', icon: FileText, badge: unscoredCount > 0 ? `${unscoredCount} Antri` : undefined },
    { id: 'participants', label: 'Daftar Peserta & Berkas', icon: Users, badge: totalParticipants },
    { id: 'recap', label: 'Rekapitulasi & Juara', icon: Award },
    { id: 'analytics', label: 'Dashboard Analitik', icon: BarChart3 },
    { id: 'liveboard', label: 'Layar Proyektor Live', icon: Tv },
    { id: 'export', label: 'Ekspor & Google Sheets', icon: Download },
    { id: 'security', label: 'Keamanan 2FA & API', icon: ShieldCheck },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-[98px] z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center space-x-1.5 overflow-x-auto py-2.5 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-indigo-800 text-white'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
