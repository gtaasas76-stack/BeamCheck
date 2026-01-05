
import React, { useState, useEffect, useCallback } from 'react';
import { AppTab, FuelPrice, GasStation } from './types.ts';
import Navigation from './components/Navigation.tsx';
import FuelCalculator from './components/FuelCalculator.tsx';
import { 
  getFuelPrices, 
  findNearbyGasStations, 
  checkVehicleHealth, 
  getRouteDetails, 
  findNearbyRepairShops,
  reverseGeocode,
  generateAppBranding,
  getTrafficAnalysis
} from './services/geminiService.ts';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, LayersControl, Popup } from 'react-leaflet';
import L from 'leaflet';
import { QRCodeCanvas } from 'qrcode.react';

const EMERGENCY_DATA = [
  { id: 1, province: 'อุบลราชธานี', tel: '0-4535-2600' },
  { id: 2, province: 'กรุงเทพฯ (ตำรวจทางหลวง)', tel: '1193' },
  { id: 3, province: 'กู้ภัยทั่วไทย', tel: '1669' },
  // ... more can be added here
];

const pendingIcon = L.divIcon({
  html: '<div class="text-3xl filter drop-shadow-lg animate-bounce">📍</div>',
  className: 'custom-div-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const gasIcon = L.divIcon({
  html: '<div class="text-2xl filter drop-shadow-lg">⛽</div>',
  className: 'custom-div-icon',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

const repairIcon = L.divIcon({
  html: '<div class="text-2xl filter drop-shadow-lg">🛠️</div>',
  className: 'custom-div-icon',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}

function SplashScreen({ onFinish, image }: { onFinish: () => void, image: string | null }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 3000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[10000] bg-[#030712] flex flex-col items-center justify-center text-white overflow-hidden">
      {image ? (
        <div className="absolute inset-0 animate-in fade-in duration-[1500ms]">
          <img src={image} className="w-full h-full object-cover opacity-50 scale-105" alt="BeamCheck Splash" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/40 via-transparent to-cyan-900/40" />
      )}
      
      <div className="relative z-10 flex flex-col items-center text-center px-8">
        <div className="w-28 h-28 glass rounded-[3rem] flex items-center justify-center mb-8 shadow-2xl relative animate-float">
          <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full"></div>
          <span className="text-5xl">🚗</span>
        </div>
        <h1 className="text-6xl font-[800] tracking-tighter mb-3 italic gradient-text">BeamCheck.</h1>
        <p className="text-slate-400 font-bold tracking-[0.3em] uppercase text-[9px] opacity-80">เทคโนโลยีเพื่อทุกการขับขี่</p>
      </div>
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [splashImage, setSplashImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('beamcheck-theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const [fuelPrices, setFuelPrices] = useState<FuelPrice[]>([]);
  const [stations, setStations] = useState<GasStation[]>([]);
  const [shops, setShops] = useState<GasStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const [healthQuery, setHealthQuery] = useState('');
  const [healthResult, setHealthResult] = useState<any>(null);
  
  const [destination, setDestination] = useState('');
  const [tripInfo, setTripInfo] = useState<{ text: string; links: any[] } | null>(null);
  const [pendingCoords, setPendingCoords] = useState<[number, number] | null>(null);
  const [trafficInfo, setTrafficInfo] = useState<{ text: string; links: any[] } | null>(null);
  const [isTrafficActive, setIsTrafficActive] = useState(false);

  const [emergencySearch, setEmergencySearch] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('dark', 'light');
    html.classList.add(theme);
    localStorage.setItem('beamcheck-theme', theme);
  }, [theme]);

  useEffect(() => {
    const init = async () => {
      const img = await generateAppBranding();
      setSplashImage(img);
    };
    init();
    fetchPrices();
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => setLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        () => setLocation({ lat: 13.7563, lng: 100.5018 })
      );
    }
  }, []);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const data = await getFuelPrices();
      setFuelPrices(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setPendingCoords([lat, lng]);
    setLoading(true);
    try {
      const name = await reverseGeocode(lat, lng);
      setDestination(name.trim());
    } catch (e) { setDestination(`${lat.toFixed(4)}, ${lng.toFixed(4)}`); } finally { setLoading(false); }
  }, []);

  const handleHealthCheck = async () => {
    if (!healthQuery) return;
    setLoading(true);
    try {
      const result = await checkVehicleHealth(healthQuery);
      setHealthResult(result);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleCalculateTrip = async () => {
    if (!location || !destination.trim()) return;
    setLoading(true);
    try {
      const result = await getRouteDetails(location.lat, location.lng, destination);
      setTripInfo(result);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleFindGas = async () => {
    if (!location) return;
    setLoading(true);
    try {
      const result = await findNearbyGasStations(location.lat, location.lng);
      setStations(result.stations);
      setTripInfo({ text: result.text, links: [] });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleFindRepair = async () => {
    if (!location) return;
    setLoading(true);
    try {
      const result = await findNearbyRepairShops(location.lat, location.lng);
      setShops(result.shops);
      setTripInfo({ text: result.text, links: [] });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleGetTraffic = async () => {
    if (!location) return;
    setLoading(true);
    try {
      const result = await getTrafficAnalysis(location.lat, location.lng);
      setTrafficInfo(result);
      setIsTrafficActive(true);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.HOME:
        return (
          <div className="space-y-6 pb-12 animate-in">
            <div className="relative overflow-hidden rounded-[2.5rem] p-8 glass-bright shadow-2xl">
              <h2 className="text-4xl font-black tracking-tighter mb-2 leading-tight">
                พร้อมเดินทาง <br/><span className="gradient-text">ไปกับคุณ</span>
              </h2>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setActiveTab(AppTab.MAP)} className="flex-1 bg-white text-black font-extrabold py-4 rounded-2xl">ค้นหาเส้นทาง</button>
                <button onClick={() => setActiveTab(AppTab.CALC)} className="aspect-square glass flex items-center justify-center rounded-2xl px-5">📈</button>
              </div>
            </div>
            <div className="glass rounded-[2.5rem] p-8">
              <h3 className="font-extrabold text-lg mb-6">ราคาน้ำมันวันนี้</h3>
              <div className="space-y-3">
                {fuelPrices.slice(0, 3).map((f, i) => (
                  <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                    <span className="text-sm font-bold">{f.type}</span>
                    <span className="text-lg font-black">{f.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case AppTab.FUEL:
        return (
          <div className="space-y-6 animate-in pb-12">
            <h2 className="text-4xl font-black italic tracking-tighter px-2">Oil <span className="gradient-text">Prices.</span></h2>
            {fuelPrices.map((f, i) => (
              <div key={i} className="glass p-6 rounded-[2rem] flex justify-between items-center">
                <h3 className="font-extrabold text-slate-300">{f.type}</h3>
                <p className="text-3xl font-black">{f.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        );
      case AppTab.MAP:
        return (
          <div className="space-y-6 animate-in pb-12">
             <div className="h-[450px] relative rounded-[3rem] overflow-hidden shadow-2xl border border-white/10">
                {location && (
                  <MapContainer center={[location.lat, location.lng]} zoom={13} zoomControl={false} className="w-full h-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[location.lat, location.lng]} />
                    {pendingCoords && <Marker position={pendingCoords} icon={pendingIcon} />}
                    {stations.map((s, idx) => (
                      <Marker key={`gas-${idx}`} position={[location.lat, location.lng]} icon={gasIcon}>
                        <Popup><React.Fragment><div className="font-bold">{s.name}</div><p className="text-xs">{s.address}</p></React.Fragment></Popup>
                      </Marker>
                    ))}
                    {shops.map((s, idx) => (
                      <Marker key={`shop-${idx}`} position={[location.lat, location.lng]} icon={repairIcon}>
                        <Popup><React.Fragment><div className="font-bold">{s.name}</div><p className="text-xs">{s.address}</p></React.Fragment></Popup>
                      </Marker>
                    ))}
                    <MapEvents onMapClick={handleMapClick} />
                  </MapContainer>
                )}
                <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-3">
                  <button onClick={handleGetTraffic} className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-xl shadow-xl">🚦</button>
                  <button onClick={handleFindGas} className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-xl shadow-xl">⛽</button>
                  <button onClick={handleFindRepair} className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-xl shadow-xl">🛠️</button>
                </div>
             </div>
             <div className="glass rounded-[2.5rem] p-6">
                <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="วันนี้ไปไหนดี?" className="w-full h-14 bg-white/5 rounded-2xl px-6 font-bold mb-4" />
                <button onClick={handleCalculateTrip} disabled={loading || !destination} className="w-full h-14 bg-white text-black font-black rounded-2xl">วางแผนการเดินทาง</button>
             </div>
             {tripInfo && <div className="glass p-8 rounded-[2.5rem]"><p className="text-lg font-bold">{tripInfo.text}</p></div>}
          </div>
        );
      case AppTab.HEALTH:
        return (
          <div className="space-y-6 animate-in pb-12">
            <h2 className="text-4xl font-black italic tracking-tighter px-2">AI <span className="gradient-text">Doctor.</span></h2>
            <div className="glass rounded-[2.5rem] p-8">
              <textarea value={healthQuery} onChange={(e) => setHealthQuery(e.target.value)} placeholder="ระบุอาการรถ..." className="w-full h-40 bg-white/5 rounded-[2rem] p-6 font-bold mb-6" />
              <button onClick={handleHealthCheck} className="w-full h-14 bg-indigo-600 text-white font-black rounded-2xl">ตรวจสอบ</button>
            </div>
            {healthResult && <div className="glass p-8 rounded-[2.5rem]"><p className="font-bold">{healthResult.analysis}</p></div>}
          </div>
        );
      case AppTab.CALC:
        return <div className="animate-in pb-12"><FuelCalculator /></div>;
      case AppTab.EMERGENCY:
        return (
          <div className="space-y-6 animate-in pb-12">
            <h2 className="text-4xl font-black italic tracking-tighter px-2">เบอร์ <span className="gradient-text">ฉุกเฉิน.</span></h2>
            {EMERGENCY_DATA.map(e => (
              <div key={e.id} className="glass p-5 rounded-2xl flex justify-between items-center">
                <div><h4 className="font-bold">{e.province}</h4><p className="text-xs text-indigo-400">{e.tel}</p></div>
                <a href={`tel:${e.tel}`} className="w-10 h-10 glass rounded-xl flex items-center justify-center">📞</a>
              </div>
            ))}
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-current-bg flex flex-col relative">
      <style>{`.bg-current-bg { background-color: var(--bg); } .leaflet-container { border-radius: 3rem; }`}</style>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} image={splashImage} />}
      {loading && <div className="fixed inset-0 z-[10005] bg-black/40 backdrop-blur-sm flex items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>}
      
      {showSettings && (
        <div className="fixed inset-0 z-[10001] bg-black/60 flex items-center justify-center p-6" onClick={() => setShowSettings(false)}>
          <div className="glass w-full max-w-md p-8 rounded-[3rem]" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-black mb-8">Settings</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-bold">ธีมแอปพลิเคชัน</span>
                <div className="flex gap-2">
                  <button onClick={() => setTheme('light')} className={`p-2 rounded-xl ${theme === 'light' ? 'bg-indigo-600' : 'glass'}`}>☀️</button>
                  <button onClick={() => setTheme('dark')} className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-indigo-600' : 'glass'}`}>🌙</button>
                </div>
              </div>
              <button onClick={() => setShowQR(true)} className="w-full glass p-4 rounded-2xl font-bold">QR Code สำหรับมือถือ</button>
            </div>
          </div>
        </div>
      )}

      {showQR && (
        <div className="fixed inset-0 z-[10002] bg-black/80 flex items-center justify-center p-6" onClick={() => setShowQR(false)}>
          <div className="glass p-10 rounded-[3rem] text-center">
            <QRCodeCanvas value={window.location.href} size={200} />
            <button onClick={() => setShowQR(false)} className="mt-8 bg-white/10 px-6 py-2 rounded-xl text-xs font-bold">ปิด</button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-[1000] glass px-6 py-6 flex justify-between items-center shadow-lg">
        <h1 className="text-2xl font-black italic gradient-text">BeamCheck.</h1>
        <button onClick={() => setShowSettings(true)} className="w-10 h-10 glass rounded-xl flex items-center justify-center">⚙️</button>
      </header>

      <main className="flex-1 px-6 pt-8 overflow-y-auto pb-32">
        {renderContent()}
      </main>

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
