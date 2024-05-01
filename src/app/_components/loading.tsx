import { Loader } from "lucide-react";
import React from "react";

export default function Loading({size}: {size: number}) {
  return <Loader className="animate-spin" style={{width: size, height: "auto"}} />;
};
