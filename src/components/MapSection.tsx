import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue with Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export interface MapSectionProps {
  coordinates?: {
    lat: number;
    lng: number;
  };
  zoom?: number;
  provider?: 'openstreetmap' | 'google' | 'kakao';
  apiKey?: string;
  address?: string;
}

export const MapSection = ({
  coordinates = { lat: 37.5665, lng: 126.978 }, // Default to Seoul
  zoom = 15,
  address = 'Seoul, South Korea',
}: MapSectionProps) => {
  useEffect(() => {
    // Ensure map container has proper dimensions
    const mapElement = document.getElementById('map-container');
    if (mapElement) {
      mapElement.style.height = '100%';
    }
  }, []);


  return (
    <section id="map" className="py-10 md:py-14 bg-muted/30" aria-labelledby="map-heading">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 id="map-heading" className="text-3xl md:text-4xl lg:text-5xl font-black mb-4">
              <span className="gradient-text-animated">Map</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Seoul, South Korea
            </p>
          </div>

          {/* Leaflet OpenStreetMap */}
          <div className="relative w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden shadow-lg">
            <MapContainer
              center={[coordinates.lat, coordinates.lng]}
              zoom={zoom}
              style={{ width: '100%', height: '100%' }}
              id="map-container"
            >
              {/* OpenStreetMap tiles (Free, no API key required) */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Marker with popup */}
              <Marker position={[coordinates.lat, coordinates.lng]}>
                <Popup>
                  <div className="text-center">
                    <p className="font-semibold text-sm">{address}</p>
                    <p className="text-xs text-gray-600">
                      {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>

          {/* Location Information */}
          <div className="mt-8 flex flex-col md:flex-row gap-6 justify-center items-center">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Location</h3>
              <p className="text-muted-foreground mb-3">{address}</p>
              <p className="text-sm text-muted-foreground">
                Latitude: {coordinates.lat.toFixed(4)} <br />
                Longitude: {coordinates.lng.toFixed(4)}
              </p>
            </div>

            <div className="hidden md:block w-px h-24 bg-border"></div>

            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Open in Map Services</h3>
              <div className="flex gap-4 justify-center">
                {/* Google Maps - Official Brand Icon */}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-primary/10 transition-all duration-200 group"
                  title="Open in Google Maps"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-md group-hover:shadow-lg transition-shadow">
                    <svg className="w-7 h-7" viewBox="0 0 92.3 132.3" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fill="#1A73E8" d="M60.2 2.2C55.8.8 51 0 46.1 0 32 0 19.3 6.4 10.8 16.5l21.8 18.3L60.2 2.2z"/>
                      <path fill="#EA4335" d="M10.8 16.5C4.1 24.5 0 34.9 0 46.1c0 8.7 1.7 15.7 4.6 22l28-33.3-21.8-18.3z"/>
                      <path fill="#4285F4" d="M46.1 28.5c9.8 0 17.7 7.9 17.7 17.7 0 4.3-1.6 8.3-4.2 11.4 0 0 13.9-16.6 27.5-32.7-5.6-10.8-15.3-19-27-22.7L32.6 34.8c3.3-3.8 8.1-6.3 13.5-6.3z"/>
                      <path fill="#FBBC04" d="M46.1 63.5c-9.8 0-17.7-7.9-17.7-17.7 0-4.3 1.5-8.3 4.1-11.3l-28 33.3c4.8 10.6 12.8 19.2 21 29.9l34.1-40.5c-3.3 3.9-8.1 6.3-13.5 6.3z"/>
                      <path fill="#34A853" d="M59.2 83.9c9.4 14.4 17.9 22.3 20.3 39.6 2.4-17.4 10.9-25.2 12.9-49.4 0-8.7-1.7-15.7-4.6-22l-28.6 31.8z"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Google Maps</span>
                </a>

                {/* Kakao Map - Official Brand Icon */}
                <a
                  href={`https://map.kakao.com/link/map/${address},${coordinates.lat},${coordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-primary/10 transition-all duration-200 group"
                  title="Open in Kakao Map"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FEE500] shadow-md group-hover:shadow-lg transition-shadow">
                    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2.5C6.477 2.5 2 5.943 2 10.207c0 2.756 1.823 5.173 4.574 6.536-.15.53-.966 3.41-.999 3.632 0 0-.02.166.088.23.108.063.235.014.235.014.31-.044 3.588-2.34 4.158-2.743.628.092 1.278.14 1.944.14 5.523 0 10-3.444 10-7.809C22 5.943 17.523 2.5 12 2.5z" fill="#391B1B"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Kakao Map</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
