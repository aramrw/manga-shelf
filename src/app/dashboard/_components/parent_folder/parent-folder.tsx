"use client";
import { DirEntry, readDir } from "@tauri-apps/plugin-fs";
import { MangaFolderType, ParentFolderType } from "../../page";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
// import {
//   HoverCard,
//   HoverCardContent,
//   HoverCardTrigger,
// } from "@/components/ui/hover-card";
import FolderContextMenu from "./folder-context-menu";
import Image from "next/image";
import { MangaPanelType } from "@/app/manga/page";
import { join } from "@tauri-apps/api/path";

const fileTypes = ["jpg", "jpeg", "png", "gif", "webp"];

export default function ParentFolder({ parentFolder }: { parentFolder: ParentFolderType }) {
  // these can hold both manga folders and child folders
  const [parentFolders, setParentFolders] = useState<ParentFolderType[]>([]);
  // these only hold manga image panels
  const [mangaFolders, setMangaFolders] = useState<MangaFolderType[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(parentFolder.is_expanded);
  const router = useRouter();
  const pathname = usePathname();

  const invokeAddFolders = useCallback((parentDirs: string[], mangaDirs: string[]) => {
    invoke("update_parent_folders", {
      dirPaths: JSON.stringify(parentDirs),
      asChild: true,
      isExpanded: false,
    }).then((result: unknown) => {
      if (result) {
        const currentParentFolders: ParentFolderType[] = result as ParentFolderType[];
        setParentFolders(currentParentFolders);
      }
    });

    invoke("update_manga_folders", {
      dirPaths: JSON.stringify(mangaDirs),
      asChild: true,
      isExpanded: false,
    }).then((result: unknown) => {
      if (result) {
        const currentMangaFolders: MangaFolderType[] = result as MangaFolderType[];
        setMangaFolders(currentMangaFolders);
      }
    });
  }, []);

  const readDirSort = useCallback(
    async (dir: string) => {
      const parentFolderPaths: string[] = [];
      const mangaFolderPaths: string[] = [];

      const dirEntries = await readDir(dir);

      const folderPromises = dirEntries.map(async (entry) => {
        let entryPath = await join(dir, entry.name);
        if (entry.isDirectory) {
          const subEntries = await readDir(entryPath);
          let firstSubEntry = subEntries[0];
          let firstSubEntryFileType = firstSubEntry.name.split(".")[1];
          if (firstSubEntry && firstSubEntry.name && fileTypes.includes(firstSubEntryFileType)) {
            mangaFolderPaths.push(entryPath);
          } else {
            parentFolderPaths.push(entryPath);
          }
        }
      });

      await Promise.all(folderPromises);

      if (parentFolderPaths.length > 0 || mangaFolderPaths.length > 0) {
        parentFolderPaths.sort((a, b) => a.localeCompare(b));
        mangaFolderPaths.sort((a, b) => a.localeCompare(b));
        invokeAddFolders(parentFolderPaths, mangaFolderPaths);
      }
    },
    [invokeAddFolders],
  );

  useEffect(() => {
    readDirSort(parentFolder.full_path);
  }, [parentFolder.full_path, readDirSort]);

  return (
    <ul
      className={cn(
        `
					flex
					flex-row
					justify-center
					items-center
					text-center
					rounded-sm
					cursor-pointer
					will-change-transform
					shadow-sm
					bg-primary transition-transform duration-100 ease-in-out
				`,
        !isExpanded && !parentFolder.as_child && "hover:scale-[1.005]",
        !parentFolder.as_child && "h-36 w-28 md:h-52 md:w-36 lg:h-64 lg:w-48 xl:h-72 xl:w-52",
        parentFolder.as_child && "max-w-28 h-36 text-xs hover:translate-y-[1px]",
      )}
    >
      <li
        tabIndex={0}
        className={cn(
          "mb-0.5 w-full h-full flex flex-col justify-center items-center relative focus-visible:outline focus-visible:outline-0 focus-visible:ring-2 focus-visible:ring-muted-foreground focus-visible:ring-opacity-50 ring-inset",
          parentFolder.as_child && "bg-transparent rounded-sm",
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
          invoke("set_global_parent_folder", { fullPath: parentFolder.full_path }).then(() => {
            if (pathname === "/manga-chapters") {
              window.location.reload();
            } else {
              router.push("/manga-chapters");
            }
          });
        }}
        style={{ position: "relative" }} // Position relative to apply pseudo-element background
      >
        {/* Pseudo-element for blurred background */}
        <style jsx>{`
          li::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: url(${convertFileSrc(parentFolder.cover_panel_path)});
            filter: blur(2px); /* Adjust the blur radius as needed */
            z-index: 0; /* Place it behind the image */
            background-size: cover;
            background-position: center;
          }
        `}</style>
        {parentFolder.cover_panel_path ? (
          <Image
            alt={parentFolder.title}
            className="object-contain object-left w-full h-full relative z-10" // Ensure image stays on top
            src={convertFileSrc(parentFolder.cover_panel_path)}
            fill
            priority
            quality={100}
          />
        ) : (
          <span>loading...</span>
        )}
      </li>
    </ul>
  );
}
