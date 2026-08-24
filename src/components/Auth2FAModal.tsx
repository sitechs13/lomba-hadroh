import React, { useState } from 'react';
import { X, ShieldCheck, KeyRound, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { generateTOTP, verifyTOTP } from '../utils/crypto';

interface Auth2FAModalProps {
  isOpen: boolean;
  onClose: () => void;
  is2FAEnabled: boolean;
  onToggle2FA: (enabled: boolean) => void;
  admin2FAConfig: { enabled: boolean; secret: string; backupPin: string };
  onUpdateConfig: (config: { enabled: boolean; secret: string; backupPin: string }) => void;
}

export const Auth2FAModal: React.FC<Auth2FAModalProps> = ({
  isOpen,
  onClose,
  is2FAEnabled,
  onToggle2FA,
  admin2FAConfig,
  onUpdateConfig,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [backupPin, setBackupPin] = useState(admin2FAConfig.backupPin);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerifyAndToggle = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // If disabling
    if (is2FAEnabled) {
      const isValid = await verifyTOTP(inputCode, admin2FAConfig.secret);
      if (isValid || inputCode.trim() === admin2FAConfig.backupPin) {
        onToggle2FA(false);
        setSuccessMsg('2FA berhasil dinonaktifkan.');
        setTimeout(() => onClose(), 1000);
      } else {
        setErrorMsg('Kode 2FA atau PIN tidak valid untuk mematikan 2FA!');
      }
      return;
    }

    // If enabling
    const isValid = await verifyTOTP(inputCode, admin2FAConfig.secret);
    if (isValid || inputCode.trim() === backupPin) {
      onUpdateConfig({
        ...admin2FAConfig,
        enabled: true,
        backupPin,
      });
      onToggle2FA(true);
      setSuccessMsg('2FA berhasil diaktifkan dengan aman!');
      setTimeout(() => onClose(), 1000);
    } else {
      setErrorMsg('Kode verifikasi salah. Masukkan kode 6 digit dari Authenticator atau PIN.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base text-white">
              {is2FAEnabled ? 'Kelola Autentikasi 2FA' : 'Aktivasi Autentikasi Dua Faktor'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-600">
            Autentikasi dua faktor menambahkan lapisan perlindungan ekstra untuk mencegah perubahan skor tanpa otorisasi.
          </p>

          <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2">
            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span>Secret Key (Authenticator):</span>
              <span className="font-mono text-amber-300 font-bold">{admin2FAConfig.secret}</span>
            </div>
            <p className="text-[10px] text-slate-400">
              *Masukkan kunci di atas pada aplikasi Google Authenticator atau gunakan PIN cadangan.
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              PIN Cadangan Admin (4 Digit)
            </label>
            <input
              type="password"
              maxLength={6}
              value={backupPin}
              onChange={(e) => setBackupPin(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-sm tracking-widest text-center focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Masukkan Kode OTP 6-Digit / PIN untuk Konfirmasi
            </label>
            <input
              type="text"
              maxLength={6}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Contoh: 123456 atau PIN"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-sm tracking-widest text-center focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-50 text-red-700 rounded-lg flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Tutup
            </button>
            <button
              onClick={handleVerifyAndToggle}
              className={`px-5 py-2 font-bold text-white rounded-xl shadow-xs transition-colors ${
                is2FAEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {is2FAEnabled ? 'Nonaktifkan 2FA' : 'Aktifkan 2FA Sekarang'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
