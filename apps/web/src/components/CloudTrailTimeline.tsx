import React, { useState } from 'react';
import { TimelineEvent } from '../types';
import { Clock, User, Filter } from 'lucide-react';

interface CloudTrailTimelineProps {
  events: TimelineEvent[];
  loading: boolean;
}

export const CloudTrailTimeline: React.FC<CloudTrailTimelineProps> = ({ events, loading }) => {
  const [filterSuspiciousOnly, setFilterSuspiciousOnly] = useState(false);

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-8 border border-slate-800 text-center py-16 animate-pulse">
        <Clock className="w-8 h-8 text-cyan-400 mx-auto animate-spin mb-3" />
        <h3 className="text-sm font-semibold text-slate-200">Reconstructing Chronological Management Timeline...</h3>
      </div>
    );
  }

  const displayedEvents = filterSuspiciousOnly
    ? events.filter((e) => e.is_suspicious)
    : events;

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              CloudTrail Incident Forensics & Drift Timeline
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-slate-300 border border-slate-800">
              AUDIT RECORD
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Correlating security findings with management events, mutating actors, and timestamps.
          </p>
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setFilterSuspiciousOnly(!filterSuspiciousOnly)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filterSuspiciousOnly
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Suspicious Events Only ({events.filter((e) => e.is_suspicious).length})</span>
        </button>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {displayedEvents.map((evt) => (
          <div
            key={evt.event_id}
            className={`p-4 rounded-xl border transition-all ${
              evt.is_suspicious
                ? 'bg-red-950/20 border-red-900/60 shadow-lg shadow-red-950/20'
                : 'bg-slate-950/60 border-slate-800/80'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                      evt.is_suspicious
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {evt.event_name}
                  </span>
                  <span className="text-xs text-slate-500">|</span>
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                    <User className="w-3 h-3 text-cyan-400" />
                    {evt.actor_username} ({evt.actor_arn.split('/').pop()})
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white pt-0.5">
                  {evt.security_significance}
                </h4>
              </div>

              <div className="text-right text-xs text-slate-400 font-mono">
                <div>{new Date(evt.event_time).toLocaleTimeString()}</div>
                <div className="text-[10px] text-slate-500">{new Date(evt.event_time).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Event Details Footer */}
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
              <div className="flex items-center gap-2 font-mono">
                <span>Source IP:</span>
                <span className="text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  {evt.source_ip}
                </span>
                {evt.target_resource_id && (
                  <>
                    <span>Target:</span>
                    <span className="text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      {evt.target_resource_id}
                    </span>
                  </>
                )}
              </div>
              <div className="font-mono text-slate-500 text-[10px]">
                Event ID: {evt.event_id}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
