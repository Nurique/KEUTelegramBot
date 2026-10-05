"use client";

import {
  addEdge,
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { logout, saveFlowAction, setUiLang } from "@/app/actions";
import { EditorContext, MessageNode, type MessageNodeData } from "@/components/MessageNode";
import NodePanel from "@/components/NodePanel";
import SettingsPanel from "@/components/SettingsPanel";
import { newId, validateFlow, type Flow, type Lang } from "@/lib/flow";
import type { Dict } from "@/lib/i18n";

type RFNode = Node<MessageNodeData, "message">;

const nodeTypes = { message: MessageNode };
const edgeDefaults = {
  type: "smoothstep",
  markerEnd: { type: MarkerType.ArrowClosed },
  style: { strokeWidth: 2 },
};

function toRF(flow: Flow): { nodes: RFNode[]; edges: Edge[] } {
  return {
    nodes: flow.nodes.map((n) => ({ id: n.id, type: "message", position: n.position, data: n.data })),
    edges: flow.edges.map((e) => ({ ...e, ...edgeDefaults })),
  };
}

function fromRF(nodes: RFNode[], edges: Edge[], base: Pick<Flow, "startNodeId" | "settings">): Flow {
  return {
    ...base,
    nodes: nodes.map((n) => ({
      id: n.id,
      position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
      data: n.data,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      sourceHandle: e.sourceHandle ?? "",
      target: e.target,
    })),
  };
}

interface Props {
  initialFlow: Flow;
  stats: { total: number; kk: number; ru: number };
  uiLang: Lang;
  dict: Dict;
}

function Editor({ initialFlow, stats, uiLang, dict }: Props) {
  const router = useRouter();
  const { screenToFlowPosition } = useReactFlow();
  const initial = useMemo(() => toRF(initialFlow), [initialFlow]);
  const [nodes, setNodes, onNodesChange] = useNodesState<RFNode>(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initial.edges);
  const [startNodeId, setStartNodeId] = useState(initialFlow.startNodeId);
  const [settings, setSettings] = useState(initialFlow.settings);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewLang, setPreviewLang] = useState<Lang>(uiLang);
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initialFlow));
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [saving, startSaving] = useTransition();

  const flow = useMemo(
    () => fromRF(nodes, edges, { startNodeId, settings }),
    [nodes, edges, startNodeId, settings],
  );
  const dirty = JSON.stringify(flow) !== savedJson;
  const issues = useMemo(() => validateFlow(flow), [flow]);
  const selected = nodes.find((n) => n.id === selectedId);

  const save = useCallback(() => {
    startSaving(async () => {
      const res = await saveFlowAction(flow);
      if (res.ok) setSavedJson(JSON.stringify(flow));
      setStatus(res.ok ? "saved" : "error");
    });
  }, [flow]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  const onConnect = useCallback(
    (c: Connection) =>
      // У кнопки только один переход: новая связь заменяет старую.
      setEdges((eds) =>
        addEdge(
          { ...c, id: `e_${newId()}`, ...edgeDefaults },
          eds.filter((e) => !(e.source === c.source && e.sourceHandle === c.sourceHandle)),
        ),
      ),
    [setEdges],
  );

  const updateNode = useCallback(
    (id: string, data: MessageNodeData) => {
      setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data } : n)));
      // Удаляем связи кнопок, которых больше нет или которые стали ссылками.
      const linkable = new Set(data.buttons.filter((b) => !b.url).map((b) => b.id));
      setEdges((eds) => eds.filter((e) => e.source !== id || linkable.has(e.sourceHandle ?? "")));
    },
    [setNodes, setEdges],
  );

  const addNode = () => {
    const id = newId();
    const position = screenToFlowPosition({ x: window.innerWidth / 3, y: window.innerHeight / 3 });
    setNodes((ns) => [
      ...ns.map((n) => ({ ...n, selected: false })),
      {
        id,
        type: "message",
        position,
        selected: true,
        data: { title: dict["node.newTitle"], text: { kk: "", ru: "" }, buttons: [] },
      },
    ]);
    setSelectedId(id);
  };

  const deleteNode = (id: string) => {
    if (id === startNodeId) return;
    setNodes((ns) => ns.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    setSelectedId(null);
  };

  const switchUiLang = async (lang: Lang) => {
    await setUiLang(lang);
    router.refresh();
  };

  const ctx = useMemo(
    () => ({ startNodeId, previewLang, dict, issues }),
    [startNodeId, previewLang, dict, issues],
  );

  return (
    <EditorContext.Provider value={ctx}>
      <div className="flex h-full flex-col">
        <header className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
          <div className="mr-auto min-w-0">
            <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-brand">
              {dict["app.subtitle"]}
            </p>
            <h1 className="truncate text-lg font-bold leading-tight">{dict["app.title"]}</h1>
          </div>
          <div className="text-sm text-slate-600">
            {dict["stats.users"]}: <b>{stats.total}</b>{" "}
            <span className="text-slate-400">
              (KZ {stats.kk} · RU {stats.ru})
            </span>
          </div>
          <LangSwitch value={uiLang} onChange={switchUiLang} />
          <form action={logout}>
            <button className="btn-ghost">{dict["nav.logout"]}</button>
          </form>
        </header>

        <div className="flex items-center gap-2 border-b border-slate-200 bg-white/70 px-4 py-2">
          <button className="btn-ghost" onClick={addNode}>
            ＋ {dict["toolbar.addNode"]}
          </button>
          <button
            className="btn-ghost"
            onClick={() => setSelectedId(null)}
            aria-pressed={!selected}
          >
            ⚙ {dict["toolbar.settings"]}
          </button>
          <span className="ml-auto text-sm">
            {saving
              ? dict["toolbar.saving"]
              : status === "error"
                ? <span className="text-danger">{dict["toolbar.error"]}</span>
                : dirty
                  ? <span className="text-amber-600">● {dict["toolbar.unsaved"]}</span>
                  : status === "saved"
                    ? <span className="text-emerald-600">✓ {dict["toolbar.saved"]}</span>
                    : null}
          </span>
          <button className="btn-primary" onClick={save} disabled={!dirty || saving}>
            {dict["toolbar.save"]}
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="h-[55vh] min-h-0 flex-1 lg:h-auto">
            <ReactFlow
              nodes={nodes.map((n) => (n.id === startNodeId ? { ...n, deletable: false } : n))}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(_, n) => setSelectedId(n.id)}
              onPaneClick={() => setSelectedId(null)}
              onNodesDelete={(deleted) => {
                if (deleted.some((n) => n.id === selectedId)) setSelectedId(null);
              }}
              connectionRadius={60}
              fitView
              fitViewOptions={{ padding: 0.3 }}
            >
              <Background gap={20} />
              <Controls />
              <MiniMap pannable zoomable className="!hidden md:!block" />
            </ReactFlow>
          </div>

          <aside className="w-full overflow-y-auto border-t border-slate-200 bg-white lg:w-[400px] lg:border-t-0 lg:border-l">
            {selected ? (
              <NodePanel
                key={selected.id}
                flow={flow}
                node={selected}
                isStart={selected.id === startNodeId}
                previewLang={previewLang}
                onPreviewLang={setPreviewLang}
                onChange={(data) => updateNode(selected.id, data)}
                onMakeStart={() => setStartNodeId(selected.id)}
                onDelete={() => deleteNode(selected.id)}
                onClose={() => setSelectedId(null)}
                dict={dict}
              />
            ) : (
              <SettingsPanel
                settings={settings}
                onChange={setSettings}
                issues={issues}
                nodes={nodes}
                onSelect={setSelectedId}
                dict={dict}
              />
            )}
          </aside>
        </div>
      </div>
    </EditorContext.Provider>
  );
}

export function LangSwitch({ value, onChange }: { value: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-slate-300 text-xs font-semibold">
      {(["kk", "ru"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          className={`px-2.5 py-1.5 ${value === l ? "bg-brand text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
        >
          {l === "kk" ? "ҚАЗ" : "РУС"}
        </button>
      ))}
    </div>
  );
}

export default function FlowEditor(props: Props) {
  return (
    <ReactFlowProvider>
      <Editor {...props} />
    </ReactFlowProvider>
  );
}
