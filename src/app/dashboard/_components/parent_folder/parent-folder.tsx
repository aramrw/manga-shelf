"use client";
import { FileEntry, readDir } from "@tauri-apps/api/fs";
import { MangaFolderType, ParentFolderType } from "../../page";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

const fileTypes = ["jpg", "jpeg", "png", "gif", "webp"];

export default function ParentFolder({
  parentFolder,
}: {
  parentFolder: ParentFolderType;
}) {
  // these can hold both manga folders and child folders
  const [parentFolders, setParentFolders] = useState<ParentFolderType[]>([]);
  // these only hold manga panels
  const [mangaFolders, setMangaFolders] = useState<MangaFolderType[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(
    parentFolder.is_expanded,
  );
  const router = useRouter();

  useEffect(() => {
    readDirSort(parentFolder.full_path);
  }, []);

  function readDirSort(dir: string) {
    const parentFolderPaths: string[] = [];
    const mangaFolderPaths: string[] = [];

    readDir(dir, { recursive: true })
      .then((dirEntries: FileEntry[]) => {
        for (const entry of dirEntries) {
          if (
            entry.children &&
            entry.children[0] &&
            entry.children[0].name &&
            fileTypes.some(
              (fileType) =>
                entry.children &&
                entry.children[0].name &&
                entry.children[0].name.includes(fileType),
            )
          ) {
            mangaFolderPaths.push(entry.path);
          } else {
            parentFolderPaths.push(entry.path);
          }
        }
      })
      .then(() => {
        if (parentFolderPaths.length > 0 || mangaFolderPaths.length > 0) {
          invokeAddFolders(parentFolderPaths, mangaFolderPaths);
        }
      });
  }

  const invokeAddFolders = (parentDirs: string[], mangaDirs: string[]) => {
    invoke("update_parent_folders", {
      dirPaths: JSON.stringify(parentDirs),
      asChild: true,
      isExpanded: false,
    }).then((result: unknown) => {
      if (result) {
        const currentParentFolders: ParentFolderType[] =
          result as ParentFolderType[];
        setParentFolders(currentParentFolders);
      }
    });

    invoke("update_manga_folders", {
      dirPaths: JSON.stringify(mangaDirs),
      asChild: true,
      isExpanded: false,
    }).then((result: unknown) => {
      if (result) {
        const currentMangaFolders: MangaFolderType[] =
          result as MangaFolderType[];
        setMangaFolders(currentMangaFolders);
      }
    });
  };

  const handleMangaClick = (mangaFolderPath: string) => {
    invoke("set_global_manga", { fullPath: mangaFolderPath }).then(() => {
      router.push("/manga");
    });
  };

  return (
    <ul
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
        !parentFolder.as_child &&
        "hover:scale-[1.005] transition-transform duration-100 ease-in-out",
        parentFolder.as_child && "p-0 rounded-none text-xs",
      )}
    >
      <li
        tabIndex={0}
        className={cn(
          "p-1 mb-0.5 w-full h-full flex flex-col justify-center items-center bg-secondary focus:outline focus:outline-0 focus:ring-2 focus:ring-muted-foreground focus:ring-opacity-50 ring-inset",
          parentFolder.as_child && "bg-accent-foreground",
        )}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            invoke("update_parent_folders", {
              dirPaths: JSON.stringify([parentFolder.full_path]),
              asChild: parentFolder.as_child,
              isExpanded: !isExpanded,
            });

            setIsExpanded(!isExpanded);
          }
        }}
        onClick={() => {
          invoke("update_parent_folders", {
            dirPaths: JSON.stringify([parentFolder.full_path]),
            asChild: parentFolder.as_child,
            isExpanded: !isExpanded,
          });

          setIsExpanded(!isExpanded);
        }}
      >
        <h1 className="font-bold w-full overflow-hidden text-nowrap">
          {parentFolder.title}
        </h1>
      </li>
      {isExpanded && (
        <>
          {parentFolders.length > 0 && (
            <li className="w-full h-fit flex flex-col justify-center items-center bg-secondary">
              {parentFolders.map((folder, index) => (
                <ParentFolder
                  key={`${folder.id}-${index}`}
                  parentFolder={folder}
                />
              ))}
            </li>
          )}
          <li
            className="w-full h-fit flex flex-col justify-center items-center bg-secondary"
          >
            {mangaFolders.map((mangaFolder, index) => (
              <HoverCard key={`${mangaFolder.full_path}-${index}`}>
                <HoverCardTrigger className="w-full h-full">
                  <h1
										tabIndex={0}
                    className={cn(
                      "z-50 bg-accent py-1 px-1 text-xs font-bold border-t-2 border-primary hover:opacity-70 transition-opacity duration-100 text-nowrap overflow-hidden w-full focus:outline-none focus:ring-2 focus:ring-muted-foreground focus:ring-opacity-50 ring-inset",
                    )}
                    onClick={() => handleMangaClick(mangaFolder.full_path)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												handleMangaClick(mangaFolder.full_path);
											}
										}}
                  >
                    {mangaFolder.title}
                  </h1>
                </HoverCardTrigger>
                <HoverCardContent className="z-50 w-fit h-fit p-1 font-semibold text-xs">
                  {mangaFolder.title}
                </HoverCardContent>
              </HoverCard>
            ))}
          </li>
        </>
      )}
    </ul>
  );
}
