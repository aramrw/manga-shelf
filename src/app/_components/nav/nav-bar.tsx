"use client";

import Link from "next/link";
import {
  ArrowLeftStartOnRectangleIcon,
  ChartBarIcon,
  ChartBarSquareIcon,
  Cog6ToothIcon,
  CogIcon,
} from "@heroicons/react/16/solid";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeftFromLine, BarChart, BarChart3, MoveLeft } from "lucide-react";

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname == "/") {
      router.push("/dashboard");
    }
  }, [pathname]);

  const handleGoBack = () => {
    router.back();
  };

  return (
    <menu className="bg-primary px-1.5 md:px-30 z-50 top-0 sticky flex h-8 w-full flex-row items-center justify-between border-b-2 shadow-sm lg:px-16 xl:px-36 2xl:px-48">
      <ul className="w-full h-full flex flex-row justify-between items-center">
        <li
          onClick={handleGoBack}
          className="flex flex-row justify-center items-center cursor-pointer hover:opacity-80 rounded-sm text-accent"
        >
          <ArrowLeftStartOnRectangleIcon className="w-5 h-auto" />
        </li>
        <ul className="flex flex-row gap-1">
          <li className="flex flex-row justify-center items-center cursor-pointer hover:opacity-80 rounded-sm text-accent">
            <Link href="/">
              <BarChart3 className="w-5 h-auto" />
            </Link>
          </li>
          <li className="flex flex-row justify-center items-center cursor-pointer hover:opacity-80 rounded-sm text-accent">
            <Link href="/">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-[1.3rem] h-auto"
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
