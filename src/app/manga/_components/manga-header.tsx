"use client";

import { ParentFolderType } from "@/app/dashboard/page";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";

const MangaHeader = ({
  currentManga,
  handleNextPanel,
  handlePreviousPanel,
}: {
  currentManga: ParentFolderType;
  handleNextPanel: () => void;
  handlePreviousPanel: () => void;
}) => {

	useEffect(() => {

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "ArrowRight") {
				handlePreviousPanel();
			}
			if (event.key === "ArrowLeft") {
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
              <ChevronRight size={20}/>
            </Button>
          </li>
        </ul>
      </menu>
    </header>
  );
}

export default MangaHeader;
