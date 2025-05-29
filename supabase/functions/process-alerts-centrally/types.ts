
export interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  guid: string;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  location: string;
  timestamp: string;
  source: string;
  link: string;
  is_security_event: boolean;
  image_url?: string;
}
