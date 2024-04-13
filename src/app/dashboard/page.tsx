"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PlusCircleIcon } from "@heroicons/react/16/solid";
import { open } from "@tauri-apps/api/dialog";
import { invoke } from "@tauri-apps/api/tauri";
import React, { useState, useEffect } from "react";

export default function Dashboard() {
  const [mangaFolders, setMangaFolders] = useState<string[]>([]);

  const handleAddManga = () => {
    const selected = open({
      title: "Select Manga Folder",
      directory: true,
      multiple: true,
    }).then((result: any) => {
      if (result) {
        invoke("add_manga_folder", { mangaFolderPath: result[0] });
        setMangaFolders([...mangaFolders, ...(result as string[])]);
      }
    });
  };

  // useEffect(() => {
  //   console.log(mangaFolders);
  // }, [mangaFolders]);

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
      </div>
    </main>
  );
}
