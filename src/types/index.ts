
export interface Alert {
  id: string;
  title: string;
  description: string;
  location: string;
  timestamp: string;
  isRelevant: boolean;
  source: string;
  link: string;
}

export interface LocationData {
  city: string;
  latitude: number;
  longitude: number;
}

export interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  guid: string;
}
