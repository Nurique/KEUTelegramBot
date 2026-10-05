"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { createContext, memo, useContext } from "react";
import type { FlowNode, Lang, validateFlow } from "@/lib/flow";
import type { Dict } from "@/lib/i18n";

export type MessageNodeData = FlowNode["data"];

export const EditorContext = createContext<{
  startNodeId: string;
  previewLang: Lang;
  dict: Dict;
  issues: ReturnType<typeof validateFlow>;
}>(null!);

export const MessageNode = memo(function MessageNode({
  id,
  data,
  selected,
}: NodeProps<Node<MessageNodeData, "message">>) {
  const { startNodeId, previewLang, dict, issues } = useContext(EditorContext);
  const isStart = id === startNodeId;
  const nodeIssues = issues.filter((i) => i.nodeId === id);
  const missingLangs = [...new Set(nodeIssues.map((i) => i.lang).filter(Boolean))];

  return (
    <div
      className={`w-60 rounded-lg border-2 bg-white shadow-sm transition ${
        selected ? "border-brand shadow-md" : isStart ? "border-accent" : "border-slate-200"
      }`}
    >
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !bg-slate-400" />
      <div className="flex items-center gap-1.5 border-b border-slate-100 px-3 py-2">
        {isStart && (
          <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
            {dict["node.start"]}
          </span>
        )}
        <span className="truncate text-sm font-semibold">{data.title}</span>
        {missingLangs.length > 0 && (
          <span
            className="ml-auto rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-danger"
            title={nodeIssues.map((i) => dict[`issues.${i.code}` as keyof Dict]).join(", ")}
          >
            ⚠ {missingLangs.join("/")}
          </span>
        )}
      </div>
      <p className="line-clamp-3 px-3 py-2 text-xs whitespace-pre-line text-slate-600">
        {data.text[previewLang] || <i className="text-danger">—</i>}
      </p>
      <div className="space-y-1 px-2 pb-2">
        {data.buttons.length === 0 && (
          <p className="px-1 text-[11px] text-slate-400">{dict["node.noButtons"]}</p>
        )}
        {data.buttons.map((b) => (
          <div
            key={b.id}
            className="relative rounded border border-brand/20 bg-brand-soft px-2 py-1 text-center text-xs font-medium text-brand"
          >
            {b.url ? "🔗 " : ""}
            {b.label[previewLang] || "…"}
            {!b.url && (
              <Handle
                type="source"
                id={b.id}
                position={Position.Right}
                className="!-right-3 !h-3 !w-3 !bg-brand"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
});
