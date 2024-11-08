"use client";

import Link from "next/link";
import { ArrowLeftStartOnRectangleIcon, ArrowUturnLeftIcon } from "@heroicons/react/16/solid";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { MangaFolderType } from "@/app/dashboard/page";

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [startTime, setStartTime] = useState<number>(0);
  const [wasPreviousPathManga, setWasPreviousPathManga] = useState<boolean>(false);

  useEffect(() => {
    if (pathname == "/") {
      router.push("/dashboard");
    }

    if (pathname == "/manga") {
      setStartTime(Date.now());
      setWasPreviousPathManga(true);
    } else {
      if (wasPreviousPathManga) {
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        invoke("get_global_manga").then((result: unknown) => {
          invoke("update_folder_time_spent_reading", {
            folderPath: (result as MangaFolderType).full_path,
            timeSpentReading: elapsedTime,
          });
          invoke("update_chart_watchtime", { watchTime: elapsedTime });
        });
        setStartTime(0);
      }

      setWasPreviousPathManga(false);
    }
  }, [pathname, router, startTime, wasPreviousPathManga]);

  const handleGoBack = () => {
    if (pathname === "/dashboard") {
      router.forward();
    }
    router.back();
  };

  return (
    <menu className="flex h-8 w-full flex-row bg-primary px-1.5 md:px-30 md:h-10 z-50 top-0 stickyitems-center justify-between border-b-2 shadow-sm lg:px-16 xl:px-36 2xl:px-48">
      <ul className="w-full h-full flex flex-row justify-between items-center">
        <li className="transition-all bg-gray-700 text-accent flex flex-row justify-center items-center cursor-pointer hover:opacity-80 rounded-sm ">
          <Link href="" onClick={handleGoBack} className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white ring-opacity-50 rounded-sm">
            <ArrowUturnLeftIcon className="w-5 md:w-7 h-auto  transition-all" />
          </Link>
        </li>
        <ul className="flex flex-row gap-1">
          <li className="transition-all pl-0.5 bg-gray-700 text-accent flex flex-row justify-center items-center cursor-pointer hover:opacity-80 rounded-sm">
            <Link href="/stats" className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white ring-opacity-50 rounded-sm">
              <BarChart3 className="w-5 md:w-6 h-auto  transition-all" strokeWidth={2.4} />
            </Link>
          </li>
          <li className="transition-all bg-gray-700 text-accent flex flex-row justify-center items-center cursor-pointer hover:opacity-80 rounded-sm">
            <Link href="" className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white ring-opacity-50 rounded-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.7}
                stroke="currentColor"
                className="w-[1.3rem] md:w-7 h-auto hover:animate-spin transition-all"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12a7.5 7.5 0 0 0 15 0m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077 1.41-.513m14.095-5.13 1.41-.513M5.106 17.785l1.15-.964m11.49-9.642 1.149-.964M7.501 19.795l.75-1.3m7.5-12.99.75-1.3m-6.063 16.658.26-1.477m2.605-14.772.26-1.477m0 17.726-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205 12 12m6.894 5.785-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495"
                />
              </svg>
            </Link>
          </li>
        </ul>
      </ul>
    </menu>
  );
}
