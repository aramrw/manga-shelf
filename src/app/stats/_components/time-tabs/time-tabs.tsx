import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DailyTab from "./daily-tab/daily-tab";

export default function TimeTabs() {
  return (
    <Tabs defaultValue="stats" className="w-full">
      <TabsList className="flex flex-row w-full justify-center items-center">
        <TabsTrigger value="stats" className="w-full">
          Progress & Statistics
        </TabsTrigger>
      </TabsList>
      <TabsContent value="stats">
        <DailyTab />
      </TabsContent>
    </Tabs>
  );
}
