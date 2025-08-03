import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { LatLng, LeafletMouseEvent } from 'leaflet';
import { useState, useEffect, useRef } from 'react';
import { LocateIcon } from 'lucide-react';
import L from 'leaflet';

interface LocationPickerProps {
  onChange: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

const MapEvents: React.FC<{
  onMapClick: (e: LeafletMouseEvent) => void;
}> = ({ onMapClick }) => {
  const map = useMap();

  useEffect(() => {
    map.on('click', onMapClick);
    return () => {
      map.off('click', onMapClick);
    };
  }, [map, onMapClick]);

  return null;
};

const LocationControl: React.FC<{
  onLocationFound: (lat: number, lng: number) => void;
}> = ({ onLocationFound }) => {
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
    console.log('Requesting location...');
    map.locate({ setView: false });
  };

  return (
    <div
      ref={controlRef}
      className="absolute z-[1000] top-3 right-3 bg-white p-2 rounded-lg shadow-md hover:bg-gray-100"
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
}) => {
  const [position, setPosition] = useState<LatLng>(new LatLng(initialLat, initialLng));

  const handleMapClick = (e: LeafletMouseEvent) => {
    setPosition(e.latlng);
    onChange(e.latlng.lat, e.latlng.lng);
  };

  const handleMarkerDrag = (e: any) => {
    const newPos = e.target.getLatLng();
    setPosition(newPos);
    onChange(newPos.lat, newPos.lng);
  };

  const handleLocationFound = (lat: number, lng: number) => {
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
          draggable={true}
          eventHandlers={{
            dragend: handleMarkerDrag,
          }}
        />
        <MapEvents onMapClick={handleMapClick} />
        <LocationControl onLocationFound={handleLocationFound} />
      </MapContainer>
    </div>
  );
};

export default LocationPicker;