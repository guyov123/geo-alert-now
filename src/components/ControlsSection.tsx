
import { RefreshButton } from "./RefreshButton";

interface ControlsSectionProps {
  onRefresh: () => void;
}

export function ControlsSection({ onRefresh }: ControlsSectionProps) {
  return (
    <div className="mb-4 flex justify-end gap-2 flex-wrap">
      <RefreshButton onRefresh={onRefresh} />
    </div>
  );
}
