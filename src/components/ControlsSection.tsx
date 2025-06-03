
import { RefreshButton } from "./RefreshButton";
import { TestProcessingButton } from "./TestProcessingButton";
import { SystemHealthButton } from "./SystemHealthButton";

interface ControlsSectionProps {
  onRefresh: () => void;
}

export function ControlsSection({ onRefresh }: ControlsSectionProps) {
  return (
    <div className="mb-4 flex justify-end gap-2 flex-wrap">
      <SystemHealthButton />
      <TestProcessingButton />
      <RefreshButton onRefresh={onRefresh} />
    </div>
  );
}
