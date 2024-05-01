"use client";

import { MangaFolderType } from "@/app/dashboard/page";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import MangaCard from "../../manga-card";
import { Separator } from "@/components/ui/separator";
import Heatmap from "../../heatmap";

export default function DailyTab() {
  const [dailyMangaFolders, setDailyMangaFolders] = useState<MangaFolderType[]>(
    [],
  );

  useEffect(() => {
    invoke("fetch_daily_manga_folders").then((daily) => {
      setDailyMangaFolders(daily as MangaFolderType[]);
    });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Tracker</CardTitle>
        <CardDescription className="font-medium">
          Last updated @ {new Date().toLocaleDateString()} at{" "}
          {new Date().toLocaleTimeString()}
        </CardDescription>
        <Separator className="h-0.5 w-[270px] rounded-sm" />
      </CardHeader>
      <CardContent className="space-y-1 flex flex-row gap-4">
        <div className="flex flex-col gap-1.5 w-fit">
          <h1 className="text-sm font-bold">Recently Added</h1>
          <div className="py-1 max-h-56 overflow-auto max-w-52 rounded-md flex flex-col justify-self-auto items-start gap-2 shadow-md outline outline-secondary">
            {dailyMangaFolders.map((manga, index) => (
              <MangaCard key={index} mangaFolder={manga} />
            ))}
          </div>
        </div>
        <div className="flex justify-start items-start w-fit">
          <Heatmap/>
        </div>
      </CardContent>
    </Card>
  );
}
