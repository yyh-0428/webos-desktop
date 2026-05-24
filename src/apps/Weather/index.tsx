import { useState, useMemo } from 'react';
import {
  Search, Droplets, Wind, Sun, Eye, Gauge, Thermometer, CloudRain, Cloud, CloudSun, CloudLightning, Snowflake, ChevronDown,
} from 'lucide-react';

interface WeatherData {
  city: string;
  country: string;
  temp: number;
  feelsLike: number;
  condition: string;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  visibility: number;
  pressure: number;
  hourly: { hour: string; temp: number; icon: string }[];
  daily: { day: string; high: number; low: number; icon: string; condition: string }[];
}

const citiesData: Record<string, WeatherData> = {
  'San Francisco': {
    city: 'San Francisco', country: 'US', temp: 18, feelsLike: 16, condition: '多云',
    description: '多云，伴有凉爽的海风', icon: '⛅',
    humidity: 72, windSpeed: 19, uvIndex: 5, visibility: 16, pressure: 1015,
    hourly: [
      { hour: '6am', temp: 14, icon: '🌫' }, { hour: '8am', temp: 15, icon: '⛅' },
      { hour: '10am', temp: 17, icon: '⛅' }, { hour: '12pm', temp: 19, icon: '☀️' },
      { hour: '2pm', temp: 20, icon: '☀️' }, { hour: '4pm', temp: 19, icon: '⛅' },
      { hour: '6pm', temp: 17, icon: '⛅' }, { hour: '8pm', temp: 15, icon: '🌙' },
      { hour: '10pm', temp: 14, icon: '🌙' },
    ],
    daily: [
      { day: '今天', high: 20, low: 13, icon: '⛅', condition: '多云' },
      { day: '周二', high: 22, low: 14, icon: '☀️', condition: '晴' },
      { day: '周三', high: 19, low: 12, icon: '🌥', condition: '阴天' },
      { day: '周四', high: 17, low: 11, icon: '🌧', condition: '雨' },
      { day: '周五', high: 18, low: 12, icon: '⛅', condition: '多云' },
      { day: '周六', high: 21, low: 13, icon: '☀️', condition: '晴' },
      { day: '周日', high: 23, low: 14, icon: '☀️', condition: '晴朗' },
    ],
  },
  'New York': {
    city: 'New York', country: 'US', temp: 28, feelsLike: 31, condition: '晴',
    description: '天气晴朗，气温温暖', icon: '☀️',
    humidity: 45, windSpeed: 12, uvIndex: 8, visibility: 20, pressure: 1018,
    hourly: [
      { hour: '6am', temp: 22, icon: '☀️' }, { hour: '8am', temp: 24, icon: '☀️' },
      { hour: '10am', temp: 27, icon: '☀️' }, { hour: '12pm', temp: 29, icon: '☀️' },
      { hour: '2pm', temp: 31, icon: '☀️' }, { hour: '4pm', temp: 30, icon: '☀️' },
      { hour: '6pm', temp: 28, icon: '⛅' }, { hour: '8pm', temp: 25, icon: '🌙' },
      { hour: '10pm', temp: 23, icon: '🌙' },
    ],
    daily: [
      { day: '今天', high: 31, low: 22, icon: '☀️', condition: '晴' },
      { day: '周二', high: 33, low: 24, icon: '☀️', condition: '炎热' },
      { day: '周三', high: 30, low: 23, icon: '⛈', condition: '雷暴' },
      { day: '周四', high: 26, low: 20, icon: '🌧', condition: '雨' },
      { day: '周五', high: 27, low: 21, icon: '⛅', condition: '多云' },
      { day: '周六', high: 29, low: 22, icon: '☀️', condition: '晴' },
      { day: '周日', high: 30, low: 23, icon: '☀️', condition: '晴朗' },
    ],
  },
  'London': {
    city: 'London', country: 'GB', temp: 14, feelsLike: 12, condition: '雨',
    description: '全天小雨', icon: '🌧',
    humidity: 85, windSpeed: 24, uvIndex: 2, visibility: 8, pressure: 1008,
    hourly: [
      { hour: '6am', temp: 12, icon: '🌧' }, { hour: '8am', temp: 13, icon: '🌧' },
      { hour: '10am', temp: 14, icon: '🌧' }, { hour: '12pm', temp: 15, icon: '🌦' },
      { hour: '2pm', temp: 15, icon: '⛅' }, { hour: '4pm', temp: 14, icon: '🌧' },
      { hour: '6pm', temp: 13, icon: '🌧' }, { hour: '8pm', temp: 12, icon: '🌙' },
      { hour: '10pm', temp: 11, icon: '🌙' },
    ],
    daily: [
      { day: '今天', high: 15, low: 11, icon: '🌧', condition: '雨' },
      { day: '周二', high: 16, low: 12, icon: '🌦', condition: '阵雨' },
      { day: '周三', high: 17, low: 13, icon: '⛅', condition: '多云' },
      { day: '周四', high: 18, low: 13, icon: '☀️', condition: '晴' },
      { day: '周五', high: 16, low: 12, icon: '🌥', condition: '阴天' },
      { day: '周六', high: 15, low: 11, icon: '🌧', condition: '雨' },
      { day: '周日', high: 17, low: 12, icon: '⛅', condition: '多云' },
    ],
  },
  'Tokyo': {
    city: 'Tokyo', country: 'JP', temp: 26, feelsLike: 29, condition: '潮湿',
    description: '温暖潮湿，有零星云层', icon: '🌥',
    humidity: 78, windSpeed: 8, uvIndex: 6, visibility: 14, pressure: 1012,
    hourly: [
      { hour: '6am', temp: 23, icon: '🌥' }, { hour: '8am', temp: 25, icon: '⛅' },
      { hour: '10am', temp: 27, icon: '⛅' }, { hour: '12pm', temp: 28, icon: '☀️' },
      { hour: '2pm', temp: 29, icon: '☀️' }, { hour: '4pm', temp: 28, icon: '⛅' },
      { hour: '6pm', temp: 26, icon: '🌥' }, { hour: '8pm', temp: 24, icon: '🌙' },
      { hour: '10pm', temp: 23, icon: '🌙' },
    ],
    daily: [
      { day: '今天', high: 29, low: 22, icon: '🌥', condition: '潮湿' },
      { day: '周二', high: 30, low: 23, icon: '☀️', condition: '炎热' },
      { day: '周三', high: 28, low: 22, icon: '⛈', condition: '雷暴' },
      { day: '周四', high: 25, low: 20, icon: '🌧', condition: '雨' },
      { day: '周五', high: 27, low: 21, icon: '⛅', condition: '多云' },
      { day: '周六', high: 29, low: 22, icon: '☀️', condition: '晴' },
      { day: '周日', high: 31, low: 24, icon: '☀️', condition: '炎热' },
    ],
  },
  'Sydney': {
    city: 'Sydney', country: 'AU', temp: 15, feelsLike: 13, condition: '晴朗',
    description: '凉爽晴朗的秋夜', icon: '🌙',
    humidity: 55, windSpeed: 14, uvIndex: 3, visibility: 22, pressure: 1022,
    hourly: [
      { hour: '6am', temp: 11, icon: '🌙' }, { hour: '8am', temp: 13, icon: '☀️' },
      { hour: '10am', temp: 16, icon: '☀️' }, { hour: '12pm', temp: 18, icon: '☀️' },
      { hour: '2pm', temp: 19, icon: '☀️' }, { hour: '4pm', temp: 17, icon: '⛅' },
      { hour: '6pm', temp: 15, icon: '⛅' }, { hour: '8pm', temp: 13, icon: '🌙' },
      { hour: '10pm', temp: 12, icon: '🌙' },
    ],
    daily: [
      { day: '今天', high: 19, low: 11, icon: '☀️', condition: '晴朗' },
      { day: '周二', high: 20, low: 12, icon: '☀️', condition: '晴' },
      { day: '周三', high: 18, low: 11, icon: '⛅', condition: '多云' },
      { day: '周四', high: 16, low: 10, icon: '🌧', condition: '雨' },
      { day: '周五', high: 17, low: 10, icon: '⛅', condition: '多云' },
      { day: '周六', high: 19, low: 11, icon: '☀️', condition: '晴' },
      { day: '周日', high: 21, low: 12, icon: '☀️', condition: '晴朗' },
    ],
  },
};

