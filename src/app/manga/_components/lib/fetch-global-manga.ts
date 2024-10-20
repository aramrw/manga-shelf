import { invoke } from "@tauri-apps/api/core";
import { MangaFolderType, ParentFolderType } from "@/app/dashboard/page";

export default async function fetchGlobalManga(): Promise<MangaFolderType | null> {
  const result = await invoke("get_global_manga");
  if (result) {
    const mangaFolder: MangaFolderType = result as MangaFolderType;
    return mangaFolder;
  }
  return null;
}

export async function fetchGlobalParent(): Promise<ParentFolderType | null> {
  const result = await invoke("get_global_parent");
  if (result) {
    const parentFolder: ParentFolderType = result as ParentFolderType;
    return parentFolder;
  }
  return null;
}
