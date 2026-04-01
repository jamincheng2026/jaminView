import {redirect} from "next/navigation";
import {decodeRouteSegment} from "@/lib/project-utils";

export default async function PublishSuccessRedirectRoute({
  params,
}: {
  params: Promise<{projectId: string}>;
}) {
  const {projectId} = await params;
  redirect(`/zh-CN/publish-success/${encodeURIComponent(decodeRouteSegment(projectId))}`);
}
