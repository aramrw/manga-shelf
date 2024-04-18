"use client";

import { ParentFolderType } from "@/app/dashboard/page";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";

const MangaHeader = ({
  currentManga,
  handleNextPanel,
  handleNextSinglePanel,
  handlePreviousPanel,
	handlePreviousSinglePanel,
}: {
  currentManga: ParentFolderType;
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
        handlePreviousPanel();
      }

      // next panel
       if (event.shiftKey && event.key === "ArrowLeft") {
        handleNextSinglePanel();
      } else if (event.altKey && event.key === "ArrowLeft") {
        // handleNextPanel();
      } else if (event.key === "ArrowLeft") {
        handleNextPanel();
      }
    }

    addEventListener("keydown", handleKeyDown);

    return () => {
      removeEventListener("keydown", handleKeyDown);
    };
  }, [handleNextPanel, handlePreviousPanel]);

  return (
    <header className="w-full h-fit bg-secondary p-1.5 rounded-b-sm flex justify-center items-center">
      <menu className="w-full h-full flex flex-row justify-center items-center">
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
