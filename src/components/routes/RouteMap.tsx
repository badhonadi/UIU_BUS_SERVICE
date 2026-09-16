'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Loader2, MapPin } from 'lucide-react';

interface RouteMapProps {
  routeName: string;
  stops: readonly string[];
  routeColor: string;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

const STOP_COORDINATES: Record<string, Coordinates> = {
  'Zigatola Bus Stop': { latitude: 23.7393, longitude: 90.3684 },
  'Dhanmondi Keari Plaza': { latitude: 23.7467, longitude: 90.3742 },
  'Shankar Bus Stop': { latitude: 23.7582, longitude: 90.3612 },
  'Mohammadpur BRTC Bus Stop': { latitude: 23.7618, longitude: 90.3599 },
  'Manik Mia Avenue': { latitude: 23.7662, longitude: 90.3691 },
  'BARC, Farmgate': { latitude: 23.7651, longitude: 90.3892 },
  Kakoli: { latitude: 23.7932, longitude: 90.4042 },
  'Gulshan 2': { latitude: 23.7937, longitude: 90.4167 },
  'Notun Bazar': { latitude: 23.8061, longitude: 90.4261 },
  UIU: { latitude: 23.8223, longitude: 90.3654 },
  Palashi: { latitude: 23.7301, longitude: 90.3852 },
  Azimpur: { latitude: 23.7278, longitude: 90.3843 },
  'Dhaka College': { latitude: 23.7354, longitude: 90.3833 },
  'City College': { latitude: 23.7385, longitude: 90.3818 },
  'West Kalabagan': { latitude: 23.7474, longitude: 90.3848 },
  Panthapath: { latitude: 23.7514, longitude: 90.3882 },
  Technical: { latitude: 23.7792, longitude: 90.3531 },
  'Mirpur 1': { latitude: 23.7932, longitude: 90.3534 },
  'Mirpur 2': { latitude: 23.8023, longitude: 90.3652 },
  'Mirpur 10': { latitude: 23.8064, longitude: 90.3687 },
  'Mirpur 11': { latitude: 23.8151, longitude: 90.3665 },
  'Mirpur 12': { latitude: 23.8231, longitude: 90.3659 },
  'ECB Chattar (Kalshi)': { latitude: 23.824, longitude: 90.3902 },
  'Kuril Flyover': { latitude: 23.8232, longitude: 90.4123 },
  'Signboard Mor': { latitude: 23.7044, longitude: 90.4304 },
  'Hanif Flyover': { latitude: 23.7181, longitude: 90.425 },
  'Manik Nagar': { latitude: 23.723, longitude: 90.4286 },
  Mugdapara: { latitude: 23.7185, longitude: 90.4401 },
  Bashabo: { latitude: 23.7356, longitude: 90.4301 },
  'Khilgaon Police Fari': { latitude: 23.7412, longitude: 90.4302 },
  'Abul Hotel': { latitude: 23.7503, longitude: 90.4232 },
  'Rampura Bridge': { latitude: 23.7637, longitude: 90.4221 },
  'Aftab Nagar': { latitude: 23.7702, longitude: 90.4182 },
  'Jatrabari Mor': { latitude: 23.7101, longitude: 90.4352 },
  Sunvally: { latitude: 23.7984, longitude: 90.4211 },
  Abdullahpur: { latitude: 23.8751, longitude: 90.4001 },
  'House Building': { latitude: 23.8752, longitude: 90.405 },
  Azampur: { latitude: 23.872, longitude: 90.4056 },
  Jashimuddin: { latitude: 23.8624, longitude: 90.3995 },
  Airport: { latitude: 23.8512, longitude: 90.3971 },
  Khilkhet: { latitude: 23.83, longitude: 90.4201 },
  '300 ft': { latitude: 23.8155, longitude: 90.4498 },
  Bashundhara: { latitude: 23.8125, longitude: 90.4302 },
};

const STOP_LABELS: Record<string, string> = {
  'Zigatola Bus Stop': 'Zigatola Bus Stand',
  'Dhanmondi Keari Plaza': 'Dhanmondi Keari Plaza Bus Stand',
  'Shankar Bus Stop': 'Shankar Bus Stand',
  'Mohammadpur BRTC Bus Stop': 'Mohammadpur BRTC Bus Stand',
  'Manik Mia Avenue': 'Manik Mia Avenue Bus Stand',
  'BARC, Farmgate': 'Farmgate Bus Stand',
  Kakoli: 'Kakoli Bus Stand',
  'Gulshan 2': 'Gulshan 2 Bus Stand',
  'Notun Bazar': 'Notun Bazar Bus Stand',
  Palashi: 'Palashi Bus Stand',
  Azimpur: 'Azimpur Bus Stand',
  'Dhaka College': 'Dhaka College Bus Stand',
  'City College': 'City College Bus Stand',
  'West Kalabagan': 'Kalabagan Bus Stand',
  Panthapath: 'Panthapath Bus Stand',
  Technical: 'Technical Bus Stand',
  'Mirpur 1': 'Mirpur 1 Bus Stand',
  'Mirpur 2': 'Mirpur 2 Bus Stand',
  'Mirpur 10': 'Mirpur 10 Bus Stand',
  'Mirpur 11': 'Mirpur 11 Bus Stand',
  'Mirpur 12': 'Mirpur 12 Bus Stand',
  'ECB Chattar (Kalshi)': 'Kalshi Bus Stand',
  'Kuril Flyover': 'Kuril Bus Stand',
  'Signboard Mor': 'Signboard Bus Stand',
  'Hanif Flyover': 'Hanif Flyover Bus Stand',
  'Manik Nagar': 'Manik Nagar Bus Stand',
  Mugdapara: 'Mugdapara Bus Stand',
  Bashabo: 'Bashabo Bus Stand',
  'Khilgaon Police Fari': 'Khilgaon Bus Stand',
  'Abul Hotel': 'Abul Hotel Bus Stand',
  'Rampura Bridge': 'Rampura Bus Stand',
  'Aftab Nagar': 'Aftab Nagar Bus Stand',
  'Jatrabari Mor': 'Jatrabari Bus Stand',
  Sunvally: 'Sunvally Bus Stand',
  Abdullahpur: 'Abdullahpur Bus Stand',
  'House Building': 'House Building Bus Stand',
  Azampur: 'Azampur Bus Stand',
  Jashimuddin: 'Jashimuddin Bus Stand',
  Airport: 'Airport Bus Stand',
  Khilkhet: 'Khilkhet Bus Stand',
  '300 ft': '300 Feet Bus Stand',
  Bashundhara: 'Bashundhara Bus Stand',
};

export function RouteMap({ routeName, stops, routeColor }: RouteMapProps) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState('');
  const pickupStops = stops.filter((stop) => stop !== 'UIU');

