import React, { useState, useEffect, useRef } from 'react';

const WeatherWidget = ({ compact = false, floating = false }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshInterval = useRef(null);
  const city = "Kigali";

  const fetchWeather = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    
    try {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=-1.9441&longitude=30.0619&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`);
      const data = await response.json();
      setWeather(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Weather fetch failed:", error);
    } finally {
      if (!silent) setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeather();

    // Set up auto-refresh every 30 minutes
    refreshInterval.current = setInterval(() => {
      fetchWeather(true);
    }, 30 * 60 * 1000);

    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, []);

  const getWeatherLabel = (code) => {
    return (
      <span style={{ fontWeight: '900', fontSize: '0.65rem', color: 'var(--rubis-red)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {getWeatherDesc(code)}
      </span>
    );
  };

  const getWeatherDesc = (code) => {
    if (code <= 3) return "Sunny";
    if (code <= 48) return "Cloudy";
    if (code <= 67) return "Drizzle";
    if (code <= 82) return "Rainy";
    if (code <= 99) return "Storm";
    return "Fine";
  };

  if (loading) return null;

  const floatingStyle = floating ? {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    zIndex: 1000,
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
  } : {};

  if (compact) {
    return (
      <div className="glass-panel animate-fade-in" style={{ 
        padding: '0.6rem 1rem', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem',
        borderRadius: '50px',
        ...floatingStyle
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {getWeatherLabel(weather?.current_weather?.weathercode)}
        </div>
        <span style={{ fontWeight: '900', fontSize: '1rem', color: 'var(--text-primary)' }}>
          {Math.round(weather?.current_weather?.temperature)}°C
        </span>
        <div style={{ width: '1px', height: '12px', background: 'var(--border-white)' }} />
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '900', textTransform: 'uppercase' }}>
          KIGALI
        </span>
      </div>
    );
  }

  return (
    <div className="glass-panel animate-fade-in" style={{ 
      padding: '1.25rem', 
      background: 'linear-gradient(135deg, var(--bg-secondary) 0%, rgba(227,10,19,0.03) 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', position: 'relative', zIndex: 1 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span style={{ 
              width: '8px', height: '8px', background: '#10b981', borderRadius: '50%',
              boxShadow: '0 0 8px rgba(16,185,129,0.5)'
            }} className="animate-pulse" />
            <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Live Telemetry
            </span>
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--text-primary)' }}>Kigali Station</h3>
        </div>
        <div style={{ textAlign: 'right' }}>
           <button 
             onClick={() => fetchWeather(true)} 
             style={{ background: 'var(--surface)', border: '1px solid var(--border-white)', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.6rem', fontWeight: '900' }}
             disabled={isRefreshing}
           >
             {isRefreshing ? 'SYNCING...' : 'SYNC'}
           </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--surface)', padding: '0.75rem', borderRadius: '14px', border: '1px solid var(--border-white)', marginBottom: '1rem' }}>
        <div>
          {getWeatherLabel(weather?.current_weather?.weathercode)}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--text-primary)' }}>
              {Math.round(weather?.current_weather?.temperature)}°C
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--rubis-red)' }}>
              {getWeatherDesc(weather?.current_weather?.weathercode)}
            </span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '-2px' }}>
            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={{ background: 'var(--surface)', padding: '0.5rem', borderRadius: '10px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--rubis-red)' }}>WIND: {weather?.current_weather?.windspeed}KM/H</span>
        </div>
        <div style={{ background: 'var(--surface)', padding: '0.5rem', borderRadius: '10px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: '900', color: 'var(--rubis-red)', textTransform: 'uppercase' }}>
            RUBIS SYSTEM
          </span>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
