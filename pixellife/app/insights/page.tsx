"use client";

import { InsightHistory } from "../components/insights/InsightHistory";
import PixelMenu from "../components/PixelMenu";

export default function InsightsPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      <PixelMenu />
      
      <div className="pl-0 md:pl-0 py-6 md:py-12 px-4 md:px-6 pt-0 md:pt-0">
        <div className="max-w-4xl mx-auto">
          <section className="scroll-mt-8">
            <div className="section-box p-4 md:p-8">
              <h1 className="font-pixel-bold mb-6 text-xl md:text-2xl" style={{ color: "#333" }}>
                Histórico de Feedback
              </h1>
              <InsightHistory />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

