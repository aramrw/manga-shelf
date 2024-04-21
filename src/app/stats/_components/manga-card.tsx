"use client";

import { MangaFolderType } from "@/app/dashboard/page";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";

type MangaStatsType = {
  total_panels: number;
  total_panels_read: number;
  total_panels_remaining: number;
};

export default function MangaCard({
  mangaFolder,
}: {
  mangaFolder: MangaFolderType;
}) {
  const [stats, setStats] = useState<MangaStatsType>();

  function calculateTimeSpentReading(time: number | undefined) {
    // if time (seconds) is greater than a minute render both minutes and seconds
    // else render only seconds
    if (time && time > 60) {
      const minutes = Math.floor(time / 60);
      const seconds = time % 60;
      return `${minutes}m ${seconds}s`;
    } else if (time) {
      return `${time}s`;
    } else {
      return "0s";
    }
  }

  useEffect(() => {
    invoke("create_manga_stats", { folderPath: mangaFolder.full_path }).then(
      (stats: unknown) => {
        setStats(stats as MangaStatsType);
      },
    );
  }, []);

  return (
    <div className="px-1 h-fit shadow-sm w-full">
      <HoverCard>
        <HoverCardTrigger>
          <h2 className="text-xs font-semibold cursor-pointer overflow-hidden text-nowrap">
            {mangaFolder.title}
          </h2>
        </HoverCardTrigger>
        <HoverCardContent className="w-fit px-1 flex flex-row justify-center items-center pt-0.5 pb-1.5">
          <ul className="flex flex-col justify-center items-center gap-0.5">
            <li className="text-center flex flex-col justify-center items-center gap-0.5 text-[11px] font-bold">
              <span className="bg-muted rounded-sm px-0.5">
                {mangaFolder.title}
              </span>
            </li>
            <Separator className="h-[1.1px] w-11/12" />
            <ul className="flex flex-row justify-center items-center gap-2">
              <li className="flex flex-col justify-center items-center ">
                <label className="font-semibold text-[9.5px]">Updated</label>
                <span className="font-medium bg-accent-foreground rounded-sm px-0.5 text-[7px]">
                  {mangaFolder.updated_at}
                </span>
              </li>
              <li className="flex flex-col justify-center items-center">
                <label className="font-semibold text-[9.5px]">Created</label>
                <span className="font-medium bg-accent-foreground rounded-sm px-0.5 text-[7px]">
                  {mangaFolder.created_at}
                </span>
              </li>
            </ul>
            <Separator className="h-[1.1px] w-4/5 mt-0.5" />
            {stats && stats.total_panels > 0 ? (
              <>
                <ul className="flex flex-row justify-center items-center gap-1">
                  <li className="text-center flex flex-col justify-center items-center bg-muted rounded-sm p-0.5">
                    <label className="font-semibold text-[9.5px]">
                      Total Panels
                    </label>
                    <span className="bg-accent-foreground rounded-sm px-0.5 font-medium text-[9px]">
                      {stats?.total_panels}
                    </span>
                  </li>
                  <li className="text-center flex flex-col justify-center items-center bg-muted rounded-sm p-0.5">
                    <label className="font-semibold text-[9.5px]">Read</label>
                    <span className="bg-accent-foreground rounded-sm px-0.5 font-medium text-[9px]">
                      {stats?.total_panels_read}
                    </span>
                  </li>
                  <li className="text-center flex flex-col justify-center items-center bg-muted rounded-sm p-0.5">
                    <label className="font-semibold text-[9.5px]">
                      Remaining
                    </label>
                    <span className="bg-accent-foreground rounded-sm px-0.5 font-medium text-[9px]">
                      {stats?.total_panels_remaining}
                    </span>
                  </li>
                </ul>
                <li className="text-center flex flex-col justify-center items-center bg-muted rounded-sm p-0.5">
                  <label className="font-semibold text-[9.5px]">
                    Time Spent Reading
                  </label>
                  <span className="bg-accent-foreground rounded-sm px-0.5 font-medium text-[9px]">
                    {calculateTimeSpentReading(mangaFolder.time_spent_reading)}
                  </span>
                </li>
              </>
            ) : (
              <span className="text-[9px] font-semibold">
                Start Reading to Generate Stats
              </span>
            )}
            <Separator className="h-[1.1px] w-11/12 mt-0.5" />
          </ul>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}
