// app/contexts/LocationContext.tsx
import React, { createContext, useContext, useState } from 'react';

type Location = { latitude: number; longitude: number } | null;

const LocationContext = createContext<{
  location: Location;
  setLocation: React.Dispatch<React.SetStateAction<Location>>;
}>({
  location: null,
  setLocation: () => {},
});

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
  const [location, setLocation] = useState<Location>(null);

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
