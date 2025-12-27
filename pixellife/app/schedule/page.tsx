"use client";

import { ScheduleOverlay } from "../components/schedule/ScheduleOverlay";
import { useState } from "react";

export default function SchedulePage() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen">
      <ScheduleOverlay isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}

