'use client';

import { DailyOverview } from '../components/DailyOverview';
import PixelMenu from '../components/PixelMenu';

export default function DailyPage() {
  return (
    <div className="relative min-h-screen">
      <PixelMenu />
      <DailyOverview />
    </div>
  );
}

