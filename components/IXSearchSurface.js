export default function IXSearchSurface({
  searchQuery = "",
  setSearchQuery = () => {},
  filters = {},
  setFilters = () => {},
  sortMode = "custom",
  setSortMode = () => {},
  onClear = null
}) {
  const yearOptions = [
    "",
    ...Array.from({ length: 38 }, (_, i) => String(1990 + i))
  ];

  const hoursOptions = [
    "",
    ...Array.from({ length: 30 }, (_, i) => String(250 + i * 500)),
    "15000"
  ];

  const priceOptions = [
    "",
    ...Array.from({ length: 70 }, (_, i) => String(2500 + i * 5000)),
    "350000"
  ];

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
      hoursMax: ""
    });

    setSortMode("custom");

    if (onClear) onClear();
  }

  return (
  <div className="ix-search-surface">
    <div className="ix-search-primary-row">
      <div className="ix-search-line">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoComplete="off"
          aria-label="Search"
        />
      </div>

      <select className="dash-control dash-category" aria-label="Category">
        <option>CATEGORY</option>
      </select>

      <select className="dash-control dash-make" aria-label="Make">
        <option>MAKE</option>
      </select>

      <select className="dash-control dash-model" aria-label="Model">
        <option>MODEL</option>
      </select>
    </div>

    <div className="ix-search-secondary-row">
      <select
        className="dash-control dash-secondary"
        value={filters.yearMin || ""}
        onChange={(e) => updateFilter("yearMin", e.target.value)}
        aria-label="Year min"
      >
        <option value="">YEAR MIN</option>
        {yearOptions.filter(Boolean).map(value => (
          <option key={`year-min-${value}`} value={value}>
            {value}
          </option>
        ))}
      </select>

      <select
        className="dash-control dash-secondary"
        value={filters.yearMax || ""}
        onChange={(e) => updateFilter("yearMax", e.target.value)}
        aria-label="Year max"
      >
        <option value="">YEAR MAX</option>
        {yearOptions.filter(Boolean).map(value => (
          <option key={`year-max-${value}`} value={value}>
            {value}
          </option>
        ))}
      </select>

      <select
        className="dash-control dash-secondary"
        value={filters.priceMin || ""}
        onChange={(e) => updateFilter("priceMin", e.target.value)}
        aria-label="Price min"
      >
        <option value="">PRICE MIN</option>
        {priceOptions.filter(Boolean).map(value => (
          <option key={`price-min-${value}`} value={value}>
            {value === "350000"
              ? "$350,000+"
              : `$${Number(value).toLocaleString()}`}
          </option>
        ))}
      </select>

      <select
        className="dash-control dash-secondary"
        value={filters.priceMax || ""}
        onChange={(e) => updateFilter("priceMax", e.target.value)}
        aria-label="Price max"
      >
        <option value="">PRICE MAX</option>
        {priceOptions.filter(Boolean).map(value => (
          <option key={`price-max-${value}`} value={value}>
            {value === "350000"
              ? "$350,000+"
              : `$${Number(value).toLocaleString()}`}
          </option>
        ))}
      </select>

      <select
        className="dash-control dash-secondary"
        value={filters.hoursMin || ""}
        onChange={(e) => updateFilter("hoursMin", e.target.value)}
        aria-label="Hours min"
      >
        <option value="">HOURS MIN</option>
        {hoursOptions.filter(Boolean).map(value => (
          <option key={`hours-min-${value}`} value={value}>
            {value === "15000"
              ? "15,000+"
              : `${Number(value).toLocaleString()} hrs`}
          </option>
        ))}
      </select>

      <select
        className="dash-control dash-secondary"
        value={filters.hoursMax || ""}
        onChange={(e) => updateFilter("hoursMax", e.target.value)}
        aria-label="Hours max"
      >
        <option value="">HOURS MAX</option>
        {hoursOptions.filter(Boolean).map(value => (
          <option key={`hours-max-${value}`} value={value}>
            {value === "15000"
              ? "15,000+"
              : `${Number(value).toLocaleString()} hrs`}
          </option>
        ))}
      </select>

      <select
        className="dash-control dash-sort"
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
        className="dash-clear"
        onClick={clearAll}
        aria-label="Clear"
      />
    </div>

    <style jsx>{`
      .ix-search-surface {
        width: 560px;
        max-width: 100%;
        margin: 0 auto;
      }

      .ix-search-primary-row {
        display: grid;
        grid-template-columns: 112px 150px 118px 86px;
        gap: 12px;
        align-items: end;
        margin-bottom: 9px;
      }

      .ix-search-line {
        height: 22px;
      }

      .ix-search-line input {
        width: 100%;
        height: 22px;
        border: none;
        border-bottom: 4px solid rgba(255,255,255,.16);
        background: transparent;
        color: rgba(255,255,255,.84);
        padding: 0;
        font-size: 12px;
        font-weight: 800;
        outline: none;
      }

      .ix-search-line input:focus {
        border-bottom-color: rgba(255,196,0,.62);
        box-shadow: 0 0 8px rgba(255,196,0,.14);
      }

      .ix-search-secondary-row {
        display: grid;
        grid-template-columns:
          66px 66px
          66px 66px
          66px 66px
          42px 42px;
        gap: 7px;
        align-items: end;
      }

      .dash-control {
        height: 22px;
        border: none;
        border-bottom: 4px solid rgba(255,255,255,.18);
        background: transparent;
        color: transparent;
        outline: none;
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        padding: 0;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: .35px;
        text-transform: uppercase;
      }

      .dash-control:hover,
      .dash-control:focus {
        color: rgba(255,255,255,.78);
        border-bottom-color: rgba(255,196,0,.58);
        background: rgba(17,17,17,.96);
        box-shadow: 0 0 8px rgba(255,196,0,.14);
      }

      .dash-category {
        border-bottom-color: rgba(255,255,255,.22);
      }

      .dash-make {
        border-bottom-color: rgba(255,255,255,.19);
      }

      .dash-model {
        border-bottom-color: rgba(255,255,255,.16);
      }

      .dash-secondary {
        border-bottom-color: rgba(255,255,255,.13);
      }

      .dash-sort {
        border-bottom-color: rgba(255,196,0,.24);
      }

      .dash-clear {
        height: 22px;
        border: none;
        background: transparent;
        border-bottom: 4px solid rgba(229,62,62,.72);
        cursor: pointer;
        padding: 0;
      }

      .dash-clear:hover {
        border-bottom-color: rgba(229,62,62,.96);
        box-shadow: 0 0 8px rgba(229,62,62,.18);
      }

      @media (max-width: 760px) {
        .ix-search-surface {
          width: 100%;
        }

        .ix-search-primary-row {
          grid-template-columns: .8fr 1.2fr 1fr .8fr;
          gap: 7px;
        }

        .ix-search-secondary-row {
          grid-template-columns:
            repeat(4, 1fr)
            repeat(4, 1fr);
          gap: 5px;
        }
      }
    `}</style>
  </div>
);









