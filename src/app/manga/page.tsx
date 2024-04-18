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

  useEffect(() => { }, [currentPanelIndex]);

  const invokeFindLastReadPanel = async () => {
    if (currentManga) {
      invoke("find_last_read_panel", {
        chapterPath: currentManga.full_path,
      }).then((lastReadPanelIndex: unknown) => {
        console.log(lastReadPanelIndex);
        setCurrentPanelIndex(lastReadPanelIndex as number);
      });
    }
  };

  // previous panels
  const handlePreviousPanel = () => {
    if (currentPanelIndex - 2 > 0) {
      invoke("update_manga_panel", {
        dirPaths: JSON.stringify([
          mangaPanels[currentPanelIndex - 1].path,
          mangaPanels[currentPanelIndex].path,
        ]),
        isRead: false,
      });

      setCurrentPanelIndex((prev) => prev - 2);
    }
  };

  const handlePreviousSinglePanel = () => {
    if (currentPanelIndex - 1 > 0) {
      invoke("update_manga_panel", {
        dirPaths: JSON.stringify([mangaPanels[currentPanelIndex].path]),
        isRead: false,
      });
      setCurrentPanelIndex((prev) => prev - 1);
    }
  };

  // next panels
  const handleNextPanel = () => {
    if (currentPanelIndex < mangaPanels.length - 3) {
      invoke("update_manga_panel", {
        dirPaths: JSON.stringify([
          mangaPanels[currentPanelIndex].path,
          mangaPanels[currentPanelIndex + 1].path,
        ]),
        isRead: true,
      });
      setCurrentPanelIndex((prev) => prev + 2);
    }
  };

  const handleNextSinglePanel = () => {
    if (currentPanelIndex < mangaPanels.length - 3) {
      invoke("update_manga_panel", {
        dirPaths: JSON.stringify([mangaPanels[currentPanelIndex + 1].path]),
        isRead: true,
      });
      setCurrentPanelIndex((prev) => prev + 1);
    }
  };

  return (
    <main className="w-full h-full flex flex-col justify-center items-center">
      {currentManga && (
        <MangaHeader
					key={`${currentManga.title}-manga-header`}
          currentManga={currentManga}
          handleNextPanel={handleNextPanel}
          handleNextSinglePanel={handleNextSinglePanel}
          handlePreviousPanel={handlePreviousPanel}
          handlePreviousSinglePanel={handlePreviousSinglePanel}
        />
      )}
      <div className="flex flex-row justify-center items-center">
        {currentPanelIndex < mangaPanels.length - 1 &&
          currentPanelIndex > -1 && (
            <>
              <MangaPanel
								key={`${mangaPanels[currentPanelIndex].path}-manga-panel-next`}
                currentPanel={mangaPanels[currentPanelIndex + 1]}
                secondPanel={true}
              />

              <MangaPanel
								key={`${mangaPanels[currentPanelIndex].path}-manga-panel-current`}
                currentPanel={mangaPanels[currentPanelIndex]}
                secondPanel={false}
              />
            </>
          )}
      </div>
    </main>
  );
}
