import { Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center max-w-3xl mx-auto px-6 py-24">
      <h1 className="font-display text-4xl">Your inbox is waiting.</h1>

      <p className="mt-3 text-muted-foreground">
        Share your link and anonymous messages will show up here.
      </p>

      <Card className="mt-10 w-full">
        <CardContent className="flex flex-col items-center gap-3 py-10">
          <Mail className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nothing yet. Once your link is live, messages will land in this
            space.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
