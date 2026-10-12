import { Suspense } from "react";
import { listLessons, getMisconceptionFollowUps } from "@/lib/store";
import { groupMisconceptions } from "@/lib/misconceptions";
import { MisconceptionsWorkspace } from "@/components/MisconceptionsWorkspace";
import { PageHeader } from "@/components/ui";
export const dynamic = "force-dynamic";
export const metadata = { title: "Misconceptions · RELAY" };
export default async function MisconceptionsPage() {
  const groups = groupMisconceptions(
    await listLessons(),
    await getMisconceptionFollowUps(),
  );
  return (
    <>
      <PageHeader
        eyebrow="Misconceptions"
        title={
          <>
            What your classes keep{" "}
            <span className="glow-text">getting wrong.</span>
          </>
        }
      />
      <Suspense fallback={<p>Loading class filters…</p>}>
        <MisconceptionsWorkspace groups={groups} />
      </Suspense>
    </>
  );
}
