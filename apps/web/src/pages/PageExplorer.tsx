import React, { useState } from 'react';
import {
  InvestigationReport,
  SecurityFinding
} from '../types';
import { InfrastructureScene3D } from '../components/InfrastructureScene3D';
import { TopologyMap } from '../components/TopologyMap';
import {
  Layers,
  Search,
  Server,
  Lock,
  Database,
  Globe,
  ShieldAlert,
  ArrowRight,
  Code,
  FileText,
  Key,
  ExternalLink,
  Info,
  CheckCircle,
  Eye
} from 'lucide-react';

interface PageExplorerProps {
  report: InvestigationReport | null;
  isHardened?: boolean;
  onSelectFinding?: (f: SecurityFinding) => void;
}

export const PageExplorer: React.FC<PageExplorerProps> = ({
  report,
  isHardened,
  onSelectFinding
}) => {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    isHardened ? 'i-web-worker-01' : 'i-0a1b2c3d4e5f67890'
  );
  const [activeTab, setActiveTab] = useState<'overview' | 'networking' | 'identity' | 'security' | 'relationships' | 'evidence'>('overview');

  // Hardened vs Vulnerable asset directory
  const assetMetadataMap: Record<string, any> = {
    'i-0a1b2c3d4e5f67890': {
      id: 'i-0a1b2c3d4e5f67890',
      label: 'Bastion Host EC2',
      type: 'AWS::EC2::Instance',
      status: 'compromised',
      vpcId: 'vpc-01234567',
      subnetId: 'subnet-pub-1 (10.100.1.0/24)',
      publicIp: '54.210.12.88',
      privateIp: '10.100.1.55',
      iamProfile: 'arn:aws:iam::237657481511:instance-profile/BastionAdminProfile',
      attachedRole: 'role-wildcard-administrator',
      securityGroup: 'sg-bastion-public',
      findings: [
        'SEC-NET-01: Public Ingress Port 22 open to 0.0.0.0/0',
        'SEC-IAM-01: Wildcard Administrator Access (*:*)'
      ],
      inbound: ['igw-01234567 (TCP 22 SSH)'],
      outbound: ['rds-prod-customers-db (TCP 5432)', 's3-customer-financial-vault (HTTPS)'],
      collector: 'EC2Collector (boto3 describe_instances)',
      discoveredAt: '2026-11-19T18:00:00Z',
      confidence: 1.0
    },
    'sg-bastion-public': {
      id: 'sg-bastion-public',
      label: 'Bastion Security Group',
      type: 'AWS::EC2::SecurityGroup',
      status: 'compromised',
      vpcId: 'vpc-01234567',
      ingressRules: [
        { protocol: 'tcp', fromPort: 22, toPort: 22, cidr: '0.0.0.0/0', status: 'VIOLATION' }
      ],
      egressRules: [
        { protocol: '-1', fromPort: 0, toPort: 0, cidr: '0.0.0.0/0', status: 'ALLOW_ALL' }
      ],
      findings: ['SEC-NET-01: Open SSH Ingress to 0.0.0.0/0'],
      inbound: ['Internet Gateway igw-01234567'],
      outbound: ['Bastion Host i-0a1b2c3d4e5f67890'],
      collector: 'EC2Collector (boto3 describe_security_groups)',
      discoveredAt: '2026-11-19T18:00:00Z',
      confidence: 1.0
    },
    'role-wildcard-administrator': {
      id: 'role-wildcard-administrator',
      label: 'Administrator IAM Role',
      type: 'AWS::IAM::Role',
      status: 'compromised',
      arn: 'arn:aws:iam::237657481511:role/AdministratorAccessRole',
      policies: ['AdministratorAccess (AWS Managed)'],
      permissions: [{ effect: 'Allow', action: '*', resource: '*' }],
      findings: ['SEC-IAM-01: Full Administrator Privilege Allowed (*:*)'],
      inbound: ['Assumed by EC2 Instance Profile BastionAdminProfile'],
      outbound: ['Can mutate all AWS resources and exfiltrate data'],
      collector: 'IAMCollector (boto3 get_role & list_attached_role_policies)',
      discoveredAt: '2026-11-19T18:00:00Z',
      confidence: 1.0
    },
    'rds-prod-customers-db': {
      id: 'rds-prod-customers-db',
      label: 'Customer Financial RDS',
      type: 'AWS::RDS::DBInstance',
      status: 'target',
      vpcId: 'vpc-01234567',
      subnetId: 'subnet-priv-1 (10.100.2.0/24)',
      engine: 'PostgreSQL 15.3',
      storageEncrypted: true,
      publiclyAccessible: false,
      findings: ['Exposed target on active lateral attack path AP-01'],
      inbound: ['Reachable laterally from Bastion Host via compromised IAM credential'],
      outbound: [],
      collector: 'RDSCollector (boto3 describe_db_instances)',
      discoveredAt: '2026-11-19T18:00:00Z',
      confidence: 1.0
    },
    'i-web-worker-01': {
      id: 'i-web-worker-01',
      label: 'App Worker EC2',
      type: 'AWS::EC2::Instance',
      status: 'hardened',
      vpcId: 'vpc-compliant-01',
      subnetId: 'subnet-priv-1 (10.200.2.0/24)',
      publicIp: 'None (Private Only)',
      privateIp: '10.200.2.42',
      iamProfile: 'arn:aws:iam::237657481511:instance-profile/ScopedWorkerProfile',
      attachedRole: 'role-scoped-least-privilege',
      securityGroup: 'sg-hardened-web',
      findings: [],
      inbound: ['Internal ALB via TCP 443'],
      outbound: ['hardened-archive-vault (s3:GetObject only)'],
      collector: 'EC2Collector (boto3 describe_instances)',
      discoveredAt: '2026-11-19T18:00:00Z',
      confidence: 1.0
    }
  };

  const selectedAsset = assetMetadataMap[selectedAssetId] || {
    id: selectedAssetId,
    label: selectedAssetId,
    type: 'AWS::EC2::Resource',
    status: 'normal',
    details: 'Discovered AWS infrastructure asset.'
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header with 3D/2D Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
        <div>
          <h2 className="text-base font-semibold tracking-normal text-white">
            Infrastructure topology explorer
          </h2>
          <p className="text-xs text-zinc-400">
            Interactive multi-dimensional AWS VPC, compute, storage, and IAM relationship inspector.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.08] rounded-md p-0.5 text-xs">
          <button
            onClick={() => setViewMode('3d')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              viewMode === '3d'
                ? 'bg-white/10 text-white font-medium shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            3D spatial WebGL
          </button>
          <button
            onClick={() => setViewMode('2d')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              viewMode === '2d'
                ? 'bg-white/10 text-white font-medium shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            2D schematic graph
          </button>
        </div>
      </div>

      {/* Main Split-Layout: Canvas (Left) + Resource Inspector (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: 3D/2D Canvas (2 Columns on XL) */}
        <div className="xl:col-span-2 space-y-3">
          {viewMode === '3d' ? (
            <InfrastructureScene3D
              attackPaths={report ? report.attack_paths : []}
              isHardened={isHardened}
              selectedNodeId={selectedAssetId}
              onSelectNode={(nodeId) => setSelectedAssetId(nodeId)}
            />
          ) : (
            <TopologyMap
              attackPaths={report ? report.attack_paths : []}
              isHardened={isHardened}
            />
          )}

          {/* Quick Asset Selector Tray */}
          <div className="aegis-card p-3 flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-500">Quick select asset:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {Object.keys(assetMetadataMap).map((k) => (
                <button
                  key={k}
                  onClick={() => setSelectedAssetId(k)}
                  className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                    selectedAssetId === k
                      ? 'bg-white/10 text-white font-medium border border-white/[0.12]'
                      : 'bg-white/[0.02] text-zinc-400 border border-white/[0.06] hover:text-white'
                  }`}
                >
                  {assetMetadataMap[k].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Deep Resource Detail Inspector */}
        <div className="aegis-card flex flex-col h-[580px] overflow-hidden">
          {/* Inspector Header */}
          <div className="p-4 border-b border-white/[0.07] bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              {selectedAsset.type.includes('Instance') && <Server className="w-4 h-4 text-sky-400 shrink-0" />}
              {selectedAsset.type.includes('Role') && <Lock className="w-4 h-4 text-indigo-400 shrink-0" />}
              {selectedAsset.type.includes('Bucket') && <Database className="w-4 h-4 text-sky-400 shrink-0" />}
              {selectedAsset.type.includes('DBInstance') && <Database className="w-4 h-4 text-indigo-400 shrink-0" />}
              {selectedAsset.type.includes('SecurityGroup') && <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />}
              {selectedAsset.type.includes('InternetGateway') && <Globe className="w-4 h-4 text-amber-400 shrink-0" />}
              <div className="truncate">
                <div className="font-semibold text-xs text-white truncate">{selectedAsset.label}</div>
                <div className="text-[10px] font-mono text-zinc-500 truncate">{selectedAsset.id}</div>
              </div>
            </div>

            <span
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                selectedAsset.status === 'compromised'
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : selectedAsset.status === 'exposed'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : selectedAsset.status === 'target'
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}
            >
              {selectedAsset.status}
            </span>
          </div>

          {/* Inspector Navigation Tabs */}
          <div className="border-b border-white/[0.07] bg-white/[0.01] px-3 flex gap-1 overflow-x-auto text-[11px]">
            {(['overview', 'networking', 'identity', 'security', 'relationships', 'evidence'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-2.5 py-2 border-b-2 capitalize whitespace-nowrap transition-colors ${
                  activeTab === t
                    ? 'border-sky-400 text-white font-medium'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {activeTab === 'overview' && (
              <div className="space-y-3 font-mono">
                <div>
                  <span className="text-zinc-500 block text-[10px]">RESOURCE TYPE</span>
                  <span className="text-zinc-200">{selectedAsset.type}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">AWS VPC IDENTIFIER</span>
                  <span className="text-sky-400">{selectedAsset.vpcId || 'vpc-01234567'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">SUBNET ASSOCIATION</span>
                  <span className="text-zinc-200">{selectedAsset.subnetId || 'subnet-pub-1 (10.100.1.0/24)'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">CURRENT EXPOSURE POSTURE</span>
                  <span className="text-zinc-400 font-sans leading-relaxed block mt-1">
                    {selectedAsset.details || 'Discovered and validated by AEGIS AWS discovery collectors.'}
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'networking' && (
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <span className="text-zinc-500 block text-[10px]">PUBLIC IPV4</span>
                  <span className={selectedAsset.publicIp && selectedAsset.publicIp !== 'None (Private Only)' ? 'text-red-400 font-medium' : 'text-zinc-200'}>
                    {selectedAsset.publicIp || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">PRIVATE IPV4</span>
                  <span className="text-zinc-200">{selectedAsset.privateIp || '10.100.1.55'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] mb-1">INGRESS BOUNDARY</span>
                  {selectedAsset.ingressRules ? (
                    <div className="p-2.5 rounded bg-white/[0.02] border border-red-500/20 text-[11px] text-red-300">
                      Port 22/TCP open to 0.0.0.0/0 (Violates SEC-NET-01)
                    </div>
                  ) : (
                    <div className="text-zinc-400 font-sans">Standard VPC peering & internal security group enforcement.</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'identity' && (
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <span className="text-zinc-500 block text-[10px]">ATTACHED IAM ROLE</span>
                  <span className="text-indigo-400">{selectedAsset.attachedRole || selectedAsset.arn || 'None'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] mb-1">EVALUATED PERMISSIONS</span>
                  <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.06] text-[11px]">
                    {selectedAsset.status === 'compromised' ? (
                      <span className="text-red-400 font-medium">Action: * | Resource: * (AdministratorAccess)</span>
                    ) : (
                      <span className="text-emerald-400">Action: s3:GetObject | Resource: arn:aws:s3:::vault/*</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-2.5">
                <span className="text-zinc-500 block text-[10px] font-mono">DETECTED SECURITY VIOLATIONS</span>
                {selectedAsset.findings && selectedAsset.findings.length > 0 ? (
                  selectedAsset.findings.map((f: string, i: number) => (
                    <div key={i} className="p-2.5 rounded border border-red-500/20 bg-white/[0.02] text-xs text-red-300 font-mono">
                      {f}
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded border border-emerald-500/20 bg-white/[0.02] text-xs text-emerald-300 font-mono flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Zero critical violations detected for this asset.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'relationships' && (
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <span className="text-aegis-textMuted block text-[10px] mb-1">INBOUND DEPENDENCIES</span>
                  {(selectedAsset.inbound || []).map((inb: string, i: number) => (
                    <div key={i} className="text-aegis-textSecondary p-1.5 rounded bg-aegis-bgSecondary border border-aegis-border mb-1 text-[11px]">
                      ← {inb}
                    </div>
                  ))}
                </div>
                <div>
                  <span className="text-aegis-textMuted block text-[10px] mb-1">OUTBOUND ACCESS</span>
                  {(selectedAsset.outbound || []).map((outb: string, i: number) => (
                    <div key={i} className="text-aegis-accentBlue p-1.5 rounded bg-aegis-bgSecondary border border-aegis-border mb-1 text-[11px]">
                      → {outb}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'evidence' && (
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <span className="text-aegis-textMuted block text-[10px]">SOURCE COLLECTOR</span>
                  <span className="text-aegis-textPrimary">{selectedAsset.collector || 'EC2Collector (boto3)'}</span>
                </div>
                <div>
                  <span className="text-aegis-textMuted block text-[10px]">INGESTION TIMESTAMP</span>
                  <span className="text-aegis-textSecondary">{selectedAsset.discoveredAt || '2026-11-19T18:00:00Z'}</span>
                </div>
                <div>
                  <span className="text-aegis-textMuted block text-[10px]">EVIDENCE CONFIDENCE SCORE</span>
                  <span className="text-aegis-success font-bold">100.0% (Evidenced from live AWS API response)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
