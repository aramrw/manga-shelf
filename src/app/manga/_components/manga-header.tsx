"use client";

import { ParentFolderType } from "@/app/dashboard/page";
import { Button } from "@/components/ui/button";
import {
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
} from "@heroicons/react/16/solid";
import { invoke } from "@tauri-apps/api/tauri";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";

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
}) => {


  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // previous panel
      if (event.shiftKey && event.key === "ArrowRight") {
        handlePreviousSinglePanel();
      } else if (event.altKey && event.key === "ArrowRight") {
        // handleNextPanel();
      } else if (event.key === "ArrowRight") {
        if (largePanel) {
          handlePreviousSinglePanel();
        } else {
          handlePreviousPanel();
        }
      }

      // next panel
      if (event.shiftKey && event.key === "ArrowLeft") {
        handleNextSinglePanel();
      } else if (event.altKey && event.key === "ArrowLeft") {
        // handleNextPanel();
      } else if (event.key === "ArrowLeft") {
        if (largePanel) {
          handleNextSinglePanel();
        } else {
          handleNextPanel();
        }
      }
    }

    addEventListener("keydown", handleKeyDown);

    return () => {
      removeEventListener("keydown", handleKeyDown);
    };
  }, [handleNextPanel, handlePreviousPanel]);

	const handleMagnify = () => {
		setZoomLevel((prev) => prev + 10);
		invoke("update_manga_panel", {	dirPaths: JSON.stringify([currentPanelPath]), isRead: true, zoomLevel: zoomLevel + 10 });
	};

	const handleMinify = () => {
		setZoomLevel((prev) => prev - 10);
		invoke("update_manga_panel", {	dirPaths: JSON.stringify([currentPanelPath]), isRead: true, zoomLevel: zoomLevel - 10});
	};


  return (
    <header className="w-full h-fit bg-secondary p-1.5 rounded-b-sm flex justify-center items-center">
      <menu className="w-full h-full flex flex-row justify-center items-center">
        <ul className="w-fit h-fit flex flex-row justify-center items-center gap-1">
          <li className="flex flex-row justify-center items-center">
            <Button className="py-0.5 px-1"
							onClick={handleMagnify}
							>
              <MagnifyingGlassPlusIcon className="w-4 h-auto" />
            </Button>
          </li>
          <li className="flex flex-row justify-center items-center">
            <Button className="py-0.5 px-1"
							onClick={handleMinify}
							>
              <MagnifyingGlassMinusIcon className="w-4 h-auto" />
            </Button>
          </li>
        </ul>
        <ul className="w-full h-full flex flex-row justify-center items-center gap-2">
          <li className="flex flex-row justify-center items-center">
            <Button className="p-0" onClick={handleNextPanel}>
              <ChevronLeft size={20} />
            </Button>
          </li>
          <li className="flex flex-row justify-center items-center select-none">
            <h1 className="font-bold text-sm">{currentManga.title}</h1>
          </li>
          <li className="flex flex-row justify-center items-center">
            <Button className="p-0" onClick={handlePreviousPanel}>
              <ChevronRight size={20} />
            </Button>
          </li>
        </ul>
      </menu>
    </header>
  );
};

export default MangaHeader;
