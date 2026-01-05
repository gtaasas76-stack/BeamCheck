
import React, { useState } from 'react';

const FuelCalculator: React.FC = () => {
  const [distance, setDistance] = useState<string>('');
  const [rate, setRate] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [result, setResult] = useState<{ cost: number; fuel: number } | null>(null);

  const calculate = () => {
    const d = parseFloat(distance);
    const r = parseFloat(rate);
    const p = parseFloat(price);
    if (d > 0 && r > 0 && p > 0) {
      setResult({ cost: (d / r) * p, fuel: d / r });
    }
  };

  return (
    <div className="glass rounded-[2.5rem] p-8 space-y-8">
      <h3 className="font-extrabold text-lg">คำนวณงบประมาณเดินทาง</h3>
      <div className="space-y-6">
        <input type="number" value={distance} onChange={e => setDistance(e.target.value)} placeholder="ระยะทาง (กม.)" className="w-full h-14 bg-white/5 rounded-2xl px-6" />
        <input type="number" value={rate} onChange={e => setRate(e.target.value)} placeholder="อัตราสิ้นเปลือง (กม./ลิตร)" className="w-full h-14 bg-white/5 rounded-2xl px-6" />
        <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="ราคาน้ำมัน (บาท)" className="w-full h-14 bg-white/5 rounded-2xl px-6" />
        <button onClick={calculate} className="w-full h-14 bg-indigo-600 text-white font-black rounded-2xl">คำนวณ</button>
        {result && (
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="glass p-5 rounded-3xl"><p className="text-xs uppercase opacity-50">ค่าใช้จ่าย</p><p className="text-2xl font-black">{Math.round(result.cost)} บาท</p></div>
            <div className="glass p-5 rounded-3xl"><p className="text-xs uppercase opacity-50">ปริมาณน้ำมัน</p><p className="text-2xl font-black">{result.fuel.toFixed(1)} ลิตร</p></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FuelCalculator;
