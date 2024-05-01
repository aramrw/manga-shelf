"use client";
import React, { useEffect, useState } from "react";
import HeatMap from "@uiw/react-heat-map";
import Tooltip from '@uiw/react-tooltip';
import { invoke } from "@tauri-apps/api/tauri";

interface DateCount {
  date: string;
  count: number;
}

const Heatmap = () => {
  const [panelDates, setPanelDates] = useState<DateCount[]>();

  useEffect(() => {
    invoke("get_read_panel_dates").then((res) => {
      console.log(res);
      setPanelDates(res as DateCount[]);
    });
  }, []);

  return (
    <div className="w-fit h-fit">
      <HeatMap
				className="font-semibold"
        value={panelDates}
				style={{ color: "#374253" }}
        weekLabels={["S", "M", "T", "W", "T", "F", "S"]}
        startDate={new Date("2024/01/01")}
        endDate={new Date()}
        panelColors={{
          0: "#E3EBF8",
          50: "#C9DAF2",
          150: "#88A9DB",
          300: "#5A7091",
          500: "#435166",
          700: "#374253",
        }}
        rectRender={(props, data) => {
          // if (!data.count) return <rect {...props} />;
          return (
            <Tooltip placement="top" content={`${data.count || 0}`} className="text-xs">
              <rect {...props} />
            </Tooltip>
          );
        }} />
    </div>
  );
};

export default Heatmap;
