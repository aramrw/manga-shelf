"use client";

import { MangaFolderType } from "@/app/dashboard/page";
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
import {
  BetweenVerticalStart,
  Columns2,
  RectangleVertical,
} from "lucide-react";
import { useCallback, useEffect } from "react";

const MangaHeader = ({
  currentManga,
  doublePanels,
  currentPanelPath,
  zoomLevel,
  setZoomLevel,
  setIsDoublePanels,
  handleNextPanel,
  handleNextSinglePanel,
  handlePreviousPanel,
  handlePreviousSinglePanel,
  handleSetLastPanel,
  handleSetFirstPanel,
}: {
  currentManga: MangaFolderType;
  doublePanels: boolean;
  currentPanelPath: string;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  setIsDoublePanels: React.Dispatch<React.SetStateAction<boolean>>;
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
        if (doublePanels) {
          handlePreviousPanel();
        } else {
          handlePreviousSinglePanel();
        }
      } // next panels
      else if (event.shiftKey && event.key === "ArrowLeft") {
        handleNextSinglePanel();
      } else if (event.key === "ArrowLeft") {
        if (doublePanels) {
          handleNextPanel();
        } else {
          handleNextSinglePanel();
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
      doublePanels,
    ],
  );

  const handleSetDoublePanels = () => {
    console.log("setting double panels to", !doublePanels);
    invoke("update_folder_double_panels", {
      folderPath: currentManga.full_path,
      doublePanels: !doublePanels,
    }).then(() => {
      setIsDoublePanels((prev) => !prev);
    });
  };

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
          <li className="flex flex-row justify-center items-center">
            <Button
              className="py-0.5 px-1 shadow-lg"
              onClick={handleSetDoublePanels}
            >
              {doublePanels ? (
                <RectangleVertical className="h-4 w-4" />
              ) : (
                <Columns2 className="h-4 w-4" />
              )}
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
            <h1 className="font-bold text-sm overflow-auto text-nowrap">
              {currentManga.title}
            </h1>
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
