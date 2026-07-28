import React, { useState } from 'react';
import { UserProfile, PRDJsonOutput, updateProfilePasswordInStorage } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { User, LogOut, ShieldCheck, Mail, Briefcase, History, Check, Building, Phone, Key, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSwitchUser: (newUser: UserProfile) => void;
  onLogout: () => void;
  auditLogs: PRDJsonOutput[];
  onUpdateCurrentUser?: (updatedUser: UserProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSwitchUser,
  onLogout,
  auditLogs,
  onUpdateCurrentUser
}) => {
  const [isResetFormOpen, setIsResetFormOpen] = useState<boolean>(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState<string>('');
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');
  const [showCurrentPass, setShowCurrentPass] = useState<boolean>(false);
  const [showNewPass, setShowNewPass] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate movements performed by current user
  const userActionsCount = auditLogs.filter(
    (log) =>
      log.inventory_event.performed_by &&
      log.inventory_event.performed_by.toLowerCase().includes(currentUser.fullName.toLowerCase())
  ).length;

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const cleanCurrent = currentPasswordInput.trim();
    const cleanNew = newPasswordInput.trim();
    const cleanConfirm = confirmPasswordInput.trim();

    if (!cleanCurrent) {
      setFormError('Please enter your current password.');
      return;
    }

    if (currentUser.password && cleanCurrent.toLowerCase() !== currentUser.password.toLowerCase()) {
      setFormError('Current password does not match.');
      return;
    }

    if (!cleanNew) {
      setFormError('Please enter a new password.');
      return;
    }

    if (cleanNew.length < 6) {
      setFormError('New password must be at least 6 characters long.');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setFormError('New password and confirmation do not match.');
      return;
    }

    const updatedUser = updateProfilePasswordInStorage(currentUser.id, cleanNew);
    if (updatedUser) {
      if (onUpdateCurrentUser) {
        onUpdateCurrentUser(updatedUser);
      }
      setFormSuccess('Password reset successfully! Use your new password on your next login.');
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
    } else {
      setFormError('Failed to update password.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 font-sans">
      <div className="bg-white border border-zinc-200 rounded-2xl sm:rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-zinc-950 my-auto">
        {/* Header Banner */}
        <div className="bg-zinc-950 text-white p-4 sm:p-6 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md border border-zinc-700">
              Active Officer Session
            </span>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 text-sm font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-extrabold text-base sm:text-lg text-white border border-zinc-700 shrink-0 ${currentUser.avatarColor || 'bg-zinc-800'}`}>
              {currentUser.fullName.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-base sm:text-lg leading-tight truncate">{currentUser.fullName}</h3>
              <p className="text-xs text-zinc-300 font-medium truncate">{currentUser.role}</p>
              {currentUser.company && (
                <p className="text-[11px] text-zinc-400 font-normal truncate">{currentUser.company}</p>
              )}
            </div>
          </div>
        </div>

        {/* Content Details */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 text-xs">
          {/* Info stats */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="bg-zinc-50 border border-zinc-200 p-2.5 sm:p-3 rounded-2xl">
              <div className="text-zinc-500 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider mb-1">
                Audit Trail Logged
              </div>
              <div className="text-lg sm:text-xl font-black text-zinc-950 font-mono">
                {userActionsCount} <span className="text-xs text-zinc-500 font-normal">events</span>
              </div>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 p-2.5 sm:p-3 rounded-2xl">
              <div className="text-zinc-500 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider mb-1">
                Personnel ID
              </div>
              <div className="text-xs sm:text-sm font-black font-mono text-zinc-950 uppercase truncate">
                {currentUser.id}
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3.5 sm:p-4 space-y-2 text-xs">
            {currentUser.company && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-zinc-700">
                <div className="flex items-center space-x-1.5 shrink-0">
                  <Building className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="font-bold text-zinc-900">Company:</span>
                </div>
                <span className="text-zinc-700 font-medium break-words leading-tight">{currentUser.company}</span>
              </div>
            )}
            {currentUser.contactNumber && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-zinc-700">
                <div className="flex items-center space-x-1.5 shrink-0">
                  <Phone className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="font-bold text-zinc-900">Contact:</span>
                </div>
                <span className="font-mono text-zinc-700 break-all">{currentUser.contactNumber}</span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-zinc-700">
              <div className="flex items-center space-x-1.5 shrink-0">
                <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="font-bold text-zinc-900">Email:</span>
              </div>
              <span className="font-mono text-zinc-700 break-all leading-tight">{currentUser.email}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-zinc-700">
              <div className="flex items-center space-x-1.5 shrink-0">
                <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="font-bold text-zinc-900">Username:</span>
              </div>
              <span className="font-mono text-zinc-600 break-all">@{currentUser.username}</span>
            </div>
          </div>

          {/* Reset Password Form Accordion */}
          <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-zinc-50">
            <button
              type="button"
              onClick={() => {
                setIsResetFormOpen(!isResetFormOpen);
                setFormError(null);
                setFormSuccess(null);
              }}
              className="w-full p-3.5 flex items-center justify-between font-bold text-zinc-900 hover:bg-zinc-100 transition-colors text-xs cursor-pointer"
            >
              <span className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-amber-600" />
                <span>Reset Operator Password</span>
              </span>
              <span className="text-zinc-500 font-normal text-[11px]">
                {isResetFormOpen ? 'Cancel' : 'Change'}
              </span>
            </button>

            {isResetFormOpen && (
              <form onSubmit={handleResetPassword} className="p-3.5 pt-0 space-y-3 border-t border-zinc-200 bg-white">
                {formError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[11px] flex items-center space-x-2 mt-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {formSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-[11px] flex items-center space-x-2 mt-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{formSuccess}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Current Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showCurrentPass ? 'text' : 'password'}
                      required
                      placeholder="Enter current password..."
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      className="bg-zinc-50 border-zinc-300 text-zinc-900 h-9 text-xs pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                    >
                      {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      placeholder="Enter new password (min 6 chars)..."
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      className="bg-zinc-50 border-zinc-300 text-zinc-900 h-9 text-xs pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                    >
                      {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    required
                    placeholder="Re-enter new password..."
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    className="bg-zinc-50 border-zinc-300 text-zinc-900 h-9 text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-zinc-900 hover:bg-black text-white font-bold h-9 rounded-xl text-xs cursor-pointer mt-1"
                >
                  Apply & Save New Password
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Footer Lock/Logout */}
        <div className="p-3 sm:p-4 border-t border-zinc-200 flex items-center justify-between gap-2 shrink-0 bg-white">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs font-semibold"
          >
            Close
          </Button>

          <Button
            type="button"
            onClick={onLogout}
            className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-white" />
            <span>Lock & Logout</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

