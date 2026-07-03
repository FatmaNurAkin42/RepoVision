import { Layers } from 'lucide-react';
import type { TechStack as TechStackType } from '../App';
import './TechStack.css';

type Props = {
  techStack: TechStackType;
};

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  frontend: { label: 'Frontend', color: 'var(--accent-cyan)', bg: 'var(--accent-cyan-dim)' },
  backend: { label: 'Backend', color: 'var(--accent-purple)', bg: 'var(--accent-purple-dim)' },
  database: { label: 'Veritabanı', color: 'var(--accent-green)', bg: 'var(--accent-green-dim)' },
  devops: { label: 'DevOps & Araçlar', color: 'var(--accent-orange)', bg: 'var(--accent-orange-dim)' },
  testing: { label: 'Test', color: 'var(--accent-pink)', bg: 'rgba(236, 72, 153, 0.15)' },
  other: { label: 'Diğer', color: 'var(--text-secondary)', bg: 'rgba(124, 124, 153, 0.1)' },
};

const TechStack = ({ techStack }: Props) => {
  const categories = Object.entries(techStack).filter(([, items]) => items.length > 0);

  if (categories.length === 0) {
    return (
      <div className="glass-card tech-card">
        <div className="section-header">
          <div className="section-icon" style={{ background: 'var(--accent-orange-dim)', color: 'var(--accent-orange)' }}>
            <Layers size={20} />
          </div>
          <h3>Teknoloji Yığını</h3>
        </div>
        <p className="text-secondary" style={{ textAlign: 'center', padding: '2rem 0' }}>
          Bilinen teknoloji tespit edilemedi.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card tech-card">
      <div className="section-header">
        <div className="section-icon" style={{ background: 'var(--accent-orange-dim)', color: 'var(--accent-orange)' }}>
          <Layers size={20} />
        </div>
        <h3>Teknoloji Yığını</h3>
      </div>

      <div className="tech-categories">
        {categories.map(([key, items]) => {
          const config = CATEGORY_CONFIG[key] || CATEGORY_CONFIG.other;
          return (
            <div key={key} className="tech-category">
              <h4 className="tech-category-label" style={{ color: config.color }}>
                {config.label}
              </h4>
              <div className="tech-items">
                {items.map((item, i) => (
                  <div
                    key={i}
                    className="tech-badge"
                    style={{
                      borderColor: config.color,
                      background: config.bg,
                    }}
                  >
                    <span className="tech-badge-name">{item.name}</span>
                    <span className="tech-badge-cat" style={{ color: config.color }}>
                      {item.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TechStack;
