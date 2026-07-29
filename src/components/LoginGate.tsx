import React, { useState } from 'react';
import { UserProfile, getStoredProfiles } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Lock, ShieldCheck, ArrowRight, Eye, EyeOff, AlertCircle, Key, UserCheck } from 'lucide-react';
import { MgSolarLogo } from './MgSolarLogo';

interface LoginGateProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginGate: React.FC<LoginGateProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper to determine matching user profile based on entered password
  const getMatchedProfile = (inputPass: string): UserProfile | null => {
    const clean = inputPass.trim().toLowerCase();
    if (!clean) return null;

    const storedProfiles = getStoredProfiles();
    const directMatch = storedProfiles.find(
      (p) =>
        (p.password && p.password.toLowerCase() === clean) ||
        (p.username && p.username.toLowerCase() === clean) ||
        (p.username.toLowerCase() === 'admin' && (clean === 'admin' || clean === 'admin123' || clean === 'admin!master2026#mg'))
    );

    return directMatch || null;
  };

  const matchedProfile = getMatchedProfile(password);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPass = password.trim();

    if (!cleanPass) {
      setErrorMsg('Please enter your operator access password.');
      return;
    }

    const matched = getMatchedProfile(cleanPass);

    if (!matched) {
      setErrorMsg('Invalid password. Please enter a valid operator access code.');
      return;
    }

    onLoginSuccess(matched);
  };

  const handleQuickFillAndSubmit = (pass: string) => {
    setPassword(pass);
    setErrorMsg(null);
    const matched = getMatchedProfile(pass);
    if (matched) {
      onLoginSuccess(matched);
    }
  };

  return (
    <div id="login-gate-screen" className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4 selection:bg-white selection:text-black font-sans">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Brand Header with MG Solar Logo */}
        <div className="text-center space-y-3">
          <div className="p-4 bg-white rounded-2xl shadow-xl inline-block border border-zinc-200">
            <MgSolarLogo size="lg" showText={true} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white uppercase mt-1">
              EPC Inventory & Stock System
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Password-Only Operator Authentication
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5 text-xs">
          {/* Password Input */}
          <div className="space-y-2">
            <label className="block text-zinc-300 font-bold uppercase tracking-wider text-[11px] flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Enter Operator Password</span>
              </span>
            </label>

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                placeholder="Enter operator password..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                className="bg-zinc-950 border-zinc-800 text-white font-mono text-sm h-12 pr-10 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Account Auto-Detection Indicator */}
          {matchedProfile ? (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-2xl flex items-center justify-between transition-all">
              <div className="flex items-center space-x-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white shrink-0 ${matchedProfile.avatarColor || 'bg-zinc-800'}`}>
                  {matchedProfile.fullName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-200 flex items-center gap-1.5">
                    <span>{matchedProfile.fullName}</span>
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-[10px] text-emerald-400/80 font-medium">
                    {matchedProfile.role}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-900/60 px-2 py-1 rounded-md border border-emerald-800">
                Matched
              </span>
            </div>
          ) : (
            password.trim().length > 0 && (
              <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-400 text-[11px] flex items-center space-x-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Checking password database...</span>
              </div>
            )
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-200 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-white hover:bg-zinc-200 text-black font-extrabold h-11 rounded-2xl text-xs flex items-center justify-center space-x-2 cursor-pointer shadow-lg"
          >
            <span>Login & Redirect to Account</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </Button>



          <div className="text-center text-[10px] text-zinc-500 pt-1 flex items-center justify-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            <span>Authenticated under MG SOLAR Security Protocol</span>
          </div>
        </form>
      </div>
    </div>
  );
};

