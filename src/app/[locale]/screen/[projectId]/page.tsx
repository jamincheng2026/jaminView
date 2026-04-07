import {ScreenPage} from "@/components/pages/screen-page";
import {decodeRouteSegment} from "@/lib/project-utils";

export default async function LocalizedScreenRoute({
  params,
}: {
  params: Promise<{projectId: string}>;
}) {
  const {projectId} = await params;
  return <ScreenPage projectId={decodeRouteSegment(projectId)} />;
}
