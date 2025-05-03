
import { RSSSource } from "@/services/rssSourcesService";
import { SourceItem } from "./SourceItem";

interface SourcesListProps {
  sources: RSSSource[];
  onSourceUpdated: (id: string, isActive: boolean) => void;
  onSourceDeleted: (id: string) => void;
}

export const SourcesList = ({ sources, onSourceUpdated, onSourceDeleted }: SourcesListProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-right">מקורות RSS שלך</h2>
      {sources.length > 0 ? (
        sources.map((source) => (
          <SourceItem
            key={source.id}
            source={source}
            onSourceUpdated={onSourceUpdated}
            onSourceDeleted={onSourceDeleted}
          />
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          אין מקורות RSS מוגדרים
        </div>
      )}
    </div>
  );
};
