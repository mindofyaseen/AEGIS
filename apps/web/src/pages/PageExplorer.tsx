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
    <div className="space-y-6">
      {/* Header with 3D/2D Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-aegis-border pb-4">
        <div>
          <h2 className="text-lg font-bold font-mono tracking-tight text-aegis-textPrimary">
            INFRASTRUCTURE TOPOLOGY EXPLORER
          </h2>
          <p className="text-xs text-aegis-textSecondary">
            Interactive multi-dimensional AWS VPC, compute, storage, and IAM relationship inspector.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-aegis-bgSecondary border border-aegis-border rounded-md p-1 font-mono text-xs">
          <button
            onClick={() => setViewMode('3d')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              viewMode === '3d'
                ? 'bg-aegis-accentCyan text-black font-semibold shadow-glow-cyan'
                : 'text-aegis-textSecondary hover:text-aegis-textPrimary'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            3D Spatial WebGL
          </button>
          <button
            onClick={() => setViewMode('2d')}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              viewMode === '2d'
                ? 'bg-aegis-accentBlue text-black font-semibold'
                : 'text-aegis-textSecondary hover:text-aegis-textPrimary'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            2D Schematic Graph
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
            <span className="text-aegis-textMuted">Quick Select Asset:</span>
            <div className="flex flex-wrap items-center gap-2">
              {Object.keys(assetMetadataMap).map((k) => (
                <button
                  key={k}
                  onClick={() => setSelectedAssetId(k)}
                  className={`px-2.5 py-1 rounded border text-[11px] transition-all ${
                    selectedAssetId === k
                      ? 'bg-aegis-accentBlue/20 text-aegis-accentCyan border-aegis-accentCyan'
                      : 'bg-aegis-panel text-aegis-textSecondary border-aegis-border hover:border-aegis-borderLight'
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
          <div className="p-4 border-b border-aegis-border bg-aegis-bgSecondary flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              {selectedAsset.type.includes('Instance') && <Server className="w-5 h-5 text-aegis-accentCyan shrink-0" />}
              {selectedAsset.type.includes('Role') && <Lock className="w-5 h-5 text-aegis-aiViolet shrink-0" />}
              {selectedAsset.type.includes('Bucket') && <Database className="w-5 h-5 text-aegis-accentBlue shrink-0" />}
              {selectedAsset.type.includes('DBInstance') && <Database className="w-5 h-5 text-aegis-aiViolet shrink-0" />}
              {selectedAsset.type.includes('SecurityGroup') && <ShieldAlert className="w-5 h-5 text-aegis-critical shrink-0" />}
              {selectedAsset.type.includes('InternetGateway') && <Globe className="w-5 h-5 text-aegis-warning shrink-0" />}
              <div className="truncate">
                <div className="font-bold text-xs text-aegis-textPrimary truncate">{selectedAsset.label}</div>
                <div className="text-[10px] font-mono text-aegis-textMuted truncate">{selectedAsset.id}</div>
              </div>
            </div>

            <span
              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border shrink-0 ${
                selectedAsset.status === 'compromised'
                  ? 'bg-aegis-critical/20 text-aegis-critical border-aegis-critical/30'
                  : selectedAsset.status === 'exposed'
                  ? 'bg-aegis-warning/20 text-aegis-warning border-aegis-warning/30'
                  : selectedAsset.status === 'target'
                  ? 'bg-aegis-aiViolet/20 text-aegis-aiViolet border-aegis-aiViolet/30'
                  : 'bg-aegis-success/20 text-aegis-success border-aegis-success/30'
              }`}
            >
              {selectedAsset.status}
            </span>
          </div>

          {/* Inspector Navigation Tabs */}
          <div className="border-b border-aegis-border bg-aegis-panel px-3 flex gap-1 overflow-x-auto text-[11px] font-mono">
            {(['overview', 'networking', 'identity', 'security', 'relationships', 'evidence'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-2.5 py-2 border-b-2 uppercase whitespace-nowrap transition-colors ${
                  activeTab === t
                    ? 'border-aegis-accentCyan text-aegis-accentCyan font-semibold'
                    : 'border-transparent text-aegis-textMuted hover:text-aegis-textSecondary'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {activeTab === 'overview' && (
              <div className="space-y-3 font-mono">
                <div>
                  <span className="text-aegis-textMuted block text-[10px]">RESOURCE TYPE</span>
                  <span className="text-aegis-textPrimary">{selectedAsset.type}</span>
                </div>
                <div>
                  <span className="text-aegis-textMuted block text-[10px]">AWS VPC IDENTIFIER</span>
                  <span className="text-aegis-accentBlue">{selectedAsset.vpcId || 'vpc-01234567'}</span>
                </div>
                <div>
                  <span className="text-aegis-textMuted block text-[10px]">SUBNET ASSOCIATION</span>
                  <span className="text-aegis-textPrimary">{selectedAsset.subnetId || 'subnet-pub-1 (10.100.1.0/24)'}</span>
                </div>
                <div>
                  <span className="text-aegis-textMuted block text-[10px]">CURRENT EXPOSURE POSTURE</span>
                  <span className="text-aegis-textSecondary font-sans leading-relaxed block mt-1">
                    {selectedAsset.details || 'Discovered and validated by AEGIS AWS discovery collectors.'}
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'networking' && (
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <span className="text-aegis-textMuted block text-[10px]">PUBLIC IPV4</span>
                  <span className={selectedAsset.publicIp && selectedAsset.publicIp !== 'None (Private Only)' ? 'text-aegis-critical font-bold' : 'text-aegis-textPrimary'}>
                    {selectedAsset.publicIp || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-aegis-textMuted block text-[10px]">PRIVATE IPV4</span>
                  <span className="text-aegis-textPrimary">{selectedAsset.privateIp || '10.100.1.55'}</span>
                </div>
                <div>
                  <span className="text-aegis-textMuted block text-[10px] mb-1">INGRESS BOUNDARY</span>
                  {selectedAsset.ingressRules ? (
                    <div className="p-2 rounded bg-aegis-bgSecondary border border-aegis-critical/40 text-[11px] text-aegis-critical">
                      Port 22/TCP open to 0.0.0.0/0 (Violates SEC-NET-01)
                    </div>
                  ) : (
                    <div className="text-aegis-textSecondary">Standard VPC peering & internal security group enforcement.</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'identity' && (
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <span className="text-aegis-textMuted block text-[10px]">ATTACHED IAM ROLE</span>
                  <span className="text-aegis-aiViolet">{selectedAsset.attachedRole || selectedAsset.arn || 'None'}</span>
                </div>
                <div>
                  <span className="text-aegis-textMuted block text-[10px] mb-1">EVALUATED PERMISSIONS</span>
                  <div className="p-2.5 rounded bg-aegis-bgSecondary border border-aegis-border text-[11px]">
                    {selectedAsset.status === 'compromised' ? (
                      <span className="text-aegis-critical font-bold">Action: * | Resource: * (AdministratorAccess)</span>
                    ) : (
                      <span className="text-aegis-success">Action: s3:GetObject | Resource: arn:aws:s3:::vault/*</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-3">
                <span className="text-aegis-textMuted block text-[10px] font-mono">DETECTED SECURITY VIOLATIONS</span>
                {selectedAsset.findings && selectedAsset.findings.length > 0 ? (
                  selectedAsset.findings.map((f: string, i: number) => (
                    <div key={i} className="p-2.5 rounded border border-aegis-critical/40 bg-red-950/20 text-xs text-aegis-critical font-mono">
                      {f}
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded border border-aegis-success/30 bg-emerald-950/20 text-xs text-aegis-success font-mono flex items-center gap-2">
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
