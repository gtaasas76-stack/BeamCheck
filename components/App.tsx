
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

// ข้อมูลเบอร์ฉุกเฉิน 72 จังหวัด
const EMERGENCY_DATA = [
  { id: 1, province: 'อุบลราชธานี', tel: '0-4535-2600-09' },
  { id: 2, province: 'นครราชสีมา', tel: '0-4242-0250-99' },
  { id: 3, province: 'ขอนแก่น', tel: '0-4324-0250-98' },
  { id: 4, province: 'เชียงใหม่', tel: '0-5392-0750-51' },
  { id: 5, province: 'พิษณุโลก', tel: '0-5523-6400' },
  { id: 6, province: 'นครปฐม', tel: '0-3424-0650' },
  { id: 7, province: 'สุราษฎร์ธานี', tel: '0-7727-7600' },
  { id: 8, province: 'อุดรธานี', tel: '0-4221-5750-99' },
  { id: 9, province: 'ชลบุรี', tel: '0-3893-2600-08' },
  { id: 10, province: 'สงขลา', tel: '0-7431-7301-30' },
  { id: 11, province: 'ปทุมธานี', tel: '0-2598-8191' },
  { id: 12, province: 'พระนครศรีอยุธยา', tel: '0-3524-9750' },
  { id: 13, province: 'ฉะเชิงเทรา', tel: '0-3850-0099' },
  { id: 14, province: 'ศรีสะเกษ', tel: '0-4582-9799' },
  { id: 15, province: 'ร้อยเอ็ด', tel: '0-4361-9799' },
  { id: 16, province: 'เชียงราย', tel: '0-5391-0788' },
  { id: 17, province: 'นครสวรรค์', tel: '0-5621-9099' },
  { id: 18, province: 'นครศรีธรรมราช', tel: '0-7530-4600' },
  { id: 19, province: 'พัทลุง', tel: '0-7460-9977' },
  { id: 20, province: 'กาญจนบุรี', tel: '0-3452-7600-49' },
  { id: 21, province: 'ลำปาง', tel: '0-5423-7090' },
  { id: 22, province: 'ระยอง', tel: '0-3892-8090' },
  { id: 23, province: 'สภ.หัวหิน', tel: '0-3261-8090' },
  { id: 24, province: 'ภูเก็ต', tel: '0-7636-0790' },
  { id: 25, province: 'นราธิวาส', tel: '0-7351-7990' },
  { id: 26, province: 'ราชบุรี', tel: '0-3271-9798' },
  { id: 27, province: 'กาฬสินธุ์', tel: '0-4380-9799' },
  { id: 28, province: 'เพชรบูรณ์', tel: '0-5671-7799' },
  { id: 29, province: 'ปัตตานี', tel: '0-7334-5999' },
  { id: 30, province: 'สระบุรี', tel: '0-3624-0698' },
  { id: 31, province: 'สมุทรสาคร', tel: '0-3441-9780' },
  { id: 32, province: 'สมุทรปราการ', tel: '0-2338-0090' },
  { id: 33, province: 'จันทบุรี', tel: '0-3931-9790' },
  { id: 34, province: 'ยะลา', tel: '0-7322-0890' },
  { id: 35, province: 'ตรัง', tel: '0-7520-1990' },
  { id: 36, province: 'กระบี่', tel: '0-7562-7900' },
  { id: 37, province: 'กำแพงเพชร', tel: '0-5571-8490' },
  { id: 38, province: 'ลำพูน', tel: '0-5356-9790' },
  { id: 39, province: 'บุรีรัมย์', tel: '0-4460-4090' },
  { id: 40, province: 'นครพนม', tel: '0-4253-9790' },
  { id: 41, province: 'นนทบุรี', tel: '02-528-7490' },
  { id: 42, province: 'สุพรรณบุรี', tel: '035-514-000' },
  { id: 43, province: 'ชัยนาท', tel: '056-459-639' },
  { id: 44, province: 'ลพบุรี', tel: '036-418-900' },
  { id: 45, province: 'ชัยภูมิ', tel: '044-815-000' },
  { id: 46, province: 'พิจิตร', tel: '056-609-739' },
  { id: 47, province: 'ตาก', tel: '055-518-000' },
  { id: 48, province: 'สุโขทัย', tel: '055-609-739' },
  { id: 49, province: 'แพร่', tel: '054-539-739' },
  { id: 50, province: 'พะเยา', tel: '054-409-739' },
  { id: 51, province: 'น่าน', tel: '054-683-000' },
  { id: 52, province: 'เลย', tel: '042-808-739' },
  { id: 53, province: 'หนองบัวลำภู', tel: '042-318-739' },
  { id: 54, province: 'หนองคาย', tel: '042-415-000' },
  { id: 55, province: 'สกลนคร', tel: '042-700-739' },
  { id: 56, province: 'มุกดาหาร', tel: '042-629-739' },
  { id: 57, province: 'ยโสธร', tel: '045-709-739' },
  { id: 58, province: 'สุรินทร์', tel: '044-710-739' },
  { id: 59, province: 'สระแก้ว', tel: '037-240-740' },
  { id: 60, province: 'ปราจีนบุรี', tel: '037-239-098' },
  { id: 61, province: 'นครนายก', tel: '037-307-000' },
  { id: 62, province: 'สมุทรสงคราม', tel: '034-719-740' },
  { id: 63, province: 'เพชรบุรี', tel: '032-709-740' },
  { id: 64, province: 'ชุมพร', tel: '077-529-739' },
  { id: 65, province: 'พังงา', tel: '076-401-439' },
  { id: 66, province: 'สตูล', tel: '074-709-739' },
  { id: 67, province: 'ระนอง', tel: '077-819-739' },
  { id: 68, province: 'สิงห์บุรี', tel: '036-509798-99' },
  { id: 69, province: 'อ่างทอง', tel: '035-617098-99' },
  { id: 70, province: 'ตราด', tel: '039-552900-01' },
  { id: 71, province: 'อำนาจเจริญ', tel: '045-519200-01' },
  { id: 72, province: 'มหาสารคาม', tel: '043-719698-99' },
];

