
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { RSSSource, getRSSSources, ensureUserPreferences } from "@/services/rssSourcesService";
import { useLocation } from "@/hooks/use-location";
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
      // First ensure the user has preference records
      await ensureUserPreferences();
      // Then fetch sources
      const data = await getRSSSources();
      setSources(data);
    } catch (error) {
      console.error("Error fetching sources:", error);
      setError("אירעה שגיאה בטעינת ערוצי RSS");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleSourceUpdated = (id: string, isActive: boolean) => {
    setSources(sources.map(source => 
      source.id === id ? { ...source, is_active: isActive } : source
    ));
  };

  // Create a dummy function for snoozeChange since we don't need it here
  const handleSnoozeChange = (minutes: number) => {
    console.log(`Snooze set for ${minutes} minutes, but not used in RSS page`);
  };

  if (loading) {
    return <LoadingSpinner message="טוען ערוצי RSS..." />;
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
          <h1 className="text-2xl font-bold mb-6 text-right text-geoalert-turquoise">ערוצי RSS</h1>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-right">
              {error}
            </div>
          )}

          <SourcesList 
            sources={sources} 
            onSourceUpdated={handleSourceUpdated} 
          />
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default RssSources;
