import { PageHeader } from "@/components/ui";
import { ImportForm } from "./ImportForm";

export const metadata = { title: "Import transcript · RELAY" };

export default function ImportPage() {
  return (
    <>
      <PageHeader eyebrow="Import" title="Bring in a recording" />
      <ImportForm />
    </>
  );
}
