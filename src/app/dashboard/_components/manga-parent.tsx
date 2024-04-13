import { FileEntry } from "@tauri-apps/api/fs";
import { ParentFolder } from "../page";

export default function MangaParent({
  parentFolder,
}: {
  parentFolder: ParentFolder ;
}) {



  return (
    <main
      className="
			w-full 
			p-1 
			bg-primary
			flex 
			flex-col 
			justify-center
			items-center
			text-center
			rounded-sm
			cursor-pointer
			hover:scale-[1.02]
			transition-transform
			duration-200 
			will-change-transform
			"
    >
      <div className="w-full h-full flex flex-col justify-center items-center bg-secondary">
        <h1 className="text-xs font-bold">{parentFolder.title}</h1>
      </div>
    </main>
  );
}
