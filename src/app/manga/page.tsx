"use client";

import fetchGlobalManga from "./_components/lib/fetch-global-manga";
import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { FileEntry, readDir } from "@tauri-apps/api/fs";
import { MangaFolderType } from "../dashboard/page";
import MangaPanel from "./_components/manga-panel";
import MangaHeader from "./_components/manga-header";

export type MangaPanelType = {
  id: string;
  title: string;
  full_path: string;
  is_read: boolean;
  width: number;
  height: number;
  zoom_level: number;
  created_at: string;
  updated_at: string;
};

export default function Manga() {
  const [currentManga, setCurrentManga] = useState<MangaFolderType | null>(
    null,
  );
  const [mangaPanels, setMangaPanels] = useState<FileEntry[]>([]);
  const [currentPanelIndex, setCurrentPanelIndex] = useState<number>(0);
  const [currentMangaPanel, setCurrentMangaPanel] =
    useState<MangaPanelType | null>(null);
  const [zoomLevel, setZoomLevel] = useState(490);
  const [isDoublePanels, setIsDoublePanels] = useState<boolean>(false);

  useEffect(() => {
    fetchGlobalManga().then((manga) => {
      if (manga) {
        setCurrentManga(manga as MangaFolderType);
        console.log("manga:", manga);
        if (manga.double_panels) {
          setIsDoublePanels(true);
        }
      }
    });
  }, []);

  const invokeFindLastReadPanel = useCallback(() => {
    if (currentManga) {
      console.log("currentManga:", currentManga);
      readDir(currentManga.full_path).then((result) => {
        if (result) {
          let sorted = result.sort((a, b) => {
            if (a.name && b.name) {
              return a.name.localeCompare(b.name, undefined, {
                numeric: true,
              });
            } else if (a.name) {
              return -1; // a is sorted to a lower index than b
            } else if (b.name) {
              return 1; // b is sorted to a lower index than a
            } else {
              return 0; // both a and b are undefined, so they're considered equal
            }
          });

          setMangaPanels(sorted);
          // always update the first panel as read because
          // the handles only invoke starting from the second panel
          invoke("update_manga_panel", {
            dirPaths: JSON.stringify([result[0].path]),
            isRead: true,
            zoomLevel: 0,
          });
        }
      });

      invoke("find_last_read_panel", {
        chapterPath: currentManga.full_path,
      }).then((lastReadPanelIndex: unknown) => {
        console.log("previous:", lastReadPanelIndex);
        setCurrentPanelIndex(lastReadPanelIndex as number);
      });
    }
  }, [currentManga]);

  const invokeGetCurrentPanel = useCallback(() => {
    if (
      currentManga &&
      mangaPanels.length > 0 &&
      mangaPanels[currentPanelIndex]
    ) {
      invoke("get_manga_panel", {
        path: mangaPanels[currentPanelIndex].path,
      }).then((panel: unknown) => {
        let knownPanel = panel as MangaPanelType;
        setCurrentMangaPanel(knownPanel);
        if (knownPanel.zoom_level > 0) {
          setZoomLevel(knownPanel.zoom_level);
        }
      });
    }
  }, [currentManga, currentPanelIndex, mangaPanels]);

  useEffect(() => {
    if (
      currentPanelIndex > -1 &&
      mangaPanels.length > 0 &&
      mangaPanels[currentPanelIndex]
    ) {
      //console.log("getting:", mangaPanels[currentPanelIndex].path);
      let remove = setTimeout(() => {
        invokeGetCurrentPanel();
      }, 30);

      return () => {
        clearTimeout(remove);
      };
    }
  }, [mangaPanels, currentPanelIndex, invokeGetCurrentPanel]);

  useEffect(() => {
    if (currentManga) invokeFindLastReadPanel();
  }, [currentManga, invokeFindLastReadPanel]);

  // previous panels
  const handlePreviousPanel = () => {
    // if the current panel index is 1, it will set it to 0
    if (currentPanelIndex - 2 === -1) {
      invoke("update_manga_panel", {
        dirPaths: JSON.stringify([
          mangaPanels[currentPanelIndex - 1].path,
          mangaPanels[currentPanelIndex].path,
        ]),
        isRead: false,
        zoomLevel: zoomLevel,
      });

      setCurrentPanelIndex(0);
    } else if (currentPanelIndex - 2 > -1) {
      invoke("update_manga_panel", {
        dirPaths: JSON.stringify([
          mangaPanels[currentPanelIndex - 1].path,
          mangaPanels[currentPanelIndex].path,
        ]),
        isRead: false,
        zoomLevel: zoomLevel,
      });

      setCurrentPanelIndex((prev) => prev - 2);
    }
  };

  const handlePreviousSinglePanel = () => {
    if (currentPanelIndex - 1 > -1) {
      invoke("update_manga_panel", {
        dirPaths: JSON.stringify([mangaPanels[currentPanelIndex].path]),
        isRead: false,
        zoomLevel: zoomLevel,
      });
      setCurrentPanelIndex((prev) => prev - 1);
    }
  };

  // next panels
  const handleNextPanel = () => {
    if (currentPanelIndex + 2 <= mangaPanels.length - 1) {
      invoke("update_manga_panel", {
        dirPaths: JSON.stringify([
          mangaPanels[currentPanelIndex + 1].path,
          mangaPanels[currentPanelIndex + 2].path,
        ]),
        isRead: true,
        zoomLevel: zoomLevel,
      });
      setCurrentPanelIndex((prev) => prev + 2);

      // then update the bar chart
    }
  };

  const handleNextSinglePanel = () => {
    if (currentPanelIndex + 1 <= mangaPanels.length - 1) {
      invoke("update_manga_panel", {
        dirPaths: JSON.stringify([mangaPanels[currentPanelIndex + 1].path]),
        isRead: true,
        zoomLevel: zoomLevel,
      });
      setCurrentPanelIndex((prev) => prev + 1);

      // then update the bar chart
    }
  };

  const handleSetLastPanel = () => {
    const panelDirs: string[] = [];
    for (const panel of mangaPanels) {
      panelDirs.push(panel.path);
    }

    // if user is already at the last panel
    // push router to next manga folder if any
    if (mangaPanels.length > 0) {
      invoke("update_manga_panel", {
        dirPaths: JSON.stringify(panelDirs),
        isRead: true,
        zoomLevel: zoomLevel,
      });

      if (currentPanelIndex === mangaPanels.length - 1) {
        invoke("get_next_or_previous_manga_folder", {
          currentFolderPath: currentManga?.full_path,
          isNext: true,
        }).then((nextFolder: unknown) => {
          console.log("nextFolder:", nextFolder);
          if (nextFolder) {
            invoke("set_global_manga", {
              fullPath: (nextFolder as MangaFolderType).full_path,
            }).then(() => {
              // update the currentManga as read before replacing
              invoke("set_folder_read", { path: currentManga?.full_path });
              setCurrentManga(nextFolder as MangaFolderType);
            });
          }
        });
      }

      setCurrentPanelIndex(mangaPanels.length - 1);
    }
  };

  const handleSetFirstPanel = () => {
    const panelDirs: string[] = [];
    for (const panel of mangaPanels) {
      panelDirs.push(panel.path);
    }

    // if user is already at the first panel
    // push router to prev manga folder if any

    if (mangaPanels.length > 0 && panelDirs.length > 0) {
      invoke("update_manga_panel", {
        dirPaths: JSON.stringify(panelDirs),
        isRead: false,
        zoomLevel: zoomLevel,
      });

      if (currentPanelIndex === 0) {
        invoke("get_next_or_previous_manga_folder", {
          currentFolderPath: currentManga?.full_path,
          isNext: false,
        }).then((nextFolder: unknown) => {
          console.log("prev:", nextFolder);
          if (nextFolder) {
            invoke("set_global_manga", {
              fullPath: (nextFolder as MangaFolderType).full_path,
            }).then(() => {
              // update the `nextFolder` as unread before replacing
              // `nextFolder` actually refers to the previous folder
              invoke("set_folder_unread", {
                path: (nextFolder as MangaFolderType)?.full_path,
              });
              setCurrentManga(nextFolder as MangaFolderType);
            });
          }
        });
      }

      setCurrentPanelIndex(0);
    }
  };

  return (
    <main className="w-full h-full flex flex-col justify-center items-center">
      {currentManga &&
        currentMangaPanel &&
        currentPanelIndex <= mangaPanels.length - 1 &&
        currentPanelIndex >= -1 && (
          <>
            <MangaHeader
              key={`${currentManga.title}-manga-header`}
              currentManga={currentManga}
              setIsDoublePanels={setIsDoublePanels}
              handleNextPanel={handleNextPanel}
              handleNextSinglePanel={handleNextSinglePanel}
              handlePreviousPanel={handlePreviousPanel}
              handlePreviousSinglePanel={handlePreviousSinglePanel}
              handleSetLastPanel={handleSetLastPanel}
              handleSetFirstPanel={handleSetFirstPanel}
              doublePanels={isDoublePanels}
              currentPanelPath={mangaPanels[currentPanelIndex].path}
              zoomLevel={zoomLevel}
              setZoomLevel={setZoomLevel}
            />
            <div className="flex flex-row justify-center items-center">
              <>
                {isDoublePanels && mangaPanels[currentPanelIndex + 1] && (
                  <MangaPanel
                    key={`${mangaPanels[currentPanelIndex].path}-manga-panel-next`}
                    currentPanel={mangaPanels[currentPanelIndex + 1]}
                    secondPanel={true}
                    zoomLevel={zoomLevel}
                    width={currentMangaPanel.width}
                    height={currentMangaPanel.height}
                  />
                )}

                <MangaPanel
                  key={`${mangaPanels[currentPanelIndex].path}-manga-panel-current`}
                  currentPanel={mangaPanels[currentPanelIndex]}
                  secondPanel={false}
                  zoomLevel={zoomLevel}
                  width={currentMangaPanel.width}
                  height={currentMangaPanel.height}
                />
              </>
              <h1 className="fixed left-50 bottom-1 text-xs font-semibold text-muted-foreground pointer-events-none">
                {`${currentPanelIndex}/${mangaPanels.length - 1}`}
              </h1>
            </div>
          </>
        )}
    </main>
  );
}
