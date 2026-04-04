"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';
import { io, Socket } from 'socket.io-client';
import { API_URL, SOCKET_URL } from '@/lib/config';
import { useJsApiLoader, GoogleMap, Marker, DirectionsRenderer, Autocomplete } from '@react-google-maps/api';

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];
const mapContainerStyle = { width: '100%', height: '100%' };
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
    { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
    { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
  ]
};

export default function UserDashboard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  const [categories, setCategories] = useState<string[]>([]);
  const [cargoTypes, setCargoTypes] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCargo, setSelectedCargo] = useState<any | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Maps & Routing State
  const { isLoaded: isMapLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES
  });
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [pickupAutocomplete, setPickupAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [dropoffAutocomplete, setDropoffAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  
  const [pickupLocation, setPickupLocation] = useState<{lat: number, lng: number, address: string} | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<{lat: number, lng: number, address: string} | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [tripDistance, setTripDistance] = useState<number>(0);
  const [tripDuration, setTripDuration] = useState<number>(0);

  // Address text just for UI fields
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');

  const [rideStatus, setRideStatus] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<{lat: number, lng: number} | null>(null);
  const [assignedDriver, setAssignedDriver] = useState<any | null>(null);

  // Directions Effect
  useEffect(() => {
    if (!pickupLocation || !dropoffLocation || !window.google) return;
    
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: new window.google.maps.LatLng(pickupLocation.lat, pickupLocation.lng),
        destination: new window.google.maps.LatLng(dropoffLocation.lat, dropoffLocation.lng),
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          setDirectionsResponse(result);
          
          const route = result.routes[0].legs[0];
          if (route.distance?.value) setTripDistance(route.distance.value / 1000); // meters to km
          if (route.duration?.value) setTripDuration(Math.ceil(route.duration.value / 60)); // seconds to mins
        } else {
          console.error(`Directions request failed due to ${status}`);
        }
      }
    );
  }, [pickupLocation, dropoffLocation]);

  // Auth guard — Clerk-based
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();

  // Sync Clerk user to backend MongoDB on first load
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !clerkUser) return;
    const syncUser = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/clerk-sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            clerkId: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress,
            fullName: clerkUser.fullName || clerkUser.firstName || 'Cargex User',
            imageUrl: clerkUser.imageUrl,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('userData', JSON.stringify(data));
          setIsAuthChecked(true);
        } else {
          console.error('Clerk sync failed');
          setIsAuthChecked(true); // Still allow access — Clerk already authed
        }
      } catch (e) {
        console.error('Clerk sync error:', e);
        setIsAuthChecked(true);
      }
    };
    syncUser();
  }, [isLoaded, isSignedIn, clerkUser]);

  const getIconForCategory = (cat: string) => {
    if (cat.includes('Household')) return '🏠';
    if (cat.includes('Commercial')) return '🏢';
    if (cat.includes('Food')) return '🌾';
    if (cat.includes('Construction')) return '🏗️';
    if (cat.includes('Heavy') || cat.includes('Industrial')) return '🚜';
    return '📦';
  };

  // Socket connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      withCredentials: true
    });
    setSocket(newSocket);
    newSocket.on('connect', () => {
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (userData._id) newSocket.emit('join_user', userData._id);
      } catch {}
    });
    newSocket.on('driver_assigned', (booking) => {
      if (booking._id === bookingId) { setAssignedDriver(booking.driverId); setRideStatus('accepted'); }
    });
    newSocket.on('ride_status_update', (data) => {
      if (data.bookingId === bookingId) { setRideStatus(data.status); if (data.driver) setAssignedDriver(data.driver); }
    });
    newSocket.on('live_location', (data) => { setDriverLocation({ lat: data.lat, lng: data.lng }); });
    return () => { newSocket.disconnect(); };
  }, [bookingId]);

  // Fetch categories
  useEffect(() => {
    fetch(`${API_URL}/api/universal/categories`).then(r => r.json()).then(j => { if (j.success) setCategories(j.data); }).catch(() => {});
  }, []);

  const handleCategorySelect = useCallback(async (catName: string) => {
    setSelectedCategory(catName); setSelectedCargo(null); setSelectedVehicle(null); setStep(2); setIsLoading(true);
    try { const res = await fetch(`${API_URL}/api/universal/cargo/${catName}`); const j = await res.json(); if (j.success) setCargoTypes(j.data); } catch {} finally { setIsLoading(false); }
  }, []);

  const handleCargoSelect = useCallback(async (cargo: any) => {
    if (!pickupLocation || !dropoffLocation) {
      alert("Please select pickup and dropoff locations first on Step 4 section");
      return;
    }
    setSelectedCargo(cargo); setSelectedVehicle(null); setStep(3); setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/universal/recommend`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ cargoTypeId: cargo._id, distanceKm: tripDistance || 15, weightKg: 500 }) 
      });
      const j = await res.json(); if (j.success) setRecommendations(j.data); else setRecommendations([]);
    } catch { setRecommendations([]); } finally { setIsLoading(false); }
  }, [pickupLocation, dropoffLocation, tripDistance]);

  const handleVehicleSelect = useCallback((v: any) => { setSelectedVehicle(v); setStep(4); }, []);

  const handleConfirmBooking = async () => {
    setIsBooking(true);
    try {
      const res = await fetch(`${API_URL}/api/users/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          pickupLocation: { address: pickupLocation?.address || pickupAddress, latitude: pickupLocation?.lat || 28.6139, longitude: pickupLocation?.lng || 77.2090 },
          dropLocation: { address: dropoffLocation?.address || dropoffAddress, latitude: dropoffLocation?.lat || 28.7041, longitude: dropoffLocation?.lng || 77.1025 },
          distance: tripDistance || 15, duration: tripDuration || 35, vehicleType: selectedVehicle.name,
          category: selectedCategory, subcategory: selectedCargo?.name,
          loadType: selectedCargo?.name || 'small',
          paymentMethod,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setBookingId(data._id); setBookingSuccess(true);
        if (socket) socket.emit('join_booking_room', data._id);
      } else {
        const err = await res.json();
        if (res.status === 401) { alert('Session expired. Redirecting...'); router.push('/login'); }
        else alert('Booking failed: ' + err.message);
      }
    } catch { alert('Network error'); } finally { setIsBooking(false); }
  };

  const resetBooking = async () => {
    // If there's an active booking, cancel it on the backend so drivers get notified
    if (bookingId) {
      try {
        await fetch(`${API_URL}/api/users/bookings/${bookingId}/cancel`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ reason: 'Cancelled by user' }),
        });
      } catch (e) {
        console.error('Cancel API failed:', e);
      }
    }
    setStep(1); setSelectedCategory(null); setSelectedCargo(null); setSelectedVehicle(null); setBookingSuccess(false); setBookingId(null); setPaymentMethod('Cash'); setRideStatus(null); setAssignedDriver(null);
  };

  const handleLogout = async () => { 
    try { await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' }); } catch(e){}
    localStorage.removeItem('userData'); 
    router.push('/login'); 
  };

  if (!isLoaded || !isSignedIn || !isAuthChecked) return (
    <div className="min-h-screen bg-surface flex items-center justify-center font-sans">
      <div className="text-center"><div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-muted text-sm">Authenticating...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-surface font-sans">
      <nav className="h-16 bg-white border-b border-border flex items-center justify-between px-4 md:px-8 shrink-0 z-20 sticky top-0 shadow-sm">
        <div className="flex items-center gap-8">
          <span className="text-2xl font-bold tracking-tight text-primary">Cargex</span>
          <div className="hidden md:flex gap-6">
            <button className="text-sm font-medium text-primary border-b-2 border-primary h-16">Booking</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                userButtonAvatarBox: 'w-9 h-9 ring-2 ring-border',
                userButtonPopoverCard: 'bg-white shadow-xl border border-border rounded-xl',
              }
            }}
          />
        </div>
      </nav>

      <div className="flex-1 flex flex-col-reverse md:flex-row relative overflow-hidden">
        <div className="w-full md:w-[480px] lg:w-[550px] bg-white md:h-[calc(100vh-64px)] overflow-y-auto z-10 shadow-[4px_0_24px_rgba(0,0,0,0.04)] border-r border-border shrink-0 pb-10 md:pb-0 flex flex-col">
          <div className="p-6 border-b border-border bg-white sticky top-0 z-10">
            <div className="flex items-center gap-4 mb-2">
              {step > 1 && <button onClick={() => setStep(step - 1)} className="w-8 h-8 rounded-full bg-surface flex items-center justify-center hover:bg-border transition-colors"><span className="text-primary font-bold">&larr;</span></button>}
              <h1 className="text-2xl font-bold tracking-tight text-primary">
                {step === 1 && "What are you transporting?"}
                {step === 2 && "Select Cargo Details"}
                {step === 3 && "Recommended Vehicles"}
                {step === 4 && "Finalize Booking"}
              </h1>
            </div>
            <div className="flex gap-2 mt-4">{[1,2,3,4].map(s => <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-surfaceHighlight'}`}></div>)}</div>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            {step === 1 && (
              <div className="grid grid-cols-2 gap-4">
                {categories.length === 0 ? <p className="col-span-2 text-muted text-sm text-center py-8">Loading Categories...</p> :
                  categories.map((cat, i) => (
                    <button key={i} onClick={() => handleCategorySelect(cat)} className="p-4 border-2 border-transparent border-b-border bg-white rounded-2xl hover:border-black transition-all text-left shadow-sm flex flex-col gap-3 group">
                      <span className="text-3xl bg-surface w-12 h-12 flex items-center justify-center rounded-xl group-hover:scale-105 transition-transform">{getIconForCategory(cat)}</span>
                      <h3 className="font-bold text-primary tracking-tight">{cat}</h3>
                    </button>
                  ))
                }
              </div>
            )}

            {step === 2 && selectedCategory && (
              <div className="space-y-3">
                <div className="bg-surfaceHighlight border border-border rounded-xl p-4 mb-6 flex items-center gap-4">
                  <span className="text-3xl">{getIconForCategory(selectedCategory)}</span>
                  <div><span className="text-xs text-muted uppercase font-bold tracking-wider">Selected</span><h3 className="font-bold text-primary">{selectedCategory}</h3></div>
                </div>
                <h4 className="font-bold text-lg mb-4">Select specific type</h4>
                {isLoading ? <p className="text-muted text-sm py-4">Loading...</p> : cargoTypes.length === 0 ? <p className="text-muted text-sm py-4">No cargo types found.</p> :
                  cargoTypes.map((cargo) => (
                    <button key={cargo._id} onClick={() => handleCargoSelect(cargo)} className="w-full text-left p-5 border border-border rounded-xl bg-white hover:border-black hover:shadow-sm transition-all flex justify-between items-center">
                      <div><span className="font-bold text-primary block">{cargo.name}</span>{cargo.description && <span className="text-xs text-muted mt-1 block">{cargo.description}</span>}</div>
                      <span className="text-muted">&rarr;</span>
                    </button>
                  ))
                }
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-primary text-white p-4 rounded-xl mb-6 shadow-md">
                  <div><span className="text-[10px] font-bold tracking-wider uppercase opacity-70">AI Matched for</span><h3 className="font-bold text-lg">{selectedCargo?.name}</h3></div>
                  <span className="text-2xl">✨</span>
                </div>
                {isLoading ? <p className="text-muted text-sm py-4">Running Pricing Engine...</p> : recommendations.length === 0 ?
                  <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl"><p className="font-bold">No Vehicles Available</p></div> :
                  recommendations.map((veh) => (
                    <button key={veh.vehicleTypeId} onClick={() => handleVehicleSelect(veh)} className="w-full text-left border-2 rounded-2xl p-4 transition-all border-transparent bg-white hover:border-border border-b-border group">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                          <div className="w-16 h-16 bg-surface rounded-xl flex items-center justify-center border border-border"><span className="text-3xl">🚚</span></div>
                          <div><h3 className="font-bold text-primary text-lg">{veh.name}</h3><div className="flex items-center gap-2 mt-1"><span className="text-xs bg-surface px-2 py-0.5 rounded font-bold">{veh.capacity} kg</span><span className="text-xs text-muted">{veh.category}</span></div></div>
                        </div>
                        <div className="text-right"><p className="font-black text-xl text-primary">₹{veh.estimatedPrice}</p><p className="text-[10px] uppercase font-bold text-muted mt-1">Est. Fare</p></div>
                      </div>
                      {veh.breakdown && (
                        <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-3 gap-2 text-[11px]">
                          <div><span className="text-muted block">Base</span><span className="font-bold">₹{veh.breakdown.baseFare}</span></div>
                          <div><span className="text-muted block">Distance</span><span className="font-bold">₹{veh.breakdown.distanceCost}</span></div>
                          <div><span className="text-muted block">Load</span><span className="font-bold">₹{veh.breakdown.loadCost}</span></div>
                          {veh.breakdown.surgeMultiplier > 1 && <div><span className="text-red-500 block">Surge</span><span className="font-bold text-red-500">×{veh.breakdown.surgeMultiplier}</span></div>}
                          {veh.breakdown.nightSurcharge > 0 && <div><span className="text-amber-500 block">Night</span><span className="font-bold text-amber-500">+₹{veh.breakdown.nightSurcharge}</span></div>}
                        </div>
                      )}
                    </button>
                  ))
                }
              </div>
            )}

            {step === 4 && selectedVehicle && (
              <div className="space-y-6 pb-10">
                <div className="bg-surfaceHighlight border border-border rounded-xl p-4 flex justify-between items-center">
                  <div><span className="text-xs text-muted uppercase font-bold tracking-wider block mb-1">Selected</span><h3 className="font-bold text-primary">{selectedVehicle.name}</h3></div>
                  <p className="font-black text-xl text-primary">₹{selectedVehicle.estimatedPrice}</p>
                </div>

                {/* Transparent Pricing Breakdown */}
                {selectedVehicle.breakdown && (
                  <div className="bg-white border border-border rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-border bg-surface"><h4 className="font-bold text-sm uppercase tracking-wider text-muted">Fare Breakdown</h4></div>
                    <div className="p-4 space-y-2.5 text-sm">
                      <div className="flex justify-between"><span className="text-muted">Base Fare</span><span className="font-bold">₹{selectedVehicle.breakdown.baseFare}</span></div>
                      <div className="flex justify-between"><span className="text-muted">Distance ({tripDistance.toFixed(1)} km)</span><span className="font-bold">₹{selectedVehicle.breakdown.distanceCost}</span></div>
                      <div className="flex justify-between"><span className="text-muted">Load Charge</span><span className="font-bold">₹{selectedVehicle.breakdown.loadCost}</span></div>
                      <div className="flex justify-between"><span className="text-muted">Vehicle Multiplier</span><span className="font-bold">×{selectedVehicle.breakdown.vehicleMultiplier}</span></div>
                      {selectedVehicle.breakdown.surgeMultiplier > 1 && (
                        <div className="flex justify-between text-red-500"><span>Surge Pricing</span><span className="font-bold">×{selectedVehicle.breakdown.surgeMultiplier}</span></div>
                      )}
                      {selectedVehicle.breakdown.nightSurcharge > 0 && (
                        <div className="flex justify-between text-amber-600"><span>Night Surcharge</span><span className="font-bold">+₹{selectedVehicle.breakdown.nightSurcharge}</span></div>
                      )}
                      <div className="border-t border-border pt-2 mt-2 flex justify-between text-base">
                        <span className="font-bold">Total Estimated Fare</span>
                        <span className="font-black text-primary text-lg">₹{selectedVehicle.breakdown.totalFare}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Always show locations selection when step < 4 (so they can pick before they reach step 4/recommendations) */}
            {step < 4 && (
              <div className="mt-8 border-t border-border pt-8">
                <h4 className="font-bold text-lg mb-4">Logistics Details</h4>
                <div className="bg-inputBg rounded-xl p-4 border border-transparent focus-within:border-black transition-colors">
                  <div className="relative pl-8 space-y-4">
                    <div className="absolute left-[11px] top-5 bottom-5 w-0.5 bg-black z-0"></div>
                    
                    <div className="relative z-10 flex items-center">
                      <div className="w-2 h-2 bg-black rounded-full absolute -left-[27px]"></div>
                      {isMapLoaded ? (
                        <Autocomplete
                          onLoad={(a) => setPickupAutocomplete(a)}
                          onPlaceChanged={() => {
                            if (pickupAutocomplete !== null) {
                              const place = pickupAutocomplete.getPlace();
                              if (place.geometry && place.geometry.location) {
                                setPickupAddress(place.formatted_address || place.name || '');
                                setPickupLocation({
                                  lat: place.geometry.location.lat(),
                                  lng: place.geometry.location.lng(),
                                  address: place.formatted_address || place.name || ''
                                });
                              }
                            }
                          }}
                          className="w-full"
                        >
                          <input type="text" placeholder="Pickup location" value={pickupAddress} onChange={e => setPickupAddress(e.target.value)} className="w-full bg-white rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black shadow-sm" />
                        </Autocomplete>
                      ) : (
                        <input type="text" placeholder="Loading Pickup location..." value={pickupAddress} onChange={e => setPickupAddress(e.target.value)} className="w-full bg-white rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black shadow-sm" />
                      )}
                    </div>

                    <div className="relative z-10 flex items-center">
                      <div className="w-2 h-2 bg-black absolute -left-[27px]"></div>
                      {isMapLoaded ? (
                        <Autocomplete
                          onLoad={(a) => setDropoffAutocomplete(a)}
                          onPlaceChanged={() => {
                            if (dropoffAutocomplete !== null) {
                              const place = dropoffAutocomplete.getPlace();
                              if (place.geometry && place.geometry.location) {
                                setDropoffAddress(place.formatted_address || place.name || '');
                                setDropoffLocation({
                                  lat: place.geometry.location.lat(),
                                  lng: place.geometry.location.lng(),
                                  address: place.formatted_address || place.name || ''
                                });
                              }
                            }
                          }}
                          className="w-full"
                        >
                          <input type="text" placeholder="Drop location" value={dropoffAddress} onChange={e => setDropoffAddress(e.target.value)} className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-black rounded-md shadow-sm" />
                        </Autocomplete>
                      ) : (
                        <input type="text" placeholder="Loading Drop location..." value={dropoffAddress} onChange={e => setDropoffAddress(e.target.value)} className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-black rounded-md shadow-sm" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {step === 4 && (
            <div className="p-6 border-t border-border bg-white mt-auto z-20">
              <button className="flex justify-between items-center w-full py-4 px-5 bg-white hover:bg-surface rounded-xl transition-colors border-2 border-border mb-4 shadow-sm" onClick={() => setShowPaymentModal(true)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-6 bg-black text-white text-[10px] font-black flex items-center justify-center rounded uppercase tracking-wider">{paymentMethod === 'Cash' ? 'CASH' : paymentMethod === 'Wallet' ? 'WLLT' : 'UPI'}</div>
                  <span className="font-semibold text-sm">{paymentMethod}</span>
                </div>
                <span className="text-primary font-bold">Change &rarr;</span>
              </button>
              <button onClick={handleConfirmBooking} disabled={isBooking} className="w-full bg-black text-white py-4 text-center rounded-xl font-bold text-lg hover:bg-[#333] transition-transform active:scale-[0.98] shadow-lg disabled:opacity-50">
                {isBooking ? 'Processing...' : 'Confirm Booking'}
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 bg-surfaceHighlight relative h-[35vh] md:h-full flex flex-col items-center justify-center z-0">
          {isMapLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={pickupLocation || DEFAULT_CENTER}
              zoom={13}
              options={mapOptions}
              onLoad={map => setMap(map)}
            >
              {pickupLocation && <Marker position={{ lat: pickupLocation.lat, lng: pickupLocation.lng }} label="A" />}
              {dropoffLocation && <Marker position={{ lat: dropoffLocation.lat, lng: dropoffLocation.lng }} label="B" />}
              {driverLocation && <Marker position={driverLocation} icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/truck.png', scaledSize: new window.google.maps.Size(32, 32) }} />}
              {directionsResponse && (
                <DirectionsRenderer
                  directions={directionsResponse}
                  options={{ suppressMarkers: true, polylineOptions: { strokeColor: '#10B981', strokeWeight: 5 } }}
                />
              )}
            </GoogleMap>
          ) : (
            <>
              <svg className="w-12 h-12 text-muted z-10 mb-2 opacity-50 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
              <span className="text-muted tracking-widest text-xs uppercase font-bold z-10 opacity-50">Loading Map...</span>
            </>
          )}
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end md:items-center justify-center md:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center"><h3 className="text-2xl font-bold">Payment</h3><button onClick={() => setShowPaymentModal(false)} className="w-8 h-8 bg-surface rounded-full flex items-center justify-center hover:bg-border">✕</button></div>
            <div className="p-6 space-y-3">
              {['Cash', 'Wallet', 'UPI'].map(m => (
                <button key={m} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${paymentMethod === m ? 'border-primary bg-surfaceHighlight' : 'border-transparent border-b-border'}`} onClick={() => { setPaymentMethod(m); setShowPaymentModal(false); }}>
                  <span className="text-2xl">{m === 'Cash' ? '💵' : m === 'Wallet' ? '💳' : '📱'}</span>
                  <span className="font-semibold">{m === 'Cash' ? 'Pay at Location' : m === 'Wallet' ? 'Cargex Wallet' : 'UPI'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {bookingSuccess && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-8 text-center">
            {!assignedDriver ? (
              <>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 relative"><div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20"></div><span className="text-2xl animate-spin">⏳</span></div>
                <h3 className="text-2xl font-bold mb-2">Locating Driver...</h3>
                <p className="text-muted text-sm mb-1">Your {selectedVehicle?.name} request is live.</p>
                <p className="text-xs text-muted mb-6">Booking ID: <span className="font-mono font-bold text-primary">{bookingId}</span></p>
                <button onClick={resetBooking} className="w-full bg-surface text-primary py-3 rounded-xl font-bold border border-border hover:bg-border transition-colors">Cancel Request</button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                {rideStatus === 'accepted' && <h3 className="text-xl font-bold mb-1 text-green-600">Driver En Route!</h3>}
                {rideStatus === 'in_progress' && <h3 className="text-xl font-bold mb-1 text-blue-600">Ride In Progress 🚚</h3>}
                {rideStatus === 'completed' && <h3 className="text-xl font-bold mb-1">Delivery Complete! 🎉</h3>}
                <div className="bg-surfaceHighlight border border-border rounded-xl p-4 my-4 text-left flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-full border border-border flex items-center justify-center shadow-sm shrink-0"><span className="text-xl font-bold text-primary">{assignedDriver.fullName?.charAt(0)}</span></div>
                  <div><h4 className="font-bold text-primary">{assignedDriver.fullName}</h4><p className="text-xs font-semibold text-muted">{assignedDriver.vehicleDetails?.numberPlate || 'CARGEX'}</p><p className="text-xs font-semibold text-accent">{assignedDriver.phone}</p></div>
                </div>
                {driverLocation && rideStatus === 'in_progress' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-left">
                    <p className="text-[10px] uppercase font-bold text-blue-600 tracking-wider mb-1">📡 Live GPS</p>
                    <p className="text-xs font-mono text-blue-800">Lat: {driverLocation.lat.toFixed(6)} • Lng: {driverLocation.lng.toFixed(6)}</p>
                  </div>
                )}
                {rideStatus === 'completed' ? (
                  <div className="space-y-3 mt-4">
                    <button onClick={resetBooking} className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-[#333] shadow-md">Book Another</button>
                    <button onClick={() => router.push('/')} className="w-full bg-surface text-primary py-3 rounded-xl font-semibold hover:bg-border">Back to Home</button>
                  </div>
                ) : (
                  <div className="mt-4"><div className="w-full bg-surface text-primary py-3 rounded-xl font-medium text-sm border border-border">{rideStatus === 'in_progress' ? 'Tracking live...' : 'Waiting for driver...'}</div></div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
