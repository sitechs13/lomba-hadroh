import React, { useState, useRef } from 'react';
import {
  Plus,
  Search,
  Upload,
  FileText,
  Music,
  Image as ImageIcon,
  Trash2,
  Edit2,
  Phone,
  Play,
  Pause,
  ExternalLink,
  CheckCircle2,
  Clock,
  Volume2,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ParticipantGroup,
  AttachedFile,
  HadrohCategory,
  EventConfig,
} from '../types/hadroh';

interface ParticipantsViewProps {
  participants: ParticipantGroup[];
  eventConfig: EventConfig;
  onAddParticipant: (participant: ParticipantGroup) => void;
  onUpdateParticipant: (participant: ParticipantGroup) => void;
  onDeleteParticipant: (id: string) => void;
}

export const ParticipantsView: React.FC<ParticipantsViewProps> = ({
  participants,
  eventConfig,
  onAddParticipant,
  onUpdateParticipant,
  onDeleteParticipant,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<ParticipantGroup | null>(null);

  // Audio preview playback state
  const [currentPlayingAudio, setCurrentPlayingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // File upload state for specific participant modal
  const [activeUploadPartId, setActiveUploadPartId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<ParticipantGroup>>({
    orderNumber: participants.length + 1,
    groupName: '',
    institution: '',
    category: eventConfig.category,
    leadVocalist: '',
    leadDrummer: '',
    songMandatory: 'Ya Hanana',
    songChoice: '',
    contactPhone: '',
    status: 'waiting',
  });

  const handleOpenAddModal = (itemToEdit?: ParticipantGroup) => {
    if (itemToEdit) {
      setEditingParticipant(itemToEdit);
      setFormData({ ...itemToEdit });
    } else {
      setEditingParticipant(null);
      setFormData({
        orderNumber: participants.length + 1,
        groupName: '',
        institution: '',
        category: eventConfig.category,
        leadVocalist: '',
        leadDrummer: '',
        songMandatory: 'Ya Hanana',
        songChoice: '',
        contactPhone: '',
        status: 'waiting',
      });
    }
    setIsAddModalOpen(true);
  };

  const handleSaveParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.groupName) return;

    if (editingParticipant) {
      const updated: ParticipantGroup = {
        ...(editingParticipant as ParticipantGroup),
        ...formData,
      } as ParticipantGroup;
      onUpdateParticipant(updated);
    } else {
      const newPart: ParticipantGroup = {
        id: 'part-' + Date.now(),
        orderNumber: Number(formData.orderNumber) || participants.length + 1,
        groupName: formData.groupName || 'Grup Hadroh Baru',
        institution: formData.institution || 'Lembaga / Pesantren',
        category: (formData.category as HadrohCategory) || 'banjari',
        leadVocalist: formData.leadVocalist || '-',
        leadDrummer: formData.leadDrummer || '-',
        songMandatory: formData.songMandatory || '-',
        songChoice: formData.songChoice || '-',
        contactPhone: formData.contactPhone || '-',
        status: (formData.status as any) || 'waiting',
        attachedFiles: [],
        createdAt: new Date().toISOString(),
      };
      onAddParticipant(newPart);
    }
    setIsAddModalOpen(false);
  };

  // Direct File Upload from Device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, participantId: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const participant = participants.find((p) => p.id === participantId);
    if (!participant) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      let fileType: AttachedFile['type'] = 'document';

      if (file.type.startsWith('image/')) fileType = 'photo';
      else if (file.type.startsWith('audio/')) fileType = 'audio';
      else if (file.name.endsWith('.txt') || file.name.endsWith('.pdf') || file.name.endsWith('.doc')) fileType = 'syaiir';

      reader.onload = (event) => {
        const newAttachment: AttachedFile = {
          id: 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          name: file.name,
          type: fileType,
          size: file.size,
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
          dataUrl: event.target?.result as string,
          description: `Berkas ${fileType} diunggah dari perangkat`,
        };

        const updatedPart: ParticipantGroup = {
          ...participant,
          attachedFiles: [...participant.attachedFiles, newAttachment],
        };
        onUpdateParticipant(updatedPart);
      };

      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
    setActiveUploadPartId(null);
  };

  const handleDeleteAttachment = (participantId: string, fileId: string) => {
    const participant = participants.find((p) => p.id === participantId);
    if (!participant) return;

    const updatedPart: ParticipantGroup = {
      ...participant,
      attachedFiles: participant.attachedFiles.filter((f) => f.id !== fileId),
    };
    onUpdateParticipant(updatedPart);
  };

  const togglePlayAudio = (dataUrl: string) => {
    if (currentPlayingAudio === dataUrl) {
      audioRef.current?.pause();
      setCurrentPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = dataUrl;
        audioRef.current.play();
        setCurrentPlayingAudio(dataUrl);
      }
    }
  };

  // Filtered List
  const filteredParticipants = participants
    .filter((p) => {
      const matchesSearch =
        p.groupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.leadVocalist.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = filterCategory === 'all' || p.category === filterCategory;
      return matchesSearch && matchesCat;
    })
    .sort((a, b) => a.orderNumber - b.orderNumber);

  return (
    <div className="space-y-6 pb-12">
      {/* Hidden audio element for preview */}
      <audio
        ref={audioRef}
        onEnded={() => setCurrentPlayingAudio(null)}
        onError={() => setCurrentPlayingAudio(null)}
      />

      {/* Top Action Bar */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search & Filter */}
        <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama grup, ponpes, vokalis..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="all">Semua Kategori</option>
            <option value="banjari">Al-Banjari</option>
            <option value="habsyi">Simthudduror / Habsyi</option>
            <option value="kontemporer">Kontemporer & Kreasi</option>
            <option value="marawis">Marawis</option>
            <option value="klasik">Klasik</option>
          </select>
        </div>

        {/* Add Participant Button */}
        <button
          onClick={() => handleOpenAddModal()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Tambah Kontingen Peserta
        </button>
      </div>

      {/* Participants Card List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredParticipants.map((part) => (
          <div
            key={part.id}
            className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between hover:border-indigo-500/40 hover:shadow-sm transition-all group"
          >
            <div>
              {/* Header: Number & Status */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-slate-900 text-indigo-300 flex items-center justify-center font-bold text-sm shadow-xs border border-slate-800">
                    #{String(part.orderNumber).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                      {part.groupName}
                    </h3>
                    <p className="text-xs text-slate-500">{part.institution}</p>
                  </div>
                </div>

                {/* Status Badge */}
                <select
                  value={part.status}
                  onChange={(e) =>
                    onUpdateParticipant({ ...part, status: e.target.value as ParticipantGroup['status'] })
                  }
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg border focus:outline-none ${
                    part.status === 'finished'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : part.status === 'performing'
                      ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                      : part.status === 'disqualified'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <option value="waiting">⏳ Menunggu</option>
                  <option value="performing">🎤 Tampil</option>
                  <option value="finished">✅ Selesai</option>
                  <option value="disqualified">❌ Diskualifikasi</option>
                </select>
              </div>

              {/* Song details */}
              <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs text-slate-700 mb-3 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Lagu Wajib:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[170px]">
                    🎵 {part.songMandatory}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Lagu Pilihan:</span>
                  <span className="font-medium text-slate-900 truncate max-w-[170px]">
                    ✨ {part.songChoice}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500 font-medium">Vokalis / Penabuh:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                    {part.leadVocalist} / {part.leadDrummer}
                  </span>
                </div>
              </div>

              {/* Attached Files Section (Uploaded from Device) */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" /> Berkas Pendukung ({part.attachedFiles.length}):
                  </span>
                  <label className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3" /> Unggah Berkas
                    <input
                      type="file"
                      multiple
                      accept="audio/*,image/*,.pdf,.txt,.doc,.docx"
                      onChange={(e) => handleFileUpload(e, part.id)}
                      className="hidden"
                    />
                  </label>
                </div>

                {part.attachedFiles.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic bg-slate-50/70 p-2 rounded-lg text-center border border-dashed border-slate-200">
                    Belum ada berkas teks syair / audio rekaman yang diunggah
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {part.attachedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate max-w-[180px]">
                          {file.type === 'audio' ? (
                            <button
                              type="button"
                              onClick={() => file.dataUrl && togglePlayAudio(file.dataUrl)}
                              className="p-1 rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
                              title="Putar Audio"
                            >
                              {currentPlayingAudio === file.dataUrl ? (
                                <Pause className="w-3 h-3" />
                              ) : (
                                <Play className="w-3 h-3" />
                              )}
                            </button>
                          ) : file.type === 'photo' ? (
                            <ImageIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          )}
                          <span className="font-medium text-slate-800 truncate" title={file.name}>
                            {file.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {file.dataUrl && (
                            <a
                              href={file.dataUrl}
                              download={file.name}
                              className="text-slate-500 hover:text-indigo-600"
                              title="Unduh Berkas"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(part.id, file.id)}
                            className="text-red-400 hover:text-red-600"
                            title="Hapus Berkas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Card Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <Phone className="w-3 h-3" />
                <span>{part.contactPhone || 'Tanpa Kontak'}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenAddModal(part)}
                  className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Edit Data Peserta"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Hapus grup "${part.groupName}" dari daftar peserta?`)) {
                      onDeleteParticipant(part.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Hapus Peserta"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Participant Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                {editingParticipant ? 'Ubah Data Kontingen' : 'Pendaftaran Kontingen Hadroh Baru'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveParticipant} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    No. Tampil
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.orderNumber}
                    onChange={(e) => setFormData({ ...formData, orderNumber: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nama Grup Hadroh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: Syauqul Musthofa"
                    value={formData.groupName}
                    onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Asal Lembaga / Ponpes / Majelis / Daerah
                </label>
                <input
                  type="text"
                  placeholder="Misal: PP. Darussalam / Majelis Rasulullah"
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Lagu Wajib
                  </label>
                  <input
                    type="text"
                    placeholder="Misal: Ya Hanana / Ya Imamarusli"
                    value={formData.songMandatory}
                    onChange={(e) => setFormData({ ...formData, songMandatory: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Lagu Pilihan
                  </label>
                  <input
                    type="text"
                    placeholder="Misal: Padang Bulan / Qomarun"
                    value={formData.songChoice}
                    onChange={(e) => setFormData({ ...formData, songChoice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Vokalis Utama
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Vokalis"
                    value={formData.leadVocalist}
                    onChange={(e) => setFormData({ ...formData, leadVocalist: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Penabuh Utama
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Penabuh Terbang"
                    value={formData.leadDrummer}
                    onChange={(e) => setFormData({ ...formData, leadDrummer: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    No. Kontak WhatsApp / HP
                  </label>
                  <input
                    type="tel"
                    placeholder="08123456789"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Kategori Lomba
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as HadrohCategory })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="banjari">Al-Banjari</option>
                    <option value="habsyi">Simthudduror / Habsyi</option>
                    <option value="kontemporer">Kontemporer</option>
                    <option value="marawis">Marawis</option>
                    <option value="klasik">Klasik</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  Simpan Kontingen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