const destinationIcon = L.divIcon({
  html: '<div class="text-3xl filter drop-shadow-lg">🏁</div>',
  className: 'custom-div-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

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
    if (image) {
      const timer = setTimeout(onFinish, 3000);
      return () => clearTimeout(timer);
    }
  }, [image, onFinish]);

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
          <span className="text-3xl absolute -bottom-1 -right-1">🏍️</span>
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
      try {
        const img = await generateAppBranding();
        setSplashImage(img);
      } catch (e) {
        setSplashImage("https://images.unsplash.com/photo-1558981403-c5f91cbba527?auto=format&fit=crop&q=80&w=1000");
      }
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
    try {
      setLoading(true);
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
    try {
      setLoading(true);
      const result = await checkVehicleHealth(healthQuery);
      setHealthResult(result);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleCalculateTrip = async () => {
    if (!location || !destination.trim()) return;
    try {
      setLoading(true);
      const result = await getRouteDetails(location.lat, location.lng, destination);
      setTripInfo(result);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleFindGas = async () => {
    if (!location) return;
    try {
      setLoading(true);
      const result = await findNearbyGasStations(location.lat, location.lng);
      setStations(result.stations);
      setTripInfo({ text: result.text, links: [] });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleFindRepair = async () => {
    if (!location) return;
    try {
      setLoading(true);
      const result = await findNearbyRepairShops(location.lat, location.lng);
      setShops(result.shops);
      setTripInfo({ text: result.text, links: [] });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleGetTraffic = async () => {
    if (!location) return;
    try {
      setLoading(true);
      const result = await getTrafficAnalysis(location.lat, location.lng);
      setTrafficInfo(result);
      setIsTrafficActive(true);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const filteredEmergency = EMERGENCY_DATA.filter(e => e.province.includes(emergencySearch));

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.HOME:
        return (
          <div className="space-y-6 pb-12 animate-in">
            <div className="relative overflow-hidden rounded-[2.5rem] p-8 glass-bright shadow-2xl group transition-all duration-500 hover:border-indigo-500/30">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 blur-[60px] rounded-full group-hover:bg-indigo-500/30 transition-all"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">System Online</span>
                </div>
                <h2 className="text-4xl font-black tracking-tighter mb-2 leading-tight">
                  พร้อมเดินทาง <br/><span className="gradient-text">ไปกับคุณ</span>
                </h2>
                <p className="text-slate-400 text-sm font-medium mb-8 max-w-[200px]">ผู้ช่วยอัจฉริยะสำหรับคนรักรถ ดูแลครบทุกการขับขี่</p>
                
                <div className="flex gap-3">
                  <button onClick={() => setActiveTab(AppTab.MAP)} className="flex-1 bg-white text-black font-extrabold py-4 px-6 rounded-2xl text-sm shadow-xl active:scale-95 transition-all">
                    ค้นหาเส้นทาง
                  </button>
                  <button onClick={() => setActiveTab(AppTab.CALC)} className="aspect-square glass flex items-center justify-center rounded-2xl px-5 hover:bg-white/10 transition-all">
                    📈
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div onClick={() => setActiveTab(AppTab.MAP)} className="glass rounded-[2rem] p-6 hover:bg-white/5 cursor-pointer transition-all active:scale-95 group">
                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">🛠️</div>
                <h3 className="font-extrabold">หาร้านซ่อม</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Mechanics</p>
              </div>
              <div onClick={() => setActiveTab(AppTab.ABOUT)} className="glass rounded-[2rem] p-6 hover:bg-white/5 cursor-pointer transition-all active:scale-95 group">
                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">ℹ️</div>
                <h3 className="font-extrabold">เกี่ยวกับเรา</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">About Us</p>
              </div>
            </div>

            <div className="glass rounded-[2.5rem] p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-extrabold text-lg">ราคาน้ำมันวันนี้</h3>
                <span className="text-[10px] font-black text-indigo-400 tracking-widest uppercase">Live View</span>
              </div>
              <div className="space-y-3">
                {fuelPrices.slice(0, 3).map((f, i) => (
                  <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                    <span className="text-sm font-bold text-slate-300">{f.type}</span>
                    <span className="text-lg font-black">{f.price.toFixed(2)} <span className="text-[10px] text-slate-500">บาท</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case AppTab.FUEL:
        return (
          <div className="space-y-6 animate-in pb-12">
            <h2 className="text-4xl font-black italic tracking-tighter mb-8 px-2">Oil <span className="gradient-text">Trends.</span></h2>
            <div className="grid gap-4">
              {fuelPrices.map((f, i) => (
                <div key={i} className="glass p-6 rounded-[2rem] flex justify-between items-center relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                  <div>
                    <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{f.type}</h3>
                    <p className="text-lg font-extrabold">ราคากลางวันนี้</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black leading-none">{f.price.toFixed(2)}</p>
                    <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">บาท / ลิตร</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case AppTab.MAP:
        return (
          <div className="space-y-6 animate-in pb-12">
             <div className="flex justify-between items-end mb-4 px-2">
               <h2 className="text-4xl font-black italic tracking-tighter">Smart <span className="gradient-text">Map.</span></h2>
             </div>

             <div className="h-[450px] relative rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 group">
                {location ? (
                  <MapContainer center={[location.lat, location.lng]} zoom={13} zoomControl={false} className="w-full h-full">
                    <LayersControl position="bottomright">
                      <LayersControl.BaseLayer checked name="ถนน">
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      </LayersControl.BaseLayer>
                      <LayersControl.BaseLayer name="ดาวเทียม">
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                      </LayersControl.BaseLayer>
                    </LayersControl>
                    <MapUpdater center={[location.lat, location.lng]} />
                    <Marker position={[location.lat, location.lng]} />
                    {pendingCoords && <Marker position={pendingCoords} icon={pendingIcon} />}
                    {stations.map((s, idx) => (
                      <Marker key={`gas-${idx}`} position={[location.lat, location.lng]} icon={gasIcon}>
                        <Popup>
                          {/* Wrap multiple elements in a Fragment to avoid JSX confusion */}
                          <React.Fragment>
                            <div className="font-bold">{s.name}</div>
                            <p className="text-xs">{s.address}</p>
                          </React.Fragment>
                        </Popup>
                      </Marker>
                    ))}
                    {shops.map((s, idx) => (
                      <Marker key={`shop-${idx}`} position={[location.lat, location.lng]} icon={repairIcon}>
                        <Popup>
                          {/* Wrap multiple elements in a Fragment to avoid JSX confusion */}
                          <React.Fragment>
                            <div className="font-bold">{s.name}</div>
                            <p className="text-xs">{s.address}</p>
                          </React.Fragment>
                        </Popup>
                      </Marker>
                    ))}
                    <MapEvents onMapClick={handleMapClick} />
                  </MapContainer>
                ) : (
                  <div className="w-full h-full glass flex items-center justify-center text-indigo-400 font-black text-xs uppercase tracking-widest animate-pulse">
                    กำลังหาพิกัด...
                  </div>
                )}
                
                {/* Floating Map Actions */}
                <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-3">
                  <button onClick={handleGetTraffic} className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-xl shadow-xl hover:bg-indigo-600 transition-all active:scale-90" title="รายงานจราจร">🚦</button>
                  <button onClick={handleFindGas} className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-xl shadow-xl hover:bg-indigo-600 transition-all active:scale-90" title="หาปั๊มน้ำมัน">⛽</button>
                  <button onClick={handleFindRepair} className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-xl shadow-xl hover:bg-indigo-600 transition-all active:scale-90" title="หาร้านซ่อม">🛠️</button>
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] glass px-4 py-1.5 rounded-full text-[9px] font-bold text-slate-400 pointer-events-none uppercase tracking-widest">
                  แตะบนแผนที่เพื่อเลือกจุดหมาย
                </div>
             </div>

             <div className="glass rounded-[2.5rem] p-6">
                <input 
                  type="text" value={destination} onChange={(e) => setDestination(e.target.value)}
                  placeholder="วันนี้ไปไหนดี?"
                  className="w-full h-14 pl-6 pr-6 bg-white/5 border border-white/10 rounded-2xl font-bold placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-current mb-4"
                />
                <button 
                  onClick={handleCalculateTrip} disabled={loading || !destination}
                  className="w-full h-14 bg-white text-black font-black rounded-2xl active:scale-95 transition-all disabled:opacity-50 shadow-xl"
                >
                  {loading ? 'กำลังวิเคราะห์...' : 'วางแผนการเดินทาง'}
                </button>
             </div>

             {isTrafficActive && trafficInfo && (
               <div className="p-8 glass rounded-[2.5rem] animate-in slide-in-from-bottom-5 border-rose-500/30">
                 <div className="flex justify-between items-center mb-4">
                    <h4 className="font-black text-sm uppercase tracking-wider text-rose-500">รายงานการจราจรปัจจุบัน</h4>
                    <button onClick={() => setIsTrafficActive(false)} className="text-xs font-bold opacity-50">ปิด x</button>
                 </div>
                 <p className="text-slate-200 text-md font-bold leading-relaxed italic">"{trafficInfo.text}"</p>
                 <div className="mt-4 flex flex-wrap gap-2">
                   {trafficInfo.links.map((l:any, i:number) => l.maps && (
                     <a key={i} href={l.maps.uri} target="_blank" className="text-[10px] font-black text-rose-400 underline uppercase tracking-widest">
                       {l.maps.title}
                     </a>
                   ))}
                 </div>
               </div>
             )}

             {tripInfo && !isTrafficActive && (
               <div className="p-8 glass rounded-[2.5rem] animate-in border-indigo-500/30">
                 <h4 className="font-black text-sm uppercase tracking-wider mb-4">ข้อมูลพิกัด/เส้นทาง</h4>
                 <p className="text-slate-200 text-lg font-bold leading-relaxed mb-6 italic">"{tripInfo.text}"</p>
                 <div className="grid gap-3">
                   {tripInfo.links.filter(l => l.maps).map((l, i) => (
                     <a key={i} href={l.maps.uri} target="_blank" className="flex items-center justify-between bg-indigo-600 p-5 rounded-[1.5rem] text-white font-black text-sm uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/20 group">
                       เปิดใน Google Maps 🚀
                     </a>
                   ))}
                 </div>
               </div>
             )}
          </div>
        );

      case AppTab.HEALTH:
        return (
          <div className="space-y-6 animate-in pb-12">
            <h2 className="text-4xl font-black italic tracking-tighter mb-8 px-2">AI <span className="gradient-text">Doctor.</span></h2>
            <div className="glass rounded-[2.5rem] p-8 border-indigo-500/20 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-[1.5rem] flex items-center justify-center text-3xl animate-pulse">🤖</div>
                <div>
                   <h3 className="font-extrabold">วินิจฉัยอาการเบื้องต้น</h3>
                   <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Neural Analysis Active</p>
                </div>
              </div>
              <textarea 
                value={healthQuery} onChange={(e) => setHealthQuery(e.target.value)}
                placeholder="ระบุอาการ เช่น เบรกเสียงดัง, เครื่องสั่น, มอเตอร์ไซค์สตาร์ทติดยาก..."
                className="w-full h-40 p-6 bg-white/5 border border-white/10 rounded-[2rem] font-bold placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all resize-none mb-6 text-current"
              />
              <button 
                onClick={handleHealthCheck} disabled={loading || !healthQuery}
                className="w-full h-14 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-900/30 active:scale-95 transition-all"
              >
                {loading ? 'กำลังประมวลผล...' : 'เริ่มการตรวจสอบ'}
              </button>
            </div>

            {healthResult && (
              <div className="glass p-8 rounded-[2.5rem] animate-in border-white/10 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-2 h-full ${healthResult.severity === 'สูง' ? 'bg-rose-500' : healthResult.severity === 'กลาง' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                <h3 className="text-lg font-bold mb-6">ผลการวิเคราะห์</h3>
                <p className="text-md font-bold mb-6 leading-snug">{healthResult.analysis}</p>
                <div className="space-y-4 mb-6">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">สาเหตุที่เป็นไปได้</h4>
                  <div className="flex flex-wrap gap-2">
                    {healthResult.possibleCauses.map((c: string, i: number) => (
                      <span key={i} className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs font-bold text-slate-300">{c}</span>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">คำแนะนำเพิ่มเติม</h4>
                  <p className="text-sm font-bold">{healthResult.advice}</p>
                </div>
              </div>
            )}
          </div>
        );

      case AppTab.CALC:
        return (
          <div className="space-y-6 animate-in pb-12">
            <h2 className="text-4xl font-black italic tracking-tighter mb-8 px-2">Smart <span className="gradient-text">Stats.</span></h2>
            <FuelCalculator />
          </div>
        );

      case AppTab.EMERGENCY:
        return (
          <div className="space-y-6 animate-in pb-12">
            <h2 className="text-4xl font-black italic tracking-tighter mb-8 px-2">เบอร์ <span className="gradient-text">ฉุกเฉิน.</span></h2>
            
            <div className="glass p-6 rounded-[2.5rem] border-rose-500/20 mb-6 bg-rose-500/5 shadow-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white text-2xl animate-pulse">👨‍🔧</div>
                <div>
                  <h3 className="font-extrabold text-rose-500">ตำรวจช่าง (โครงการพระราชดำริ)</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">บริการฟรีทั่วไทย *จ่ายแค่ค่าอะไหล่</p>
                </div>
              </div>
              <a href="tel:023546324" className="block w-full bg-rose-500 text-white text-center py-4 rounded-2xl font-black text-lg active:scale-95 transition-all shadow-lg shadow-rose-900/40">
                โทร 02-354-6324
              </a>
              <p className="text-[10px] mt-4 opacity-50 text-center">ใช้เฉพาะกรณีรถเสียระหว่างเดินทาง</p>
            </div>

            <div className="glass rounded-[2rem] p-4 mb-6">
              <input 
                type="text" placeholder="ค้นหาจังหวัด..." value={emergencySearch} onChange={(e) => setEmergencySearch(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 font-bold placeholder:text-slate-600 text-current"
              />
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto px-1">
              {filteredEmergency.map(e => (
                <div key={e.id} className="glass p-5 rounded-2xl flex justify-between items-center group hover:border-indigo-500/50 transition-all">
                  <div>
                    <h4 className="font-bold text-slate-300">{e.province}</h4>
                    <p className="text-[10px] font-black text-indigo-400 mt-1">{e.tel}</p>
                  </div>
                  <a href={`tel:${e.tel.split('-').join('')}`} className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                    📞
                  </a>
                </div>
              ))}
            </div>
          </div>
        );

      case AppTab.ABOUT:
        return (
          <div className="space-y-8 animate-in pb-12">
            <div className="text-center pt-8">
              <div className="w-24 h-24 glass rounded-[2.5rem] mx-auto flex items-center justify-center text-4xl mb-6 shadow-2xl relative">
                 B
                 <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full -z-10"></div>
              </div>
              <h2 className="text-4xl font-black gradient-text italic">BeamCheck.</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Intelligence for Every Ride</p>
            </div>

            <div className="glass p-8 rounded-[3rem] space-y-6 leading-relaxed text-slate-300 shadow-2xl">
              <p className="font-bold">
                BeamCheck คือแอปพลิเคชันที่สร้างขึ้นเพื่อยกระดับการดูแลรักษารถยนต์และรถจักรยานยนต์ของคุณในยุคดิจิทัล ด้วยการผสานพลังของ AI อัจฉริยะ เพื่อช่วยคุณวิเคราะห์ปัญหา ค้นหาพิกัดสำคัญ และวางแผนการเดินทางได้อย่างแม่นยำ
              </p>
              <div className="grid gap-4">
                <div className="flex gap-4">
                  <span className="text-xl">🛡️</span>
                  <p className="text-sm"><b>ความปลอดภัยเป็นหลัก:</b> เชื่อมต่อเบอร์ฉุกเฉินและหน่วยกู้ภัยได้ทันที</p>
                </div>
                <div className="flex gap-4">
                  <span className="text-xl">🤖</span>
                  <p className="text-sm"><b>AI Diagnostic:</b> ตรวจสอบอาการผิดปกติของรถเบื้องต้นได้ง่ายๆ</p>
                </div>
                <div className="flex gap-4">
                  <span className="text-xl">🌍</span>
                  <p className="text-sm"><b>Smart Mapping:</b> ข้อมูลพิกัดปั๊มน้ำมัน ร้านซ่อม และสภาพจราจรแบบ Real-time</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-current-bg flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)] relative">
      <style>{`
        .bg-current-bg { background-color: var(--bg); }
        .text-current { color: var(--text); }
        .leaflet-container { border-radius: 3rem; }
      `}</style>
      
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} image={splashImage} />}
      
      {/* Loading Overlay */}
      {loading && !showSplash && (
        <div className="fixed inset-0 z-[10005] bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
          <div className="glass p-8 rounded-[3rem] flex flex-col items-center gap-4">
             <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Processing AI...</p>
          </div>
        </div>
      )}
      
      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200" onClick={() => setShowQR(false)}>
          <div className="glass p-10 rounded-[3rem] flex flex-col items-center max-w-xs w-full text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-black mb-6 gradient-text italic underline">MOBILE TEST.</h3>
            <div className="bg-white p-6 rounded-[2rem] shadow-2xl mb-6 ring-8 ring-indigo-500/10">
              <QRCodeCanvas value={window.location.href} size={200} level="H" />
            </div>
            <p className="text-[10px] font-black text-slate-400 leading-relaxed mb-8 uppercase tracking-widest">สแกนเพื่อเปิดแอปบนมือถือทันที</p>
            <button onClick={() => setShowQR(false)} className="w-full bg-white/10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">ยกเลิก</button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowSettings(false)}>
          <div className="glass w-full max-w-md p-8 rounded-t-[3rem] sm:rounded-[3rem] animate-in slide-in-from-bottom-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black tracking-tighter italic">Settings <span className="text-indigo-500">.</span></h3>
              <button onClick={() => setShowSettings(false)} className="w-10 h-10 glass rounded-full flex items-center justify-center text-lg">✕</button>
            </div>

            <div className="space-y-4">
              <div className="glass p-6 rounded-[2rem] flex justify-between items-center group transition-all">
                <div>
                  <h4 className="font-extrabold text-sm mb-1">ธีมแอปพลิเคชัน</h4>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">สลับโหมดมืด/สว่าง</p>
                </div>
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                  <button 
                    onClick={() => setTheme('light')}
                    className={`px-4 py-2 rounded-xl text-sm transition-all ${theme === 'light' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
                  >
                    ☀️
                  </button>
                  <button 
                    onClick={() => setTheme('dark')}
                    className={`px-4 py-2 rounded-xl text-sm transition-all ${theme === 'dark' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
                  >
                    🌙
                  </button>
                </div>
              </div>

              <button 
                onClick={() => { setShowQR(true); setShowSettings(false); }}
                className="w-full glass p-6 rounded-[2rem] flex items-center justify-between hover:bg-indigo-600/10 transition-all text-left"
              >
                <div className="flex items-center gap-4">
                   <span className="text-2xl">📱</span>
                   <div>
                    <h4 className="font-extrabold text-sm mb-1">ทดสอบบนมือถือ</h4>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">สร้าง QR Code เพื่อสแกน</p>
                   </div>
                </div>
                <span className="text-slate-400">→</span>
              </button>

              <button 
                onClick={() => { setActiveTab(AppTab.ABOUT); setShowSettings(false); }}
                className="w-full glass p-6 rounded-[2rem] flex items-center justify-between hover:bg-indigo-600/10 transition-all text-left"
              >
                <div className="flex items-center gap-4">
                   <span className="text-2xl">ℹ️</span>
                   <div>
                    <h4 className="font-extrabold text-sm mb-1">เกี่ยวกับเวอร์ชัน</h4>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">BeamCheck v1.0.5</p>
                   </div>
                </div>
                <span className="text-slate-400">→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-[1000] glass px-6 py-6 flex justify-between items-center border-b-0 border-white/5 shadow-lg">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setActiveTab(AppTab.HOME)}>
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black italic shadow-2xl group-hover:rotate-6 transition-all">
            B
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tighter leading-none italic">BeamCheck.</h1>
            <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em] opacity-80">Gen Alpha Edition</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 glass rounded-xl flex items-center justify-center text-lg active:scale-95 transition-all hover:bg-white/10"
            title="Settings"
          >
            ⚙️
          </button>
          <div className="w-10 h-10 rounded-2xl overflow-hidden glass p-0.5 ml-1">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${theme}`} className="w-full h-full object-cover" alt="User" />
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 pt-8 overflow-y-auto pb-32 text-current scroll-smooth">
        {renderContent()}
      </main>

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
