import {PublishSuccessPage} from "@/components/pages/publish-success-page";
import {decodeRouteSegment} from "@/lib/project-utils";

export default async function LocalizedPublishSuccessRoute({
  params,
}: {
  params: Promise<{projectId: string}>;
}) {
  const {projectId} = await params;
  return <PublishSuccessPage projectId={decodeRouteSegment(projectId)} />;
}
