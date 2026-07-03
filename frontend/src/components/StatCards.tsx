import { FileCode2, Hash, Globe, Award } from 'lucide-react';
import './StatCards.css';

type Props = {
  summary: {
    total_files: number;
    total_lines: number;
    total_languages: number;
    total_dependencies: number;
  };
  grade: string;
};

const StatCards = ({ summary, grade }: Props) => {
  const formatNumber = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  const cards = [
    {
      icon: <FileCode2 size={22} />,
      label: 'Toplam Dosya',
      value: formatNumber(summary.total_files),
      color: 'cyan',
    },
    {
      icon: <Hash size={22} />,
      label: 'Satır Sayısı',
      value: formatNumber(summary.total_lines),
      color: 'purple',
    },
    {
      icon: <Globe size={22} />,
      label: 'Dil Sayısı',
      value: summary.total_languages.toString(),
      color: 'green',
    },
    {
      icon: <Award size={22} />,
      label: 'Kalite Notu',
      value: grade,
      color: grade === 'A+' || grade === 'A' ? 'green' : grade === 'B' ? 'cyan' : grade === 'C' ? 'orange' : 'red',
    },
  ];

  return (
    <div className="stat-cards">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`stat-card glass-card animate-fade-in-up animate-delay-${index + 1}`}
        >
          <div className={`stat-card-icon bg-${card.color}`}>
            {card.icon}
          </div>
          <div className="stat-card-content">
            <p className="stat-card-label text-secondary">{card.label}</p>
            <h3 className={`stat-card-value text-${card.color}`}>{card.value}</h3>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatCards;
