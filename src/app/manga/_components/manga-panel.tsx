import { cn } from "@/lib/utils";
import { convertFileSrc } from "@tauri-apps/api/core";
import Image from "next/image";
import { FileEntry } from "../page";

export default function MangaPanel({
  currentPanel,
  secondPanel,
  zoomLevel,
  width,
  height,
  isDoublePanels,
}: {
  currentPanel: FileEntry;
  secondPanel: boolean;
  zoomLevel: number;
  width: number;
  height: number;
  isDoublePanels?: boolean;
}) {
  return (
    <div className={cn("w-full h-full flex flex-col justify-center items-center pt-1", !isDoublePanels && secondPanel && "hidden")}>
      {currentPanel && currentPanel.name && (
        <>
          {secondPanel ? (
            <h2 className="font-bold fixed left-2 bottom-1 text-xs text-zinc-300 pointer-events-none">{currentPanel.name}</h2>
          ) : (
            <h2 className="font-bold fixed right-2 bottom-1 text-xs text-zinc-300 pointer-events-none">{currentPanel.name}</h2>
          )}
          <div
            id="IMAGE-DIV"
            style={{
              height: `${zoomLevel}px`,
              width: "auto",
            }}
          >
            <Image
              src={convertFileSrc(currentPanel.path)}
              alt={currentPanel.name}
              width={width}
              height={height}
              quality={100}
              priority={true}
              className={cn(
                "w-fit h-full pointer-events-none",
                !secondPanel && "shadow-[10px_0_20px_-10px_rgba(0,0,0,0.45)]",
                secondPanel && "shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.45)]",
              )}
            />
          </div>
        </>
      )}
    </div>
  );
}
