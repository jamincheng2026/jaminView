import {redirect} from "next/navigation";
import {decodeRouteSegment} from "@/lib/project-utils";

export default async function EditorRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{projectId: string}>;
  searchParams: Promise<{template?: string; name?: string}>;
}) {
  const {projectId} = await params;
  const {template, name} = await searchParams;
  const nextSearch = new URLSearchParams();
  if (template) nextSearch.set("template", template);
  if (name) nextSearch.set("name", name);
  redirect(
    `/zh-CN/editor/${encodeURIComponent(decodeRouteSegment(projectId))}${
      nextSearch.size ? `?${nextSearch.toString()}` : ""
    }`,
  );
}
