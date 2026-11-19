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
          <h2 className="text-lg font-bold font-mono tracking-tight text-aegis-textPrimary">
            INCIDENT INVESTIGATION & CLOUDTRAIL FORENSICS
          </h2>
          <p className="text-xs text-aegis-textSecondary">
            Audit management events, IAM policy mutations, and suspicious ingress changes correlated with topology nodes.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="bg-aegis-bgSecondary border border-aegis-border rounded px-3 py-1.5 flex items-center gap-2">
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
            className={`px-3 py-1.5 rounded border text-xs font-mono transition-all flex items-center gap-1.5 ${
              suspiciousOnly
                ? 'bg-aegis-critical/20 text-aegis-critical border-aegis-critical/40 font-bold'
                : 'bg-aegis-bgSecondary text-aegis-textSecondary border-aegis-border hover:text-aegis-textPrimary'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Suspicious Only
          </button>
        </div>
      </div>

      {/* Split: Timeline (Left) + Event Inspector (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Timeline List (2 cols on XL) */}
        <div className="xl:col-span-2 aegis-card overflow-hidden flex flex-col">
          <div className="p-3 border-b border-aegis-border bg-aegis-bgSecondary text-xs font-mono text-aegis-textMuted flex items-center justify-between">
            <span>CHRONOLOGICAL CLOUDTRAIL TIMELINE ({filteredEvents.length} EVENTS)</span>
            <span>SOURCE: AWS CLOUDTRAIL US-EAST-1</span>
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
                        ? 'bg-aegis-panelElevated border-l-4 border-l-aegis-accentCyan'
                        : 'hover:bg-aegis-bgSecondary/60'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {ev.is_suspicious ? (
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-aegis-critical/20 text-aegis-critical border border-aegis-critical/30 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" /> Suspicious
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-aegis-panel text-aegis-textMuted border border-aegis-border">
                            Management
                          </span>
                        )}
                        <span className="text-xs font-bold font-mono text-aegis-textPrimary">{ev.event_name}</span>
                        <span className="text-[11px] font-mono text-aegis-textMuted truncate">· {ev.event_source}</span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-aegis-textSecondary">
                        <span>Actor: <strong className="font-mono text-aegis-accentBlue">{ev.actor_username}</strong></span>
                        <span>IP: <strong className="font-mono text-aegis-textMuted">{ev.source_ip}</strong></span>
                        <span>Time: <span className="font-mono text-aegis-textMuted">{new Date(ev.event_time).toLocaleTimeString()}</span></span>
                      </div>

                      <p className="text-xs text-aegis-textSecondary line-clamp-1 leading-relaxed">
                        {ev.security_significance}
                      </p>
                    </div>

                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-aegis-accentCyan translate-x-1' : 'text-aegis-textMuted'}`} />
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
                <span className="text-[10px] text-aegis-textMuted uppercase block">CLOUDTRAIL EVENT ID</span>
                <span className="text-aegis-accentCyan text-xs truncate block">{selectedEvent.event_id}</span>
                <h4 className="text-sm font-bold text-aegis-textPrimary pt-1">{selectedEvent.event_name}</h4>
              </div>

              <div>
                <span className="text-[10px] text-aegis-textMuted uppercase block">EVENT TIMESTAMP</span>
                <span className="text-aegis-textPrimary">{selectedEvent.event_time}</span>
              </div>

              <div>
                <span className="text-[10px] text-aegis-textMuted uppercase block">PRINCIPAL ACTOR ARN</span>
                <span className="text-aegis-aiViolet break-all text-[11px]">{selectedEvent.actor_arn}</span>
              </div>

              <div>
                <span className="text-[10px] text-aegis-textMuted uppercase block">SOURCE IP ADDRESS</span>
                <span className="text-aegis-textPrimary">{selectedEvent.source_ip}</span>
              </div>

              {selectedEvent.target_resource_id && (
                <div>
                  <span className="text-[10px] text-aegis-textMuted uppercase block">MUTATED TARGET RESOURCE</span>
                  <span className="text-aegis-accentBlue font-bold">{selectedEvent.target_resource_id}</span>
                </div>
              )}

              <div className="pt-2 border-t border-aegis-border space-y-1">
                <span className="text-[10px] text-aegis-textMuted uppercase block">SECURITY SIGNIFICANCE</span>
                <p className="font-sans text-xs text-aegis-textSecondary leading-relaxed bg-aegis-bgSecondary p-3 rounded border border-aegis-border">
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
