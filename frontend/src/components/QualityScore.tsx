import { CheckCircle, XCircle, ShieldCheck } from 'lucide-react';
import type { QualityResult } from '../App';
import './QualityScore.css';

type Props = {
  quality: QualityResult;
};

const QualityScore = ({ quality }: Props) => {
  const circumference = 2 * Math.PI * 58;
  const progress = (quality.score / quality.max_score) * circumference;
  const offset = circumference - progress;

  const gradeColor =
    quality.grade === 'A+' || quality.grade === 'A'
      ? 'var(--accent-green)'
      : quality.grade === 'B'
      ? 'var(--accent-cyan)'
      : quality.grade === 'C'
      ? 'var(--accent-orange)'
      : 'var(--accent-red)';

  return (
    <div className="glass-card quality-card">
      <div className="section-header">
        <div className="section-icon" style={{ background: 'var(--accent-green-dim)', color: 'var(--accent-green)' }}>
          <ShieldCheck size={20} />
        </div>
        <h3>Kalite Skoru</h3>
      </div>

      <div className="quality-layout">
        {/* Circular Progress */}
        <div className="quality-gauge">
          <svg viewBox="0 0 128 128" className="quality-svg">
            {/* Background circle */}
            <circle
              cx="64" cy="64" r="58"
              fill="none"
              stroke="var(--border-subtle)"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="64" cy="64" r="58"
              fill="none"
              stroke={gradeColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 64 64)"
              style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
          </svg>
          <div className="quality-gauge-text">
            <span className="quality-grade" style={{ color: gradeColor }}>{quality.grade}</span>
            <span className="quality-score font-mono">{quality.score}/{quality.max_score}</span>
          </div>
        </div>

        {/* Criteria List */}
        <div className="quality-criteria">
          {quality.criteria.map((c, i) => (
            <div key={i} className={`quality-criterion ${c.passed ? 'passed' : 'failed'}`}>
              <div className="quality-criterion-left">
                {c.passed ? (
                  <CheckCircle size={16} className="text-green" />
                ) : (
                  <XCircle size={16} className="text-red" />
                )}
                <span className="quality-criterion-name">{c.name}</span>
              </div>
              <span className="quality-criterion-pts font-mono">
                {c.passed ? `+${c.points}` : `0/${c.points}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QualityScore;
