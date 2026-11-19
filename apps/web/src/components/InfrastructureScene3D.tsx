import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AttackPath } from '../types';
import {
  Maximize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Layers,
  Crosshair,
  ShieldAlert,
  Server,
  Globe,
  Database,
  Lock,
  Search,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface InfrastructureScene3DProps {
  attackPaths: AttackPath[];
  isHardened?: boolean;
  onSelectNode?: (nodeId: string, nodeType: string, meta: any) => void;
  selectedNodeId?: string;
}

interface Node3DData {
  id: string;
  label: string;
  type: string;
  status: 'compromised' | 'exposed' | 'hardened' | 'target' | 'normal';
  details: string;
  position: [number, number, number];
  subnetId?: string;
}

export const InfrastructureScene3D: React.FC<InfrastructureScene3DProps> = ({
  attackPaths,
  isHardened,
  onSelectNode,
  selectedNodeId
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<Node3DData | null>(null);
  const [activeNode, setActiveNode] = useState<Node3DData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLabels, setShowLabels] = useState(true);
  const [selectedLayer, setSelectedLayer] = useState<'all' | 'compute' | 'network' | 'storage' | 'iam'>('all');
  const [webglError, setWebglError] = useState(false);

  // Define 3D Node positions based on realistic AWS VPC architecture
  const nodes: Node3DData[] = useMemo(() => {
    if (isHardened) {
      return [
        {
          id: 'igw-compliant-01',
          label: 'Internet Gateway',
          type: 'AWS::EC2::InternetGateway',
          status: 'normal',
          details: 'Egress-only route configuration with DMZ firewall boundary.',
          position: [-10, 1.5, 0],
          subnetId: 'subnet-dmz'
        },
        {
          id: 'sg-hardened-web',
          label: 'Hardened Web SG',
          type: 'AWS::EC2::SecurityGroup',
          status: 'hardened',
          details: 'Port 443 HTTPS only. Port 22 SSH strictly disabled.',
          position: [-5, 1.5, -2],
          subnetId: 'subnet-pub-1'
        },
        {
          id: 'i-web-worker-01',
          label: 'App Worker EC2',
          type: 'AWS::EC2::Instance',
          status: 'hardened',
          details: 'Private worker 10.100.1.42 with no public IPv4 assignment.',
          position: [0, 1.5, 0],
          subnetId: 'subnet-priv-1'
        },
        {
          id: 'role-scoped-least-privilege',
          label: 'Scoped IAM Role',
          type: 'AWS::IAM::Role',
          status: 'hardened',
          details: 'Least privilege policy restricted to s3:GetObject only.',
          position: [5, 2.5, -2],
          subnetId: 'iam-boundary'
        },
        {
          id: 'hardened-archive-vault',
          label: 'Hardened Vault S3',
          type: 'AWS::S3::Bucket',
          status: 'hardened',
          details: 'All 4 Public Access Blocks enabled + SSE-KMS encryption.',
          position: [10, 1.5, 0],
          subnetId: 'storage-tier'
        }
      ];
    }

    return [
      {
        id: 'igw-01234567',
        label: 'Internet Gateway',
        type: 'AWS::EC2::InternetGateway',
        status: 'exposed',
        details: 'Public gateway routed directly to internet 0.0.0.0/0.',
        position: [-10, 1.5, 0],
        subnetId: 'subnet-public'
      },
      {
        id: 'sg-bastion-public',
        label: 'Bastion Security Group',
        type: 'AWS::EC2::SecurityGroup',
        status: 'compromised',
        details: 'CRITICAL VIOLATION: Ingress port 22 open to 0.0.0.0/0.',
        position: [-5, 1.5, -3],
        subnetId: 'subnet-public'
      },
      {
        id: 'i-0a1b2c3d4e5f67890',
        label: 'Bastion Host EC2',
        type: 'AWS::EC2::Instance',
        status: 'compromised',
        details: 'Public IP 54.210.12.88 associated with Administrator role.',
        position: [-1, 1.5, 0],
        subnetId: 'subnet-public'
      },
      {
        id: 'role-wildcard-administrator',
        label: 'Administrator IAM Role',
        type: 'AWS::IAM::Role',
        status: 'compromised',
        details: 'Wildcard Action:* on Resource:*, granting full cloud takeover.',
        position: [4, 2.8, -2],
        subnetId: 'iam-boundary'
      },
      {
        id: 'rds-prod-customers-db',
        label: 'Customer Financial RDS',
        type: 'AWS::RDS::DBInstance',
        status: 'target',
        details: 'Crown-jewel database containing sensitive financial records.',
        position: [9, 1.5, 1],
        subnetId: 'subnet-private'
      },
      {
        id: 's3-customer-financial-vault',
        label: 'Customer Financial S3',
        type: 'AWS::S3::Bucket',
        status: 'target',
        details: 'PAB disabled; vulnerable to lateral exfiltration via wildcard role.',
        position: [9, 1.5, -4],
        subnetId: 'storage-tier'
      }
    ];
  }, [isHardened]);

  // Color mapping based on security status
  const getColor = (status: Node3DData['status']) => {
    switch (status) {
      case 'compromised':
        return 0xf06e77; // Crimson critical
      case 'exposed':
        return 0xebae58; // Amber warning
      case 'hardened':
        return 0x36c995; // Emerald success
      case 'target':
        return 0xa98bff; // Crown jewel violet
      default:
        return 0x53c8de; // Cyan technical
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglError(true);
        return;
      }
    } catch {
      setWebglError(true);
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight || 480;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d15);
    scene.fog = new THREE.FogExp2(0x090d15, 0.025);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 18, 22);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Do not go below floor
    controls.minDistance = 6;
    controls.maxDistance = 50;

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xeff5ff, 1.2);
    dirLight.position.set(10, 20, 15);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x4e9eff, 1.5, 40);
    pointLight.position.set(0, 8, 0);
    scene.add(pointLight);

    // 3. Grid & Ground Platform (VPC Spatial Container)
    const vpcGrid = new THREE.GridHelper(32, 32, 0x263549, 0x121c29);
    vpcGrid.position.y = 0;
    scene.add(vpcGrid);

    // Subnet Zones Visual Planes
    const publicSubnetGeo = new THREE.PlaneGeometry(14, 14);
    const publicSubnetMat = new THREE.MeshBasicMaterial({
      color: isHardened ? 0x172335 : 0x2d1520,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    const publicSubnetPlane = new THREE.Mesh(publicSubnetGeo, publicSubnetMat);
    publicSubnetPlane.rotation.x = Math.PI / 2;
    publicSubnetPlane.position.set(-6, 0.02, 0);
    scene.add(publicSubnetPlane);

    const privateSubnetGeo = new THREE.PlaneGeometry(14, 14);
    const privateSubnetMat = new THREE.MeshBasicMaterial({
      color: 0x121c29,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    const privateSubnetPlane = new THREE.Mesh(privateSubnetGeo, privateSubnetMat);
    privateSubnetPlane.rotation.x = Math.PI / 2;
    privateSubnetPlane.position.set(7, 0.02, 0);
    scene.add(privateSubnetPlane);

    // 4. Mesh Nodes
    const nodeMeshMap = new Map<string, THREE.Mesh>();
    const nodeDataMap = new Map<string, Node3DData>();

    nodes.forEach((n) => {
      let geo: THREE.BufferGeometry;
      const col = getColor(n.status);

      if (n.type.includes('Instance')) {
        geo = new THREE.CylinderGeometry(0.9, 0.9, 1.8, 6);
      } else if (n.type.includes('SecurityGroup')) {
        geo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      } else if (n.type.includes('InternetGateway')) {
        geo = new THREE.OctahedronGeometry(1.0);
      } else if (n.type.includes('Role')) {
        geo = new THREE.TorusGeometry(0.8, 0.25, 8, 24);
      } else if (n.type.includes('DBInstance')) {
        geo = new THREE.CylinderGeometry(1.1, 1.1, 1.5, 16);
      } else {
        // S3 Bucket
        geo = new THREE.CylinderGeometry(1.0, 0.9, 1.4, 16);
      }

      const mat = new THREE.MeshStandardMaterial({
        color: col,
        roughness: 0.3,
        metalness: 0.6,
        emissive: col,
        emissiveIntensity: n.id === selectedNodeId ? 0.6 : 0.2
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...n.position);
      mesh.userData = { id: n.id };
      scene.add(mesh);

      // Node ring base
      const ringGeo = new THREE.RingGeometry(1.2, 1.35, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: col,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(n.position[0], 0.05, n.position[2]);
      scene.add(ring);

      nodeMeshMap.set(n.id, mesh);
      nodeDataMap.set(n.id, n);
    });

    // 5. Connective Network & Attack Path Edges (3D Bezier Curves)
    const curvePoints: [string, string, boolean][] = isHardened
      ? [
          ['igw-compliant-01', 'sg-hardened-web', false],
          ['sg-hardened-web', 'i-web-worker-01', false],
          ['i-web-worker-01', 'role-scoped-least-privilege', false],
          ['i-web-worker-01', 'hardened-archive-vault', false]
        ]
      : [
          ['igw-01234567', 'sg-bastion-public', true],
          ['sg-bastion-public', 'i-0a1b2c3d4e5f67890', true],
          ['i-0a1b2c3d4e5f67890', 'role-wildcard-administrator', true],
          ['role-wildcard-administrator', 'rds-prod-customers-db', true],
          ['role-wildcard-administrator', 's3-customer-financial-vault', true]
        ];

    const edgeLines: THREE.Line[] = [];

    curvePoints.forEach(([sId, tId, isAttackHop]) => {
      const sMesh = nodeMeshMap.get(sId);
      const tMesh = nodeMeshMap.get(tId);
      if (!sMesh || !tMesh) return;

      const p1 = sMesh.position;
      const p2 = tMesh.position;
      const mid = new THREE.Vector3(
        (p1.x + p2.x) / 2,
        Math.max(p1.y, p2.y) + 1.8,
        (p1.z + p2.z) / 2
      );

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const pts = curve.getPoints(24);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineBasicMaterial({
        color: isAttackHop ? 0xf06e77 : 0x4e9eff,
        linewidth: isAttackHop ? 3 : 1,
        transparent: true,
        opacity: isAttackHop ? 0.95 : 0.4
      });

      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);
      edgeLines.push(line);
    });

    // 6. Raycaster for Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = Array.from(nodeMeshMap.values());
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hitId = intersects[0].object.userData.id;
        const data = nodeDataMap.get(hitId) || null;
        setHoveredNode(data);
        container.style.cursor = 'pointer';
      } else {
        setHoveredNode(null);
        container.style.cursor = 'default';
      }
    };

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = Array.from(nodeMeshMap.values());
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hitId = intersects[0].object.userData.id;
        const data = nodeDataMap.get(hitId);
        if (data) {
          setActiveNode(data);
          if (onSelectNode) {
            onSelectNode(data.id, data.type, data);
          }
        }
      }
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('click', onClick);

    // 7. Animation Loop with Node Rotation & Attack Pulse
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Subtle rotation for compute/storage nodes
      nodeMeshMap.forEach((mesh, id) => {
        mesh.rotation.y += 0.008;
        if (id === selectedNodeId) {
          mesh.position.y = (nodeDataMap.get(id)?.position[1] || 1.5) + Math.sin(elapsed * 4) * 0.15;
        }
      });

      // Pulse attack path lines
      edgeLines.forEach((line, idx) => {
        if (!isHardened) {
          const mat = line.material as THREE.LineBasicMaterial;
          mat.opacity = 0.5 + Math.sin(elapsed * 5 + idx) * 0.45;
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 8. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('click', onClick);
      renderer.dispose();
      controls.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [nodes, isHardened, selectedNodeId]);

  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      const matchSearch = n.label.toLowerCase().includes(searchQuery.toLowerCase()) || n.id.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;
      if (selectedLayer === 'all') return true;
      if (selectedLayer === 'compute') return n.type.includes('Instance');
      if (selectedLayer === 'network') return n.type.includes('SecurityGroup') || n.type.includes('InternetGateway');
      if (selectedLayer === 'storage') return n.type.includes('DBInstance') || n.type.includes('Bucket');
      if (selectedLayer === 'iam') return n.type.includes('Role');
      return true;
    });
  }, [nodes, searchQuery, selectedLayer]);

  if (webglError) {
    return (
      <div className="aegis-card p-8 text-center text-aegis-textMuted flex flex-col items-center justify-center min-h-[420px]">
        <AlertTriangle className="w-12 h-12 text-aegis-warning mb-3" />
        <h4 className="text-aegis-textPrimary font-semibold text-base mb-1">WebGL Acceleration Unavailable</h4>
        <p className="text-xs max-w-md">Your browser does not have hardware-accelerated 3D WebGL enabled. 2D schematic graph mode is active as an automated fallback.</p>
      </div>
    );
  }

  return (
    <div className="relative aegis-card overflow-hidden flex flex-col h-[520px]">
      {/* 3D Scene Controls Header */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-[#121C29]/90 border border-[#263549] rounded-md px-3 py-1.5 flex items-center gap-2 shadow-panel backdrop-blur-md">
            <Search className="w-3.5 h-3.5 text-aegis-textMuted" />
            <input
              type="text"
              placeholder="Search 3D topology assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-aegis-textPrimary outline-none w-44 placeholder:text-aegis-textMuted font-mono"
            />
          </div>

          {/* Layer Filter Pills */}
          <div className="bg-[#121C29]/90 border border-[#263549] rounded-md p-1 flex items-center gap-1 shadow-panel backdrop-blur-md text-[11px] font-mono">
            {(['all', 'compute', 'network', 'storage', 'iam'] as const).map((layer) => (
              <button
                key={layer}
                onClick={() => setSelectedLayer(layer)}
                className={`px-2.5 py-1 rounded transition-colors uppercase ${
                  selectedLayer === layer
                    ? 'bg-aegis-accentBlue text-black font-semibold'
                    : 'text-aegis-textMuted hover:text-aegis-textPrimary'
                }`}
              >
                {layer}
              </button>
            ))}
          </div>
        </div>

        {/* Legend & 3D Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-[#121C29]/90 border border-[#263549] rounded-md px-3 py-1.5 flex items-center gap-3 shadow-panel text-[11px] font-mono backdrop-blur-md">
            <span className="flex items-center gap-1 text-aegis-critical">
              <span className="w-2 h-2 rounded-full bg-aegis-critical animate-pulse" />
              Compromised
            </span>
            <span className="flex items-center gap-1 text-aegis-warning">
              <span className="w-2 h-2 rounded-full bg-aegis-warning" />
              Exposed
            </span>
            <span className="flex items-center gap-1 text-aegis-aiViolet">
              <span className="w-2 h-2 rounded-full bg-aegis-aiViolet" />
              Target Asset
            </span>
            <span className="flex items-center gap-1 text-aegis-success">
              <span className="w-2 h-2 rounded-full bg-aegis-success" />
              Hardened
            </span>
          </div>

          <button
            onClick={() => setShowLabels(!showLabels)}
            title="Toggle Node Identifiers"
            className={`p-2 rounded border border-[#263549] bg-[#121C29]/90 text-aegis-textSecondary hover:text-aegis-textPrimary transition-colors ${
              showLabels ? 'border-aegis-accentCyan text-aegis-accentCyan' : ''
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* WebGL 3D Container */}
      <div ref={mountRef} className="w-full h-full three-canvas-container flex-1" />

      {/* Hover Tooltip Overlay */}
      {hoveredNode && (
        <div className="absolute bottom-4 left-4 z-20 bg-[#172335]/95 border border-aegis-borderLight rounded-md p-3.5 shadow-panel-elevated max-w-sm pointer-events-none backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-semibold text-xs text-aegis-textPrimary flex items-center gap-1.5">
              {hoveredNode.type.includes('Instance') && <Server className="w-3.5 h-3.5 text-aegis-accentCyan" />}
              {hoveredNode.type.includes('Role') && <Lock className="w-3.5 h-3.5 text-aegis-aiViolet" />}
              {hoveredNode.type.includes('Bucket') && <Database className="w-3.5 h-3.5 text-aegis-accentBlue" />}
              {hoveredNode.type.includes('InternetGateway') && <Globe className="w-3.5 h-3.5 text-aegis-warning" />}
              {hoveredNode.label}
            </span>
            <span
              className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                hoveredNode.status === 'compromised'
                  ? 'bg-aegis-critical/20 text-aegis-critical'
                  : hoveredNode.status === 'exposed'
                  ? 'bg-aegis-warning/20 text-aegis-warning'
                  : hoveredNode.status === 'target'
                  ? 'bg-aegis-aiViolet/20 text-aegis-aiViolet'
                  : 'bg-aegis-success/20 text-aegis-success'
              }`}
            >
              {hoveredNode.status}
            </span>
          </div>
          <div className="text-[11px] font-mono text-aegis-accentBlue mb-1.5">{hoveredNode.id}</div>
          <p className="text-xs text-aegis-textSecondary leading-relaxed">{hoveredNode.details}</p>
        </div>
      )}

      {/* Interactive Controls Overlay Footer */}
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2 pointer-events-auto">
        <div className="bg-[#121C29]/80 border border-[#263549] rounded px-3 py-1 text-[11px] font-mono text-aegis-textMuted backdrop-blur-sm">
          Left-Click: Rotate · Right-Click: Pan · Scroll: Zoom · Click Node: Inspect
        </div>
      </div>
    </div>
  );
};
