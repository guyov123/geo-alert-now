
import { RefreshButton } from "./RefreshButton";
import { HistoryLink } from "./HistoryLink";

interface ControlsSectionProps {
  useAI: boolean;
  onAIToggle: () => void;
  onApiKeyDialogOpen: () => void;
}

export function ControlsSection({ useAI, onAIToggle, onApiKeyDialogOpen }: ControlsSectionProps) {
  return (
    <div className="flex justify-between mb-4">
      <RefreshButton 
        useAI={useAI} 
        onAIToggle={onAIToggle} 
        onApiKeyDialogOpen={onApiKeyDialogOpen} 
      />
      <HistoryLink />
    </div>
  );
}
