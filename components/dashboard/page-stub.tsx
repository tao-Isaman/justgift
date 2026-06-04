import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function PageStub({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid size-12 place-items-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </span>
          <Badge variant="outline">Coming soon</Badge>
          <p className="max-w-sm text-sm text-muted-foreground">
            This is part of the build plan and will land in an upcoming
            iteration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
