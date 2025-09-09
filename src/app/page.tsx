"use client";

import React from "react";
import CollegeSportsManager from "@/components/CollegeSportsManager";
import UUIDGenerator from "@/components/UUIDGenerator";
import CollegeSportsManagerInput from "@/components/CollegeSportsManagerInput";

export default function Home() {
  return (
    <section className="w-full  min-h-screen font-sans">
      <div className="flex flex-col justify-center font-sans">
        <CollegeSportsManager />
      </div>
    </section>
  );
}
