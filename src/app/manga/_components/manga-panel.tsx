"use client";

import { cn } from "@/lib/utils";
import { FileEntry } from "@tauri-apps/api/fs";
import { convertFileSrc } from "@tauri-apps/api/tauri";

export default function MangaPanel({
  currentPanel,
  secondPanel,
	zoomLevel,
}: {
  currentPanel: FileEntry;
  secondPanel: boolean;
	zoomLevel: number;
}) {

  return (
    <div className="w-full h-full flex flex-col justify-center items-center py-2">
      {secondPanel ? (
        <h1 className="font-bold fixed left-2 bottom-1 text-xs text-zinc-300">
					{currentPanel.name}
        </h1>
      ) : (
        <h1 className="font-bold fixed right-2 bottom-1 text-xs text-zinc-300">
          {currentPanel.name}
        </h1>
      )}
      <div className={cn("w-full h-96",
				)}
				style={{
					height: `${500 + zoomLevel}px`,
				}}
				>
        {currentPanel && currentPanel.name && (
          <img
            src={convertFileSrc(currentPanel.path)}
            alt={currentPanel.name}
            className="w-full h-full object-contain"
          />
        )}
      </div>
    </div>
  );
}
