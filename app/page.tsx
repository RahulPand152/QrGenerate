"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";
import { AIResponseItem } from "./types/ai";
import { QRConfig } from "./types/qr";

export default function Home() {
  const [config, setConfig] = useState<QRConfig>({
    data: "https://nepla.com",
    fgColor: "#000000",
    bgColor: "#ffffff",
    errorCorrectionLevel: "H",
    logo: null,
    logoPadding: 5,
    logoSize: 20,
    qrSize: 1024,
  });

  const [qrUrl, setQrUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [suggestions, setSuggestions] = useState<AIResponseItem[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQR = useCallback(async () => {
    if (!config.data) return;
    setLoading(true);
    try {
      const qrDataUrl = await QRCode.toDataURL(config.data, {
        color: { dark: config.fgColor, light: config.bgColor },
        errorCorrectionLevel: config.errorCorrectionLevel,
        width: config.qrSize,
        margin: 2,
      });

      if (config.logo && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const qrImg = new Image();
        qrImg.src = qrDataUrl;
        await new Promise((res) => (qrImg.onload = res));

        canvas.width = config.qrSize;
        canvas.height = config.qrSize;
        ctx.drawImage(qrImg, 0, 0);

        const logoImg = new Image();
        logoImg.src = URL.createObjectURL(config.logo);
        await new Promise((res) => (logoImg.onload = res));

        const size = (canvas.width * config.logoSize) / 100;
        const x = (canvas.width - size) / 2;
        const y = (canvas.height - size) / 2;
        const padding = (config.logoPadding * config.qrSize) / 1024;

        ctx.fillStyle = config.bgColor;
        ctx.beginPath();
        ctx.roundRect(
          x - padding,
          y - padding,
          size + padding * 2,
          size + padding * 2,
          (8 * config.qrSize) / 1024,
        );
        ctx.fill();
        ctx.drawImage(logoImg, x, y, size, size);

        setQrUrl(canvas.toDataURL("image/png"));
      } else {
        setQrUrl(qrDataUrl);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    generateQR();
  }, [generateQR]);

  const generateText = async (prompt: string): Promise<AIResponseItem[]> => {
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error generating text:", error);
      throw error;
    }
  };
  const downloadQR = () => {
    if (!qrUrl) return;
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = "qr-code.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <i className="fa-solid fa-qrcode text-xl"></i>
            </div>
            <span className="text-xl font-bold tracking-tight">
              R<span className="text-indigo-600">QR</span>
            </span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={downloadQR}
              className="px-4 py-2 bg-indigo-600 text-white rounded-full font-medium shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <i className="fa-solid fa-download"></i>
              Download PNG
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Sidebar Controls */}
        <div className="lg:col-span-4 space-y-5 sm:space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
              Content
            </h2>
            <div className="space-y-4">
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-sm font-medium mb-1.5 text-indigo-600 flex items-center gap-1.5">
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                  AI Smart Prompt
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="e.g. WiFi for guest room"
                    className="flex-1 px-4 py-2 bg-indigo-50/50 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                  <button
                    onClick={async () => {
                      if (!aiInput.trim()) return;
                      setIsAiLoading(true);

                      try {
                        const results = await generateText(aiInput);
                        setSuggestions(results);
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setIsAiLoading(false);
                      }
                    }}
                    disabled={isAiLoading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl 
hover:bg-indigo-700 disabled:opacity-50 
flex items-center justify-center 
min-w-[110px]"
                  >
                    {isAiLoading ? (
                      <span className="text-xs flex items-center gap-2 whitespace-nowrap">
                        <i className="fa-solid fa-spinner animate-spin text-sm"></i>
                        <span>Thinking...</span>
                      </span>
                    ) : (
                      <span className="text-xs flex items-center gap-2 whitespace-nowrap">
                        <span>Generate</span>
                        <i className="fa-solid fa-paper-plane"></i>
                      </span>
                    )}
                  </button>
                </div>
                {suggestions.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() =>
                          setConfig({ ...config, data: s.content })
                        }
                        className="w-full text-left p-3 sm:p-2.5 
bg-slate-50 rounded-lg 
active:scale-[0.98] transition"
                      >
                        <p className="text-xs font-bold text-slate-700">
                          {s.title}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {s.description}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  QR Text or URL
                </label>
                <textarea
                  value={config.data}
                  onChange={(e) =>
                    setConfig({ ...config, data: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none h-24"
                  placeholder="https://yourlink.com"
                />
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
              Export Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-2 text-slate-500 flex justify-between">
                  <span>Resolution</span>
                  <span className="text-indigo-600 font-bold">
                    {config.qrSize}x{config.qrSize} px
                  </span>
                </label>
                <input
                  type="range"
                  min="256"
                  max="4096"
                  step="128"
                  value={config.qrSize}
                  onChange={(e) =>
                    setConfig({ ...config, qrSize: Number(e.target.value) })
                  }
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Small (256)</span>
                  <span>4K (4096)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Error Correction
                </label>
                <select
                  value={config.errorCorrectionLevel}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      errorCorrectionLevel: e.target.value as any,
                    })
                  }
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  <option value="L">Low (7% recovery)</option>
                  <option value="M">Medium (15% recovery)</option>
                  <option value="Q">Quartile (25% recovery)</option>
                  <option value="H">
                    High (30% recovery - Recommended for Logos)
                  </option>
                </select>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
              Style & Logo
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1 text-slate-500">
                    Dots Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.fgColor}
                      onChange={(e) =>
                        setConfig({ ...config, fgColor: e.target.value })
                      }
                      className="w-10 h-10 rounded-lg border-0 cursor-pointer overflow-hidden p-0"
                    />
                    <span className="text-sm font-mono uppercase text-slate-600">
                      {config.fgColor}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-slate-500">
                    Background
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.bgColor}
                      onChange={(e) =>
                        setConfig({ ...config, bgColor: e.target.value })
                      }
                      className="w-10 h-10 rounded-lg border-0 cursor-pointer overflow-hidden p-0"
                    />
                    <span className="text-sm font-mono uppercase text-slate-600">
                      {config.bgColor}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Custom Logo
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        logo: e.target.files?.[0] || null,
                      })
                    }
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/20 transition-all text-slate-500"
                  >
                    <i className="fa-solid fa-image text-indigo-500"></i>
                    <span className="text-sm truncate">
                      {config.logo ? config.logo.name : "Choose image..."}
                    </span>
                    {config.logo && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setConfig({ ...config, logo: null });
                        }}
                        className="ml-auto text-slate-400 hover:text-red-500"
                      >
                        <i className="fa-solid fa-times"></i>
                      </button>
                    )}
                  </label>
                </div>
              </div>

              {config.logo && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-500">
                      Logo Size ({config.logoSize}%)
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="40"
                      value={config.logoSize}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          logoSize: Number(e.target.value),
                        })
                      }
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-500">
                      Padding ({config.logoPadding}px)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={config.logoPadding}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          logoPadding: Number(e.target.value),
                        })
                      }
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className="w-full max-w-2xl bg-white p-8 md:p-12 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center gap-8 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-slate-50 rounded-full blur-3xl opacity-50"></div>

            <div className="text-center relative z-10">
              <h1 className="text-2xl font-bold text-slate-800 mb-2">
                Live Preview
              </h1>
              <p className="text-slate-500 text-sm">
                Real-time rendering ({config.qrSize}x{config.qrSize})
              </p>
            </div>

            <div className="relative group z-10">
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative bg-white p-4 rounded-2xl shadow-inner flex items-center justify-center min-h-[300px] min-w-[300px] md:min-h-[400px] md:min-w-[400px]">
                {loading ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <span className="text-sm font-medium text-slate-400">
                      Rendering...
                    </span>
                  </div>
                ) : qrUrl ? (
                  <img
                    src={qrUrl}
                    alt="Custom QR Code Preview"
                    className="w-full h-full object-contain rounded-lg max-h-[500px]"
                  />
                ) : (
                  <span className="text-slate-300 italic">
                    Enter content to preview
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 w-full z-10">
              <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Dimensions
                  </span>
                  <span className="text-sm font-semibold text-slate-700">
                    {config.qrSize} x {config.qrSize} px
                  </span>
                </div>
                <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Format
                  </span>
                  <span className="text-sm font-semibold text-slate-700">
                    PNG
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-400 text-center flex items-center gap-2">
                <i className="fa-solid fa-circle-check text-green-500"></i>
                Scan with any mobile device to verify
              </div>
            </div>
          </div>

          <div className="mt-8 bg-indigo-900 text-indigo-100 p-6 rounded-2xl w-full max-w-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-xl shrink-0">
              <i className="fa-solid fa-lightbulb"></i>
            </div>
            <div>
              <h3 className="font-bold text-white">Pro Tip: Resolution</h3>
              <p className="text-sm text-indigo-200">
                Higher resolutions (like 2048px or 4096px) are perfect for
                printing on large posters and banners without losing quality.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Hidden canvas for combining image & logo */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
