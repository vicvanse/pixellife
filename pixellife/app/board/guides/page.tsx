'use client';

import { useRouter } from 'next/navigation';

export default function GuidesPage() {
  const router = useRouter();

  return (
    <div className="w-full py-6 md:py-12 md:pt-4" style={{ paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 44px) + 50px - 30px)', paddingLeft: 'max(env(safe-area-inset-left), 16px)', paddingRight: 'max(env(safe-area-inset-right), 16px)' }}>
      <div className="max-w-6xl mx-auto w-full">
        <section id="guides" className="scroll-mt-8 mb-8">
          <div className="section-box">
            <h1 className="font-pixel-bold mb-4" style={{ color: '#333', fontSize: '24px' }}>
              Guias
            </h1>
            <p className="font-pixel text-center py-8" style={{ color: '#666', fontSize: '16px' }}>
              Conteúdo de guias em desenvolvimento...
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

