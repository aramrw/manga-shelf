import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


export default function MonthlyTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly</CardTitle>
        <CardDescription>
          Track your monthly reading progress here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2"></CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
}
