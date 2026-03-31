import {EditorWorkbench} from "@/components/editor/editor-workbench";

export function EditorPage({projectId}: {projectId: string}) {
  return <EditorWorkbench projectId={projectId} />;
}
