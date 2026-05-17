import React, { useState } from "react";
import { Upload, Camera, CheckCircle, ArrowRight, MapPin, DollarSign } from "lucide-react";

const BRAND_YELLOW = "#FFC400";

export default function PostFreeMockup() {
  const [category, setCategory] = useState("EXCAVATORS");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");

  import motorGradersTaxonomy from "../lib/motorGradersTaxonomy";
  import wheelLoadersTaxonomy from "../lib/wheelLoadersTaxonomy";
  import dozersTaxonomy from "../lib/dozersTaxonomy";
  import excavatorsTaxonomy from "../lib/excavatorsTaxonomy";

  const taxonomyMap = {
    "MOTOR GRADERS": motorGradersTaxonomy,
    "WHEEL LOADERS": wheelLoadersTaxonomy,
    "DOZERS": dozersTaxonomy,
    "EXCAVATORS": excavatorsTaxonomy
  };

  const taxonomy = taxonomyMap[category] || [];

  const availableMakes = Array.from(
    new Set(taxonomy.map(x => x.make).filter(Boolean))
  );

  const availableModels = Array.from(
    new Set(
      taxonomy
        .filter(x => x.make === make)
        .map(x => x.model)
        .filter(Boolean)
    )
  );

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-[#d6d6d6] font-sans">
      <nav className="h-16 bg-[#050505] border-b border-white/10 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#FFC400] text-black font-black grid place-items-center">X</div>
          <div>
            <div className="text-white font-black tracking-wide">IRONXCHANGE</div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold">Post Free Listing</div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-5 text-xs font-black uppercase tracking-wide">
          <a className="text-zinc-300">Browse</a>
          <a className="text-[#FFC400]">Post Free</a>
          <a className="text-zinc-300">Account</a>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-4 py-5 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        <div>
          <div className="rounded-2xl border border-[#282828] bg-[#151515] p-4 mb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Post equipment free in minutes.</h1>
                <p className="text-sm text-zinc-400 mt-1">No fees. No credit card. No rep required. Build a clean, searchable listing buyers can actually use.</p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs font-black text-green-400 border border-green-700 rounded-full px-3 py-2 bg-green-500/5">
                <CheckCircle size={14} /> FREE LISTING
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#282828] bg-[#151515] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#282828] flex items-center justify-between">
              <h2 className="font-black text-white uppercase text-sm tracking-wide">Machine Details</h2>
              <span className="text-[10px] text-zinc-500 font-black uppercase">Required fields first</span>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="field md:col-span-2">
                <span>Category</span>
                <select
                  value={category}
                  onChange={e => {
                    setCategory(e.target.value);
                    setMake("");
                    setModel("");
                  }}
                >
                  {Object.keys(taxonomyMap).map(cat => (
                    <option key={cat}>{cat}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Year</span>
                <input placeholder="2021" />
              </label>

              <label className="field">
                <span>Make</span>
                <select
                  value={make}
                  onChange={e => {
                    setMake(e.target.value);
                    setModel("");
                  }}
                >
                  <option value="">Select Make</option>
                  {availableMakes.map(m => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Model</span>
                <select
                  value={model}
                  onChange={e => setModel(e.target.value)}
                >
                  <option value="">Select Model</option>
                  {availableModels.map(m => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Hours</span>
                <input placeholder="4987" />
              </label>

              <label className="field">
                <span>Price</span>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input className="pl-8" placeholder="68900" />
                </div>
              </label>

              <label className="field">
                <span>Location</span>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input className="pl-8" placeholder="Amarillo, TX" />
                </div>
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-[#282828] bg-[#151515] mt-4 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#282828] flex items-center justify-between">
              <h2 className="font-black text-white uppercase text-sm tracking-wide">Photos</h2>
              <span className="text-[10px] text-zinc-500 font-black uppercase">Drag / select multiple</span>
            </div>

            <div className="p-4">
              <div className="border border-dashed border-[#3a3a3a] rounded-2xl bg-[#101010] p-6 text-center">
                <Upload className="mx-auto text-[#FFC400] mb-3" size={28} />
                <div className="font-black text-white">Drop photos here or click to upload</div>
                <p className="text-xs text-zinc-500 mt-1">Recommended: front, rear, side, cab, engine, undercarriage, meter, serial plate.</p>
              </div>

              <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mt-3">
                {[1,2,3,4,5,6,7,8].map(i => (
                  <div key={i} className="aspect-square rounded-xl border border-[#282828] bg-[#101010] grid place-items-center text-zinc-600">
                    <Camera size={18} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#282828] bg-[#151515] mt-4 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#282828]">
              <h2 className="font-black text-white uppercase text-sm tracking-wide">Description</h2>
            </div>
            <div className="p-4">
              <textarea className="w-full h-32 bg-[#101010] border border-[#2A2A2A] rounded-xl p-3 text-sm outline-none focus:border-[#FFC400]" placeholder="Straight machine. Tight. No known codes. Aux hydraulics. 42 inch bucket. Ready to work." />
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#282828] bg-[#151515] p-4 sticky top-4">
            <h2 className="text-white font-black uppercase text-sm tracking-wide mb-3">Listing Preview</h2>
            <div className="rounded-xl overflow-hidden border border-[#282828] bg-[#101010]">
              <div className="h-44 bg-gradient-to-br from-zinc-800 to-zinc-950 grid place-items-center text-zinc-500">
                Machine Photo
              </div>
              <div className="p-3">
                <div className="text-white font-black leading-tight">2021 Komatsu PC210LC-11</div>
                <div className="text-[#FFC400] font-black mt-1">$68,900</div>
                <div className="text-xs text-zinc-500 mt-1">4,987 hrs • Amarillo, TX</div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#282828] bg-[#101010] p-3">
              <div className="text-[10px] uppercase font-black text-zinc-500 mb-2">Auto-generated title</div>
              <div className="text-sm text-white font-bold">Year + Make + Model – Hours</div>
            </div>

            <button className="mt-4 w-full bg-[#FFC400] text-black font-black rounded-xl py-3 flex items-center justify-center gap-2">
              POST FREE <ArrowRight size={16} />
            </button>

            <p className="text-[11px] text-zinc-500 mt-3 leading-relaxed">V1 submit will create a Sharetribe listing. IronXchange DB can come later.</p>
          </div>
        </aside>
      </section>

      <style>{`
        .field { display: grid; gap: 6px; }
        .field span { color: #8f8f8f; font-size: 10px; text-transform: uppercase; font-weight: 900; letter-spacing: .45px; }
        .field input, .field select { background: #101010; border: 1px solid #2A2A2A; color: #f2f2f2; border-radius: 12px; padding: 12px; font-size: 14px; outline: none; width: 100%; }
        .field input:focus, .field select:focus { border-color: #FFC400; }
      `}</style>
    </main>
  );
}