  useEffect(() => {
    let cancelled = false;

    async function loadGoogleMaps() {
      if (typeof window === 'undefined') return null;
      const browserWindow = window as Window & { google?: any; __googleMapsPromise?: Promise<any> };

      if (browserWindow.google?.maps) return browserWindow.google.maps;
      if (browserWindow.__googleMapsPromise) return browserWindow.__googleMapsPromise;

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) throw new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured');

      browserWindow.__googleMapsPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
        script.async = true;
        script.onload = () => resolve(browserWindow.google?.maps);
        script.onerror = reject;
        document.body.appendChild(script);
      });

      return browserWindow.__googleMapsPromise;
    }

    async function initializeMap() {
      try {
        const googleMaps = await loadGoogleMaps();
        if (cancelled || !googleMaps || !mapElementRef.current || mapRef.current) return;

        const map = new googleMaps.Map(mapElementRef.current, {
          center: { lat: 23.79, lng: 90.4 },
          zoom: 12,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        });
        mapRef.current = map;
        setMapReady(true);
      } catch (error) {
        setMapError(error instanceof Error ? error.message : 'Google Maps could not be loaded');
        setLoading(false);
      }
    }

    initializeMap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    let cancelled = false;

    const routeCoordinates = pickupStops
      .map((stop) => STOP_COORDINATES[stop])
      .filter((coordinates): coordinates is Coordinates => Boolean(coordinates));

    if (routeCoordinates.length === 0) {
      setLoading(false);
      return;
    }

    if (!cancelled) {
      const googleMaps = (window as any).google?.maps;
      if (!googleMaps) {
        setLoading(false);
        return;
      }

      const bounds = new googleMaps.LatLngBounds();
      routeCoordinates.forEach(({ latitude, longitude }) => bounds.extend({ lat: latitude, lng: longitude }));
      mapRef.current.fitBounds(bounds, 28);
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [mapReady, stops]);

  const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(routeName)}`;

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-slate-100">
      <div ref={mapElementRef} className="absolute inset-0 h-full w-full" aria-label={`Interactive map for ${routeName}`} />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/90 text-sm text-slate-600">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#F37021]" /> Loading Google Map...
        </div>
      )}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 px-6 text-center">
          <div className="max-w-md rounded-xl border border-amber-200 bg-white p-5 shadow-sm">
            <p className="font-semibold text-slate-800">Google Map is unavailable</p>
            <p className="mt-2 text-sm text-slate-500">
              Add a valid NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local and restart the dev server.
            </p>
          </div>
        </div>
      )}
      <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-2 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm">
        <MapPin size={14} className="text-[#F37021]" />
        Google Maps
      </div>
      <a
        href={mapSearchUrl}
        target="_blank"
        rel="noreferrer"
        className="absolute right-3 top-3 z-[1000] inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-white"
      >
        Open Google Maps <ExternalLink size={13} />
      </a>
    </div>
  );
}
