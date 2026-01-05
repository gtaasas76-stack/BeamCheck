
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAppBranding = async () => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: "A sleek, modern, and minimalist splash screen for a premium automotive assistant app called 'BeamCheck'. The design must feature BOTH a futuristic car silhouette AND a sleek motorcycle silhouette together. Professional deep blue and glowing cyan palette. 4K quality.",
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "9:16"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (e) {
    console.error("Branding gen failed", e);
  }
  return null;
};

export const checkVehicleHealth = async (symptoms: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `วิเคราะห์อาการผิดปกติของรถยนต์หรือรถมอเตอร์ไซค์ต่อไปนี้และให้คำแนะนำเบื้องต้น: "${symptoms}" ตอบกลับเป็นภาษาไทย ในรูปแบบ JSON ที่ระบุ สาเหตุที่อาจเป็นไปได้, ความรุนแรง (ต่ำ, กลาง, สูง), และแนวทางการแก้ไข`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analysis: { type: Type.STRING },
          possibleCauses: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          severity: { type: Type.STRING, description: "ต่ำ, กลาง หรือ สูง" },
          advice: { type: Type.STRING }
        },
        required: ["analysis", "possibleCauses", "severity", "advice"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const reverseGeocode = async (lat: number, lng: number) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "พิกัดปัจจุบันนี้คือสถานที่ใด? ตอบเป็นชื่อสถานที่สั้นๆ",
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lng
          }
        }
      }
    }
  });
  return response.text;
};

export const findNearbyGasStations = async (lat: number, lng: number) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "ค้นหาปั๊มน้ำมันที่ใกล้ที่สุด",
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lng
          }
        }
      }
    }
  });

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const stations = groundingChunks
    .filter((chunk: any) => chunk.maps)
    .map((chunk: any) => ({
      name: chunk.maps.title,
      uri: chunk.maps.uri,
      address: chunk.maps.address || 'ไม่มีข้อมูลที่อยู่'
    }));

  return {
    text: response.text,
    stations
  };
};

export const findNearbyRepairShops = async (lat: number, lng: number) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "ค้นหาร้านซ่อมรถและศูนย์บริการใกล้เคียง",
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lng
          }
        }
      }
    }
  });

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const shops = groundingChunks
    .filter((chunk: any) => chunk.maps)
    .map((chunk: any) => ({
      name: chunk.maps.title,
      uri: chunk.maps.uri,
      address: chunk.maps.address || 'ไม่มีข้อมูลที่อยู่'
    }));

  return {
    text: response.text,
    shops
  };
};

export const getRouteDetails = async (lat: number, lng: number, destination: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `ช่วยคำนวณระยะทางและเวลาเดินทางโดยประมาณ (ETA) จากตำแหน่งปัจจุบันไปยัง "${destination}" ตอบเป็นภาษาไทย`,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lng
          }
        }
      }
    }
  });

  return {
    text: response.text,
    links: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const getTrafficAnalysis = async (lat: number, lng: number) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "รายงานสภาพการจราจรล่าสุดในบริเวณรอบๆ นี้ สรุปเป็นภาษาไทย",
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lng
          }
        }
      }
    }
  });

  return {
    text: response.text,
    links: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const getFuelPrices = async () => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: 'ขอข้อมูลราคาน้ำมันล่าสุดในประเทศไทย (กรุงเทพฯ) สำหรับ แก๊สโซฮอล์ 95, 91, E20 และ ดีเซล ในรูปแบบ JSON',
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            price: { type: Type.NUMBER }
          },
          required: ["type", "price"]
        }
      }
    }
  });
  return JSON.parse(response.text || '[]');
};
