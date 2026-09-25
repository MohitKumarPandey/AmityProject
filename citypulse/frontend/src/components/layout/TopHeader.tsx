import React, { useEffect, useState } from 'react';
import { fetchMapSearch } from '../../api/client';

interface TopHeaderProps {
  onToggleMobileMenu?: () => void;
  apiConnected?: boolean;
  selectedCity?: string;
  onCityChange?: (city: string) => void;
  onSelectLocation?: (location: { name: string; lat: number; lng: number }) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  title?: string;
}

interface SearchResult {
  id?: string;
  place_name?: string;
  display_name?: string;
  name?: string;
  text?: string;
  center?: [number, number];
  latitude?: number;
  longitude?: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onToggleMobileMenu,
  apiConnected = true,
  selectedCity = 'All',
  onCityChange,
  onSelectLocation,
  onRefresh,
  refreshing = false,
  title = 'Civic Intelligence Platform',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // ---------------------------------------------------------
  // Dynamic location search with debounce
  // ---------------------------------------------------------
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setSearchError(null);
      setLoadingSearch(false);
      return;
    }

    const handler = setTimeout(async () => {
      try {
        setLoadingSearch(true);
        setSearchError(null);

        const results = await fetchMapSearch(searchQuery.trim());

        // Make sure API response is actually an array
        const safeResults: SearchResult[] = Array.isArray(results)
          ? results
          : [];

        setSuggestions(safeResults);
        if (safeResults.length === 0) {
          setSearchError('No location found');
        }
      } catch (error) {
        console.error('Map search error:', error);

        setSuggestions([]);
        setSearchError('Search failed');
      } finally {
        setLoadingSearch(false);
      }
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // ---------------------------------------------------------
  // Select location from search results
  // ---------------------------------------------------------
  const handleSelect = (result: SearchResult) => {
    const cityName =
      result.name ||
      result.place_name ||
      result.text ||
      '';

    if (!cityName) {
      return;
    }

    setSearchQuery('');
    setSuggestions([]);
    setSearchError(null);

    const lat = result.latitude ?? (result.center ? result.center[1] : undefined);
    const lng = result.longitude ?? (result.center ? result.center[0] : undefined);

    if (lat !== undefined && lng !== undefined && onSelectLocation) {
      onSelectLocation({ name: cityName, lat, lng });
    }
    onCityChange?.(cityName);
  };

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------
  return (
    <header className="top-header">
      {/* LEFT SIDE */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        {/* Mobile menu */}
        {onToggleMobileMenu && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onToggleMobileMenu}
            aria-label="Toggle Navigation Menu"
            style={{
              padding: '0.4rem 0.6rem',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}

        {/* Title */}
        <h1 className="header-title">
          {title}
        </h1>
      </div>

      {/* RIGHT SIDE */}
      <div className="header-controls">

        {/* Dynamic City / Location Search */}
        {onCityChange && (
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              minWidth: '240px',
            }}
          >
            <input
              type="text"
              placeholder={
                selectedCity && selectedCity !== 'All'
                  ? selectedCity
                  : 'Search city or location...'
              }
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              style={{
                padding: '0.5rem 0.7rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                outline: 'none',
                width: '100%',
              }}
              aria-label="Search city or location"
            />

            {/* Searching indicator */}
            {loadingSearch && (
              <span
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem',
                }}
              >
                Searching...
              </span>
            )}

            {/* Search error */}
            {searchError && (
              <span
                style={{
                  color: 'var(--danger)',
                  fontSize: '0.8rem',
                }}
              >
                {searchError}
              </span>
            )}

            {/* Search suggestions */}
            {suggestions.length > 0 && (
              <ul
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                  listStyle: 'none',
                  margin: '0.25rem 0 0',
                  padding: 0,
                  maxHeight: '220px',
                  overflowY: 'auto',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
                }}
              >
                {suggestions.map((result, index) => {
                  const name =
                    result.place_name ||
                    result.text ||
                    'Unknown location';

                  return (
                    <li
                      key={
                        result.id ||
                        `${name}-${index}`
                      }
                      onClick={() => handleSelect(result)}
                      style={{
                        padding: '0.6rem 0.7rem',
                        cursor: 'pointer',
                        borderBottom:
                          index < suggestions.length - 1
                            ? '1px solid var(--border-color)'
                            : 'none',
                        fontSize: '0.85rem',
                        color: 'var(--text-primary)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          'var(--bg-hover, rgba(0,0,0,0.05))';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          'transparent';
                      }}
                    >
                      {name}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* Refresh button */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.8rem',
              fontSize: '0.85rem',
              opacity: refreshing ? 0.7 : 1,
              cursor: refreshing
                ? 'not-allowed'
                : 'pointer',
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>

            {refreshing
              ? 'Refreshing...'
              : 'Refresh'}
          </button>
        )}

        {/* API Status */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.3rem 0.65rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 600,
            background: apiConnected
              ? 'var(--success-light)'
              : 'var(--danger-light)',
            color: apiConnected
              ? 'var(--success)'
              : 'var(--danger)',
            border: `1px solid ${
              apiConnected
                ? '#A7F3D0'
                : '#FCA5A5'
            }`,
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: apiConnected
                ? 'var(--success)'
                : 'var(--danger)',
            }}
          />

          {apiConnected
            ? 'API Connected'
            : 'Disconnected'}
        </div>
      </div>
    </header>
  );
};