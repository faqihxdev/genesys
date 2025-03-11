// import { useInsertNode } from "@/hooks/use-insert-node";
// import { useSetAtom } from "jotai";
// import { setActiveSidebarAtom } from "@/stores/funnel";
// import SidebarPanelWrapper from "../../_components/sidebar-panel-wrapper";
// import { AVAILABLE_NODES } from "../../..";
// import { NodePreviewDraggable } from "./_components/node-preview-draggable";
// import { Grid } from "lucide-react";

// export default function AvailableNodesPanel() {
//   const setActivePanel = useSetAtom(setActiveSidebarAtom);
//   const insertNode = useInsertNode();

//   return (
//     <SidebarPanelWrapper>
//       <div className="mt-4 flex  flex-col items-center p-4 text-center ">
//         <div className="size-12 flex items-center justify-center rounded-full bg-primary">
//           <Grid className="size-6 text-white" />
//         </div>

//         <div className="mt-4 text-balance font-medium">Available Nodes</div>

//         <div className="mt-1 w-2/3 text-xs text-light-50/40 font-medium leading-normal">
//           Drag and drop nodes to build your chatbot flow
//         </div>
//       </div>

//       <div className="grid grid-cols-1 gap-4 p-4">
//         {AVAILABLE_NODES.map((node) => (
//           <NodePreviewDraggable
//             key={node.type}
//             type={node.type}
//             icon={node.icon}
//             title={node.title}
//             description={node.description}
//             setActivePanel={setActivePanel}
//             insertNode={insertNode}
//           />
//         ))}
//       </div>
//     </SidebarPanelWrapper>
//   );
// }

import { useInsertNode } from "@/hooks/use-insert-node";
import { useSetAtom } from "jotai";
import { setActiveSidebarAtom } from "@/stores/funnel";
import SidebarPanelWrapper from "../../_components/sidebar-panel-wrapper";
import { AVAILABLE_NODES } from "../../..";
import { NodePreviewDraggable } from "./_components/node-preview-draggable";
import { Icon } from "@iconify/react";

export default function AvailableNodesPanel() {
  const setActivePanel = useSetAtom(setActiveSidebarAtom);
  const insertNode = useInsertNode();

  return (
    <SidebarPanelWrapper>
      <div className="mt-4 flex  flex-col items-center p-4 text-center ">
        <div className="size-12 flex items-center justify-center rounded-full bg-primary">
          <Icon icon="mynaui:grid" className="size-6 text-white" />
        </div>

        <div className="mt-4 text-balance font-medium">Available Stages</div>

        <div className="mt-1 w-2/3 text-xs text-light-50/40 font-medium leading-normal">
          Drag and drop stages to build your funnel simulator
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4">
        {AVAILABLE_NODES.map((node) => (
          <NodePreviewDraggable
            key={node.type}
            type={node.type}
            icon={node.icon}
            title={node.title}
            description={node.description}
            setActivePanel={setActivePanel}
            insertNode={insertNode}
          />
        ))}
      </div>
    </SidebarPanelWrapper>
  );
}