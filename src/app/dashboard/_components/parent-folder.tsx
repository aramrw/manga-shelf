import { FileEntry, readDir } from "@tauri-apps/api/fs";
import { ParentFolderType } from "../page";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function ParentFolder({
  parentFolder,
}: {
  parentFolder: ParentFolderType;
}) {
  const [childFolders, setChildFolders] = useState<ParentFolderType[]>([]);
  const [mangaFolders, setMangaFolders] = useState<FileEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    handleReadDirectories(parentFolder.full_path);
  }, []);

  useEffect(() => {
    console.log(mangaFolders);
  }, [mangaFolders]);

  const handleReadDirectories = (dir: string) => {
    readDir(dir).then((result: FileEntry[]) => {
      for (const entry of result) {
        console.log(entry);
        if (entry.children?.length === 0) {
          setMangaFolders((prev) => [...prev, entry]);
        }
      }
    });
  };

  return (
    <main
      className={cn(
        `
			w-full 
			p-1 
			bg-primary
			flex 
			flex-col
			justify-center
			items-center
			text-center
			rounded-sm
			cursor-pointer
			will-change-transform`,
        !isExpanded && "hover:scale-[1.02] transition-transform duration-200",
      )}
    >
      <div
        className={
          "p-1 mb-0.5 w-full h-full flex flex-col justify-center items-center bg-secondary"
        }
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h1 className="font-bold">{parentFolder.title}</h1>
      </div>
      {isExpanded && (
        <>
          <div className="w-full h-full flex flex-col justify-center items-center bg-secondary">
            {childFolders.map((childFolder, index) => (
              <ParentFolder key={index} parentFolder={childFolder} />
            ))}
          </div>
          <div className="w-full h-full flex flex-col justify-center items-center bg-secondary">
            {mangaFolders.map((mangaFolder, index) => (
              <Link
                key={index}
                className="py-2 text-xs font-bold border-t-2 border-primary hover:opacity-70 transition-opacity duration-100"
              >
                {mangaFolder.name}
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
