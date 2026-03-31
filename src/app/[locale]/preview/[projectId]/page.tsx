import {PreviewPage} from "@/components/pages/preview-page";

export default async function LocalizedPreviewRoute({
  params,
}: {
  params: Promise<{projectId: string}>;
}) {
  const {projectId} = await params;
  return <PreviewPage projectId={projectId} />;
}
