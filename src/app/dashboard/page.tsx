"use client";

import { Button } from "@/components/ui/button";
import { PlusCircleIcon, TrashIcon } from "@heroicons/react/16/solid";
import { open } from "@tauri-apps/api/dialog";
import { invoke } from "@tauri-apps/api/tauri";
import React, { useState, useEffect } from "react";
import ParentFolder from "./_components/parent-folder";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export type ParentFolderType = {
  id: string;
  title: string;
  full_path: string;
  as_child: boolean;
  created_at: string;
  updated_at: string;
};

export type MangaChapterType = {
  id: string;
  title: string;
  full_path: string;
  is_read: boolean;
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
    invoke("add_manga_folders", {
      dirPaths: JSON.stringify(dirs),
      asChild: false,
    }).then((result: unknown) => {
      if (result) {
        const currentParentFolders: ParentFolderType[] =
          result as ParentFolderType[];
        setParentFolders((prev) => [...prev, ...currentParentFolders]);
      }
    });
  };

  const handleInvokeDeleteParentFolder = (id: string, path: string) => {
    invoke("delete_manga_folder", { id, path }).then(() => {
      setParentFolders((prev) => prev.filter((f) => f.id !== id));
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
          <span className="text-center text-base">Add Manga</span>
          <span className="text-center">
            <PlusCircleIcon className="h-3 w-auto" />
          </span>
        </Button>
        <ul className="w-full h-fit grid grid-cols-4 gap-2 mt-4">
          {parentFolders.map((folder, index) => {
            return (
              <ContextMenu key={index}>
                <ContextMenuTrigger>
                  <ParentFolder key={index} parentFolder={folder} />
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    className="font-semibold flex flex-row items-center gap-0.5 cursor-pointer"
                    onClick={() => handleInvokeDeleteParentFolder(folder.id, folder.full_path)}
                  >
                    <span>Delete</span>
                    <TrashIcon className="h-4 w-auto" />
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
