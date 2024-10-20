"use client";

import {
  Card,
  CardContent,
  CardDescription,
  //CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { invoke } from "@tauri-apps/api/core";
import "chart.js/auto";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";

export default function DailyTab() {

  const [stats, setStats] = useState<number[]>();

  useEffect(() => {
      invoke("create_chart_stats", { range: "daily", }).then((daily) => {
        setStats(daily as number[]);
    })
  }, [])

  const data = {
    labels: [
      "Sun",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
    ],
    datasets: [
      {
        label: " Hours Read ",
        data: stats,
        backgroundColor: [
          "rgba(255, 99, 132, 0.2)",
          "rgba(255, 159, 64, 0.2)",
          "rgba(255, 205, 86, 0.2)",
          "rgba(75, 192, 192, 0.2)",
          "rgba(54, 162, 235, 0.2)",
          "rgba(153, 102, 255, 0.2)",
          "rgba(201, 203, 207, 0.2)",
        ],
        borderColor: [
          "rgb(255, 99, 132)",
          "rgb(255, 159, 64)",
          "rgb(255, 205, 86)",
          "rgb(75, 192, 192)",
          "rgb(54, 162, 235)",
          "rgb(153, 102, 255)",
          "rgb(201, 203, 207)",
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="pointer-events-none select-none">Daily</CardTitle>
        <CardDescription className="underline pointer-events-none select-none">
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="w-fit h-fit">
          <Bar data={data} />
        </div>
      </CardContent>
    </Card>
  );
}
