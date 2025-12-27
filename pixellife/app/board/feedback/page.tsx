'use client';

import { useRouter } from 'next/navigation';
import { FeedbackSection } from '@/app/components/feedback/FeedbackSection';

export default function FeedbackPage() {
  const router = useRouter();

  return (
    <div className="w-full py-6 md:py-12 md:pt-4" style={{ paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 44px) + 50px - 30px)', paddingLeft: 'max(env(safe-area-inset-left), 16px)', paddingRight: 'max(env(safe-area-inset-right), 16px)' }}>
      <div className="max-w-6xl mx-auto w-full">
        <section id="feedback" className="scroll-mt-8 mb-8">
          <div className="section-box">
            <h1 className="font-pixel-bold mb-4" style={{ color: '#333', fontSize: '24px' }}>
              Feedback
            </h1>
            <FeedbackSection />
          </div>
        </section>
      </div>
    </div>
  );
}

