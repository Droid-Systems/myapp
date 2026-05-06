"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";

interface PropertyMapProps {
  title: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  image?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

export default function PropertyMap({
  title,
  price,
  bedrooms,
  bathrooms,
  latitude,
  longitude,
  locationName,
}: PropertyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    latitude != null && longitude != null ? { lat: latitude, lng: longitude } : null
  );
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState(false);

  // Geocode from location name if no explicit coords
  useEffect(() => {
    if (latitude != null && longitude != null) {
      setCoords({ lat: latitude, lng: longitude });
      return;
    }
    if (!locationName) { setError(true); return; }

    let cancelled = false;
    setGeocoding(true);

    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`,
      { headers: { "Accept-Language": "en" } }
    )
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data && data.length > 0) {
          setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        } else {
          setError(true);
        }
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setGeocoding(false); });

    return () => { cancelled = true; };
  }, [latitude, longitude, locationName]);

  // Initialise map once coords are available
  useEffect(() => {
    if (!coords || !mapContainerRef.current) return;

    // Destroy any existing map instance before creating a new one
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
          },
        },
        layers: [
          {
            id: "osm-tiles",
            type: "raster",
            source: "osm",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [coords.lng, coords.lat],
      zoom: 14,
      scrollZoom: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    // Popup content
    const popupHtml = `
      <div style="min-width:180px; font-family:inherit;">
        <p style="margin:0 0 4px; font-size:13px; font-weight:700; color:#111;">${title}</p>
        <p style="margin:0 0 6px; font-size:15px; font-weight:700; color:#4a6cf7;">${price}</p>
        <p style="margin:0; font-size:12px; color:#6b7280;">${bedrooms} bd · ${bathrooms} ba</p>
      </div>
    `;

    const popup = new maplibregl.Popup({ offset: 25, closeButton: false })
      .setHTML(popupHtml);

    const marker = new maplibregl.Marker({ color: "#4a6cf7" })
      .setLngLat([coords.lng, coords.lat])
      .setPopup(popup)
      .addTo(map);

    marker.togglePopup(); // open popup by default

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [coords, title, price, bedrooms, bathrooms]);

  if (geocoding) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
        <p className="text-sm text-body-color dark:text-body-color-dark">Loading map…</p>
      </div>
    );
  }

  if (error || !coords) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
        <p className="text-sm text-body-color dark:text-body-color-dark">Location unavailable</p>
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className="h-[400px] w-full overflow-hidden rounded-2xl shadow-lg"
    />
  );
}
