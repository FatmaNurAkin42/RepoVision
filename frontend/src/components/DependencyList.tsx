import { Package } from 'lucide-react';
import type { Dependencies } from '../App';
import './DependencyList.css';

type Props = {
  dependencies: Dependencies;
};

const DependencyList = ({ dependencies }: Props) => {
  const sections = [
    { key: 'production', label: 'Production', items: dependencies.production || [], color: 'var(--accent-green)' },
    { key: 'development', label: 'Development', items: dependencies.development || [], color: 'var(--accent-orange)' },
    { key: 'python', label: 'Python', items: dependencies.python || [], color: 'var(--accent-purple)' },
    { key: 'php', label: 'PHP (Composer)', items: dependencies.php || [], color: 'var(--accent-cyan)' },
    { key: 'dart', label: 'Flutter (Pubspec)', items: dependencies.dart || [], color: 'var(--accent-yellow, #eab308)' },
  ].filter(s => s.items.length > 0);

  return (
    <div className="glass-card dep-card">
      <div className="section-header">
        <div className="section-icon" style={{ background: 'var(--accent-green-dim)', color: 'var(--accent-green)' }}>
          <Package size={20} />
        </div>
        <h3>Bağımlılıklar</h3>
        <span className="dep-total font-mono">{dependencies.total_count}</span>
      </div>

      <div className="dep-sections">
        {sections.length === 0 ? (
          <p className="text-secondary" style={{ textAlign: 'center', padding: '2rem 0' }}>
            Bağımlılık bulunamadı.
          </p>
        ) : (
          sections.map((section) => (
            <div key={section.key} className="dep-section">
              <div className="dep-section-header">
                <h4 style={{ color: section.color }}>{section.label}</h4>
                <span className="dep-count font-mono text-muted">{section.items.length}</span>
              </div>
              <div className="dep-list">
                {section.items.map((dep, i) => (
                  <div key={i} className="dep-item">
                    <span className="dep-name">{dep.name}</span>
                    <span className="dep-version font-mono text-muted">{dep.version}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DependencyList;
