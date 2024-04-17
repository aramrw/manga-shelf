"use client";

import Link from "next/link";
import { ChartBarIcon, CogIcon } from "@heroicons/react/16/solid";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { MoveLeft } from "lucide-react";

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
          <MoveLeft className="w-7 h-auto" />
        </li>
        <ul className="flex flex-row gap-1">
          <li className="flex flex-row justify-center items-center cursor-pointer hover:opacity-80 rounded-sm text-accent">
            <Link href="/">
              <ChartBarIcon className="w-6 h-auto" />
            </Link>
          </li>
          <li className="flex flex-row justify-center items-center cursor-pointer hover:opacity-80 rounded-sm text-accent">
            <Link href="/">
              <CogIcon className="w-6 h-auto" />
            </Link>
          </li>
        </ul>
      </ul>
    </menu>
  );
}
