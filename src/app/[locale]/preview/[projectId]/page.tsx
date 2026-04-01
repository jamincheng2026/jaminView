import {PreviewPage} from "@/components/pages/preview-page";
import {decodeRouteSegment} from "@/lib/project-utils";

export default async function LocalizedPreviewRoute({
  params,
}: {
  params: Promise<{projectId: string}>;
}) {
  const {projectId} = await params;
  return <PreviewPage projectId={decodeRouteSegment(projectId)} />;
}
