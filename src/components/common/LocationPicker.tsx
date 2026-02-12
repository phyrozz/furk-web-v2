import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { LatLng, LeafletMouseEvent } from 'leaflet';
import { useState, useEffect, useRef } from 'react';
import { LocateIcon } from 'lucide-react';
import L from 'leaflet';

interface LocationSearchResult {
  label: string;
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  onChange: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  readonly?: boolean;
  enableSearch?: boolean;
  searchLocations?: (query: string) => Promise<LocationSearchResult[]>;
  searchPlaceholder?: string;
}

const MapEvents: React.FC<{
  onMapClick: (e: LeafletMouseEvent) => void;
  readonly: boolean;
}> = ({ onMapClick, readonly }) => {
  const map = useMap();

  useEffect(() => {
    if (!readonly) {
      map.on('click', onMapClick);
      return () => {
        map.off('click', onMapClick);
      };
    }
  }, [map, onMapClick, readonly]);

  return null;
};

const LocationControl: React.FC<{
  onLocationFound: (lat: number, lng: number) => void;
  readonly: boolean;
}> = ({ onLocationFound, readonly }) => {
  const map = useMap();
  const controlRef = useRef<HTMLDivElement>(null);

  const handleLocationFound = (e: any) => {
    onLocationFound(e.latlng.lat, e.latlng.lng);
    map.setView(e.latlng, map.getZoom());
  };

  useEffect(() => {
    const handleLocationError = (e: L.ErrorEvent) => {
      console.error('Geolocation error:', e.message);
    };

    map.on('locationfound', handleLocationFound);
    map.on('locationerror', handleLocationError);

    return () => {
      map.off('locationfound', handleLocationFound);
      map.off('locationerror', handleLocationError);
    };
  }, [map]);

  useEffect(() => {
    if (controlRef.current) {
      // Prevent Leaflet map clicks from bubbling from this div
      L.DomEvent.disableClickPropagation(controlRef.current);
      L.DomEvent.disableScrollPropagation(controlRef.current);
    }
  }, []);

  const getCurrentLocation = () => {
    map.locate({
      setView: false,
      enableHighAccuracy: true,
      timeout: 10000, // wait up to 10 seconds
      maximumAge: 0,
    });
  };

  if (readonly) return null;

  return (
    <div
      ref={controlRef}
      className="absolute z-[1000] top-3 right-3 bg-white p-2 rounded-lg shadow-md hover:bg-gray-100 cursor-pointer"
    >
      <button
        onClick={(e) => {
          e.preventDefault();
          getCurrentLocation();
        }}
        type="button"
      >
        <LocateIcon />
      </button>
    </div>
  );
};

const MapRecenter: React.FC<{
  lat: number;
  lng: number;
}> = ({ lat, lng }) => {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);

  return null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({
  onChange,
  initialLat = 14.5995,  // default to Metro Manila
  initialLng = 120.9842,
  readonly = false,
  enableSearch = false,
  searchLocations,
  searchPlaceholder = 'Search location...',
}) => {
  const [position, setPosition] = useState<LatLng>(new LatLng(initialLat, initialLng));
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    setPosition(new LatLng(initialLat, initialLng));
  }, [initialLat, initialLng]);

  const handleMapClick = (e: LeafletMouseEvent) => {
    if (readonly) return;
    setPosition(e.latlng);
    onChange(e.latlng.lat, e.latlng.lng);
  };

  const handleMarkerDrag = (e: any) => {
    if (readonly) return;
    const newPos = e.target.getLatLng();
    setPosition(newPos);
    onChange(newPos.lat, newPos.lng);
  };

  const handleLocationFound = (lat: number, lng: number) => {
    if (readonly) return;
    const newPos = new LatLng(lat, lng);
    setPosition(newPos);
    onChange(lat, lng);
  };

  const handleSelectSearchResult = (result: LocationSearchResult) => {
    const newPos = new LatLng(result.lat, result.lng);
    setPosition(newPos);
    onChange(result.lat, result.lng);
    setSearchQuery(result.label);
    setShowResults(false);
  };

  useEffect(() => {
    if (readonly || !enableSearch || !searchLocations) return;

    const query = searchQuery.trim();
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await searchLocations(query);
        setSearchResults(results);
        setShowResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchQuery, enableSearch, searchLocations, readonly]);

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border border-gray-300 relative z-0">
      {!readonly && enableSearch && (
        <div className="absolute z-[1000] top-3 left-14 w-[min(26rem,calc(100%-4rem))]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            placeholder={searchPlaceholder}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {showResults && (searchResults.length > 0 || isSearching) && (
            <div className="mt-1 max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg">
              {isSearching && (
                <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>
              )}
              {!isSearching && searchResults.map((result, index) => (
                <button
                  key={`${result.lat}-${result.lng}-${index}`}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  onClick={() => handleSelectSearchResult(result)}
                >
                  {result.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <MapContainer
        center={[initialLat, initialLng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={position}
          draggable={!readonly}
          eventHandlers={{
            dragend: handleMarkerDrag,
          }}
        />
        <MapEvents onMapClick={handleMapClick} readonly={readonly} />
        <LocationControl onLocationFound={handleLocationFound} readonly={readonly} />
        <MapRecenter lat={position.lat} lng={position.lng} />
      </MapContainer>
    </div>
  );
};

export default LocationPicker;
