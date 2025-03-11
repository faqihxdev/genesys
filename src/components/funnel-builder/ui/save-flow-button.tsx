// import { Button } from "@/components/ui/button";
// import { useFlowValidator } from "@/hooks/use-flow-validator";
// import { useAtom } from "jotai";
// import { saveWorkflowAtom } from "@/stores/funnel";
// import { Save } from 'lucide-react';
// import { useToast } from "@/hooks/use-toast";

// export const SaveFlowButton = () => {
//   const saveWorkflow = useAtom(saveWorkflowAtom)[1];
//   const { toast } = useToast();
//   const [isValidating, validateFlow] = useFlowValidator((isValid) => {
//     if (isValid) {
//       const workflow = saveWorkflow();
//       console.log(workflow);
//       toast({
//         title: "Flow is valid",
//         description: "You can now proceed to the next step",
//         variant: "success",
//       });
//     } else {
//       toast({
//         title: "Flow is invalid",
//         description: "Please check if the flow is complete and has no lone nodes",
//         variant: "destructive",
//       });
//     }
//   });

//   return (
//     <Button
//       onClick={validateFlow}
//       disabled={isValidating}
//       variant={"outline"}
//       size={"sm"}
//       className="flex gap-4"
//     >
//       <Save /> Save Flow
//     </Button>
//   );
// };

import { Button } from "@/components/ui/button";
import { useFlowValidator } from "@/hooks/use-flow-validator";
import { useAtom } from "jotai";
import { saveWorkflowAtom } from "@/stores/funnel";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useToast } from "@/hooks/use-toast";

export const SaveFlowButton = () => {
  const saveWorkflow = useAtom(saveWorkflowAtom)[1];
  const { toast } = useToast();
  const [isValidating, validateFlow] = useFlowValidator((isValid) => {
    if (isValid) {
      const workflow = saveWorkflow();
      console.log(workflow);
      toast({
        title: "Flow is valid",
        description: "You can now proceed to the next step",
        variant: "success",
      });
    } else {
      toast({
        title: "Flow is invalid",
        description: "Please check if the flow is complete and has no lone nodes",
        variant: "destructive",
      });
    }
  });

  return (
    <Button
      onClick={validateFlow}
      disabled={isValidating}
      variant={"outline"}
      size={"sm"}
      className="flex gap-4"
    >
      <Icon icon="fluent:save-28-filled" /> Save Flow
    </Button>
  );
};