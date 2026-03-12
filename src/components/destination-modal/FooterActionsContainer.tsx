import React, { useState, useEffect } from 'react';
import { getUserLocation, getDirectionsLink, getDirectionsLinkFromPlace } from '../../lib/utils';
import type { LocationData } from '../../lib/locationTypes';

interface FooterActionsContainerProps {
  onRate?: () => void;
  hasLocation: boolean;
  onViewRoutes: () => void;
  detailsOpen: boolean;
  onCloseDetails: () => void;
  destination?: LocationData;
  destinationName?: string;
}

export const FooterActionsContainer: React.FC<FooterActionsContainerProps> = ({
  onRate,
  hasLocation,
  onViewRoutes,
  detailsOpen,
  onCloseDetails,
  destination,
  destinationName,
}) => {
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationText, setLocationText] = useState('');

  useEffect(() => {
    console.log('FooterActionsContainer props:', {
      destination,
      destinationName,
      hasLocation,
      hasValidCoords: destination ? (typeof destination.lat === 'number' && typeof destination.lng === 'number') : false,
    });
  }, [destination, destinationName, hasLocation]);

  const handleGetCurrentLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    
    console.log('Getting current location. Destination:', destination);
    
    try {
      if (!destination) {
        const errorMsg = `Destination missing: ${destination === null ? 'null' : 'undefined'}`;
        console.error(errorMsg);
        setLocationError('Destination information is not available. Please enter your location manually.');
        setLocationLoading(false);
        return;
      }

      const destLat = destination.lat;
      const destLng = destination.lng;
      
      // Check if coordinates are valid numbers
      if (destLat === null || destLng === null || typeof destLat !== 'number' || typeof destLng !== 'number') {
        const errorMsg = `Invalid or missing destination coordinates - Lat: ${destLat}, Lng: ${destLng}`;
        console.warn(errorMsg);
        setLocationError('Destination coordinates are not available. Please enter your location manually and try again.');
        setLocationLoading(false);
        return;
      }

      const userLocation = await getUserLocation();
      console.log('User location obtained:', userLocation);
      
      const directionsLink = getDirectionsLink(
        userLocation.lat,
        userLocation.lng,
        destLat,
        destLng,
        destinationName
      );

      console.log('Opening directions link:', directionsLink);
      
      const mapWindow = window.open(directionsLink, '_blank', 'noopener,noreferrer');
      
      if (!mapWindow) {
        setLocationError('Pop-up blocked. Please check your browser settings.');
        setLocationLoading(false);
        return;
      }

      setShowLocationModal(false);
      setLocationError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get your location.';
      console.error('Location error:', message, error);
      setLocationError(message);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleLocationSearch = () => {
    const trimmedLocation = locationText.trim();

    console.log('Handling location search. Input:', trimmedLocation, 'Destination:', destination);

    if (!trimmedLocation) {
      setLocationError('Please enter your location (city, barangay, or address).');
      return;
    }

    if (!destination) {
      const errorMsg = `Destination missing: ${destination === null ? 'null' : 'undefined'}`;
      console.error(errorMsg);
      setLocationError('Destination information is not available. Please try again.');
      return;
    }

    try {
      const destLat = destination.lat;
      const destLng = destination.lng;
      
      // If we have valid coordinates, use coordinate-based directions
      if (destLat !== null && destLng !== null && typeof destLat === 'number' && typeof destLng === 'number') {
        const directionsLink = getDirectionsLinkFromPlace(trimmedLocation, destLat, destLng, destinationName);
        console.log('Opening directions link with coordinates:', directionsLink);
        
        const mapWindow = window.open(directionsLink, '_blank', 'noopener,noreferrer');
        
        if (!mapWindow) {
          setLocationError('Pop-up blocked. Please check your browser settings.');
          return;
        }

        setShowLocationModal(false);
        setLocationText('');
        setLocationError(null);
      } else {
        // If no coordinates available, use destination name or address as the destination
        const destinationAddress = destination.address || 
                                  [destination.barangay, destination.municipality]
                                    .filter(Boolean)
                                    .join(', ') || 
                                  destinationName;
        
        if (!destinationAddress) {
          setLocationError('Destination name/address not available. Please try again.');
          return;
        }

        // Create a directions link using place names
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(trimmedLocation)}&destination=${encodeURIComponent(destinationAddress)}`;
        console.log('Opening directions link with place names:', directionsUrl);
        
        const mapWindow = window.open(directionsUrl, '_blank', 'noopener,noreferrer');
        
        if (!mapWindow) {
          setLocationError('Pop-up blocked. Please check your browser settings.');
          return;
        }

        setShowLocationModal(false);
        setLocationText('');
        setLocationError(null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate directions.';
      console.error('Direction generation error:', message, error);
      setLocationError(message);
    }
  };

  const handleViewRoutes = () => {
    console.log('View Routes clicked. Opening location modal for directions.');
    console.log('Destination:', destination, 'Destination Name:', destinationName);
    
    // Always open the location modal for directions
    setShowLocationModal(true);
    setLocationError(null);
  };

  return (
    <>
      <div className="relative z-40 pt-2 border-t border-white/10 modal-stone-text">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          {onRate ? (
            <button
              type="button"
              onClick={onRate}
              className="rounded-full glass-button px-4 py-2 text-xs sm:text-sm font-semibold transition-colors"
            >
              Rate
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={handleViewRoutes}
            className="text-xs sm:text-sm font-semibold modal-stone-muted underline underline-offset-4 hover:opacity-80"
          >
            View Routes
          </button>
        </div>

        {detailsOpen && (
          <button
            type="button"
            onClick={onCloseDetails}
            className="mt-2 text-[10px] sm:text-xs modal-stone-muted underline underline-offset-4 hover:opacity-80 lg:hidden"
          >
            See less
          </button>
        )}
      </div>

      {/* Location Modal */}
      {showLocationModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowLocationModal(false)}
        >
          <div
            className="relative w-full max-w-md bg-white/10 rounded-2xl border border-white/20 glass-secondary p-6 backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-black/90 mb-4">Get Directions</h3>
            
            {locationError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-700 text-sm">
                {locationError}
              </div>
            )}

            {/* Info message about destination coordinates */}
            {destination && (
              <div className="mb-4 p-3 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-700 text-xs">
                {destination.lat !== null && destination.lng !== null ? (
                  <p>✓ Destination coordinates available. Enter your location below.</p>
                ) : (
                  <p>⚠ Exact destination coordinates not available, but you can still get directions to "{destinationName}"</p>
                )}
              </div>
            )}

            <div className="space-y-3">
              {/* Use Current Location */}
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={locationLoading || !destination || destination.lat === null || destination.lng === null}
                title={!destination || destination.lat === null || destination.lng === null ? 'Destination coordinates not available' : ''}
                className="w-full py-3 px-4 rounded-xl bg-blue-600/80 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {locationLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    Use My Current Location
                  </>
                )}
              </button>

              {/* Or Divider - only show if current location button is available */}
              {destination && destination.lat !== null && destination.lng !== null && (
                <div className="relative flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-white/20" />
                  <span className="text-xs text-black/50">or</span>
                  <div className="flex-1 h-px bg-white/20" />
                </div>
              )}

              {/* Location Search */}
              <div className="space-y-2">
                <label className="text-xs text-black/70 font-medium">Enter Your Location</label>
                <input
                  type="text"
                  placeholder="e.g., Vigan City, San Jacinto, or an address"
                  value={locationText}
                  onChange={(e) => {
                    setLocationText(e.target.value);
                    if (locationError) setLocationError(null);
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <button
                  type="button"
                  onClick={handleLocationSearch}
                  className="w-full py-2 px-4 rounded-lg bg-green-600/80 hover:bg-green-700 text-white text-sm font-medium transition-colors"
                >
                  Get Directions
                </button>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setShowLocationModal(false);
                setLocationError(null);
                setLocationText('');
              }}
              className="absolute top-4 right-4 text-black/60 hover:text-black/90 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
