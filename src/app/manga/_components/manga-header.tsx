"use client";

import { ParentFolderType } from "@/app/dashboard/page";
import { Button } from "@/components/ui/button";
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
} from "@heroicons/react/16/solid";
import { invoke } from "@tauri-apps/api/tauri";
import { useCallback, useEffect } from "react";

const MangaHeader = ({
  currentManga,
  largePanel,
  currentPanelPath,
  zoomLevel,
  setZoomLevel,
  handleNextPanel,
  handleNextSinglePanel,
  handlePreviousPanel,
  handlePreviousSinglePanel,
  handleSetLastPanel,
  handleSetFirstPanel,
}: {
  currentManga: ParentFolderType;
  largePanel: boolean;
  currentPanelPath: string;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  handleNextPanel: () => void;
  handleNextSinglePanel: () => void;
  handlePreviousPanel: () => void;
  handlePreviousSinglePanel: () => void;
  handleSetLastPanel: () => void;
  handleSetFirstPanel: () => void;
}) => {
  const handleMagnify = useCallback(() => {
    setZoomLevel((prev) => prev + 10);
    invoke("update_manga_panel", {
      dirPaths: JSON.stringify([currentPanelPath]),
      isRead: true,
      zoomLevel: zoomLevel + 10,
    });
  }, [currentPanelPath, zoomLevel, setZoomLevel]);

  const handleMinify = useCallback(() => {
    setZoomLevel((prev) => prev - 10);
    invoke("update_manga_panel", {
      dirPaths: JSON.stringify([currentPanelPath]),
      isRead: true,
      zoomLevel: zoomLevel - 10,
    });
  }, [currentPanelPath, zoomLevel, setZoomLevel]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {

      // set first and last panel
      if (event.ctrlKey && event.key === "ArrowRight") {
        handleSetFirstPanel();
      } else if (event.ctrlKey && event.key === "ArrowLeft") {
        handleSetLastPanel();
      } // previous panels
			else if (event.shiftKey && event.key === "ArrowRight") {
        handlePreviousSinglePanel();
      } else if (event.key === "ArrowRight") {
        if (largePanel) {
          handlePreviousSinglePanel();
        } else {
          handlePreviousPanel();
        }
      } // next panels
			else if (event.shiftKey && event.key === "ArrowLeft") {
        handleNextSinglePanel();
      } else if (event.key === "ArrowLeft") {
        if (largePanel) {
          handleNextSinglePanel();
        } else {
          handleNextPanel();
        }
      }

      // handle zoom level
      if (event.ctrlKey && event.key === "=") {
        handleMagnify();
      } else if (event.ctrlKey && event.key === "-") {
        handleMinify();
      }
    },
    [
      handleNextPanel,
      handlePreviousPanel,
      handleNextSinglePanel,
      handlePreviousSinglePanel,
			handleSetFirstPanel,
			handleSetLastPanel,
      handleMagnify,
      handleMinify,
      largePanel,
    ],
  );

  useEffect(() => {
    addEventListener("keydown", handleKeyDown);

    return () => {
      removeEventListener("keydown", handleKeyDown);
    };
  }, [handleNextPanel, handlePreviousPanel, handleKeyDown]);

  return (
    <header className="w-full h-fit bg-secondary p-1.5 rounded-b-sm flex justify-center items-center border-b-2 border-accent shadow-sm">
      <menu className="w-full h-full flex flex-row justify-center items-center gap-1.5">
        <ul className="w-fit h-fit flex flex-row justify-center items-center gap-1">
          <li className="flex flex-row justify-center items-center">
            <Button className="py-0.5 px-1 shadow-lg" onClick={handleMagnify}>
              <MagnifyingGlassPlusIcon className="w-4 h-auto" />
            </Button>
          </li>
          <li className="flex flex-row justify-center items-center">
            <Button className="py-0.5 px-1 shadow-lg" onClick={handleMinify}>
              <MagnifyingGlassMinusIcon className="w-4 h-auto" />
            </Button>
          </li>
        </ul>
        <ul className="w-full h-full flex flex-row justify-center items-center gap-2">
          <li className="flex flex-row justify-center items-center">
            <Button className="p-0 shadow-lg" onClick={handleSetLastPanel}>
              <ChevronDoubleLeftIcon className="h-5" />
            </Button>
          </li>
          <li className="flex flex-row justify-center items-center">
            <Button className="p-0 shadow-lg" onClick={handleNextPanel}>
              <ChevronLeftIcon className="h-5" />
            </Button>
          </li>
          <li className="flex flex-row justify-center items-center select-none">
            <h1 className="font-bold text-sm overflow-auto text-nowrap">{currentManga.title}</h1>
          </li>
          <li className="flex flex-row justify-center items-center">
            <Button className="p-0 shadow-lg" onClick={handlePreviousPanel}>
              <ChevronRightIcon className="h-5" />
            </Button>
          </li>
          <li className="flex flex-row justify-center items-center">
            <Button className="p-0 shadow-lg" onClick={handleSetFirstPanel}>
              <ChevronDoubleRightIcon className="h-5" />
            </Button>
          </li>
        </ul>
      </menu>
    </header>
  );
};

export default MangaHeader;
