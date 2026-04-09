import {EditorWorkbench} from "@/components/editor-legacy/editor-workbench";

export function EditorPage({
  projectId,
  templateId,
  projectName,
}: {
  projectId: string;
  templateId?: string;
  projectName?: string;
}) {
  return <EditorWorkbench projectId={projectId} templateId={templateId} projectName={projectName} />;
}
