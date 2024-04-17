"use client";

import { FileEntry } from "@tauri-apps/api/fs";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";

export default function MangaPanel({
  currentPanel,
}: {
  currentPanel: FileEntry;
}) {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center py-2">
      <h1 className="font-bold fixed left-1 top-[75px] text-xs">
        {currentPanel.name}
      </h1>
      <div className="h-auto w-[53vh] lg:w-[56vh]">
        {currentPanel && currentPanel.name && (
          <img
            src={convertFileSrc(currentPanel.path)}
            alt={currentPanel.name}
            width="100%"
            height="100%"
            className="max-w-full h-auto object-contain"
          />
        )}
      </div>
    </div>
  );
}
