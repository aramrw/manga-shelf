"use client";

import { Button } from "@/components/ui/button";
import { PlusCircleIcon } from "@heroicons/react/16/solid";
import { open } from "@tauri-apps/api/dialog";
import { invoke } from "@tauri-apps/api/tauri";
import React, { useState, useEffect } from "react";
import FolderContexMenu from "./_components/parent_folder/folder-context-menu";
import { FileEntry, readDir } from "@tauri-apps/api/fs";
import { useRouter } from "next/navigation";

export interface ParentFolderType {
  id: string;
  title: string;
  full_path: string;
  as_child: boolean;
  is_expanded: boolean;
  created_at: string;
  updated_at: string;
}

export interface MangaFolderType extends ParentFolderType {
  time_spent_reading: number;
  double_panels: boolean;
  is_read: boolean;
}

const fileTypes = ["jpg", "jpeg", "png", "gif", "webp"];

export default function Dashboard() {
  // these can hold both manga folders and child folders
  const [parentFolders, setParentFolders] = useState<ParentFolderType[]>([]);
  // these are folders hold manga panels not child folders
  const [mangaFolders, setMangaFolders] = useState<MangaFolderType[]>([]);
  const router = useRouter();

  useEffect(() => {
    invoke("get_parent_folders", {}).then((result: unknown) => {
      if (result) {
        setParentFolders(result as ParentFolderType[]);
      }
    });

    invoke("get_manga_folders", {}).then((result: unknown) => {
      if (result) {
        setMangaFolders(result as MangaFolderType[]);
      }
    });
  }, []);

  const handleOpenExplorer = () => {
    open({
      title: "Select Manga Folder",
      directory: true,
      multiple: true,
      recursive: true,
    }).then((result: any) => {
      if (result) {
        readDirSort(result as string[]);
      }
    });
  };

  function readDirSort(dirs: string[]) {
    const parentFolderPaths: string[] = [];
    const mangaFolderPaths: string[] = [];

    for (const dir of dirs) {
      readDir(dir)
        .then((dirEntries: FileEntry[]) => {
          // if the folder directly contains image files its a manga folder
          if (dirEntries && dirEntries[0] && dirEntries?.[0]?.name) {
            if (
              fileTypes.some((fileType) =>
                dirEntries[0]!.name!.toLowerCase().includes(fileType),
              )
            ) {
              mangaFolderPaths.push(dir);
            } else {
              parentFolderPaths.push(dir);
            }
          }
        })
        .then(() => {
          if (parentFolderPaths.length > 0 || mangaFolderPaths.length > 0) {
            //console.log("parentFolderPaths", parentFolderPaths);
            //console.log("mangaFolderPaths", mangaFolderPaths);
            invokeAddFolders(parentFolderPaths, mangaFolderPaths);
          }
        });
    }
  }

  const invokeAddFolders = (parentDirs: string[], mangaDirs: string[]) => {
    invoke("update_parent_folders", {
      dirPaths: JSON.stringify(parentDirs),
      asChild: false,
      isExpanded: false,
    }).then((result: unknown) => {
      if (result) {
        setParentFolders((prev) => [
          ...prev,
          ...(result as ParentFolderType[]),
        ]);
      }
    });

    invoke("update_manga_folders", {
      dirPaths: JSON.stringify(mangaDirs),
      asChild: false,
      isExpanded: false,
    }).then((result: unknown) => {
      if (result) {
        setMangaFolders((prev) => [...prev, ...(result as MangaFolderType[])]);
      }
    });
  };

  const handleMangaClick = (mangaFolderPath: string) => {
    invoke("set_global_manga", { fullPath: mangaFolderPath }).then(() => {
      // update all prev manga except clicked on as read before pushing
      router.push("/manga");
    });
  };

  return (
    <main className="w-full h-full">
      <div className="w-full h-full p-4 lg:px-16 xl:px-36 2xl:px-48">
        <Button
          className="flex flex-row justify-center items-center gap-0.5 shadow-sm
					"
          onClick={handleOpenExplorer}
        >
          <span className="text-center">Add Manga</span>
          <span className="text-center">
            <PlusCircleIcon className="h-3 w-auto" />
          </span>
        </Button>
        {parentFolders.length > 0 && (
          <ul className="w-full h-fit grid grid-cols-4 gap-2 mt-4">
            {parentFolders.map((folder, index) => {
              return (
                <FolderContexMenu
                  key={"parent" + index}
                  folder={folder}
                  setParentFolders={setParentFolders}
                  setMangaFolders={setMangaFolders}
                />
              );
            })}
          </ul>
        )}
        {mangaFolders.length > 0 && (
          <ul className="w-full h-fit grid grid-cols-4 gap-2 mt-4">
            {mangaFolders.map((folder, index) => (
              <FolderContexMenu
                key={"manga" + index}
                folder={folder}
                setParentFolders={setParentFolders}
                setMangaFolders={setMangaFolders}
                handleMangaClick={handleMangaClick}
                isMangaFolder
              />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
