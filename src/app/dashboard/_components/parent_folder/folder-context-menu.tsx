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
import { MangaFolderType, ParentFolderType } from "../../page";
import { BackspaceIcon, FireIcon, FolderIcon } from "@heroicons/react/16/solid";
import { invoke } from "@tauri-apps/api/tauri";
import ParentFolder from "./parent-folder";
import { cn } from "@/lib/utils";

export default function FolderContextMenu({
  folder,
  isMangaFolder,
  asChild,
  setMangaFolders,
  setParentFolders,
  handleMangaClick,
}: {
  folder: ParentFolderType;
  isMangaFolder?: boolean;
  asChild?: boolean;
  setMangaFolders: React.Dispatch<React.SetStateAction<MangaFolderType[]>>;
  setParentFolders: React.Dispatch<React.SetStateAction<ParentFolderType[]>>;
  handleMangaClick?: (mangaFolderPath: string) => void;
}) {
  const invokeDeleteFolder = (id: string, path: string, allData: boolean) => {
    invoke("delete_folder", { id, path, allData }).then(() => {
      setMangaFolders((prev) => prev.filter((f) => f.id !== id));
      setParentFolders((prev) => prev.filter((f) => f.id !== id));
    });
  };

  const handleInvokeShowInFolder = (path: string) => {
    invoke("show_in_folder", { path });
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger className="h-fit w-full">
        {isMangaFolder && handleMangaClick ? (
          <ul
            className={cn(
              "h-fit w-full p-1 bg-muted-foreground flex flex-col justify-center items-center text-center rounded-sm cursor-pointer will-change-transform shadow-sm transition-transform duration-100 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-muted-foreground ring-opacity-50 font-bold",
              asChild && "p-0 bg-none font-semibold text-xs rounded-none bg-primary hover:opacity-80",
              !asChild && "hover:scale-[1.005] ",
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleMangaClick(folder.full_path);
              }
            }}
            onClick={() => handleMangaClick(folder.full_path)}
            tabIndex={0}
          >
            <li className="p-1 mb-0.5 w-full h-full flex flex-col justify-center items-center bg-muted">
              <h1 className="w-full overflow-hidden text-nowrap">
                {folder.title}
              </h1>
            </li>
          </ul>
        ) : (
          <ParentFolder key={folder.id} parentFolder={folder} />
        )}
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
