import {redirect} from "next/navigation";
import {decodeRouteSegment} from "@/lib/project-utils";

export default async function ScreenRedirectRoute({
  params,
}: {
  params: Promise<{projectId: string}>;
}) {
  const {projectId} = await params;
  redirect(`/zh-CN/screen/${encodeURIComponent(decodeRouteSegment(projectId))}`);
}
