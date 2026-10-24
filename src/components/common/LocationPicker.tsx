import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { LatLng, LeafletMouseEvent } from 'leaflet';
import { useState, useEffect, useRef, useId } from 'react';
import { LocateIcon, MapPin, Search, Loader2 } from 'lucide-react';
import type L from 'leaflet';

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
  /** Legacy address-driven search; skips the initial value on mount. */
  searchValue?: string;
  /** Address to search only when the merchant presses Find address on map. */
  addressQuery?: string;
  /** Broader area to try if the street address cannot be found. */
  areaQuery?: string;
  showMarker?: boolean;
  /** Require an explicit edit action before touch users can interact with the map. */
  mobileInteractionGuard?: boolean;
  /** @deprecated Kept for backwards compatibility. */
  autoSelectFirstResult?: boolean;
}

const MapEvents = ({ onMapClick, readonly }: {
  onMapClick: (e: LeafletMouseEvent) => void;
  readonly: boolean;
}) => {
  const map = useMap();
  useEffect(() => {
    if (readonly) return;
    map.on('click', onMapClick);
    return () => { map.off('click', onMapClick); };
  }, [map, onMapClick, readonly]);
  return null;
};

const MapRecenter = ({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) => {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], Math.max(map.getZoom(), zoom)); }, [lat, lng, zoom, map]);
  return null;
};

