"use client";

import { ParentFolderType } from "../dashboard/page";
import fetchGlobalManga from "./_components/lib/fetch-global-manga";
import MangaHeader from "./_components/manga-header";
import { useEffect, useState } from "react";
import { FileEntry, readDir } from "@tauri-apps/api/fs";
import MangaPanel from "./_components/manga-panel";
import { invoke } from "@tauri-apps/api/tauri";

export default function Manga() {
  const [currentManga, setCurrentManga] = useState<ParentFolderType | null>(
    null,
  );
  const [mangaPanels, setMangaPanels] = useState<FileEntry[]>([]);
  const [currentPanelIndex, setCurrentPanelIndex] = useState<number>(0);

  useEffect(() => {
    fetchGlobalManga().then((manga) => {
      if (manga) {
        //console.log(manga);
        setCurrentManga(manga);
        readDir(manga.full_path).then((result) => {
          if (result) {
            setMangaPanels(result);
          }
        });
      }
    });
  }, []);

  useEffect(() => {
    if (currentManga) invokeFindLastReadPanel();
  }, [currentManga]);

  const invokeFindLastReadPanel = async () => {
    if (currentManga) {
      invoke("find_last_read_panel", {
        chapterPath: currentManga.full_path,
      }).then((lastReadPanelIndex: unknown) => {
        setCurrentPanelIndex(lastReadPanelIndex as number);
      });
    }
  };

  const handleNextPanel = () => {
    if (currentPanelIndex < mangaPanels.length - 1) {
      invoke("update_manga_panel", {
        dirPath: mangaPanels[currentPanelIndex + 1].path,
        isRead: true,
      });
      setCurrentPanelIndex((prev) => prev + 1);
    }
  };

  const handlePreviousPanel = () => {
    if (currentPanelIndex > 0) {
      invoke("update_manga_panel", {
        dirPath: mangaPanels[currentPanelIndex].path,
        isRead: false,
      });
      setCurrentPanelIndex((prev) => prev - 1);
    }
  };

  return (
    <main className="w-full h-full flex flex-col justify-center items-center">
      {currentManga && (
        <MangaHeader
          currentManga={currentManga}
          handleNextPanel={handleNextPanel}
          handlePreviousPanel={handlePreviousPanel}
        />
      )}
      <div>
        {mangaPanels[currentPanelIndex] && (
          <MangaPanel currentPanel={mangaPanels[currentPanelIndex]} />
        )}
      </div>
    </main>
  );
}
