"use client";
import { FileEntry, readDir } from "@tauri-apps/api/fs";
import { ParentFolderType } from "../../page";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export default function ParentFolder({
  parentFolder,
}: {
  parentFolder: ParentFolderType;
}) {
  const [childFolders, setChildFolders] = useState<ParentFolderType[]>([]);
  const [mangaFolders, setMangaFolders] = useState<FileEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(
    parentFolder.is_expanded,
  );
  const router = useRouter();

  useEffect(() => {
    handleReadDirectories(parentFolder.full_path);
  }, []);

  useEffect(() => {
    for (const cf of childFolders) {
      for (const mf of mangaFolders) {
        if (cf.full_path === mf.path) {
          setChildFolders((prev) =>
            prev.filter((m) => m.full_path !== mf.path),
          );
        }
      }
    }
  }, [childFolders]);

  const handleReadDirectories = (dir: string) => {
    const folderDirPaths: string[] = [];
    try {
      readDir(dir, { recursive: true })
        .then((result: FileEntry[]) => {
          for (const entry of result) {
            if (entry.path.includes(".jpg")) {
              return;
            }
            folderDirPaths.push(entry.path);
            // if the entry is a directory that holds images
            //console.log(entry);
            if (
              entry.children &&
              (entry.children[0].path.includes(".jpeg") ||
                entry.children[0].path.includes(".png") ||
                entry.children[0].path.includes(".jpg"))
            ) {
              setMangaFolders((prev) => [...prev, entry]);
            }
          }
        })
        .then(() => {
          if (folderDirPaths.length > 0) {
            handleInvokeAddMangaFolders(folderDirPaths);
          }
        });
    } catch (error) {
      console.error(error);
    }
  };

  const handleMangaClick = (mangaFolderPath: string) => {
    //console.log("setting global manga");
    invoke("set_global_manga", { fullPath: mangaFolderPath }).then(() => {
      router.push("/manga");
    });
  };

  const handleInvokeAddMangaFolders = (dirs: string[]) => {
    invoke("update_manga_folders", {
      dirPaths: JSON.stringify(dirs),
      asChild: true,
      isExpanded: isExpanded,
    }).then((res) => {
      setChildFolders(res as ParentFolderType[]);
    });
  };

  return (
    <main
      className={cn(
        `
			h-fit
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
			will-change-transform
			shadow-sm
				`,
        !isExpanded &&
        "hover:scale-[1.005] transition-transform duration-100 ease-in-out",
        parentFolder.as_child && "p-0 text-xs",
        mangaFolders.length === 0 && childFolders.length === 0 && "bg-accent-foreground"
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
            invoke("update_manga_folders", {
              dirPaths: JSON.stringify([parentFolder.full_path]),
              asChild: false,
              isExpanded: !isExpanded,
            });
          }
        }}
      >
        <h1 className="font-bold w-full overflow-hidden text-nowrap">
          {parentFolder.title}
        </h1>
      </div>
      {isExpanded && (
        <>
          <div className="w-full h-fit flex flex-col justify-center items-center bg-secondary">
            {childFolders.map((childFolder, index) => (
              <ParentFolder
                key={`${childFolder.id}-${index}`}
                parentFolder={childFolder}
              />
            ))}
          </div>
          <div className="w-full h-fit flex flex-col justify-center items-center bg-secondary">
            {mangaFolders.map((mangaFolder, index) => (
              <HoverCard key={`${mangaFolder.path}-${index}`}>
                <HoverCardTrigger className="w-full h-full">
                  <h1
                    className={cn(
                      "bg-accent py-1 px-1 text-xs font-bold border-t-2 border-primary hover:opacity-70 transition-opacity duration-100 text-nowrap overflow-hidden w-full",
                      index === 0 && "border-t-0",
                    )}
                    onClick={() => handleMangaClick(mangaFolder.path)}
                  >
                    {mangaFolder.name}
                  </h1>
                </HoverCardTrigger>
                <HoverCardContent className="z-50 w-fit h-fit p-1 font-semibold text-xs">
                  {mangaFolder.name}
                </HoverCardContent>
              </HoverCard>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
