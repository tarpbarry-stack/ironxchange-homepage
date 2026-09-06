

import {
  getListingCategory,
  getListingMake,
  getListingModel,
  getUniqueListingValues,
  taxonomyKey
} from "../lib/listings/marketplaceFilterOptions";
export default function IXSearchSurface({
  searchQuery = "",
  setSearchQuery = () => {},
  filters = {},
  setFilters = () => {},
  sortMode = "custom",
  setSortMode = () => {},
  onClear = null,
  listings = [],
  hasRelationship = false,
  filterErrors = {},
  filterErrorMessage = "",
  searchSurfaceRevealed = false,
  onToggleSearchSurfaceRevealed = () => {}
}) {

  const sortOptions = [
    { value: "custom", label: "SORT" },
    { value: "newest", label: "NEWEST" },
    { value: "price-low", label: "PRICE ↑" },
    { value: "price-high", label: "PRICE ↓" },
    { value: "hours-low", label: "HOURS ↑" },
    { value: "hours-high", label: "HOURS ↓" },
    { value: "year-old", label: "OLDEST" }
  ];

const categories = [
  "ALL CATEGORIES",
  ...getUniqueListingValues(listings, getListingCategory)
];

const selectedCategory =
  filters.category || "ALL CATEGORIES";

const selectedMake =
  filters.make || "ALL MAKES";

const selectedModel =
  filters.model || "ALL MODELS";

const makesInSelectedCategory = getUniqueListingValues(
  listings,
  getListingMake,
  item =>
      selectedCategory === "ALL CATEGORIES" ||
      taxonomyKey(getListingCategory(item)) === taxonomyKey(selectedCategory)
);

const availableMakes =
  selectedCategory === "ALL CATEGORIES"
    ? ["ALL MAKES"]
    : ["ALL MAKES", ...makesInSelectedCategory];

const modelsInSelectedMake = getUniqueListingValues(
  listings,
  getListingModel,
  item =>
      (selectedCategory === "ALL CATEGORIES" ||
        taxonomyKey(getListingCategory(item)) === taxonomyKey(selectedCategory)) &&
      (selectedMake === "ALL MAKES" ||
        taxonomyKey(getListingMake(item)) === taxonomyKey(selectedMake))
);

const availableModels =
  selectedMake === "ALL MAKES"
    ? ["ALL MODELS"]
    : ["ALL MODELS", ...modelsInSelectedMake];
  
  function updateFilter(key, value) {
    setFilters({
      ...filters,
      [key]: value
    });
  }

  function rangeInputProps(field) {
    const error = filterErrors[field] || "";

    return {
      className: `dash-control dash-secondary ${error ? "has-error" : ""}`,
      inputMode: "decimal",
      "aria-invalid": error ? "true" : "false",
      "aria-describedby": error
        ? "marketplace-range-error"
        : undefined
    };
  }

  function clearAll() {
    setSearchQuery("");

    setFilters({
  category: "ALL CATEGORIES",
  categoryKey: "ALL CATEGORIES",
  make: "ALL MAKES",
  makeKey: "ALL MAKES",
  model: "ALL MODELS",
  modelKey: "ALL MODELS",
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
<div
  className={`ix-search-surface ${
    searchSurfaceRevealed ? "lit" : ""
  }`}
>

<div className="desktop-panel-head">
  <span>IXSearchSurface™</span>

  <div className="desktop-panel-actions">

    <button
      type="button"
      className="desktop-panel-power"
      onClick={onToggleSearchSurfaceRevealed}
      aria-label="Toggle search surface"
    />
  </div>
</div>
      
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

 <select
  className="dash-control dash-category"
  value={selectedCategory}
 onChange={(e) =>
  setFilters({
    ...filters,
    category: e.target.value,
    categoryKey: taxonomyKey(e.target.value),
    make: "ALL MAKES",
    makeKey: "ALL MAKES",
    model: "ALL MODELS",
    modelKey: "ALL MODELS"
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
  className="dash-control dash-make"
  value={selectedMake}
 onChange={(e) =>
  setFilters({
    ...filters,
    make: e.target.value,
    makeKey: taxonomyKey(e.target.value),
    model: "ALL MODELS",
    modelKey: "ALL MODELS"
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
  className="dash-control dash-model"
  value={selectedModel}
  onChange={(e) =>
  setFilters({
    ...filters,
    model: e.target.value,
    modelKey: taxonomyKey(e.target.value)
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

</div>
    <div className="ix-search-secondary-row">
     <input
  type="text"
  {...rangeInputProps("yearMin")}
  value={filters.yearMin || ""}
  onChange={(e) => updateFilter("yearMin", e.target.value)}
  placeholder="YEAR MIN"
  aria-label="Year min"
/>

<input
  type="text"
  {...rangeInputProps("yearMax")}
  value={filters.yearMax || ""}
  onChange={(e) => updateFilter("yearMax", e.target.value)}
  placeholder="YEAR MAX"
  aria-label="Year max"
/>

<input
  type="text"
  {...rangeInputProps("priceMin")}
  value={filters.priceMin || ""}
  onChange={(e) => updateFilter("priceMin", e.target.value)}
  placeholder="PRICE MIN"
  aria-label="Price min"
/>

<input
  type="text"
  {...rangeInputProps("priceMax")}
  value={filters.priceMax || ""}
  onChange={(e) => updateFilter("priceMax", e.target.value)}
  placeholder="PRICE MAX"
  aria-label="Price max"
/>

<input
  type="text"
  {...rangeInputProps("hoursMin")}
  value={filters.hoursMin || ""}
  onChange={(e) => updateFilter("hoursMin", e.target.value)}
  placeholder="HOURS MIN"
  aria-label="Hours min"
/>

<input
  type="text"
  {...rangeInputProps("hoursMax")}
  value={filters.hoursMax || ""}
  onChange={(e) => updateFilter("hoursMax", e.target.value)}
  placeholder="HOURS MAX"
  aria-label="Hours max"
/>
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

    {filterErrorMessage ? (
      <div
        id="marketplace-range-error"
        className="marketplace-range-error"
        role="alert"
      >
        {filterErrorMessage}
      </div>
    ) : null}

<style jsx>{`
.ix-search-surface {
  width: 100%;
  max-width: 100%;

  position: relative;
  top: -3px;

  margin: 0 auto;
}

.desktop-panel-head {
  height: 10px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-bottom: 4px;
}

.desktop-panel-head span {
  opacity: 0;

  color: rgba(255,196,0,.82);

  font-size: 7px;
  font-weight: 950;
  letter-spacing: .65px;

  transition: opacity .18s ease;
}

.desktop-panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ix-search-surface.lit .desktop-panel-head span {
  opacity: 1;
}

.desktop-panel-power {
  width: 18px;
  height: 4px;

  border: 0;
  border-radius: 2px;

  background: rgba(255,255,255,.18);

  padding: 0;
  cursor: pointer;
}

.desktop-panel-power,
.ixi-relationship-power {
  position: relative;
}

.desktop-panel-power::before,
.ixi-relationship-power::before {
  content: "";

  position: absolute;
  
  left: -10px;
  right: -10px;
  top: -8px;
  bottom: -8px;
}

.ix-search-surface.lit .desktop-panel-power {
  background: rgba(255,196,0,.95);

  box-shadow:
    0 0 8px rgba(255,196,0,.42);
}

.ix-search-primary-row {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  align-items: end;
  margin-bottom: 8px;
}

.ix-search-secondary-row {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 10px;
  align-items: end;
  margin-bottom: 0;
}

.ix-search-line {
  height: 22px;
  display: flex;
  align-items: end;
}

.ix-search-line input,
.dash-control,
.dash-clear {
  width: 100%;
  height: 22px;

  margin: 0;
  padding: 0;

  border: 0;
  border-radius: 0;
  border-bottom: 4px solid rgba(255,255,255,.18);

  background: transparent;
  background-color: transparent;
  background-image: none;

  outline: none;
  box-shadow: none;
}

.ix-search-line input {
  display: block;

  color: rgba(255,255,255,.84);

  opacity: .18;

  transition:
    opacity .18s ease;
}

.ix-search-surface.lit .ix-search-line input {
  opacity: 1;
}

.dash-control {
  line-height: 22px;

  color: transparent;
transition:
  color .18s ease,
  border-color .18s ease,
  opacity .18s ease;

  cursor: pointer;

  .ix-search-surface.lit .dash-control {
  color: rgba(255,255,255,.68);
}  
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  font-size: 11px;
  font-weight: 800;
  letter-spacing: .35px;
  text-transform: uppercase;
}

.ix-search-surface.lit .dash-control {
  color: rgba(255,255,255,.66);
}

.dash-control::-ms-expand {
  display: none;
}

.dash-control option {
  color: #111;
  background: #fff;
}
.ix-search-line input:focus,
.dash-control:hover,
.dash-control:focus,
.dash-control:active {
  border-bottom-color: rgba(255,196,0,.58);
  color: rgba(255,255,255,.78);
  box-shadow: 0 3px 8px rgba(255,196,0,.10);
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

.dash-secondary.has-error {
  border-bottom-color: rgba(229,62,62,.96);
  color: rgba(255,122,122,.96);
  box-shadow: 0 3px 8px rgba(229,62,62,.14);
}

.marketplace-range-error {
  min-height: 12px;
  padding-top: 4px;
  color: rgba(255,122,122,.96);
  font-size: 9px;
  font-weight: 900;
  letter-spacing: .35px;
  text-align: center;
}

.dash-secondary::placeholder {
  color: transparent;
}

.ix-search-surface.lit .dash-secondary::placeholder {
  color: rgba(255,255,255,.42);
}

.dash-secondary:hover::placeholder,
.dash-secondary:focus::placeholder {
  color: rgba(255,255,255,.42);
}

.dash-sort {
  border-bottom-color: rgba(255,196,0,.24);
}

.dash-clear {
  cursor: pointer;
  border-bottom-color: rgba(229,62,62,.72);
}

.dash-clear:hover,
.dash-clear:focus {
  border-bottom-color: rgba(229,62,62,.96);
  box-shadow: 0 3px 8px rgba(229,62,62,.14);
}

@media (max-width: 760px) {
  .ix-search-surface {
    width: 100%;
  }

  .ix-search-primary-row {
    grid-template-columns: 1fr;
    gap: 7px;
    overflow: hidden;
  }

  .ix-search-line,
  .dash-category,
  .dash-make,
  .dash-model {
    width: 100%;
  }

  .ix-search-secondary-row {
    display: flex;
    flex-wrap: nowrap;
    justify-content: flex-start;

    gap: 8px;

    overflow-x: auto;
    overflow-y: hidden;

    padding-bottom: 6px;

    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .ix-search-secondary-row::-webkit-scrollbar {
    display: none;
  }

  .dash-secondary,
  .dash-sort,
  .dash-clear {
    flex: 0 0 auto;
    min-width: 92px;
  }
}
`}</style>
  </div>
);

}

