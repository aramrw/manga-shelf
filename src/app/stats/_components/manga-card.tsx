import { ParentFolderType } from "@/app/dashboard/page";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export default function MangaCard({
  mangaFolder,
}: {
  mangaFolder: ParentFolderType;
}) {
  return (
    <div className="px-1 h-full shadow-sm">
      <HoverCard>
        <HoverCardTrigger>
          <h2 className="text-xs font-semibold cursor-pointer">
            {mangaFolder.title}
          </h2>
        </HoverCardTrigger>
        <HoverCardContent className="px-1 flex flex-row justify-center items-center pt-0 pb-1.5">
          <ul className="flex flex-col justify-center items-center gap-0.5">
            <li className="flex flex-col justify-center items-center gap-0.5 text-xs">
              <label className="font-semibold underline">Updated</label>
              <span className="font-medium bg-accent-foreground rounded-sm px-0.5 outline outline-primary">
                {mangaFolder.updated_at}
              </span>
            </li>
            <li className="flex flex-col justify-center items-center gap-0.5 text-xs">
              <label className="font-semibold underline">Created</label>
              <span className="font-medium bg-accent-foreground rounded-sm px-0.5 outline outline-primary">
                {mangaFolder.created_at}
              </span>
            </li>
          </ul>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}
