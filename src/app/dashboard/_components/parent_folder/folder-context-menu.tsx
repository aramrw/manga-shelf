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
import { BackspaceIcon, BookOpenIcon, EyeIcon, EyeSlashIcon, FireIcon, FolderIcon } from "@heroicons/react/16/solid";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import ParentFolder from "./parent-folder";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { BookCheckIcon } from "lucide-react";

export default function FolderContextMenu({
  folder,
  isMangaFolder,
  asChild,
  setMangaFolders,
  setParentFolders,
  handleMangaClick,
}: {
  folder: ParentFolderType | MangaFolderType;
  isMangaFolder?: boolean;
  asChild?: boolean;
  setMangaFolders: React.Dispatch<React.SetStateAction<MangaFolderType[]>>;
  setParentFolders: React.Dispatch<React.SetStateAction<ParentFolderType[]>>;
  handleMangaClick?: (mangaFolderPath: string) => void;
}) {
  //console.log(folder);

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
          <div
            className={cn(
              "h-[150px] w-full max-w-32 bg-primary p-1 flex flex-col justify-center items-center text-center rounded-sm cursor-pointer will-change-transform shadow-md transition-transform duration-100 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-muted-foreground ring-opacity-50 font-bold",
              asChild &&
                "p-0 border-primary border-2 bg-none font-semibold text-xs rounded-sm bg-primary transition hover:translate-y-[1px] will-change-transform",
              !asChild && "hover:scale-[1.005]",
              "relative", // Keep the div relative for positioning
              !(folder as MangaFolderType).is_read && "brightness-50",
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleMangaClick(folder.full_path);
              }
            }}
            onClick={() => handleMangaClick(folder.full_path)}
            tabIndex={0}
          >
            <style jsx>{`
              div::before {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-image: url(${convertFileSrc(folder.cover_panel_path)});
                filter: blur(5px); /* Adjust the blur radius as needed */
                z-index: 0; /* Place it behind the image */
                background-size: cover;
                background-position: center;
              }
            `}</style>

            <Image
              alt={folder.title}
              className="object-cover w-full h-full relative z-10" // Ensure image stays on top
              src={convertFileSrc(folder.cover_panel_path)}
              priority
              width={500}
              height={500}
            />
          </div>
        ) : (
          //This is the outermost folder. AKA it cannot be a child
          <ParentFolder key={folder.id} parentFolder={folder} />
        )}
      </ContextMenuTrigger>
      {!asChild && (
        <ContextMenuContent className="font-semibold">
          <ContextMenuItem className="flex flex-row items-center gap-0.5 cursor-pointer" onClick={() => handleInvokeShowInFolder(folder.full_path)}>
            <span>Show In Explorer</span>
            <FolderIcon className="h-4 w-auto" />
          </ContextMenuItem>
          <ContextMenuSeparator />
          {isMangaFolder && (
            <>
              <ContextMenuSub>
                <ContextMenuSubTrigger className="cursor-pointer flex flex-row items-center gap-0.5">
                  <span>Read</span>
                  <BookOpenIcon className="h-4 w-auto" />
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="ml-1">
                  <ContextMenuItem
                    className="flex flex-row items-center gap-0.5 cursor-pointer"
                    onClick={() => {
                      invoke("set_folder_read", { path: folder.full_path }).then((_) => {});
                    }}
                  >
                    <span>Set as Read</span>
                    <EyeIcon className="h-4 w-auto" />
                  </ContextMenuItem>
                  <ContextMenuItem
                    className="flex flex-row items-center gap-0.5 cursor-pointer"
                    onClick={() => {
                      invoke("set_folder_unread", { path: folder.full_path });
                    }}
                  >
                    <span>Set as Unread</span>
                    <EyeSlashIcon className="h-4 w-auto" />
                  </ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
              <ContextMenuSeparator />
            </>
          )}
          <ContextMenuSub>
            <ContextMenuSubTrigger className="cursor-pointer flex flex-row items-center gap-0.5">
              <span>Delete</span>
              <BackspaceIcon className="h-4 w-auto" />
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="ml-1">
              <ContextMenuItem
                className="flex flex-row items-center gap-0.5 cursor-pointer"
                onClick={() => invokeDeleteFolder(folder.id, folder.full_path, false)}
              >
                <span>Folder Only</span>
                <FolderIcon className="h-4 w-auto" />
              </ContextMenuItem>
              <ContextMenuItem
                className="flex flex-row items-center gap-0.5 cursor-pointer"
                onClick={() => invokeDeleteFolder(folder.id, folder.full_path, true)}
              >
                <span>Include Panel Data</span>
                <FireIcon className="h-4 w-auto" />
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
}
