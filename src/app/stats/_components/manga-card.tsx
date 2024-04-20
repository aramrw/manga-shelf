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
    <div className="px-1 h-fit shadow-sm w-full">
      <HoverCard>
        <HoverCardTrigger>
          <h2 className="text-xs font-semibold cursor-pointer overflow-hidden text-nowrap">
            {mangaFolder.title}
          </h2>
        </HoverCardTrigger>
        <HoverCardContent className="w-fit px-1 flex flex-row justify-center items-center pt-0 pb-1.5">
          <ul className="flex flex-col justify-center items-center gap-0.5">
						<li className="text-center flex underline flex-col justify-center items-center gap-0.5 text-[11px] font-bold">
							<span className="bg-muted rounded-sm px-0.5">
								{mangaFolder.title}
							</span>
						</li>
            <ul className="flex flex-row justify-center items-center gap-2">
              <li className="flex flex-col justify-center items-center text-[9px]">
                <label className="font-semibold">Updated</label>
                <span className="font-medium bg-muted rounded-sm px-0.5">
                  {mangaFolder.updated_at}
                </span>
              </li>
              <li className="flex flex-col justify-center items-center text-[9px]">
                <label className="font-semibold">Created</label>
                <span className="font-medium bg-muted rounded-sm px-0.5">
                  {mangaFolder.created_at}
                </span>
              </li>
            </ul>
          </ul>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}
