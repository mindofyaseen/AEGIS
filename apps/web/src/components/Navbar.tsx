import React from 'react';
import { Shield, Lock, DollarSign, Activity, AlertTriangle, FileCode } from 'lucide-react';

interface NavbarProps {
  activeTab: 'investigation' | 'forensics' | 'adversarial' | 'rules';
  setActiveTab: (tab: 'investigation' | 'forensics' | 'adversarial' | 'rules') => void;
  onOpenRules: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenRules }) => {
  return (
    <header className="border-b border-slate-800 bg-[#0a0d14]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/40">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-xl text-white">AEGIS</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-cyan-950 text-cyan-400 border border-cyan-800/80">
                PROD AGENTCORE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Autonomous Cloud Security & DevSecOps Platform</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-sm">
          <button
            onClick={() => setActiveTab('investigation')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'investigation'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-4 h-4" />
            Security Investigation
          </button>
          <button
            onClick={() => setActiveTab('forensics')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'forensics'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            CloudTrail Timeline
          </button>
          <button
            onClick={() => setActiveTab('adversarial')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'adversarial'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Shield className="w-4 h-4" />
            Adversarial Suite (14/14)
          </button>
          <button
            onClick={onOpenRules}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
          >
            <FileCode className="w-4 h-4 text-cyan-400" />
            15 Rules
          </button>
        </nav>

        {/* Telemetry / Status Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-400">AWS:</span>
            <span className="font-mono text-slate-200">237657481511</span>
            <span className="text-slate-500 text-[10px]">us-east-1</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-400 font-medium">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Credits: $200.00 ($0 Spent)</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Read-Only Mode</span>
          </div>
        </div>
      </div>
    </header>
  );
};
