
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { RSSSource, getRSSSources } from "@/services/rssSourcesService";
import { useLocation } from "@/hooks/use-location";
import { AddSourceForm } from "@/components/rss/AddSourceForm";
import { SourcesList } from "@/components/rss/SourcesList";

const RssSources = () => {
  const [sources, setSources] = useState<RSSSource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { location, handleLocationChange } = useLocation();

  const fetchSources = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRSSSources();
      setSources(data);
    } catch (error) {
      console.error("Error fetching sources:", error);
      setError("אירעה שגיאה בטעינת מקורות RSS");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleSourceAdded = (newSource: RSSSource) => {
    setSources([...sources, newSource]);
  };

  const handleSourceUpdated = (id: string, isActive: boolean) => {
    setSources(sources.map(source => 
      source.id === id ? { ...source, is_active: isActive } : source
    ));
  };

  const handleSourceDeleted = (id: string) => {
    setSources(sources.filter(source => source.id !== id));
  };

  // Create a dummy function for snoozeChange since we don't need it here
  const handleSnoozeChange = (minutes: number) => {
    console.log(`Snooze set for ${minutes} minutes, but not used in RSS page`);
  };

  if (loading) {
    return <LoadingSpinner message="טוען מקורות RSS..." />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-geoalert-gray pb-16">
      <Header 
        location={location}
        snoozeActive={false}
        onLocationChange={handleLocationChange}
        onSnoozeChange={handleSnoozeChange}
      />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4 text-right">מקורות RSS</h1>
          <p className="text-right text-gray-600 mb-6">נהל את מקורות ה-RSS שלך לקבלת התראות</p>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-right">
              {error}
            </div>
          )}

          <AddSourceForm onSourceAdded={handleSourceAdded} />
          <SourcesList 
            sources={sources} 
            onSourceUpdated={handleSourceUpdated} 
            onSourceDeleted={handleSourceDeleted} 
          />
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default RssSources;
