import { useEffect, useRef } from "react";
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from "react-resizable-panels";
import "@/lib/monaco";
import EditorPanel from "@/components/ide/editor-panel";
import Explorer from "@/components/ide/explorer";
import PreviewPanel from "@/components/ide/preview-panel";
import TerminalPanel from "@/components/ide/terminal-panel";
import TopBar from "@/components/ide/top-bar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WorkspaceProvider } from "@/contexts/workspace";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

function ResizeHandle({ direction }: { direction: "horizontal" | "vertical" }) {
  return (
    <PanelResizeHandle
      className={cn(
        "group relative flex items-center justify-center",
        direction === "horizontal" ? "w-2" : "h-2"
      )}
    >
      <div
        className={cn(
          "rounded-full bg-transparent transition-colors group-hover:bg-primary/60 group-data-[resize-handle-state=drag]:bg-primary",
          direction === "horizontal" ? "h-10 w-0.5" : "h-0.5 w-10"
        )}
      />
    </PanelResizeHandle>
  );
}

function Ide() {
  const explorerRef = useRef<ImperativePanelHandle>(null);

  const toggleExplorer = () => {
    const panel = explorerRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) panel.expand();
    else panel.collapse();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleExplorer();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-ide-bg">
      <TopBar onToggleExplorer={toggleExplorer} />
      <div className="min-h-0 flex-1 px-2 pb-2">
        <PanelGroup direction="horizontal" autoSaveId="nimbus.layout.main">
          <Panel ref={explorerRef} defaultSize={18} minSize={12} maxSize={40} collapsible collapsedSize={0}>
            <Explorer />
          </Panel>
          <ResizeHandle direction="horizontal" />
          <Panel minSize={30}>
            <PanelGroup direction="vertical" autoSaveId="nimbus.layout.center">
              <Panel defaultSize={64} minSize={20}>
                <EditorPanel />
              </Panel>
              <ResizeHandle direction="vertical" />
              <Panel defaultSize={36} minSize={12}>
                <PanelGroup direction="horizontal" autoSaveId="nimbus.layout.bottom">
                  <Panel defaultSize={62} minSize={25}>
                    <TerminalPanel />
                  </Panel>
                  <ResizeHandle direction="horizontal" />
                  <Panel defaultSize={38} minSize={20} collapsible>
                    <PreviewPanel />
                  </Panel>
                </PanelGroup>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  const session = useSession();
  // ProtectedRoute guarantees a session; this guards the moment of sign-out.
  if (!session) return null;
  return (
    <TooltipProvider delayDuration={300}>
      <WorkspaceProvider session={session}>
        <Ide />
      </WorkspaceProvider>
    </TooltipProvider>
  );
}
