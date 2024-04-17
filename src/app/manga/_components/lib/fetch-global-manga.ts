import { invoke } from "@tauri-apps/api/tauri";
import { ParentFolderType } from "@/app/dashboard/page";

export default async function fetchGlobalManga(): Promise<ParentFolderType | null> {
	const result = await invoke("get_global_manga");
	
	if (result) {
		const mangaFolder: ParentFolderType = result as ParentFolderType; 
		return mangaFolder;
	} 

	return null;
}
