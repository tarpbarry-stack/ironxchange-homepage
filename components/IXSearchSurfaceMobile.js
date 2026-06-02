import { useState } from "react";

import {
  getV12CategoryNames,
  getV12Makes,
  getV12Models
} from "../lib/v12TaxonomyAdapter";

export default function IXSearchSurfaceMobile({
  searchQuery = "",
  setSearchQuery = () => {},
  filters = {},
  setFilters = () => {},
  sortMode = "custom",
  setSortMode = () => {},
  onClear = null
}) {
  const sortOptions = [
    { value: "custom", label: "SORT" },
    { value: "newest", label: "NEWEST" },
    { value: "price-low", label: "PRICE ↑" },
    { value: "price-high", label: "PRICE ↓" },
    { value: "hours-low", label: "HOURS ↑" },
    { value: "hours-high", label: "HOURS ↓" },
    { value: "year-new", label: "YEAR ↓" },
    { value: "year-old", label: "YEAR ↑" }
  ];

  const categories = [
    "ALL CATEGORIES",
    ...getV12CategoryNames()
  ];

  const selectedCategory =
    filters.category || "ALL CATEGORIES";

  const selectedMake =
    filters.make || "ALL MAKES";

  const selectedModel =
    filters.model || "ALL MODELS";

  const availableMakes =
    selectedCategory === "ALL CATEGORIES"
      ? ["ALL MAKES"]
      : [
          "ALL MAKES",
          ...getV12Makes(selectedCategory)
        ];

  const availableModels =
    selectedMake === "ALL MAKES"
      ? ["ALL MODELS"]
      : [
          "ALL MODELS",
          ...getV12Models(
            selectedCategory,
            selectedMake
          )
        ];

  const [panelLit, setPanelLit] = useState(false);

  function updateFilter(key, value) {
    setFilters({
      ...filters,
      [key]: value
    });
  }

  function clearAll() {
    setSearchQuery("");

    setFilters({
      yearMin: "",
      yearMax: "",
      priceMin: "",
      priceMax: "",
      hoursMin: "",
      hoursMax: "",
      category: "ALL CATEGORIES",
      make: "ALL MAKES",
      model: "ALL MODELS"
    });

    setSortMode("custom");

    if (onClear) onClear();
  }

  return (
    <div className={`ix-mobile-search-surface ${panelLit ? "lit" : ""}`}>
  <div className="mobile-panel-head">
  <span>IXSearchSurface™</span>

  <button
    type="button"
    className="mobile-panel-power"
    onClick={() => setPanelLit(current => !current)}
    aria-label="Toggle search labels"
  />
</div>
      <div className="ix-mobile-search-row">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoComplete="off"
          aria-label="Search"
        />
      </div>

      <div className="ix-mobile-taxonomy-row">
        <select
          className="mobile-dash-control"
          value={selectedCategory}
          onChange={(e) =>
            setFilters({
              ...filters,
              category: e.target.value,
              make: "ALL MAKES",
              model: "ALL MODELS"
            })
          }
          aria-label="Category"
        >
          {categories.map(value => (
            <option key={value} value={value}>
              {value === "ALL CATEGORIES" ? "CATEGORY" : value}
            </option>
          ))}
        </select>

        <select
          className="mobile-dash-control"
          value={selectedMake}
          onChange={(e) =>
            setFilters({
              ...filters,
              make: e.target.value,
              model: "ALL MODELS"
            })
          }
          aria-label="Make"
        >
          {availableMakes.map(value => (
            <option key={value} value={value}>
              {value === "ALL MAKES" ? "MAKE" : value}
            </option>
          ))}
        </select>

        <select
          className="mobile-dash-control"
          value={selectedModel}
          onChange={(e) =>
            setFilters({
              ...filters,
              model: e.target.value
            })
          }
          aria-label="Model"
        >
          {availableModels.map(value => (
            <option key={value} value={value}>
              {value === "ALL MODELS" ? "MODEL" : value}
            </option>
          ))}
        </select>

       <button
  type="button"
  className="mobile-search-dash"
  aria-label="Go"
/>
      </div>

      <div className="ix-mobile-range-row">
        <input
          type="text"
          className="mobile-dash-control mobile-range"
          value={filters.yearMin || ""}
          onChange={(e) => updateFilter("yearMin", e.target.value)}
          placeholder="YEAR MIN"
          aria-label="Year min"
        />

        <input
          type="text"
          className="mobile-dash-control mobile-range"
          value={filters.yearMax || ""}
          onChange={(e) => updateFilter("yearMax", e.target.value)}
          placeholder="YEAR MAX"
          aria-label="Year max"
        />

        <input
          type="text"
          className="mobile-dash-control mobile-range"
          value={filters.priceMin || ""}
          onChange={(e) => updateFilter("priceMin", e.target.value)}
          placeholder="PRICE MIN"
          aria-label="Price min"
        />

        <input
          type="text"
          className="mobile-dash-control mobile-range"
          value={filters.priceMax || ""}
          onChange={(e) => updateFilter("priceMax", e.target.value)}
          placeholder="PRICE MAX"
          aria-label="Price max"
        />

        <input
          type="text"
          className="mobile-dash-control mobile-range"
          value={filters.hoursMin || ""}
          onChange={(e) => updateFilter("hoursMin", e.target.value)}
          placeholder="HOURS MIN"
          aria-label="Hours min"
        />

        <input
          type="text"
          className="mobile-dash-control mobile-range"
          value={filters.hoursMax || ""}
          onChange={(e) => updateFilter("hoursMax", e.target.value)}
          placeholder="HOURS MAX"
          aria-label="Hours max"
        />

        <select
          className="mobile-dash-control mobile-sort"
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value)}
          aria-label="Sort"
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="mobile-clear"
          onClick={clearAll}
          aria-label="Clear"
        />
      </div>

      <style jsx>{`
        .ix-mobile-search-surface {
          width: 100%;
          max-width: 520px;
          margin: 0 auto;
        }

        .mobile-panel-head {
  height: 10px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-bottom: 3px;
}

.mobile-panel-head span {
  opacity: 0;

  color: rgba(255,196,0,.82);

  font-size: 7px;
  font-weight: 950;
  letter-spacing: .65px;

  transition: opacity .14s ease;
}

.ix-mobile-search-surface.lit .mobile-panel-head span {
  opacity: 1;
}

.mobile-panel-power {
  width: 18px;
  height: 4px;

  border: 0;
  border-radius: 2px;

  background: rgba(255,255,255,.18);

  padding: 0;
  cursor: pointer;
}

.ix-mobile-search-surface.lit .mobile-panel-power {
  background: rgba(255,196,0,.95);

  box-shadow:
    0 0 8px rgba(255,196,0,.42);
}

        .ix-mobile-search-row {
          width: 100%;
          margin-bottom: 9px;
        }

        .ix-mobile-search-row input,
        .mobile-dash-control,
        .mobile-clear,
        .mobile-search-submit {
          height: 24px;

          margin: 0;
          padding: 0;

          border: 0;
          border-radius: 0;
          border-bottom: 4px solid rgba(255,255,255,.18);

          background: transparent;
          outline: none;
          box-shadow: none;
        }

        .ix-mobile-search-row input {
          width: 100%;

          color: rgba(255,255,255,.86);

          font-size: 13px;
          font-weight: 850;
        }

          .ix-mobile-taxonomy-row {
  width: 100%;
  display: grid;
  grid-template-columns: 1.45fr 1fr .72fr 18px;
  gap: 7px;
  align-items: end;
  margin-bottom: 9px;
}

        .mobile-dash-control {
          width: 100%;

          color: transparent;

          cursor: pointer;

          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;

          font-size: 8px;
          font-weight: 950;
          letter-spacing: .35px;
          text-transform: uppercase;
        }

        .mobile-dash-control::-ms-expand {
          display: none;
        }

        .mobile-dash-control option {
          color: #111;
          background: #fff;
        }

        .mobile-dash-control:hover,
        .mobile-dash-control:focus,
        .mobile-dash-control:active,
        .ix-mobile-search-row input:focus {
          border-bottom-color: rgba(255,196,0,.58);
          color: rgba(255,255,255,.78);
          box-shadow: 0 3px 8px rgba(255,196,0,.10);
        }

      .mobile-search-dash {
  width: 18px;
  height: 24px;

  border: 0;
  border-bottom: 4px solid rgba(255,196,0,.82);

  background: transparent;

  cursor: pointer;
  padding: 0;

  position: relative;
}

.mobile-search-dash:hover,
.mobile-search-dash:focus {
  border-bottom-color: rgba(255,196,0,1);
  box-shadow: 0 3px 8px rgba(255,196,0,.16);
}

.mobile-search-dash:hover::after,
.mobile-search-dash:focus::after {
  content: "GO";

  position: absolute;
  left: 50%;
  top: -12px;

  transform: translateX(-50%);

  color: rgba(255,196,0,.92);

  font-size: 7px;
  font-weight: 950;
  letter-spacing: .4px;
}

        .mobile-search-submit:hover,
        .mobile-search-submit:focus {
          background: rgba(255,196,0,.95);
          box-shadow: 0 0 10px rgba(255,196,0,.18);
        }

        .ix-mobile-range-row {
          width: 100%;

          display: flex;
          flex-wrap: nowrap;
          gap: 8px;

          overflow-x: auto;
          overflow-y: hidden;

          padding-bottom: 6px;

          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .ix-mobile-range-row::-webkit-scrollbar {
          display: none;
        }

       .mobile-range {
  flex: 0 0 58px;
}

.mobile-range[aria-label="Year min"],
.mobile-range[aria-label="Year max"] {
  flex-basis: 46px;
}

.mobile-range[aria-label="Hours min"],
.mobile-range[aria-label="Hours max"] {
  flex-basis: 54px;
}

.mobile-range[aria-label="Price min"],
.mobile-range[aria-label="Price max"] {
  flex-basis: 68px;
}

.mobile-sort {
  flex: 0 0 64px;
}
        .mobile-clear {
          flex: 0 0 18px;

          cursor: pointer;

          border-bottom-color: rgba(229,62,62,.72);
        }

        .mobile-clear:hover,
        .mobile-clear:focus {
          border-bottom-color: rgba(229,62,62,.96);
          box-shadow: 0 3px 8px rgba(229,62,62,.14);
        }  
        
        .mobile-range::placeholder {
        color: transparent;
        }

        .mobile-range:hover::placeholder,
        .mobile-range:focus::placeholder {
        color: rgba(255,255,255,.42);
        }        
      `}</style>
    </div>
  );
}
