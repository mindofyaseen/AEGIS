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
  Server
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
  children
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navSections = [
    {
      title: 'OPERATIONS',
      items: [
        { id: 'overview' as AppPage, label: 'Executive Overview', icon: Activity, badge: undefined },
        { id: 'explorer' as AppPage, label: 'Infrastructure Explorer', icon: Layers, badge: '3D' },
        { id: 'findings' as AppPage, label: 'Security Findings', icon: AlertTriangle, badge: undefined },
        { id: 'attack_paths' as AppPage, label: 'Attack Path Intelligence', icon: GitBranch, badge: 'Crucial' },
      ]
    },
    {
      title: 'DEVSECOPS & FORENSICS',
      items: [
        { id: 'change_intel' as AppPage, label: 'Change Intelligence', icon: FileCode, badge: 'IaC' },
        { id: 'investigation' as AppPage, label: 'Incident Investigation', icon: Clock, badge: 'CloudTrail' },
        { id: 'remediation' as AppPage, label: 'Remediation Workspace', icon: Wrench, badge: 'Git PR' },
      ]
    },
    {
      title: 'AI AGENT & GOVERNANCE',
      items: [
        { id: 'agent_console' as AppPage, label: 'Agent Command Center', icon: Bot, badge: 'Bedrock' },
        { id: 'governance' as AppPage, label: 'Governance & Rules', icon: Scale, badge: '15 Rules' },
        { id: 'adversarial_lab' as AppPage, label: 'Adversarial Testing Lab', icon: Crosshair, badge: '14/14' },
        { id: 'compliance_audit' as AppPage, label: 'Compliance & Audit', icon: FileText, badge: 'CIS/SOC2' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-aegis-bg text-aegis-textPrimary flex flex-col selection:bg-aegis-accentCyan selection:text-black">
      {/* 1. Top Enterprise Command Bar */}
      <header className="h-14 border-b border-aegis-border bg-aegis-bgSecondary px-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {/* Brand Logo & Identifier */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-aegis-accentBlue to-aegis-accentCyan flex items-center justify-center text-black font-black text-sm shadow-glow-cyan">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold tracking-wider text-sm leading-none">
                <span className="text-aegis-textPrimary">AEGIS</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-aegis-accentCyan/20 text-aegis-accentCyan border border-aegis-accentCyan/30 rounded">
                  PRO
                </span>
              </div>
              <div className="text-[10px] font-mono text-aegis-textMuted leading-none mt-1">
                Autonomous Cloud Security & DevSecOps
              </div>
            </div>
          </div>

          <div className="h-5 w-px bg-aegis-border hidden sm:block" />

          {/* AWS Account & Region Context */}
          <div className="hidden md:flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5 bg-aegis-panel px-2.5 py-1 rounded border border-aegis-border text-aegis-textSecondary">
              <Server className="w-3.5 h-3.5 text-aegis-accentBlue" />
              <span>AWS: <strong className="text-aegis-textPrimary">237657481511</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-aegis-panel px-2.5 py-1 rounded border border-aegis-border text-aegis-textSecondary">
              <Globe className="w-3.5 h-3.5 text-aegis-accentCyan" />
              <span>Region: <strong className="text-aegis-textPrimary">us-east-1</strong></span>
            </div>
          </div>
        </div>

        {/* Global Controls & Scenario Switcher */}
        <div className="flex items-center gap-3">
          {/* Active Scenario Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-mono text-aegis-textMuted hidden lg:inline">Investigation Context:</label>
            <select
              value={selectedScenario}
              onChange={(e) => onSelectScenario(e.target.value)}
              disabled={loading}
              className="bg-aegis-panel border border-aegis-border rounded px-3 py-1 text-xs font-mono text-aegis-textPrimary outline-none focus:border-aegis-accentCyan cursor-pointer disabled:opacity-50"
            >
              {scenarios.map((sc) => (
                <option key={sc.id} value={sc.id}>
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
            className="p-1.5 rounded border border-aegis-border bg-aegis-panel text-aegis-textSecondary hover:text-aegis-textPrimary hover:border-aegis-borderLight transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-aegis-accentCyan' : ''}`} />
          </button>

          {/* Spend Target Preservation Pill */}
          <div className="hidden xl:flex items-center gap-2 bg-emerald-950/40 border border-emerald-600/40 px-2.5 py-1 rounded text-xs font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AWS Spend: <strong>$0.00</strong> ($200 Intact)</span>
          </div>

          {/* Mode Badge */}
          <div className="flex items-center gap-1.5 bg-aegis-panelElevated border border-aegis-border px-2 py-1 rounded text-[11px] font-mono text-aegis-accentCyan">
            <Lock className="w-3 h-3 text-aegis-accentCyan" />
            <span className="hidden sm:inline">ZERO MUTATION</span>
          </div>
        </div>
      </header>

      {/* 2. Body: Collapsible Sidebar + Main Content View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside
          className={`border-r border-aegis-border bg-aegis-bgSecondary flex flex-col justify-between transition-all duration-200 select-none ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          {/* Navigation Links */}
          <div className="p-3 space-y-5 overflow-y-auto flex-1">
            {navSections.map((sec, secIdx) => (
              <div key={secIdx} className="space-y-1">
                {!sidebarCollapsed && (
                  <div className="px-3 text-[10px] font-mono font-semibold uppercase text-aegis-textMuted tracking-wider mb-1.5">
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
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-aegis-panelElevated text-aegis-textPrimary border border-aegis-borderLight shadow-sm font-semibold'
                          : 'text-aegis-textSecondary hover:text-aegis-textPrimary hover:bg-aegis-panel'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-aegis-accentCyan' : 'text-aegis-textMuted'}`} />
                      {!sidebarCollapsed && (
                        <div className="flex-1 flex items-center justify-between text-left truncate">
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                                item.badge === '3D'
                                  ? 'bg-aegis-accentCyan/20 text-aegis-accentCyan border-aegis-accentCyan/30'
                                  : item.badge === 'Crucial'
                                  ? 'bg-aegis-critical/20 text-aegis-critical border-aegis-critical/30'
                                  : 'bg-aegis-panel text-aegis-textMuted border-aegis-border'
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
