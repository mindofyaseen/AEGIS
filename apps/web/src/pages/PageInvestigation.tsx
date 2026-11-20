import React, { useState } from 'react';
import { TimelineEvent } from '../types';
import {
  Clock,
  AlertTriangle,
  Search,
  Filter,
  User,
  Globe,
  Server,
  FileText,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface PageInvestigationProps {
  events: TimelineEvent[];
}

export const PageInvestigation: React.FC<PageInvestigationProps> = ({ events }) => {
  const [search, setSearch] = useState('');
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(
    events.length > 0 ? events[0] : null
  );

  const filteredEvents = events.filter((ev) => {
    const matchSearch =
      ev.event_name.toLowerCase().includes(search.toLowerCase()) ||
      ev.actor_username.toLowerCase().includes(search.toLowerCase()) ||
      ev.source_ip.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (suspiciousOnly && !ev.is_suspicious) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-aegis-border pb-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">
            Incident investigation & forensics
          </h2>
          <p className="text-xs text-aegis-textSecondary mt-0.5">
            Audit CloudTrail management events, IAM policy mutations, and suspicious ingress changes correlated with topology nodes.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="bg-white/[0.02] border border-white/[0.08] rounded-md px-3 py-1.5 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-aegis-textMuted" />
            <input
              type="text"
              placeholder="Search event, actor, IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs text-aegis-textPrimary outline-none w-48 placeholder:text-aegis-textMuted font-mono"
            />
          </div>

          <button
            onClick={() => setSuspiciousOnly(!suspiciousOnly)}
            className={`px-3 py-1.5 rounded-md border text-xs font-mono transition-all flex items-center gap-1.5 ${
              suspiciousOnly
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 font-medium'
                : 'bg-white/[0.02] text-aegis-textSecondary border-white/[0.08] hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Suspicious only
          </button>
        </div>
      </div>

      {/* Split: Timeline (Left) + Event Inspector (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Timeline List (2 cols on XL) */}
        <div className="xl:col-span-2 aegis-card overflow-hidden flex flex-col">
          <div className="p-3 border-b border-aegis-border bg-white/[0.01] text-xs font-mono text-aegis-textMuted flex items-center justify-between">
            <span>Chronological CloudTrail timeline ({filteredEvents.length} events)</span>
            <span>Source: AWS CloudTrail (us-east-1)</span>
          </div>

          <div className="divide-y divide-aegis-border overflow-y-auto max-h-[600px]">
            {filteredEvents.length === 0 ? (
              <div className="p-12 text-center text-xs font-mono text-aegis-textMuted">
                ✓ No matching CloudTrail events discovered.
              </div>
            ) : (
              filteredEvents.map((ev) => {
                const isSelected = selectedEvent?.event_id === ev.event_id;
                return (
                  <div
                    key={ev.event_id}
                    onClick={() => setSelectedEvent(ev)}
                    className={`p-4 cursor-pointer transition-all flex items-start justify-between gap-4 ${
                      isSelected
                        ? 'bg-white/[0.03] border-l-2 border-l-sky-400'
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {ev.is_suspicious ? (
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" /> Suspicious
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-white/[0.03] text-aegis-textMuted border border-white/[0.06]">
                            Management
                          </span>
                        )}
                        <span className="text-xs font-semibold font-mono text-white">{ev.event_name}</span>
                        <span className="text-[11px] font-mono text-aegis-textMuted truncate">· {ev.event_source}</span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-aegis-textSecondary">
                        <span>Actor: <strong className="font-mono text-sky-400">{ev.actor_username}</strong></span>
                        <span>IP: <strong className="font-mono text-zinc-400">{ev.source_ip}</strong></span>
                        <span>Time: <span className="font-mono text-aegis-textMuted">{new Date(ev.event_time).toLocaleTimeString()}</span></span>
                      </div>

                      <p className="text-xs text-aegis-textSecondary line-clamp-1 leading-relaxed">
                        {ev.security_significance}
                      </p>
                    </div>

                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-sky-400 translate-x-1' : 'text-aegis-textMuted'}`} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Event Inspector Drawer */}
        <div className="aegis-card p-5 space-y-4 h-[600px] overflow-y-auto">
          {selectedEvent ? (
            <div className="space-y-4 font-mono text-xs">
              <div className="border-b border-aegis-border pb-3 space-y-1">
                <span className="text-[10px] text-aegis-textMuted uppercase tracking-wider block">CloudTrail event ID</span>
                <span className="text-sky-400 text-xs truncate block">{selectedEvent.event_id}</span>
                <h4 className="text-sm font-semibold text-white pt-1">{selectedEvent.event_name}</h4>
              </div>

              <div>
                <span className="text-[10px] text-aegis-textMuted uppercase tracking-wider block">Event timestamp</span>
                <span className="text-zinc-300">{selectedEvent.event_time}</span>
              </div>

              <div>
                <span className="text-[10px] text-aegis-textMuted uppercase tracking-wider block">Principal actor ARN</span>
                <span className="text-zinc-300 break-all text-[11px]">{selectedEvent.actor_arn}</span>
              </div>

              <div>
                <span className="text-[10px] text-aegis-textMuted uppercase tracking-wider block">Source IP address</span>
                <span className="text-zinc-300">{selectedEvent.source_ip}</span>
              </div>

              {selectedEvent.target_resource_id && (
                <div>
                  <span className="text-[10px] text-aegis-textMuted uppercase tracking-wider block">Mutated target resource</span>
                  <span className="text-sky-400 font-semibold">{selectedEvent.target_resource_id}</span>
                </div>
              )}

              <div className="pt-2 border-t border-aegis-border space-y-1">
                <span className="text-[10px] text-aegis-textMuted uppercase tracking-wider block">Security significance</span>
                <p className="font-sans text-xs text-aegis-textSecondary leading-relaxed bg-white/[0.02] p-3 rounded-md border border-white/[0.06]">
                  {selectedEvent.security_significance}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center text-aegis-textMuted text-xs my-auto">Select a CloudTrail event to inspect forensic details.</div>
          )}
        </div>
      </div>
    </div>
  );
};
