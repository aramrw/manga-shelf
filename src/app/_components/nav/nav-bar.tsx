"use client";

import Link from "next/link";
import { ChartBarIcon, CogIcon } from "@heroicons/react/16/solid";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function NavBar() {
  const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		if (pathname == "/") {
			router.push("/dashboard");
		}
			
		}, [pathname]);

  return (
    <menu className="w-full h-8 bg-primary px-1">
      <ul className="w-full h-full flex flex-row justify-between items-center">
        <ul className="flex flex-row gap-1">
          <li>
            <Link href="/">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </Link>
          </li>
          <li>
            <Link href="/">
              <CogIcon className="w-6 h-6 text-white" />
            </Link>
          </li>
        </ul>
      </ul>
    </menu>
  );
}
