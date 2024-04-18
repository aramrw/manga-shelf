import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ParentFolderType } from "../../page";
import {
  BackspaceIcon,
  FireIcon,
  FolderIcon,
  TrashIcon,
} from "@heroicons/react/16/solid";
import { invoke } from "@tauri-apps/api/tauri";
import ParentFolder from "./parent-folder";
import { Delete } from "lucide-react";

export default function ParentFolderContextMenu({
  folder,
  setParentFolders,
}: {
  folder: ParentFolderType;
  setParentFolders: React.Dispatch<React.SetStateAction<ParentFolderType[]>>;
}) {
  const invokeDeleteFolder = (id: string, path: string, allData: boolean) => {
    invoke("delete_manga_folder", { id, path, allData }).then(() => {
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
      <ContextMenuContent className="font-semibold">
        <ContextMenuItem
          className="flex flex-row items-center gap-0.5 cursor-pointer"
          onClick={() => handleInvokeShowInFolder(folder.full_path)}
        >
          <span>Show In Explorer</span>
          <FolderIcon className="h-4 w-auto" />
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger className="cursor-pointer flex flex-row items-center gap-0.5">
            <span>Delete</span>
            <BackspaceIcon className="h-4 w-auto" />
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="ml-1">
            <ContextMenuItem
              className="flex flex-row items-center gap-0.5 cursor-pointer"
              onClick={() =>
                invokeDeleteFolder(folder.id, folder.full_path, false)
              }
            >
              <span>Folder Only</span>
              <FolderIcon className="h-4 w-auto" />
            </ContextMenuItem>
            <ContextMenuItem
              className="flex flex-row items-center gap-0.5 cursor-pointer"
              onClick={() =>
                invokeDeleteFolder(folder.id, folder.full_path, true)
              }
            >
              <span>Include Panel Data</span>
              <FireIcon className="h-4 w-auto" />
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
}
