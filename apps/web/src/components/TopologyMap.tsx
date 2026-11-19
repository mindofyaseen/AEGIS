import React, { useState } from 'react';
import { AttackPath } from '../types';
import { Globe, Server, Shield, Key, Database, HardDrive, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react';

interface TopologyMapProps {
  attackPaths: AttackPath[];
  isHardened?: boolean;
}

interface NodeData {
  id: string;
  label: string;
  type: string;
  status: 'compromised' | 'exposed' | 'hardened' | 'target' | 'normal';
  details: string;
  x: number;
  y: number;
}

export const TopologyMap: React.FC<TopologyMapProps> = ({ attackPaths, isHardened }) => {
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);

  // Nodes for E-Commerce VPC vs Compliant Hardened VPC
  const nodes: NodeData[] = isHardened
    ? [
        {
          id: 'igw-compliant-01',
          label: 'Internet Gateway',
          type: 'AWS::EC2::InternetGateway',
          status: 'normal',
          details: 'Egress-only route configuration with DMZ attachment.',
          x: 80,
          y: 120,
        },
        {
          id: 'sg-hardened-web',
          label: 'Hardened Web SG',
          type: 'AWS::EC2::SecurityGroup',
          status: 'hardened',
          details: 'Port 443 HTTPS only. Port 22 SSH strictly removed.',
          x: 260,
          y: 120,
        },
        {
          id: 'i-web-worker-01',
          label: 'Private Web App Worker',
          type: 'AWS::EC2::Instance',
          status: 'hardened',
          details: 'Private IP 10.100.1.42 without public IPv4 assignment.',
          x: 440,
          y: 120,
        },
        {
          id: 'role-scoped-least-privilege',
          label: 'Scoped IAM Role',
          type: 'AWS::IAM::Role',
          status: 'hardened',
          details: 'Least privilege policy restricted to specific bucket GetObject.',
          x: 620,
          y: 120,
        },
        {
          id: 'hardened-archive-vault',
          label: 'Hardened Vault S3',
          type: 'AWS::S3::Bucket',
          status: 'hardened',
          details: 'All 4 Public Access Blocks enabled + KMS encryption.',
          x: 800,
          y: 120,
        },
      ]
    : [
        {
          id: 'igw-01234567',
          label: 'Internet Gateway',
          type: 'AWS::EC2::InternetGateway',
          status: 'exposed',
          details: 'Public gateway routed directly to internet 0.0.0.0/0.',
          x: 60,
          y: 140,
        },
        {
          id: 'sg-bastion-public',
          label: 'Bastion Security Group',
          type: 'AWS::EC2::SecurityGroup',
          status: 'compromised',
          details: 'VIOLATION SEC-NET-01: Port 22 SSH open to entire internet (0.0.0.0/0).',
          x: 230,
          y: 70,
        },
        {
          id: 'i-0a1b2c3d4e5f67890',
          label: 'Bastion Host EC2',
          type: 'AWS::EC2::Instance',
          status: 'compromised',
          details: 'Public IP 54.210.12.88 associated with Administrator role.',
          x: 400,
          y: 140,
        },
        {
          id: 'AegisBastionEC2Role',
          label: 'Administrator IAM Role',
          type: 'AWS::IAM::Role',
          status: 'compromised',
          details: 'VIOLATION SEC-IAM-01: Action: * on Resource: * attached via instance profile.',
          x: 580,
          y: 70,
        },
        {
          id: 'corporate-customer-financial-records',
          label: 'Customer Financial S3',
          type: 'AWS::S3::Bucket',
          status: 'target',
          details: 'CROWN JEWEL: Critical financial records. Exposed via wildcard IAM role.',
          x: 770,
          y: 70,
        },
        {
          id: 'orders-db-prod',
          label: 'Orders RDS Postgres',
          type: 'AWS::RDS::DBInstance',
          status: 'target',
          details: 'VIOLATION SEC-DB-01: PubliclyAccessible=True database in DMZ subnet.',
          x: 770,
          y: 210,
        },
      ];

  const hasActiveAttack = attackPaths.length > 0;

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'AWS::EC2::InternetGateway':
        return Globe;
      case 'AWS::EC2::SecurityGroup':
        return Shield;
      case 'AWS::EC2::Instance':
        return Server;
      case 'AWS::IAM::Role':
        return Key;
      case 'AWS::S3::Bucket':
        return HardDrive;
      case 'AWS::RDS::DBInstance':
        return Database;
      default:
        return Server;
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
      {/* Header and Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-wide">
              Infrastructure Knowledge Graph & Attack Path Topology
            </h2>
            {hasActiveAttack ? (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-950 text-red-400 border border-red-800 animate-pulse flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Active Attack Path Traced
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Perimeter Fully Hardened
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Bidirectional relationship traversal mapping public ingress vectors to internal crown jewels.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500" />
            <span className="text-slate-300">Compromised</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
            <span className="text-slate-300">Crown Jewel</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
            <span className="text-slate-300">Hardened</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
            <span className="text-slate-300">Network DMZ</span>
          </div>
        </div>
      </div>

      {/* Interactive Canvas / SVG Area */}
      <div className="relative bg-[#080b12] rounded-xl border border-slate-800/80 p-4 overflow-x-auto min-h-[300px] flex items-center justify-center">
        <svg className="w-[880px] h-[280px]" viewBox="0 0 880 280">
          <defs>
            <linearGradient id="attackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff0055" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffaa00" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="compliantGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#00ffaa" stopOpacity="0.8" />
            </linearGradient>
            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Connection Lines */}
          {isHardened ? (
            <g stroke="#00ffaa" strokeWidth="2" strokeDasharray="4 4" opacity="0.6">
              <line x1="140" y1="120" x2="260" y2="120" />
              <line x1="320" y1="120" x2="440" y2="120" />
              <line x1="500" y1="120" x2="620" y2="120" />
              <line x1="680" y1="120" x2="800" y2="120" />
            </g>
          ) : (
            <g>
              {/* Normal connection lines */}
              <line x1="120" y1="140" x2="230" y2="70" stroke="#1f293d" strokeWidth="2" />
              <line x1="290" y1="70" x2="400" y2="140" stroke="#1f293d" strokeWidth="2" />
              <line x1="460" y1="140" x2="580" y2="70" stroke="#1f293d" strokeWidth="2" />
              <line x1="640" y1="70" x2="770" y2="70" stroke="#1f293d" strokeWidth="2" />
              <line x1="460" y1="140" x2="770" y2="210" stroke="#1f293d" strokeWidth="2" />

              {/* Pulsing Attack Path Vector */}
              {hasActiveAttack && (
                <g
                  stroke="url(#attackGrad)"
                  strokeWidth="3.5"
                  strokeDasharray="6 4"
                  filter="url(#glowEffect)"
                  className="animate-pulse"
                >
                  <line x1="120" y1="140" x2="230" y2="70" />
                  <line x1="290" y1="70" x2="400" y2="140" />
                  <line x1="460" y1="140" x2="580" y2="70" />
                  <line x1="640" y1="70" x2="770" y2="70" />
                </g>
              )}
            </g>
          )}

          {/* Render Nodes */}
          {nodes.map((node) => {
            const Icon = getNodeIcon(node.type);
            const isSelected = selectedNode?.id === node.id;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x - 30}, ${node.y - 30})`}
                className="cursor-pointer transition-transform hover:scale-110"
                onClick={() => setSelectedNode(node)}
              >
                <circle
                  cx="30"
                  cy="30"
                  r="28"
                  className={`fill-slate-900 stroke-2 ${
                    node.status === 'compromised'
                      ? 'stroke-red-500 animate-pulse'
                      : node.status === 'target'
                      ? 'stroke-amber-400'
                      : node.status === 'hardened'
                      ? 'stroke-emerald-400'
                      : 'stroke-cyan-400'
                  } ${isSelected ? 'stroke-white stroke-[3]' : ''}`}
                />
                <foreignObject x="12" y="12" width="36" height="36">
                  <div className="flex items-center justify-center w-full h-full text-slate-200">
                    <Icon className="w-6 h-6" />
                  </div>
                </foreignObject>
                <text
                  x="30"
                  y="72"
                  textAnchor="middle"
                  className="fill-slate-300 text-[11px] font-semibold tracking-tight"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Node Inspector Flyout */}
        {selectedNode && (
          <div className="absolute bottom-3 left-4 right-4 bg-slate-950/95 border border-cyan-500/50 p-3.5 rounded-xl backdrop-blur-md shadow-2xl flex items-start justify-between gap-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-400 font-bold">{selectedNode.id}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {selectedNode.type}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                    selectedNode.status === 'compromised'
                      ? 'bg-red-950 text-red-300'
                      : selectedNode.status === 'target'
                      ? 'bg-amber-950 text-amber-300'
                      : 'bg-emerald-950 text-emerald-300'
                  }`}
                >
                  {selectedNode.status}
                </span>
              </div>
              <p className="text-xs text-slate-300">{selectedNode.details}</p>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Attack Path Narrative Box */}
      {hasActiveAttack && (
        <div className="bg-red-950/30 border border-red-900/50 p-4 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wide">
            <AlertTriangle className="w-4 h-4" />
            <span>Evidenced Multi-Hop Attack Path Analysis:</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-950/70 p-3 rounded-lg border border-red-900/30">
            {attackPaths[0].narrative}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-slate-400 font-semibold">Path Traversal Sequence:</span>
            {attackPaths[0].hops.map((hop, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs font-mono">
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-red-800/80 text-red-300">
                  {hop.source_node}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-red-500" />
                {idx === attackPaths[0].hops.length - 1 && (
                  <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300 font-bold">
                    {hop.target_node}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
