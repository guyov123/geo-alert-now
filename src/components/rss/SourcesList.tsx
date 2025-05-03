
import { RSSSource } from "@/services/rssSourcesService";
import { SourceItem } from "./SourceItem";

interface SourcesListProps {
  sources: RSSSource[];
  onSourceUpdated: (id: string, isActive: boolean) => void;
}

export const SourcesList = ({ sources, onSourceUpdated }: SourcesListProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-right text-gray-800">
        הישאר מעודכן מאתרי החדשות האמינים והמהירים בישראל
      </h2>
      
      <div className="space-y-3">
        {sources.length > 0 ? (
          sources.map((source) => (
            <SourceItem
              key={source.id}
              source={source}
              onSourceUpdated={onSourceUpdated}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            אין מקורות RSS מוגדרים
          </div>
        )}
      </div>
    </div>
  );
};
