
import { RefreshButton } from "./RefreshButton";
import { HistoryLink } from "./HistoryLink";

interface ControlsSectionProps {
  onRefresh: () => void;
}

export function ControlsSection({ onRefresh }: ControlsSectionProps) {
  return (
    <div className="flex justify-between mb-4">
      <RefreshButton onRefresh={onRefresh} />
      <HistoryLink />
    </div>
  );
}
