'use client';

interface AchievementMiniCardProps {
  title: string;
  description: string;
  icon?: string;
  completed?: boolean;
}

export function AchievementMiniCard({ title, description, icon, completed = false }: AchievementMiniCardProps) {
  return (
    <div
      className="p-3 rounded"
      style={{
        backgroundColor: completed ? '#E8F5E9' : '#FFFFFF',
        border: '1px solid #e8e8e2',
      }}
    >
      {icon && (
        <div className="mb-2 text-2xl">{icon}</div>
      )}
      <h3 className="font-pixel-bold mb-1" style={{ color: '#111', fontSize: '14px' }}>
        {title}
      </h3>
      <p className="font-pixel" style={{ color: '#666', fontSize: '16px' }}>
        {description}
      </p>
    </div>
  );
}

