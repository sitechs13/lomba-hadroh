import React, { useState } from 'react';
import { X, Plus, Trash2, Save, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { EventConfig, JudgeProfile, HadrohCategory, Criterion } from '../types/hadroh';
import { DEFAULT_EVENT, DEFAULT_CRITERIA, DEFAULT_JUDGES } from '../utils/storage';

interface EventConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventConfig: EventConfig;
  onSave: (config: EventConfig) => void;
}

export const EventConfigModal: React.FC<EventConfigModalProps> = ({
  isOpen,
  onClose,
  eventConfig,
  onSave,
}) => {
  const [formData, setFormData] = useState<EventConfig>({ ...eventConfig });
  const [activeTab, setActiveTab] = useState<'general' | 'judges' | 'criteria'>('general');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleGeneralChange = (field: keyof EventConfig, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Judge management
  const handleAddJudge = () => {
    const nextNum = formData.judges.length + 1;
    const newJudge: JudgeProfile = {
      id: 'juri-' + Date.now(),
      name: `Ustadz Baru ${nextNum}`,
      roleTitle: `Dewan Juri ${nextNum}: Bidang Umum`,
      specialty: 'umum',
      pinCode: '1234',
      twoFactorEnabled: false,
    };
    setFormData((prev) => ({
      ...prev,
      judges: [...prev.judges, newJudge],
    }));
  };

  const handleUpdateJudge = (id: string, field: keyof JudgeProfile, value: any) => {
    setFormData((prev) => ({
      ...prev,
      judges: prev.judges.map((j) => (j.id === id ? { ...j, [field]: value } : j)),
    }));
  };

  const handleRemoveJudge = (id: string) => {
    if (formData.judges.length <= 1) {
      alert('Minimal harus ada 1 Dewan Juri!');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      judges: prev.judges.filter((j) => j.id !== id),
    }));
  };

  // Criteria management
  const handleUpdateCriterion = (id: string, field: keyof Criterion, value: any) => {
    setFormData((prev) => ({
      ...prev,
      criteria: prev.criteria.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    }));
  };

  const handleResetDefaults = () => {
    if (confirm('Kembalikan konfigurasi nama lomba, juri, dan kriteria ke pengaturan standar?')) {
      setFormData({ ...DEFAULT_EVENT, judges: DEFAULT_JUDGES, criteria: DEFAULT_CRITERIA });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-xs">
              ⚙️
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Konfigurasi Lomba & Juri</h3>
              <p className="text-xs text-slate-400">Atur nama lomba, dewan hakim/juri, dan kriteria penilaian</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'general'
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Informasi Lomba
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('judges')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'judges'
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Dewan Juri ({formData.judges.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('criteria')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'criteria'
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Kriteria Penilaian ({formData.criteria.length})
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lomba / Festival Hadroh <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.eventName}
                  onChange={(e) => handleGeneralChange('eventName', e.target.value)}
                  placeholder="Contoh: Festival Hadroh Al-Banjari Nasional 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tema / Sub-Judul Acara
                </label>
                <input
                  type="text"
                  value={formData.subTitle}
                  onChange={(e) => handleGeneralChange('subTitle', e.target.value)}
                  placeholder="Contoh: Semarak Sholawat Nusantara Menuju Generasi Rabbani"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Penyelenggara / Panitia
                  </label>
                  <input
                    type="text"
                    value={formData.organizer}
                    onChange={(e) => handleGeneralChange('organizer', e.target.value)}
                    placeholder="Contoh: ISHARI / LSBML & Ponpes"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kategori Lomba
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleGeneralChange('category', e.target.value as HadrohCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-800"
                  >
                    <option value="banjari">Hadroh Al-Banjari (Murni / Klasik)</option>
                    <option value="habsyi">Hadroh Simthudduror / Habsyi</option>
                    <option value="kontemporer">Hadroh Kontemporer & Kreasi</option>
                    <option value="marawis">Marawis / Rebana Biang</option>
                    <option value="klasik">Rebana Klasik Tradisional</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tempat / Gedung Pelaksanaan
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleGeneralChange('location', e.target.value)}
                    placeholder="Contoh: Auditorium Utama Islamic Centre"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tanggal Lomba
                  </label>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => handleGeneralChange('eventDate', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Durasi Tampil (Menit)
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="30"
                    value={formData.targetDurationMinutes}
                    onChange={(e) => handleGeneralChange('targetDurationMinutes', parseInt(e.target.value) || 10)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-800 font-semibold"
                  />
                  <p className="text-[11px] text-slate-500 mt-0.5">Waktu standar per grup tampil di panggung</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Toleransi Keterlambatan (Detik)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={formData.maxOvertimeGraceSec}
                    onChange={(e) => handleGeneralChange('maxOvertimeGraceSec', parseInt(e.target.value) || 60)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-800 font-semibold"
                  />
                  <p className="text-[11px] text-slate-500 mt-0.5">Batas toleransi sebelum pemotongan poin penalti waktu</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'judges' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Daftar Dewan Juri</h4>
                  <p className="text-xs text-slate-500">Sesuaikan nama juri, jabatan bidang, dan kode PIN login</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddJudge}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" /> Tambah Juri
                </button>
              </div>

              <div className="space-y-3">
                {formData.judges.map((judge, idx) => (
                  <div
                    key={judge.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap Juri</label>
                        <input
                          type="text"
                          required
                          value={judge.name}
                          onChange={(e) => handleUpdateJudge(judge.id, 'name', e.target.value)}
                          placeholder="Nama Juri"
                          className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Gelar / Bidang Penilaian</label>
                        <input
                          type="text"
                          value={judge.roleTitle}
                          onChange={(e) => handleUpdateJudge(judge.id, 'roleTitle', e.target.value)}
                          placeholder="Contoh: Juri 1: Vokal & Aransemen"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">PIN Akses (4 Digit)</label>
                          <input
                            type="text"
                            maxLength={6}
                            value={judge.pinCode}
                            onChange={(e) => handleUpdateJudge(judge.id, 'pinCode', e.target.value)}
                            placeholder="PIN"
                            className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="pt-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveJudge(judge.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Juri"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'criteria' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Kriteria & Rubrik Penilaian</h4>
                <p className="text-xs text-slate-500">Standar bobot nilai: Vokal 35%, Terbang 35%, Adab 15%, Fasohah 15%</p>
              </div>

              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                {formData.criteria.map((crit) => (
                  <div
                    key={crit.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={crit.name}
                        onChange={(e) => handleUpdateCriterion(crit.id, 'name', e.target.value)}
                        className="font-bold text-slate-800 flex-1 bg-white px-2 py-1 border border-slate-300 rounded-lg"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-medium">Skor Max:</span>
                        <input
                          type="number"
                          min="10"
                          max="100"
                          value={crit.maxScore}
                          onChange={(e) => handleUpdateCriterion(crit.id, 'maxScore', parseInt(e.target.value) || 50)}
                          className="w-14 px-1.5 py-1 text-center font-bold bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      value={crit.description}
                      onChange={(e) => handleUpdateCriterion(crit.id, 'description', e.target.value)}
                      placeholder="Panduan rubrik penilaian juri..."
                      className="text-slate-600 bg-white px-2 py-1 border border-slate-200 rounded-lg text-[11px]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Default
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all ${
                saveSuccess ? 'bg-indigo-800' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {saveSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              {saveSuccess ? 'Tersimpan!' : 'Simpan Konfigurasi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
