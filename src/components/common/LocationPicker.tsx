import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { LatLng, LeafletMouseEvent } from 'leaflet';
import { useState, useEffect, useRef } from 'react';
import { LocateIcon } from 'lucide-react';
import L from 'leaflet';

interface LocationPickerProps {
  onChange: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  readonly?: boolean;
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

const LocationPicker: React.FC<LocationPickerProps> = ({
  onChange,
  initialLat = 14.5995,  // default to Metro Manila
  initialLng = 120.9842,
  readonly = false,
}) => {
  const [position, setPosition] = useState<LatLng>(new LatLng(initialLat, initialLng));

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

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border border-gray-300 relative z-0">
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
      </MapContainer>
    </div>
  );
};

export default LocationPicker;