// contexts/LocationContext.tsx
import * as Location from "expo-location";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type LatLng = { latitude: number; longitude: number };

type LocationCtx = {
  location: LatLng | null;
  loading: boolean;
  error: string | null;
  hasPermission: boolean | null;
  refresh: () => Promise<void>;
};

const LocationContext = createContext<LocationCtx>({
  location: null,
  loading: false,
  error: null,
  hasPermission: null,
  refresh: async () => {},
});

export const LocationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    // Prevent concurrent calls
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const refreshPromise = (async () => {
      if (!mountedRef.current) return;

      setLoading(true);
      setError(null);

      try {
        // Request permission with timeout
        const permissionTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Permission timeout")), 5000)
        );

        const getPermission = async () => {
          const fg = await Location.getForegroundPermissionsAsync();
          let granted = fg.status === Location.PermissionStatus.GRANTED;
          if (!granted) {
            const req = await Location.requestForegroundPermissionsAsync();
            granted = req.status === Location.PermissionStatus.GRANTED;
          }
          return granted;
        };

        const granted = await Promise.race([
          getPermission(),
          permissionTimeout,
        ]);

        if (!mountedRef.current) return;
        setHasPermission(granted);

        if (!granted) {
          setLocation(null);
          setError("Location permission denied");
          return;
        }

        // Get last known position first (fast)
        try {
          const last = await Location.getLastKnownPositionAsync({
            maxAge: 60000,
            requiredAccuracy: 1000,
          });

          if (last && mountedRef.current) {
            setLocation({
              latitude: last.coords.latitude,
              longitude: last.coords.longitude,
            });
          }
        } catch (lastKnownError) {
          console.warn("Last known location failed:", lastKnownError);
        }

        // Get current position with timeout
        const locationTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Location timeout")), 10000)
        );

        const getCurrentLocation = Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          maximumAge: 60000,
        });

        const cur = await Promise.race([getCurrentLocation, locationTimeout]);

        if (!mountedRef.current) return;

        setLocation({
          latitude: cur.coords.latitude,
          longitude: cur.coords.longitude,
        });

        // Set up watcher only once
        if (!watchRef.current) {
          try {
            watchRef.current = await Location.watchPositionAsync(
              {
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 30000,
                distanceInterval: 100,
              },
              (pos) => {
                if (mountedRef.current) {
                  setLocation({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                  });
                }
              }
            );
          } catch (watchError) {
            console.warn("Location watcher failed:", watchError);
          }
        }
      } catch (e: any) {
        console.error("Location refresh failed:", e);
        if (!mountedRef.current) return;

        if (e.message?.includes("timeout")) {
          setError("Location request timed out");
        } else if (e.message?.includes("denied")) {
          setError("Location permission denied");
        } else {
          setError("Could not fetch location");
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = refreshPromise;
    return refreshPromise;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refresh();

    return () => {
      mountedRef.current = false;
      if (watchRef.current) {
        watchRef.current.remove();
        watchRef.current = null;
      }
      refreshPromiseRef.current = null;
    };
  }, [refresh]);

  return (
    <LocationContext.Provider
      value={{ location, loading, error, hasPermission, refresh }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
