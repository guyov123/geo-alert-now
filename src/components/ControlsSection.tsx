
import { RefreshButton } from "./RefreshButton";
import { TestProcessingButton } from "./TestProcessingButton";

interface ControlsSectionProps {
  onRefresh: () => void;
}

export function ControlsSection({ onRefresh }: ControlsSectionProps) {
  return (
    <div className="mb-4 flex justify-end gap-2">
      <TestProcessingButton />
      <RefreshButton onRefresh={onRefresh} />
    </div>
  );
}
