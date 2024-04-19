"use client";

import { cn } from "@/lib/utils";
import { FileEntry } from "@tauri-apps/api/fs";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import Image from "next/image";
import { useEffect } from "react";
import ImageSkeleton from "./image-skeleton";

export default function MangaPanel({
  currentPanel,
  secondPanel,
  zoomLevel,
	width,
	height,
}: {
  currentPanel: FileEntry;
  secondPanel: boolean;
  zoomLevel: number;
	width: number;
	height: number;
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
      <div
        id="IMAGE-DIV"
        style={{
          height: `${zoomLevel}px`,
					width: "auto",
        }}
      >
        {currentPanel && currentPanel.name && (
          <Image
            src={convertFileSrc(currentPanel.path)}
            alt={currentPanel.name}
						width={width}
						height={height}
						quality={100}
						priority={true}
						className="w-full h-full"
          />
        )}
      </div>
    </div>
  );
}
