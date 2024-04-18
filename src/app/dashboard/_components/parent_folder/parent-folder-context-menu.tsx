import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ParentFolderType } from "../../page";
import { FolderIcon, TrashIcon } from "@heroicons/react/16/solid";
import { invoke } from "@tauri-apps/api/tauri";
import ParentFolder from "./parent-folder";

export default function ParentFolderContextMenu({
  folder,
  setParentFolders,
}: {
  folder: ParentFolderType;
  setParentFolders: React.Dispatch<React.SetStateAction<ParentFolderType[]>>;
}) {
  const handleInvokeDeleteParentFolder = (id: string, path: string) => {
    invoke("delete_manga_folder", { id, path }).then(() => {
      setParentFolders((prev) => prev.filter((f) => f.id !== id));
    });
  };

	const handleInvokeShowInFolder = (path: string) => {
		invoke("show_in_folder", { path });	
	};

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <ParentFolder key={folder.id} parentFolder={folder} />
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          className="font-semibold flex flex-row items-center gap-0.5 cursor-pointer"
          onClick={() =>
						handleInvokeShowInFolder(folder.full_path)
          }
        >
          <span>Show In Folder</span>
          <FolderIcon className="h-4 w-auto" />
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          className="font-semibold flex flex-row items-center gap-0.5 cursor-pointer"
          onClick={() =>
            handleInvokeDeleteParentFolder(folder.id, folder.full_path)
          }
        >
          <span>Delete</span>
          <TrashIcon className="h-4 w-auto" />
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
