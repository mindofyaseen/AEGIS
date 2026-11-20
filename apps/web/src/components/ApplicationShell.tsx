import React, { useState } from 'react';
import {
  Shield,
  Activity,
  Layers,
  AlertTriangle,
  GitBranch,
  FileCode,
  Clock,
  Wrench,
  Bot,
  Scale,
  Crosshair,
  FileText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Lock,
  Globe,
  Terminal,
  Server,
  Cloud
} from 'lucide-react';
import { AppPage, Scenario } from '../types';

interface ApplicationShellProps {
  activePage: AppPage;
  setActivePage: (page: AppPage) => void;
  scenarios: Scenario[];
  selectedScenario: string;
  onSelectScenario: (scenarioId: string) => void;
  loading: boolean;
  onRefresh: () => void;
  onOpenConnectModal?: () => void;
  viewAudience?: 'business' | 'technical';
  setViewAudience?: (aud: 'business' | 'technical') => void;
  children: React.ReactNode;
}

export const ApplicationShell: React.FC<ApplicationShellProps> = ({
  activePage,
  setActivePage,
  scenarios,
  selectedScenario,
  onSelectScenario,
  loading,
  onRefresh,
  onOpenConnectModal,
  viewAudience = 'business',
  setViewAudience,
  children
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isBusiness = viewAudience === 'business';

  const navSections = [
    {
      title: isBusiness ? 'EXECUTIVE INSIGHTS' : 'OPERATIONS',
      items: [
        { id: 'overview' as AppPage, label: isBusiness ? 'Business Risk & Health' : 'Executive Overview', icon: Activity, badge: isBusiness ? 'Critical' : undefined },
        { id: 'explorer' as AppPage, label: isBusiness ? 'Visual Cloud Map' : 'Infrastructure Explorer', icon: Layers, badge: '3D' },
        { id: 'findings' as AppPage, label: isBusiness ? 'Vulnerabilities & Risk' : 'Security Findings', icon: AlertTriangle, badge: undefined },
        { id: 'attack_paths' as AppPage, label: isBusiness ? 'Hacker Simulation' : 'Attack Path Intelligence', icon: GitBranch, badge: 'Crucial' },
      ]
    },
    {
      title: isBusiness ? 'SAFETY & AUTOMATION' : 'DEVSECOPS & FORENSICS',
      items: [
        { id: 'change_intel' as AppPage, label: isBusiness ? 'Pre-Launch Safety Check' : 'Change Intelligence', icon: FileCode, badge: 'IaC' },
        { id: 'investigation' as AppPage, label: isBusiness ? 'Audit Log Forensics' : 'Incident Investigation', icon: Clock, badge: 'CloudTrail' },
        { id: 'remediation' as AppPage, label: isBusiness ? '1-Click Safety Fixes' : 'Remediation Workspace', icon: Wrench, badge: 'Git PR' },
      ]
    },
    {
      title: isBusiness ? 'AI SAFETY & COMPLIANCE' : 'AI AGENT & GOVERNANCE',
      items: [
        { id: 'agent_console' as AppPage, label: isBusiness ? 'AI Guardrails & Bedrock' : 'Agent Command Center', icon: Bot, badge: 'Bedrock' },
        { id: 'governance' as AppPage, label: isBusiness ? 'Safety Policies' : 'Governance & Rules', icon: Scale, badge: '15 Rules' },
        { id: 'adversarial_lab' as AppPage, label: isBusiness ? 'Hacker Stress Tests' : 'Adversarial Testing Lab', icon: Crosshair, badge: '14/14' },
        { id: 'compliance_audit' as AppPage, label: isBusiness ? 'Regulatory Scores' : 'Compliance & Audit', icon: FileText, badge: 'CIS/SOC2' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-aegis-bg text-aegis-textPrimary flex flex-col selection:bg-sky-500/30 selection:text-white">
      {/* 1. Top Enterprise Utility Bar */}
      <header className="h-13 border-b border-white/[0.07] bg-aegis-bgSecondary px-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {/* Brand Logo & Identifier */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-sky-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-semibold text-sm leading-none">
                <span className="text-white tracking-tight font-mono font-bold">AEGIS</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-white/[0.06] text-zinc-400 border border-white/[0.08] rounded">
                  v2.0
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 leading-none mt-1">
                Autonomous Cloud Security & DevSecOps
              </div>
            </div>
          </div>

          <div className="h-4 w-px bg-white/[0.08] hidden sm:block" />

          {/* AWS Account & Region Context */}
          <div className="hidden md:flex items-center gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.07] text-zinc-400">
              <Server className="w-3.5 h-3.5 text-zinc-400" />
              <span>AWS: <strong className="text-zinc-200">237657481511</strong></span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.07] text-zinc-400">
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              <span>Region: <strong className="text-zinc-200">us-east-1</strong></span>
            </div>
          </div>
        </div>

        {/* Global Controls & Scenario Switcher */}
        <div className="flex items-center gap-2.5">
          {/* Executive vs SecOps Audience Toggle */}
          {setViewAudience && (
            <div className="hidden sm:flex items-center bg-white/[0.04] border border-white/[0.08] rounded-md p-0.5 text-xs">
              <button
                onClick={() => setViewAudience('business')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  viewAudience === 'business'
                    ? 'bg-white/10 text-white font-medium shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Plain English for Leadership & Founders"
              >
                Executive mode
              </button>
              <button
                onClick={() => setViewAudience('technical')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  viewAudience === 'technical'
                    ? 'bg-white/10 text-white font-medium shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Technical SecOps Architecture"
              >
                SecOps mode
              </button>
            </div>
          )}

          {/* Connect Custom AWS Infrastructure Button */}
          {onOpenConnectModal && (
            <button
              onClick={onOpenConnectModal}
              className="px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>+ Connect AWS</span>
            </button>
          )}

          {/* Active Scenario Selector */}
          <div className="flex items-center gap-2">
            <select
              value={selectedScenario}
              onChange={(e) => onSelectScenario(e.target.value)}
              disabled={loading}
              className="bg-white/[0.04] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs font-mono text-zinc-200 outline-none hover:border-white/[0.15] focus:border-sky-500 cursor-pointer disabled:opacity-50"
            >
              {scenarios.map((sc) => (
                <option key={sc.id} value={sc.id} className="bg-[#141822] text-zinc-200">
                  {sc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Action */}
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Re-run Autonomous Investigation"
            className="p-1.5 rounded-md border border-white/[0.08] bg-white/[0.04] text-zinc-400 hover:text-white hover:border-white/[0.15] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          {/* Spend Target Preservation Pill */}
          <div className="hidden xl:flex items-center gap-2 bg-emerald-950/20 border border-emerald-500/20 px-2.5 py-1 rounded-md text-xs font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>AWS Spend: <strong>$0.00</strong> ($200 intact)</span>
          </div>

          {/* Mode Badge */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.07] text-[11px] font-mono text-zinc-400">
            <Lock className="w-3 h-3 text-zinc-400" />
            <span className="hidden sm:inline">Zero mutation</span>
          </div>
        </div>
      </header>

      {/* 2. Body: Collapsible Sidebar + Main Content View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside
          className={`border-r border-white/[0.07] bg-aegis-bgSecondary flex flex-col justify-between transition-all duration-200 select-none ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          {/* Navigation Links */}
          <div className="p-3 space-y-5 overflow-y-auto flex-1">
            {navSections.map((sec, secIdx) => (
              <div key={secIdx} className="space-y-1">
                {!sidebarCollapsed && (
                  <div className="px-3 text-[11px] font-medium text-zinc-500 tracking-normal mb-1.5">
                    {sec.title}
                  </div>
                )}
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActivePage(item.id)}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs transition-colors ${
                        isActive
                          ? 'bg-white/[0.07] text-white font-medium border-l-2 border-sky-400'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-400' : 'text-zinc-400'}`} />
                      {!sidebarCollapsed && (
                        <div className="flex-1 flex items-center justify-between text-left truncate">
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                                item.badge === '3D'
                                  ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                                  : item.badge === 'Crucial'
                                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                  : 'bg-white/[0.04] text-zinc-400 border-white/[0.06]'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Sidebar Footer & Collapse Toggle */}
          <div className="p-3 border-t border-aegis-border flex items-center justify-between text-xs text-aegis-textMuted">
            {!sidebarCollapsed && (
              <div className="font-mono text-[10px] truncate">
                <span>Bedrock AgentCore v2</span>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 rounded hover:bg-aegis-panel text-aegis-textSecondary hover:text-aegis-textPrimary transition-colors ml-auto"
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </aside>

        {/* Main Content Workspace */}
        <main className="flex-1 overflow-y-auto p-6 bg-aegis-bg space-y-6">
          {children}
        </main>
      </div>

      {/* 3. Global Status Bar Footer */}
      <footer className="border-t border-aegis-border bg-aegis-bgSecondary px-4 py-2 flex flex-wrap items-center justify-between text-[11px] font-mono text-aegis-textMuted">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-aegis-success">
            <span className="w-2 h-2 rounded-full bg-aegis-success" />
            Bedrock AgentCore Active
          </span>
          <span>Target AWS Boundary: <strong>us-east-1</strong></span>
          <span>Telemetry Freshness: <strong>Real-time</strong></span>
        </div>
        <div className="flex items-center gap-4">
          <span>Deterministic Context Completeness Gate: <strong>Active</strong></span>
          <span>OSI License: <strong>Apache-2.0</strong></span>
        </div>
      </footer>
    </div>
  );
};
