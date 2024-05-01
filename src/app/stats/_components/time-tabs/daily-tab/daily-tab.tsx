"use client";

import { MangaFolderType } from "@/app/dashboard/page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import MangaCard from "../../manga-card";
import { Separator } from "@/components/ui/separator";
import Heatmap from "../../heatmap";
import { Label } from "@/components/ui/label";

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
        <CardTitle>Progress & Statistics</CardTitle>
        <CardDescription className="font-medium">
          Last Updated : {new Date().toLocaleDateString()} @{" "}
          {new Date().toLocaleTimeString()}
        </CardDescription>
        <Separator className="h-0.5 w-[270px] rounded-sm" />
      </CardHeader>
      <CardContent className="flex flex-row gap-4">
        <div className="flex flex-col gap-1.5 w-fit">
          <Label className="text-sm font-bold">Recently Added</Label>
          <div className="py-1 max-h-56 overflow-auto max-w-52 rounded-md flex flex-col justify-self-auto items-start gap-2 outline outline-secondary">
            {dailyMangaFolders.map((manga, index) => (
              <MangaCard key={index} mangaFolder={manga} />
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-start items-start w-fit gap-1.5">
          <Label className="text-sm font-bold">Panels Read</Label>
          <Heatmap/>
        </div>
      </CardContent>
    </Card>
  );
}