function getGradient(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes('sunny') || c.includes('clear')) return 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)';
  if (c.includes('rain') || c.includes('shower')) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  if (c.includes('cloud') || c.includes('overcast')) return 'linear-gradient(135deg, #89a0ae 0%, #b0bec5 100%)';
  if (c.includes('thunder') || c.includes('storm')) return 'linear-gradient(135deg, #434343 0%, #000000 100%)';
  if (c.includes('snow')) return 'linear-gradient(135deg, #e6e9f0 0%, #eef1f5 100%)';
  if (c.includes('humid') || c.includes('hot')) return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
  return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
}

export default function Weather({ windowId: _windowId }: { windowId: string }) {
  const [activeCity, setActiveCity] = useState('San Francisco');
  const [searchQuery, setSearchQuery] = useState('');
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [showCityPicker, setShowCityPicker] = useState(false);

  const data = citiesData[activeCity];
  const cities = Object.keys(citiesData);

  const filteredCities = useMemo(() => {
    if (!searchQuery) return cities;
    return cities.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [cities, searchQuery]);

  const convertTemp = (celsius: number) => {
    if (unit === 'F') return Math.round(celsius * 9 / 5 + 32);
    return celsius;
  };

  const tempUnit = unit === 'C' ? '°C' : '°F';

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto text-sm" style={{ background: 'var(--bg-workspace)' }}>
      {/* Top section with gradient */}
      <div className="shrink-0 p-6 pb-8" style={{ background: getGradient(data.condition), color: 'white' }}>
        {/* Header with search */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <button
              onClick={() => setShowCityPicker(!showCityPicker)}
              className="flex items-center gap-1.5 text-lg font-semibold"
            >
              {data.city}, {data.country}
              <ChevronDown size={16} />
            </button>

            {/* City picker dropdown */}
            {showCityPicker && (
              <div className="absolute top-full left-0 mt-2 w-56 rounded-xl shadow-xl z-20 overflow-hidden" style={{ background: 'var(--bg-window)' }}>
                <div className="p-2">
                  <div className="flex items-center h-8 rounded-lg px-2.5 gap-2" style={{ background: 'var(--bg-input)' }}>
                    <Search size={13} className="text-[var(--text-muted)] shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="搜索城市..."
                      className="flex-1 bg-transparent outline-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredCities.map(city => (
                    <button
                      key={city}
                      onClick={() => { setActiveCity(city); setShowCityPicker(false); setSearchQuery(''); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                        activeCity === city ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                      }`}
                      style={activeCity === city ? { background: 'var(--bg-hover)' } : {}}
                    >
                      <span className="text-base">{citiesData[city].icon}</span>
                      <span>{city}</span>
                      <span className="ml-auto text-[var(--text-muted)]">{convertTemp(citiesData[city].temp)}{tempUnit}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setUnit(u => u === 'C' ? 'F' : 'C')}
            className="px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          >
            {unit === 'C' ? '°F' : '°C'}
          </button>
        </div>

        {/* Current weather */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-7xl font-light mb-1">{convertTemp(data.temp)}{tempUnit}</div>
            <div className="text-sm opacity-90 mb-0.5">{data.condition}</div>
            <div className="text-xs opacity-70">体感温度 {convertTemp(data.feelsLike)}{tempUnit}</div>
          </div>
          <div className="text-7xl">{data.icon}</div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Weather details */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '湿度', value: `${data.humidity}%`, icon: Droplets },
            { label: '风速', value: `${data.windSpeed} km/h`, icon: Wind },
            { label: '紫外线指数', value: String(data.uvIndex), icon: Sun },
            { label: '能见度', value: `${data.visibility} km`, icon: Eye },
            { label: '气压', value: `${data.pressure} hPa`, icon: Gauge },
            { label: '体感温度', value: `${convertTemp(data.feelsLike)}${tempUnit}`, icon: Thermometer },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex flex-col items-center p-3 rounded-xl" style={{ background: 'var(--bg-window)' }}>
                <Icon size={16} className="text-[var(--accent-silver)] mb-1.5" />
                <span className="text-xs font-medium text-[var(--text-primary)]">{item.value}</span>
                <span className="text-[10px] text-[var(--text-muted)]">{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* Hourly forecast */}
        <div className="rounded-xl p-4" style={{ background: 'var(--bg-window)' }}>
          <h3 className="text-xs font-medium text-[var(--text-primary)] mb-3">逐时预报</h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {data.hourly.map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 min-w-[52px]">
                <span className="text-[11px] text-[var(--text-muted)]">{h.hour}</span>
                <span className="text-xl">{h.icon}</span>
                <span className="text-xs font-medium text-[var(--text-primary)]">{convertTemp(h.temp)}{tempUnit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 7-day forecast */}
        <div className="rounded-xl p-4" style={{ background: 'var(--bg-window)' }}>
          <h3 className="text-xs font-medium text-[var(--text-primary)] mb-3">7天预报</h3>
          <div className="space-y-1">
            {data.daily.map((d, i) => {
              const range = Math.max(...data.daily.map(x => x.high)) - Math.min(...data.daily.map(x => x.low));
              const minLow = Math.min(...data.daily.map(x => x.low));
              const leftPct = ((d.low - minLow) / range) * 100;
              const widthPct = ((d.high - d.low) / range) * 100;

              return (
                <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: i < data.daily.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
                  <span className="w-10 text-xs text-[var(--text-secondary)]">{d.day}</span>
                  <span className="text-lg w-8 text-center">{d.icon}</span>
                  <span className="w-10 text-xs text-[var(--text-muted)] text-right">{convertTemp(d.low)}{tempUnit}</span>
                  <div className="flex-1 h-1.5 rounded-full mx-2 relative" style={{ background: 'var(--bg-input)' }}>
                    <div
                      className="absolute h-full rounded-full"
                      style={{
                        left: `${leftPct}%`,
                        width: `${Math.max(widthPct, 10)}%`,
                        background: 'linear-gradient(90deg, #60a5fa, #f97316)',
                      }}
                    />
                  </div>
                  <span className="w-10 text-xs text-[var(--text-primary)] font-medium">{convertTemp(d.high)}{tempUnit}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