const MapInteraction = ({ enabled }: { enabled: boolean }) => {
  const map = useMap();
  useEffect(() => {
    const handlers = [map.dragging, map.touchZoom, map.doubleClickZoom, map.boxZoom, map.keyboard];
    handlers.forEach(handler => enabled ? handler.enable() : handler.disable());
  }, [map, enabled]);
  return null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({
  onChange,
  initialLat = 14.5995,
  initialLng = 120.9842,
  readonly = false,
  enableSearch = false,
  searchLocations,
  searchPlaceholder = 'Search a business, landmark or place',
  searchValue,
  addressQuery,
  areaQuery,
  showMarker = true,
  mobileInteractionGuard = false,
}) => {
  const searchId = useId();
  const [position, setPosition] = useState(new LatLng(initialLat, initialLng));
  const [zoom, setZoom] = useState(13);
  const [searchQuery, setSearchQuery] = useState('');
  const [request, setRequest] = useState<{ query: string; autoSelect: boolean; fallback?: string } | null>(null);
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [activeResult, setActiveResult] = useState(-1);
  const [message, setMessage] = useState('');
  const [needsMapActivation, setNeedsMapActivation] = useState(false);
  const [isAdjustingPin, setIsAdjustingPin] = useState(false);
  const mapUnlocked = readonly || !needsMapActivation || isAdjustingPin;
  const canEditPin = !readonly && mapUnlocked;
  const SearchContainer = addressQuery === undefined ? 'div' : 'details';
  // Invalidate pending searches AND geolocation when a newer action wins.
  const requestId = useRef(0);
  const searchLocationsRef = useRef(searchLocations);
  const onChangeRef = useRef(onChange);
  searchLocationsRef.current = searchLocations;
  onChangeRef.current = onChange;

  useEffect(() => { setPosition(new LatLng(initialLat, initialLng)); }, [initialLat, initialLng]);

  useEffect(() => {
    if (!mobileInteractionGuard) {
      setNeedsMapActivation(false);
      return;
    }
    const media = window.matchMedia('(max-width: 767px), (pointer: coarse)');
    const update = () => { setNeedsMapActivation(media.matches); setIsAdjustingPin(false); };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [mobileInteractionGuard]);

  useEffect(() => { setIsAdjustingPin(false); }, [addressQuery, readonly]);

  const cancelPending = () => {
    requestId.current++;
    setRequest(null);
    setIsSearching(false);
    setIsLocating(false);
    setShowResults(false);
    setSearchResults([]);
    setActiveResult(-1);
    setMessage('');
  };

  useEffect(() => {
    cancelPending();
    const pending = requestId;
    return () => { pending.current++; };
  }, [addressQuery, areaQuery, readonly, enableSearch]);

  const previousSearchValue = useRef(searchValue);
  useEffect(() => {
    if (searchValue === previousSearchValue.current) return;
    previousSearchValue.current = searchValue;
    cancelPending();
    if (!readonly && enableSearch && searchValue && searchValue.trim().length >= 3) {
      setSearchQuery(searchValue);
      setRequest({ query: searchValue, autoSelect: true });
    }
  }, [searchValue, readonly, enableSearch]);

  const choosePosition = (lat: number, lng: number, closeUp = false) => {
    cancelPending();
    setPosition(new LatLng(lat, lng));
    if (closeUp) setZoom(17);
    onChangeRef.current(lat, lng);
  };

  const selectResult = (result: LocationSearchResult) => {
    choosePosition(result.lat, result.lng, true);
    setSearchQuery(result.label);
    setMessage('Pin moved. Check the map and adjust it to the exact entrance.');
  };

  useEffect(() => {
    if (!request || readonly || !enableSearch || !searchLocationsRef.current) return;
    const id = ++requestId.current;
    setIsSearching(true);
    setMessage('');
    const timer = window.setTimeout(async () => {
      try {
        let results = await searchLocationsRef.current!(request.query);
        if (id !== requestId.current) return;
        let usedArea = false;
        if (!results.length && request.fallback && request.fallback !== request.query) {
          results = await searchLocationsRef.current!(request.fallback);
          usedArea = true;
        }
        if (id !== requestId.current) return;
        if (request.autoSelect && results.length) {
          const result = results[0];
          setPosition(new LatLng(result.lat, result.lng));
          setZoom(usedArea ? 15 : 17);
          onChangeRef.current(result.lat, result.lng);
          setSearchQuery('');
          setShowResults(false);
          setMessage(usedArea
            ? 'We found your area, but not the street address. Move the pin to the exact entrance.'
            : 'Address found. Check the pin and move it to the exact entrance if needed.');
        } else {
          setSearchResults(results);
          setShowResults(results.length > 0);
          setMessage(results.length ? 'Choose a matching place below.' : 'No matching places found. Try a nearby landmark or click the map to place the pin.');
        }
      } catch {
        if (id === requestId.current) setMessage('Location search is unavailable. Try again, use your location, or click the map to place the pin.');
      } finally {
        if (id === requestId.current) setIsSearching(false);
      }
    }, request.autoSelect ? 0 : 350);
    const pending = requestId;
    return () => { window.clearTimeout(timer); if (id === pending.current) pending.current++; };
  }, [request, readonly, enableSearch]);

  const locate = () => {
    cancelPending();
    if (!navigator.geolocation) {
      setMessage('Your browser cannot share your location. Search for a place or click the map instead.');
      return;
    }
    const id = requestId.current;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (id !== requestId.current) return;
      choosePosition(coords.latitude, coords.longitude, true);
      setMessage('Your current location is shown. Move the pin if the entrance is somewhere else.');
    }, error => {
      if (id !== requestId.current) return;
      setIsLocating(false);
      setMessage(error.code === 1
        ? 'Location access was denied. Allow location access in your browser, or search for a place instead.'
        : 'We could not get your location. Try again, search for a place, or click the map.');
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  };

  return (
    <div className="w-full min-w-0 space-y-3">
      {!readonly && (
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {addressQuery !== undefined && enableSearch && (
              <button type="button" disabled={!addressQuery.trim() || isSearching} onClick={() => {
                cancelPending();
                setRequest({ query: addressQuery, autoSelect: true, fallback: areaQuery });
              }} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
                {isSearching && request?.autoSelect ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <MapPin size={16} aria-hidden="true" />}
                {isSearching && request?.autoSelect ? 'Finding address…' : 'Find address on map'}
              </button>
            )}
            <button type="button" onClick={locate} disabled={isLocating} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 sm:w-auto">
              {isLocating ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <LocateIcon size={16} aria-hidden="true" />}
              {isLocating ? 'Getting your location…' : 'Use my current location'}
            </button>
          </div>
          {addressQuery !== undefined && <p className="text-xs text-gray-500">{addressQuery ? 'At this address now? You can use your current location instead.' : 'Complete the address above to find it on the map, or use your current location.'}</p>}
          {enableSearch && (
            <SearchContainer>
              {addressQuery !== undefined && <summary className="w-fit cursor-pointer rounded py-2 text-sm font-semibold text-primary-700 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">Can't find it? Search a nearby landmark</summary>}
              <div className={addressQuery !== undefined ? 'mt-2' : undefined} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setShowResults(false); }}>
                <label htmlFor={searchId} className="mb-1.5 block text-sm font-medium text-gray-700">{addressQuery !== undefined ? 'Nearby landmark (optional)' : 'Search for a place'}</label>
                <div className="relative">
                  <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  <input id={searchId} type="text" autoComplete="off" role="combobox" aria-autocomplete="list" aria-expanded={showResults} aria-controls={`${searchId}-results`} aria-activedescendant={showResults && activeResult >= 0 ? `${searchId}-result-${activeResult}` : undefined}
                    value={searchQuery} placeholder={searchPlaceholder} className="furk-field pl-10 pr-4"
                    onFocus={() => { if (searchResults.length) setShowResults(true); }}
                    onChange={event => {
                      cancelPending();
                      const query = event.target.value;
                      setSearchQuery(query);
                      if (query.trim().length >= 3) setRequest({ query: query.trim(), autoSelect: false });
                    }}
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        if (showResults && activeResult >= 0) selectResult(searchResults[activeResult]);
                      } else if (event.key === 'Escape') {
                        cancelPending();
                      } else if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && searchResults.length) {
                        event.preventDefault();
                        setShowResults(true);
                        setActiveResult(index => event.key === 'ArrowDown' ? Math.min(index + 1, searchResults.length - 1) : Math.max(index - 1, 0));
                      }
                    }} />
                </div>
                {showResults && <ul id={`${searchId}-results`} role="listbox" aria-label="Matching places" className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white">
                  {searchResults.map((result, index) => <li key={`${result.lat}-${result.lng}-${index}`} id={`${searchId}-result-${index}`} role="option" aria-selected={index === activeResult}>
                    <button type="button" tabIndex={-1} onMouseDown={event => event.preventDefault()} onClick={() => selectResult(result)} ref={node => { if (index === activeResult) node?.scrollIntoView({ block: 'nearest' }); }} className={`w-full px-3 py-3 text-left text-sm hover:bg-primary-50 ${index === activeResult ? 'bg-primary-50' : ''}`}>{result.label}</button>
                  </li>)}
                </ul>}
              </div>
            </SearchContainer>
          )}
          <p role="status" aria-live="polite" className="text-sm text-gray-600">{isSearching ? 'Searching for a location…' : isLocating ? 'Waiting for your device location…' : message}</p>
        </div>
      )}
      {needsMapActivation && isAdjustingPin && !readonly && (
        <p role="status" className="text-sm text-primary-900">Drag the pin or tap the map, then choose Done adjusting.</p>
      )}
      <div className={`relative z-0 overflow-hidden rounded-xl border border-gray-300 ${mobileInteractionGuard ? 'h-[280px]' : 'h-[320px]'} sm:h-[400px]`} aria-label="Location map">
        <div className={`h-full ${!mapUnlocked ? 'pointer-events-none' : ''}`} ref={node => { if (node) node.inert = !mapUnlocked; }}>
          <MapContainer center={[initialLat, initialLng]} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {showMarker && <Marker position={position} draggable={canEditPin} eventHandlers={{ dragend: (event: L.DragEndEvent) => {
              if (!canEditPin) return;
              const next = (event.target as L.Marker).getLatLng();
              choosePosition(next.lat, next.lng);
            } }} />}
            <MapEvents readonly={!canEditPin} onMapClick={event => { if (canEditPin) choosePosition(event.latlng.lat, event.latlng.lng); }} />
            <MapInteraction enabled={mapUnlocked} />
            <MapRecenter lat={position.lat} lng={position.lng} zoom={zoom} />
          </MapContainer>
        </div>
        {needsMapActivation && !readonly && (
          <div className={`absolute z-[1000] ${isAdjustingPin ? 'right-3 top-3' : 'inset-0 flex touch-pan-y items-center justify-center bg-white/25 p-4'}`}>
            <button type="button" aria-pressed={isAdjustingPin} onClick={() => { if (!isAdjustingPin) cancelPending(); setIsAdjustingPin(previous => !previous); }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-primary-200 bg-white px-4 py-3 text-sm font-bold text-primary-800 shadow-md hover:bg-primary-50">
              <MapPin size={18} aria-hidden="true" /> {isAdjustingPin ? 'Done adjusting' : 'Tap to adjust pin'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationPicker;
