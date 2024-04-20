"use client";

import { ParentFolderType } from "@/app/dashboard/page";
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

export default function DailyTab() {
  const [dailyManga, setDailyManga] = useState<ParentFolderType[]>([]);

  useEffect(() => {
    invoke("fetch_daily").then((daily) => {
      setDailyManga(daily as ParentFolderType[]);
    });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily</CardTitle>
        <CardDescription>
          Set goals & track your daily reading progress here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <h1 className="text-sm font-bold">Updated Today</h1>
        <div className="py-1 max-h-56 overflow-auto w-fit pr-2 rounded-md flex flex-col justify-center items-start gap-2 shadow-md outline outline-secondary">
          {dailyManga.map((manga, index) => (
            <MangaCard key={index} mangaFolder={manga} />
          ))}
        </div>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
}
