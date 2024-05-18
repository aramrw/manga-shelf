"use client";

import { Separator } from "@/components/ui/separator";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Folder, Timer, Video } from "lucide-react";
import { ClockIcon, EyeIcon, EyeSlashIcon, FolderIcon, VideoCameraIcon } from "@heroicons/react/16/solid";

export type MainStatsType = {
  id: number;
  total_manga: number;
  total_panels: number;
  total_panels_read: number;
  total_panels_remaining: number;
	total_time_spent_reading: number,
};

export default function MainStats() {
  const [mainStats, setMainStats] = useState<MainStatsType>();

  useEffect(() => {
      invoke("update_global_stats").then((stats) => {
        if (stats) {
          setMainStats(stats as MainStatsType);
          //console.log(stats);
        }
      });
  }, []);

  useEffect(() => {
    console.log(mainStats);
  }, [mainStats]);

  function calculateTimeSpentWatching(time: number | undefined) {
		if (time && time > 60) {
      const minutes = Math.floor(time / 60);
			if (time > 3600) {
				const hours = Math.floor(time / 3600)
				return `${hours}h ${Math.floor(minutes % 60)}m`
			}
      const seconds = time % 60;
      return `${minutes}m ${seconds}s`;
    } else if (time) {
      return `${time}s`;
    } else {
      return "0s";
    }
  }

  return (
    <div className="w-full flex flex-col justify-center items-center h-fit bg-card rounded-xl shadow-md outline outline-border p-2 select-none">
      <h1 className="font-bold rounded-md px-1">Total Stats</h1>
      <Separator className="h-[2px] w-1/5 my-1.5 mr-0.5" />
      <ul className="w-full flex flex-row justify-center items-start gap-3 pb-0.5">
        <li className="flex flex-col justify-center items-start gap-0.5 text-xs bg-muted px-2 pb-1.5 pt-0.5 rounded-md pointer-events-none select-none">
          <label className="font-semibold underline flex flex-row gap-1">Folders <FolderIcon className="w-2.5 h-auto" /></label>
          <span className="font-medium bg-accent rounded-sm px-0.5">
            {mainStats?.total_manga}
          </span>
        </li>
        <Separator className="min-w-[1.5px] max-w-[1.9px] h-11" />
        <li className="flex flex-col justify-center items-start gap-0.5 text-xs bg-muted px-2 pb-1.5 pt-0.5 rounded-md pointer-events-none select-none">
          <label className="font-semibold underline flex flex-row gap-1">Panels <VideoCameraIcon className="w-3 h-auto" /></label>
          <span className="font-medium bg-accent rounded-sm px-0.5">
            {mainStats?.total_panels}
          </span>
        </li>
        <Separator className="min-w-[1.9px] max-w-[2.05px] h-11" />
        <li className="flex flex-col justify-center items-start gap-0.5 text-xs bg-muted px-2 pb-1.5 pt-0.5 rounded-md pointer-events-none select-none">
          <label className="font-semibold underline flex flex-row gap-1">Read <EyeIcon className="w-3 h-auto"/></label>
          <span className="font-medium bg-accent rounded-sm px-0.5">
            {mainStats?.total_panels_read}
          </span>
        </li>
        <Separator className="min-w-[2.1px] max-w-[2px] h-11" />
        <li className="flex flex-col justify-center items-start gap-0.5 text-xs bg-muted px-2 pb-1.5 pt-0.5 rounded-md pointer-events-none select-none">
          <label className="font-semibold underline flex flex-row gap-1">Remaining <EyeSlashIcon className="w-3 h-auto"/> </label>
          <span className="font-medium bg-accent rounded-sm px-0.5">
            {mainStats?.total_panels_remaining}
          </span>
        </li>
        <Separator className="min-w-[2.1px] max-w-[2px] h-11" />
        <li className="flex flex-col justify-center items-start gap-0.5 text-xs bg-muted px-2 pb-1.5 pt-0.5 rounded-md pointer-events-none select-none">
          <label className="font-semibold underline flex flex-row gap-1">Time Spent Reading <ClockIcon className="w-3 h-auto" /></label>
          <span className="font-medium bg-accent rounded-sm px-0.5">
					{calculateTimeSpentWatching(mainStats?.total_time_spent_reading)}
					</span>
        </li>
      </ul>
    </div>
  );
}
