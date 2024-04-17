"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PlusCircleIcon } from "@heroicons/react/16/solid";
import { open } from "@tauri-apps/api/dialog";
import { FileEntry, readDir } from "@tauri-apps/api/fs";
import { invoke } from "@tauri-apps/api/tauri";
import React, { useState, useEffect } from "react";
import ParentFolder from "./_components/parent-folder";

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

  const handleAddManga = () => {
    open({
      title: "Select Manga Folder",
      directory: true,
      multiple: true,
      recursive: true,
    }).then((result: any) => {
      if (result) {
        handleReadDirectories(result as string[]);
      }
    });
  };

  const handleReadDirectories = (dirs: string[]) => {
    invoke("add_manga_folders", {
      dirPaths: JSON.stringify(dirs),
      asChild: false,
    }).then((result: unknown) => {
      if (result) {
        const parentFolders: ParentFolderType[] = JSON.parse(result as string);
        setParentFolders((prev) => [...prev, ...parentFolders]);
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
      <div className="w-full h-full p-4">
        <Button
          className="flex flex-row justify-center items-center gap-0.5"
          onClick={handleAddManga}
        >
          <span className="text-center">Add Manga</span>
          <span className="text-center">
            <PlusCircleIcon className="h-3 w-auto" />
          </span>
        </Button>
        <ul className="w-full h-full grid grid-cols-4 gap-2 mt-4">
          {parentFolders.map((folder, index) => {
            return <ParentFolder key={index} parentFolder={folder} />;
          })}
        </ul>
      </div>
    </main>
  );
}
