"use client";

import { Button } from "@/components/ui/button";
import { PlusCircleIcon } from "@heroicons/react/16/solid";
import { open } from "@tauri-apps/api/dialog";
import { invoke } from "@tauri-apps/api/tauri";
import React, { useState, useEffect } from "react";
import ParentFolderContextMenu from "./_components/parent_folder/parent-folder-context-menu";

export type ParentFolderType = {
  id: string;
  title: string;
  full_path: string;
  as_child: boolean;
  is_expanded: boolean;
  created_at: string;
  updated_at: string;
};

export default function Dashboard() {
  const [parentFolders, setParentFolders] = useState<ParentFolderType[]>([]);

  const handleOpenExplorer = () => {
    open({
      title: "Select Manga Folder",
      directory: true,
      multiple: true,
      recursive: true,
    }).then((result: any) => {
      if (result) {
        invokeAddMangaFolders(result as string[]);
      }
    });
  };

  const invokeAddMangaFolders = (dirs: string[]) => {
    invoke("update_manga_folders", {
      dirPaths: JSON.stringify(dirs),
      asChild: false,
      isExpanded: false,
    }).then((result: unknown) => {
      if (result) {
        const currentParentFolders: ParentFolderType[] =
          result as ParentFolderType[];
        setParentFolders((prev) => [...prev, ...currentParentFolders]);
      }
    });
  };

  useEffect(() => {
    invoke("get_manga_folders").then((result: unknown) => {
      if (result) {
        const folders: ParentFolderType[] = JSON.parse(result as string);
        for (const f of folders) {
          if (!f.as_child && !parentFolders.includes(f)) {
            setParentFolders((prev) => [...prev, f]);
          }
        }
      }
    });
  }, []);

  return (
    <main className="w-full h-full">
      <div className="w-full h-full p-4 lg:px-16 xl:px-36 2xl:px-48">
        <Button
          className="flex flex-row justify-center items-center gap-0.5 shadow-sm"
          onClick={handleOpenExplorer}
        >
          <span className="text-center">Add Manga</span>
          <span className="text-center">
            <PlusCircleIcon className="h-3 w-auto" />
          </span>
        </Button>
        <ul className="w-full h-fit grid grid-cols-4 gap-2 mt-4">
          {parentFolders.map((folder, index) => {
            return (
              <ParentFolderContextMenu
                key={`${folder.title}-${index}`}
                folder={folder}
                setParentFolders={setParentFolders}
              />
            );
          })}
        </ul>
      </div>
    </main>
  );
}
