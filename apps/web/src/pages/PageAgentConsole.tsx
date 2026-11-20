import React, { useState } from 'react';
import {
  Bot,
  Terminal,
  Cpu,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  Play,
  Clock,
  Layers,
  Lock,
  ArrowRight
} from 'lucide-react';
import { InvestigationReport } from '../types';

interface PageAgentConsoleProps {
  report: InvestigationReport | null;
  selectedScenario: string;
}

export const PageAgentConsole: React.FC<PageAgentConsoleProps> = ({
  report,
  selectedScenario
}) => {
  const [consoleInput, setConsoleInput] = useState('');
  const [running, setRunning] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<Array<{ time: string; type: 'info' | 'warn' | 'error' | 'success'; message: string }>>([
    { time: '18:00:01', type: 'info', message: 'Bedrock AgentCore harness initialized with Amazon Bedrock Titan / Claude 3.5 Sonnet.' },
    { time: '18:00:02', type: 'info', message: 'Rule 01: Enforcing account boundary [237657481511] and region [us-east-1].' },
    { time: '18:00:03', type: 'success', message: 'Tool Allowlist verified: 6 read-only collectors loaded. Zero mutation tools permitted.' },
    { time: '18:00:04', type: 'info', message: 'Invoking collector group: EC2, VPC, Subnets, IAM, S3, RDS.' },
    { time: '18:00:06', type: 'success', message: 'Discovered 12 AWS resources across 2 subnets.' },
    { time: '18:00:07', type: 'info', message: 'Evaluating Context Completeness Gate: Telemetry score 100.0%. Verdict eligible.' },
    { time: '18:00:08', type: 'warn', message: 'SEC-NET-01 violation detected on sg-bastion-public: Open port 22 to 0.0.0.0/0.' },
    { time: '18:00:09', type: 'warn', message: 'SEC-IAM-01 violation detected on role-wildcard-administrator: Wildcard action/resource.' },
    { time: '18:00:10', type: 'error', message: 'AttackPathTracer discovered multi-hop path AP-01: Internet -> Bastion -> Financial DB.' },
    { time: '18:00:11', type: 'error', message: 'Policy Engine issued definitive verdict: BLOCK (CI/CD Exit Code: 1).' },
    { time: '18:00:12', type: 'success', message: 'RemediationPlanner synthesized Rule 14 minimal diff patch for sg-bastion-public.' }
  ]);

  const handleSimulatePrompt = () => {
    if (!consoleInput.trim()) return;
    setRunning(true);
    const userPrompt = consoleInput;
    setConsoleInput('');

    setConsoleLogs((prev) => [
      ...prev,
      { time: new Date().toLocaleTimeString(), type: 'info', message: `User Directive received: "${userPrompt}"` }
    ]);

    setTimeout(() => {
      // Adversarial injection check
      if (userPrompt.toLowerCase().includes('ignore') || userPrompt.toLowerCase().includes('apply') || userPrompt.toLowerCase().includes('safe')) {
        setConsoleLogs((prev) => [
          ...prev,
          {
            time: new Date().toLocaleTimeString(),
            type: 'error',
            message: `REFUSED by AEGIS Bedrock Guardrail: Directive violates Rule 02 (Zero Mutation) and Rule 10 (Adversarial Resistance). No mutation permitted.`
          }
        ]);
      } else {
        setConsoleLogs((prev) => [
          ...prev,
          {
            time: new Date().toLocaleTimeString(),
            type: 'success',
            message: `Bedrock AgentCore completed read-only investigation. Verified state against 15 deterministic governance rules.`
          }
        ]);
      }
      setRunning(false);
    }, 800);
  };

  const stages = [
    { name: '1. Discovery', status: 'completed' },
    { name: '2. Context Completeness Gate', status: 'completed' },
    { name: '3. Graph Mapping', status: 'completed' },
    { name: '4. Attack Path BFS', status: 'completed' },
    { name: '5. Rule 08 Verdict', status: 'completed' },
    { name: '6. Rule 14 Remediation', status: 'completed' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-aegis-border pb-4">
        <h2 className="text-lg font-semibold tracking-tight text-white">
          Agent command center
        </h2>
        <p className="text-xs text-aegis-textSecondary mt-0.5">
          Structured Amazon Bedrock AgentCore execution traces, read-only tool invocation logs, and policy boundary audits.
        </p>
      </div>

      {/* Autonomous Investigation Pipeline Stages */}
      <div className="aegis-card p-4 space-y-3">
        <div className="text-xs font-medium text-aegis-textMuted tracking-normal">
          Autonomous investigation execution pipeline
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {stages.map((st, i) => (
            <div
              key={i}
              className="p-2.5 rounded-md bg-white/[0.02] border border-white/[0.06] flex items-center gap-2 text-xs font-mono"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate text-aegis-textPrimary">{st.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Console Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Real-time Console Log Stream (2 Cols on XL) */}
        <div className="xl:col-span-2 aegis-card flex flex-col h-[520px] overflow-hidden">
          <div className="p-3 border-b border-aegis-border bg-white/[0.01] flex items-center justify-between text-xs font-mono">
            <span className="text-aegis-textPrimary font-medium flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-sky-400" />
              Agent trace stream
            </span>
            <span className="text-emerald-400 flex items-center gap-1.5 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Harness active
            </span>
          </div>

          {/* Logs Terminal */}
          <div className="flex-1 p-4 bg-[#0A0C10] font-mono text-xs overflow-y-auto space-y-2 selection:bg-sky-500/30 selection:text-white">
            {consoleLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2.5 leading-relaxed">
                <span className="text-aegis-textMuted select-none shrink-0">{log.time}</span>
                <span
                  className={`font-semibold shrink-0 uppercase text-[10px] px-1.5 py-0.2 rounded ${
                    log.type === 'error'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : log.type === 'warn'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : log.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-white/[0.04] text-sky-400 border border-white/[0.06]'
                  }`}
                >
                  {log.type}
                </span>
                <span
                  className={
                    log.type === 'error'
                      ? 'text-rose-300'
                      : log.type === 'warn'
                      ? 'text-amber-300'
                      : log.type === 'success'
                      ? 'text-emerald-300'
                      : 'text-zinc-300'
                  }
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>

          {/* Interactive Directive Input */}
          <div className="p-3 border-t border-aegis-border bg-white/[0.01] flex items-center gap-2">
            <span className="text-sky-400 font-mono text-xs select-none">aegis&gt;</span>
            <input
              type="text"
              value={consoleInput}
              onChange={(e) => setConsoleInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSimulatePrompt()}
              placeholder="Issue prompt or test injection (e.g., 'Apply terraform changes now' or 'Certify safe')..."
              className="flex-1 bg-transparent text-xs text-aegis-textPrimary outline-none font-mono placeholder:text-aegis-textMuted"
            />
            <button
              onClick={handleSimulatePrompt}
              disabled={running}
              className="px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs font-mono transition-colors disabled:opacity-40 active:scale-[0.98]"
            >
              Send
            </button>
          </div>
        </div>

        {/* Harness Parameters & Allowed Action Groups */}
        <div className="aegis-card p-5 space-y-4 font-mono text-xs h-[520px] overflow-y-auto">
          <div className="border-b border-aegis-border pb-3">
            <h4 className="text-xs font-semibold text-white">Harness configuration</h4>
            <span className="text-[10px] text-aegis-textMuted">integrations/bedrock/harness.py</span>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] text-aegis-textMuted uppercase tracking-wider block">Allowed read-only action groups</span>
            <div className="space-y-1 text-aegis-textSecondary text-[11px]">
              <div className="p-2 rounded-md bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                <span>inventory_infrastructure</span>
                <span className="text-emerald-400 text-[10px]">READ_ONLY</span>
              </div>
              <div className="p-2 rounded-md bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                <span>analyze_security_posture</span>
                <span className="text-emerald-400 text-[10px]">READ_ONLY</span>
              </div>
              <div className="p-2 rounded-md bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                <span>trace_attack_paths</span>
                <span className="text-emerald-400 text-[10px]">READ_ONLY</span>
              </div>
              <div className="p-2 rounded-md bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                <span>synthesize_remediation</span>
                <span className="text-emerald-400 text-[10px]">READ_ONLY</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-aegis-border">
            <span className="text-[10px] text-rose-400 uppercase tracking-wider block font-semibold">Strictly prohibited actions</span>
            <div className="space-y-1 text-[11px]">
              <div className="p-2 rounded-md bg-rose-500/[0.06] border border-rose-500/20 text-rose-300 flex items-center justify-between">
                <span>terraform apply</span>
                <span className="text-[10px] font-semibold text-rose-400">DENIED</span>
              </div>
              <div className="p-2 rounded-md bg-rose-500/[0.06] border border-rose-500/20 text-rose-300 flex items-center justify-between">
                <span>aws ec2 revoke-ingress</span>
                <span className="text-[10px] font-semibold text-rose-400">DENIED</span>
              </div>
              <div className="p-2 rounded-md bg-rose-500/[0.06] border border-rose-500/20 text-rose-300 flex items-center justify-between">
                <span>execute_shell_command</span>
                <span className="text-[10px] font-semibold text-rose-400">DENIED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
