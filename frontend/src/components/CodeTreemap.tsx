import { useState } from 'react';
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';
import { FolderGit, ChevronDown, ChevronRight } from 'lucide-react';
import type { FileNode } from '../App';
import './CodeTreemap.css';

type Props = {
  fileTree: FileNode[];
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const CodeTreemap = ({ fileTree }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 1. Dosya ve klasör boyutlarını özyinelemeli (recursive) olarak hesaplayalım
  const computeSizes = (node: FileNode): number => {
    if (node.type === 'directory') {
      const size = (node.children || []).reduce((acc, child) => acc + computeSizes(child), 0);
      node.size = size;
      return size;
    }
    return node.size || 0;
  };

  // Boyutları hesapla
  fileTree.forEach(node => computeSizes(node));

  // 2. Birbiriyle çakışmayan (mutually exclusive) düz bir veri kümesi oluşturalım
  const partitionNodes: { name: string; size: number }[] = [];
  const totalRepoSize = fileTree.reduce((acc, node) => acc + (node.size || 0), 0);
  
  // Toplam boyutun %1'inden veya 4KB'tan küçük kutuları tek tek göstermeyip filtreleyeceğiz
  const sizeThreshold = Math.max(4096, totalRepoSize * 0.01);

  fileTree.forEach(node => {
    if (!node.size || node.size === 0) return;

    if (node.type === 'file') {
      partitionNodes.push({ name: node.name, size: node.size });
    } else if (node.type === 'directory') {
      // Klasör küçükse veya içi boşsa tek bir kutu olarak ekle
      if (node.size < sizeThreshold || !node.children || node.children.length === 0) {
        partitionNodes.push({ name: node.name, size: node.size });
      } else {
        // Klasör büyükse derinliği 1 seviye kırıp alt kırılımlarını gösterelim (Derinlik 2)
        let accountedSize = 0;
        node.children.forEach(child => {
          if (child.size && child.size > 0) {
            partitionNodes.push({
              name: `${node.name}/${child.name}`,
              size: child.size
            });
            accountedSize += child.size;
          }
        });
        
        // Eşleşmeyen küçük dosyalar varsa "diğer" adı altında topla
        const remaining = node.size - accountedSize;
        if (remaining > 1024) {
          partitionNodes.push({
            name: `${node.name}/diğer`,
            size: remaining
          });
        }
      }
    }
  });

  // Boyuta göre azalan sırada sırala ve en büyükleri seç
  let sortedData = partitionNodes
    .filter(n => n.size > 0)
    .sort((a, b) => b.size - a.size);

  // Eğer 12'den fazla kutu varsa, ilk 10'u gösterip kalanları "Diğer Dosyalar" altında birleştirelim
  if (sortedData.length > 12) {
    const topTen = sortedData.slice(0, 10);
    const rest = sortedData.slice(10);
    const restSize = rest.reduce((acc, curr) => acc + curr.size, 0);
    sortedData = [
      ...topTen,
      { name: "Diğer Dosyalar", size: restSize }
    ];
  }

  const treemapData = sortedData;

  // If no data, return nothing
  if (treemapData.length === 0) return null;

  // Custom Treemap Cell Component
  const CustomizedContent = (props: any) => {
    const { x, y, width, height, index, name, size } = props;
    
    // Theme matching colors
    const colors = [
      'rgba(0, 212, 255, 0.15)',  // Glassmorphic Cyan
      'rgba(121, 40, 202, 0.15)', // Glassmorphic Purple
      'rgba(245, 158, 11, 0.15)', // Glassmorphic Orange
      'rgba(34, 197, 94, 0.15)',  // Glassmorphic Green
    ];
    
    const borders = [
      'rgba(0, 212, 255, 0.4)',
      'rgba(121, 40, 202, 0.4)',
      'rgba(245, 158, 11, 0.4)',
      'rgba(34, 197, 94, 0.4)',
    ];

    const color = colors[index % colors.length];
    const border = borders[index % borders.length];

    if (width < 32 || height < 20) return null;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: color,
            stroke: 'var(--border-default)',
            strokeWidth: 1.5,
          }}
          className="treemap-rect"
        />
        {/* Glow left border */}
        <rect
          x={x}
          y={y}
          width={3}
          height={height}
          style={{
            fill: border,
          }}
        />
        <text
          x={x + 8}
          y={y + 18}
          fill="var(--text-primary)"
          fontSize={11}
          fontWeight={600}
          style={{ pointerEvents: 'none' }}
        >
          {name}
        </text>
        {width > 70 && height > 38 && (
          <text
            x={x + 8}
            y={y + 32}
            fill="var(--text-muted)"
            fontSize={9.5}
            fontFamily="JetBrains Mono, monospace"
            style={{ pointerEvents: 'none' }}
          >
            {formatBytes(size)}
          </text>
        )}
      </g>
    );
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="treemap-tooltip font-mono">
          <span className="tooltip-title">{data.name}</span>
          <span className="tooltip-value">Boyut: {formatBytes(data.size)}</span>
        </div>
      );
    }
    return null;
  };

  if (!isExpanded) {
    return (
      <div 
        className="glass-card treemap-card collapsed animate-fade-in-up" 
        onClick={() => setIsExpanded(true)}
        style={{ 
          cursor: 'pointer', 
          transition: 'all var(--transition-fast)',
          padding: '1.25rem 1.5rem'
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="section-icon" style={{ background: 'var(--accent-cyan-dim)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: 'var(--radius-sm)' }}>
              <FolderGit size={20} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kök Klasör Dağılım Haritası (Treemap)</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Proje klasörlerinin boyut dağılım grafiğini göster</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-cyan)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Görselleştir</span>
            <ChevronRight size={18} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card treemap-card animate-fade-in-up">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="section-icon" style={{ background: 'var(--accent-cyan-dim)', color: 'var(--accent-cyan)' }}>
            <FolderGit size={20} />
          </div>
          <h3>Kök Klasör Dağılım Haritası (Treemap)</h3>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(false);
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            transition: 'color var(--transition-fast)'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-cyan)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <ChevronDown size={16} /> Grafiği Kapat
        </button>
      </div>
      <p className="treemap-desc text-secondary">
        Proje dosyalarının ve klasörlerinin kapladığı dosya boyutlarını görselleştirir. Kutuların büyüklüğü dosya boyutlarıyla doğru orantılıdır.
      </p>

      <div className="treemap-container">
        <ResponsiveContainer width="100%" height={320}>
          <Treemap
            data={treemapData}
            dataKey="size"
            stroke="var(--border-default)"
            fill="#8884d8"
            content={<CustomizedContent />}
          >
            <Tooltip content={<CustomTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CodeTreemap;
