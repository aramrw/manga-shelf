"use client";
import { FileEntry, readDir } from "@tauri-apps/api/fs";
import { ParentFolderType } from "../page";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function ParentFolder({
  parentFolder,
}: {
  parentFolder: ParentFolderType;
}) {
  const [childFolders, setChildFolders] = useState<ParentFolderType[]>([]);
  const [mangaFolders, setMangaFolders] = useState<FileEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    handleReadDirectories(parentFolder.full_path);
  }, []);

  // useEffect(() => {
  //   console.log(mangaFolders);
  // }, [mangaFolders]);

  const handleReadDirectories = (dir: string) => {
    const folderDirPaths: string[] = [];
    readDir(dir)
      .then((result: FileEntry[]) => {
        for (const entry of result) {
          //console.log(entry);
					if (entry.path.includes(".jpg") || entry.path.includes(".png")) {
							return;
					}
          folderDirPaths.push(entry.path);
          if (entry.children?.length === 0) {
            setMangaFolders((prev) => [...prev, entry]);
          } else {
            //setChildFolders((prev) => [...prev, entry as ParentFolderType]);
          }
        }
      })
      .then(() => {
        if (folderDirPaths.length > 0) {
          handleInvokeAddMangaFolders(folderDirPaths);
        }
      });
  };

  const handleMangaClick = (mangaFolderPath: string) => {
    //console.log("setting global manga");
    invoke("set_global_manga", { fullPath: mangaFolderPath }).then(() => {
      router.push("/manga");
    });
  };

  const handleInvokeAddMangaFolders = (dirs: string[]) => {
    invoke("add_manga_folders", {
      dirPaths: JSON.stringify(dirs),
      asChild: true,
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
        onClick={() => {
          if (mangaFolders.length === 0 && childFolders.length === 0) {
            handleMangaClick(parentFolder.full_path);
          } else {
            setIsExpanded(!isExpanded);
          }
        }}
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
              <h1
                key={index}
                className={cn("py-2 text-xs font-bold border-t-2 border-primary hover:opacity-70 transition-opacity duration-100",
								index === 0 && "border-t-0" 
								)}
                onClick={() => handleMangaClick(mangaFolder.path)}
              >
                {mangaFolder.name}
              </h1>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
