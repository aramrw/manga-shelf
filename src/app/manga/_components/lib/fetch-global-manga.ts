import { invoke } from "@tauri-apps/api/tauri";
import { MangaFolderType, ParentFolderType } from "@/app/dashboard/page";

export default async function fetchGlobalManga(): Promise<MangaFolderType | null> {
	const result = await invoke("get_global_manga");
	
	if (result) {
		const mangaFolder: MangaFolderType = result as MangaFolderType; 
		return mangaFolder;
	} 

	return null;
}
