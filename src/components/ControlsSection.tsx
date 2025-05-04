
import { RefreshButton } from "./RefreshButton";

interface ControlsSectionProps {
  onRefresh: () => void;
}

export function ControlsSection({ onRefresh }: ControlsSectionProps) {
  return (
    <div className="mb-4">
      <RefreshButton onRefresh={onRefresh} />
    </div>
  );
}
