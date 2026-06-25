"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import HideCard from "@/components/HideCard";
import { Hide, CATEGORIES, DIFFICULTY_COLORS } from "@/types";
import { MAPS } from "@/lib/utils";

const DIFFICULTIES = Object.keys(DIFFICULTY_COLORS) as string[];

export default function BrowsePage() {
  const [hides, setHides] = useState<Hide[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [map, setMap] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("votes");
  const [showFilters, setShowFilters] = useState(false);

  const fetchHides = useCallback(async (resetPage = false) => {
    setLoading(true);
    const p = resetPage ? 1 : page;
    if (resetPage) setPage(1);

    const params = new URLSearchParams({ page: String(p), sort });
    if (search) params.set("search", search);
    if (map) params.set("map", map);
    if (difficulty) params.set("difficulty", difficulty);
    if (category) params.set("category", category);

    const res = await fetch(`/api/hides?${params}`);
    const data = await res.json();
    setHides(data.hides ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page, sort, search, map, difficulty, category]);

  useEffect(() => { fetchHides(); }, [fetchHides]);

  const activeFilters = [map, difficulty, category].filter(Boolean).length;
  const totalPages = Math.ceil(total / 12);

  function clearFilters() {
    setMap("");
    setDifficulty("");
    setCategory("");
    setSearch("");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-1">Browse Hides</h1>
        <p className="text-gray-500 text-sm">{total} hides in the database</p>
      </div>

      {/* Search + Filter bar */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search hides..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchHides(true)}
            className="w-full bg-[#131320] border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="relative flex items-center gap-2 bg-[#131320] border border-gray-700 hover:border-green-500/50 rounded-lg px-4 py-2.5 text-sm text-gray-300 transition-colors"
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeFilters > 0 && (
            <span className="bg-green-500 text-black text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </button>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); fetchHides(true); }}
          className="bg-[#131320] border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-green-500/50"
        >
          <option value="votes">Most Votes</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-[#131320] border border-gray-800 rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Map</label>
            <select
              value={map}
              onChange={(e) => setMap(e.target.value)}
              className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
            >
              <option value="">All Maps</option>
              {MAPS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
            >
              <option value="">All Difficulties</option>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="sm:col-span-3 flex justify-between items-center">
            <button
              onClick={() => { fetchHides(true); setShowFilters(false); }}
              className="bg-green-500 hover:bg-green-400 text-black font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
            >
              Apply Filters
            </button>
            {activeFilters > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-gray-400 hover:text-white text-sm transition-colors"
              >
                <X size={14} /> Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeFilters > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {map && <Chip label={`Map: ${map}`} onRemove={() => setMap("")} />}
          {difficulty && <Chip label={`Difficulty: ${difficulty}`} onRemove={() => setDifficulty("")} />}
          {category && <Chip label={`Category: ${category}`} onRemove={() => setCategory("")} />}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#131320] border border-gray-800 rounded-xl aspect-video animate-pulse" />
          ))}
        </div>
      ) : hides.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          No hides found. Try adjusting your filters.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {hides.map((hide) => <HideCard key={hide.id} hide={hide} />)}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 bg-[#131320] border border-gray-700 rounded-lg text-sm disabled:opacity-40 hover:border-green-500/50 transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 bg-[#131320] border border-gray-700 rounded-lg text-sm disabled:opacity-40 hover:border-green-500/50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1.5 bg-green-400/10 text-green-400 border border-green-400/20 px-3 py-1 rounded-full text-xs font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-white transition-colors">
        <X size={12} />
      </button>
    </span>
  );
}
