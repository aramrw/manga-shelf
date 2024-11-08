"use client";
import { useCallback, useEffect, useState } from "react";
import fetchGlobalManga, { fetchGlobalParent } from "../manga/_components/lib/fetch-global-manga";
import { MangaFolderType, ParentFolderType } from "../dashboard/page";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { readDir } from "@tauri-apps/plugin-fs";
import FolderContextMenu from "../dashboard/_components/parent_folder/folder-context-menu";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { join } from "@tauri-apps/api/path";
import { Button } from "@/components/ui/button";
import HeroEyeIcon from "../_components/icons/hero-eye-icon";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { calculateTimeSpentWatching } from "../stats/_components/main-stats";
import { MangaPanelType } from "../manga/page";

const fileTypes = ["jpg", "jpeg", "png", "gif", "webp"];

export default function MangaChapters() {
  const router = useRouter();
  const [mainParentFolder, setMainParentFolder] = useState<ParentFolderType | null>(null);
  // these can hold both manga folders and child folders
  const [parentFolders, setParentFolders] = useState<ParentFolderType[]>([]);
  // these only hold manga image panels
  const [mangaFolders, setMangaFolders] = useState<MangaFolderType[]>([]);
  const [lastReadMangaFolder, setLastReadMangaFolder] = useState<MangaFolderType>();
  const [lastReadMangaPanel, setLastReadMangaPanel] = useState<MangaPanelType>();

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

      for (const entry of dirEntries) {
        let entryPath = await join(dir, entry.name);
        if (entry.isDirectory) {
          const subEntries = await readDir(entryPath);
          let firstSubEntry = subEntries[0];

          if (firstSubEntry) {
            let firstSubEntryFileType = firstSubEntry.name.split(".")[1];
            if (fileTypes.includes(firstSubEntryFileType)) {
              //setFirstMangaFolderPanelPath(`${entryPath}\\${firstSubEntry.name}`);
              mangaFolderPaths.push(entryPath);
            } else {
              parentFolderPaths.push(entryPath);
            }
          }
        }
      }

      // Sort the arrays after all entries have been processed
      if (parentFolderPaths.length > 0 || mangaFolderPaths.length > 0) {
        parentFolderPaths.sort((a, b) => a.localeCompare(b));
        mangaFolderPaths.sort((a, b) => a.localeCompare(b));
        invokeAddFolders(parentFolderPaths, mangaFolderPaths);
      }
    },
    [invokeAddFolders],
  );

  const handleMangaClick = (mangaFolderPath: string) => {
    console.log(mangaFolders);
    const index = mangaFolders.findIndex((fold) => fold.full_path === mangaFolderPath);
    for (let i = 0; i < mangaFolders.length; i++) {
      //console.log(`setting ${mangaFolders[i].id} as read`);
      if (i <= index) {
        invoke("set_folder_read", { path: mangaFolders[i]?.full_path });
      } else {
        invoke("set_folder_unread", { path: mangaFolders[i]?.full_path });
      }
    }
    console.log("pushing to next manga");
    invoke("set_global_manga_folder", { fullPath: mangaFolderPath }).then(() => {
      router.push("/manga");
    });
  };

  const handleDisplayTime = (time: string): string => {
    time.split(":").pop();
    const [hours, minutes] = time.split(":");

    return `${hours}:${minutes}`;
  };

  // First useEffect to begin the page rendering
  useEffect(() => {
    fetchGlobalParent().then((manga: unknown) => {
      if (manga) {
        setMainParentFolder(manga as ParentFolderType);
        //console.log("manga:", manga);
      }
    });
  }, []);

  // Second useEffect to populate the folderes
  useEffect(() => {
    if (mainParentFolder) {
      readDirSort(mainParentFolder.full_path);
    }
  }, [mainParentFolder, readDirSort]);

  useEffect(() => {
    if (mangaFolders && parentFolders) {
      let paths: string[] = [];

      for (const f of mangaFolders) {
        paths.push(f.full_path);
      }
      for (const f of parentFolders) {
        paths.push(f.full_path);
      }

      invoke("find_last_read_manga_folder", { paths }).then((res: unknown) => {
        if (res) {
          const tuple = res as [MangaFolderType, MangaPanelType];
          const folder = tuple[0];
          const panel = tuple[1];
          setLastReadMangaFolder(folder);
          setLastReadMangaPanel(panel);
        }
      });
    }
  }, [mangaFolders, parentFolders]);

  return (
    <main className="w-full h-[90vh] relative">
      <>
        {mainParentFolder ? (
          <>
            <header className="w-full h-64 md:h-72 lg:h-[330px] py-2 px-4 relative border-b-primary border-b-2">
              <div
                className="absolute inset-0 z-0"
                style={{
                  backgroundImage: `linear-gradient(rgba(0,0,0,.3),rgba(0,0,0,.3)),url(${convertFileSrc(mainParentFolder?.cover_panel_path!)})`,
                  backgroundSize: "cover",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  filter: "blur(6px)",
                }}
              />
              <h1 className="bg-muted w-fit font-semibold z-10 relative text-medium md:text-xl lg:text-2xl shadow-2xl rounded-sm px-0.5 border-primary border-2 mb-1">
                {mainParentFolder?.title}
              </h1>
              <h2 className="mb-2 text-xs w-fit font-semibold z-15 relative bg-muted rounded-sm border-primary border-2 px-1">
                {mainParentFolder?.updated_at}
              </h2>
              {mainParentFolder?.cover_panel_path && mainParentFolder.title && (
                <div className="flex flex-row justify-start items-start gap-2">
                  <Image
                    alt={mainParentFolder?.title}
                    src={convertFileSrc(mainParentFolder?.cover_panel_path!)}
                    className=" relative h-[175px] md:h-[200px] lg:h-[240px] w-auto z-100 rounded-sm border-primary border-2 shadow-lg"
                    width={500}
                    height={500}
                    priority
                  />
                  {lastReadMangaFolder && lastReadMangaPanel && (
                    <TooltipProvider>
                      <Tooltip delayDuration={420}>
                        <TooltipTrigger>
                          <div
                            className="rounded-sm font-semibold mt-[1.5px] relative gap-0.5 flex flex-row justify-center items-center bg-muted text-primary hover:-translate-y-1 hover:bg-accent transition-all outline px-1"
                            onClick={() => handleMangaClick(lastReadMangaFolder?.full_path)}
                          >
                            <span>Last Read</span>
                            <HeroEyeIcon />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          align="start"
                          className="p-0.5 relative gap-1 flex flex-col justify-center items-start bg-zinc-200 text-primary font-semibold rounded-sm outline"
                        >
                          <div className="h-full p-1 shadow-md w-fit flex flex-row items-start gap-1 bg-zinc-100 rounded-sm">
                            <div className="h-full w-full gap-1 flex flex-col items-start">
                              <p className="select-none pointer-events-none h-fit border-zinc-300 border-b-[1.5px] shadow-md">{lastReadMangaFolder.title}</p>
                              <div className="gap-1 flex flex-col items-start justify-center h-full w-fit">
                                {lastReadMangaFolder.updated_at
                                  .toString()
                                  .split(" ")
                                  .map((item, index) => (
                                    <p
                                      className="border-l-2 border-zinc-400 flex flex-col select-none pointer-events-none h-fit w-fit bg-muted shadow-md px-1 rounded-sm"
                                      key={index}
                                    >
                                      {index === 1 ? handleDisplayTime(item) : item}
                                    </p>
                                  ))}
                                <p className="border-l-2 border-zinc-400 select-none pointer-events-none h-fit w-fit bg-muted shadow-md px-1 rounded-sm">
                                  TSR ({calculateTimeSpentWatching(lastReadMangaFolder.time_spent_reading)})
                                </p>
                              </div>
                            </div>
                            <Image
                              className="w-fit h-24 shadow-md rounded-sm"
                              src={convertFileSrc(lastReadMangaPanel?.full_path)}
                              alt={`lrmp${lastReadMangaFolder.title}`}
                              width={500}
                              height={500}
                            />
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              )}
            </header>
            <section className="p-0.5 bg-accent shadow-md flex flex-col gap-2">
              <div className="flex flex-row justify-start items-center gap-[5px]">
                <h1 className="w-fit font-semibold select-none px-0.5 rounded-sm z-1 text-xs">Volume List</h1>
                <h2 className="w-fit font-bold select-none bg-white px-0.5 rounded-sm drop-shadow-md text-[10px]">{mangaFolders.length}</h2>
              </div>
            </section>
            <section className="p-2">
              <ul className="px-3 py-1 w-full grid grid-cols-3 gap-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-10">
                {mangaFolders.map((folder, index) => (
                  <FolderContextMenu
                    key={`manga${index}`}
                    folder={folder}
                    setMangaFolders={setMangaFolders}
                    setParentFolders={setParentFolders}
                    handleMangaClick={handleMangaClick}
                    isMangaFolder
                    asChild
                  />
                ))}
              </ul>
            </section>
            <section className="p-0.5 bg-accent shadow-md flex flex-col gap-2">
              <div className="flex flex-row justify-start items-center gap-[5px]">
                <h1 className="w-fit font-semibold select-none px-0.5 rounded-sm z-1 text-xs">Folder List</h1>
                <h2 className="w-fit font-bold select-none bg-white px-0.5 rounded-sm drop-shadow-md text-[10px]">{parentFolders.length}</h2>
              </div>
            </section>
            <section className="p-2">
              <ul className="flex flex-row gap-2">
                {parentFolders.map((folder, index) => (
                  <FolderContextMenu
                    key={`manga${index}`}
                    folder={folder}
                    setMangaFolders={setMangaFolders}
                    setParentFolders={setParentFolders}
                    handleMangaClick={handleMangaClick}
                    asChild
                  />
                ))}
              </ul>
            </section>
          </>
        ) : (
          <span></span>
        )}
      </>
    </main>
  );
}
