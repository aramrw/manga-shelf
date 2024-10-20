"use client";
import { useCallback, useEffect, useState } from "react";
import fetchGlobalManga, { fetchGlobalParent } from "../manga/_components/lib/fetch-global-manga";
import { MangaFolderType, ParentFolderType } from "../dashboard/page";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { readDir } from "@tauri-apps/plugin-fs";
import FolderContextMenu from "../dashboard/_components/parent_folder/folder-context-menu";
import { useRouter } from "next/navigation";
import Image from "next/image";

const fileTypes = ["jpg", "jpeg", "png", "gif", "webp"];

export default function MangaChapters() {
  const router = useRouter();
  const [mainParentFolder, setMainParentFolder] = useState<ParentFolderType | null>(null);
  // these can hold both manga folders and child folders
  const [parentFolders, setParentFolders] = useState<ParentFolderType[]>([]);
  // these only hold manga image panels
  const [mangaFolders, setMangaFolders] = useState<MangaFolderType[]>([]);

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
        let entryPath = `${dir}\\${entry.name}`;
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

  useEffect(() => {
    fetchGlobalParent().then((manga: unknown) => {
      if (manga) {
        setMainParentFolder(manga as ParentFolderType);
        //console.log("manga:", manga);
      }
    });
  }, []);

  useEffect(() => {
    if (mainParentFolder) {
      readDirSort(mainParentFolder.full_path);
    }
  }, [mainParentFolder, readDirSort]);

  return (
    <main className="w-full h-[90vh] relative">
      <>
        {mainParentFolder ? (
          <>
            <header className="w-full h-64 md:h-72 lg:h-[330px] py-3 px-2 relative border-b-primary border-b-2">
              <div
                className="absolute inset-0 z-0"
                style={{
                  backgroundImage: `url(${convertFileSrc(mainParentFolder?.cover_panel_path!)})`,
                  backgroundSize: "cover",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  filter: "blur(3px)",
                }}
              />
              <h1 className="bg-muted w-fit font-semibold z-10 relative text-medium md:text-xl lg:text-2xl shadow-2xl rounded-sm px-0.5 border-primary border-2 mb-1">
                {mainParentFolder?.title}
              </h1>
              <h2 className="mb-2 text-xs w-fit font-semibold z-15 relative bg-muted rounded-sm border-primary border-2 px-1">
                {mainParentFolder?.updated_at}
              </h2>
              {mainParentFolder?.cover_panel_path && mainParentFolder.title && (
                <Image
                  alt={mainParentFolder?.title}
                  src={convertFileSrc(mainParentFolder?.cover_panel_path!)}
                  className=" relative h-[175px] md:h-[200px] lg:h-[240px] w-auto z-100 rounded-sm border-primary border-2 shadow-lg"
                  width={500}
                  height={500}
                  priority
                />
              )}
            </header>
            <section className="p-0.5 bg-accent shadow-md flex flex-col gap-2">
              <div className="flex flex-row justify-start items-center gap-[5px]">
                <h1 className="w-fit font-semibold select-none px-0.5 rounded-sm z-1 text-xs">Volume List</h1>
                <h2 className="w-fit font-bold select-none bg-white px-0.5 rounded-sm drop-shadow-md text-[10px]">{mangaFolders.length}</h2>
              </div>
            </section>
            <section className="p-2">
              <ul className="w-fit flex flex-row gap-2">
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
          <span>loading</span>
        )}
      </>
    </main>
  );
}
