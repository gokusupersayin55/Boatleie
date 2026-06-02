/* ═══════════════════════════════════════════════════
   BLOOMBERG TERMINAL — CORE APPLICATION
   APIs: CoinGecko (crypto), Open Exchange Rates (forex),
         Alpha Vantage (stocks), Yahoo Finance fallback
   ═══════════════════════════════════════════════════ */
'use strict';

// ══════════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════════
const CFG = {
  ALPHA_VANTAGE_KEY: 'demo',           // replace with free key from alphavantage.co
  FINNHUB_KEY:       '',               // optional: free key from finnhub.io
  REFRESH_CRYPTO:    30000,            // 30s
  REFRESH_FOREX:     60000,            // 60s
  REFRESH_STOCKS:    60000,            // 60s
  REFRESH_NEWS:      120000,           // 2min
  REFRESH_ORDERBOOK: 3000,             // 3s
};

// ══════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════
const STATE = {
  activeSymbol:   { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', type: 'crypto' },
  chartType:      'candlestick',
  chartRange:     '1M',
  indicators:     { ma: false, bb: false, rsi: false, macd: false, vol: false },
  activeTab:      'news',
  watchlist:      [],
  portfolio:      [],
  alerts:         [],
  cryptoPrices:   {},
  forexRates:     {},
  cmdHistory:     [],
  cmdHistoryIdx:  -1,
  charts:         {},          // lightweight-charts instances
  miniCharts:     {},          // chart.js instances
  mainSeries:     null,
  subSeries:      null,
  orderbookTimer: null,
  refreshTimers:  [],
  news:           [],
};

// ══════════════════════════════════════════════
// SYMBOL DATABASE (for autocomplete + screener)
// ══════════════════════════════════════════════
const SYMBOLS = [
  // Crypto
  { id:'bitcoin',       symbol:'BTC',   name:'Bitcoin',          type:'crypto', sector:'' },
  { id:'ethereum',      symbol:'ETH',   name:'Ethereum',         type:'crypto', sector:'' },
  { id:'solana',        symbol:'SOL',   name:'Solana',           type:'crypto', sector:'' },
  { id:'binancecoin',   symbol:'BNB',   name:'BNB',              type:'crypto', sector:'' },
  { id:'ripple',        symbol:'XRP',   name:'XRP',              type:'crypto', sector:'' },
  { id:'cardano',       symbol:'ADA',   name:'Cardano',          type:'crypto', sector:'' },
  { id:'dogecoin',      symbol:'DOGE',  name:'Dogecoin',         type:'crypto', sector:'' },
  { id:'avalanche-2',   symbol:'AVAX',  name:'Avalanche',        type:'crypto', sector:'' },
  { id:'polkadot',      symbol:'DOT',   name:'Polkadot',         type:'crypto', sector:'' },
  { id:'chainlink',     symbol:'LINK',  name:'Chainlink',        type:'crypto', sector:'' },
  { id:'uniswap',       symbol:'UNI',   name:'Uniswap',          type:'crypto', sector:'' },
  { id:'litecoin',      symbol:'LTC',   name:'Litecoin',         type:'crypto', sector:'' },
  // Stocks (simulated data)
  { id:'AAPL',  symbol:'AAPL',  name:'Apple Inc.',               type:'stock', sector:'Technology' },
  { id:'MSFT',  symbol:'MSFT',  name:'Microsoft Corp.',          type:'stock', sector:'Technology' },
  { id:'GOOGL', symbol:'GOOGL', name:'Alphabet Inc.',            type:'stock', sector:'Technology' },
  { id:'AMZN',  symbol:'AMZN',  name:'Amazon.com Inc.',          type:'stock', sector:'Consumer Disc.' },
  { id:'TSLA',  symbol:'TSLA',  name:'Tesla Inc.',               type:'stock', sector:'Consumer Disc.' },
  { id:'NVDA',  symbol:'NVDA',  name:'NVIDIA Corp.',             type:'stock', sector:'Technology' },
  { id:'META',  symbol:'META',  name:'Meta Platforms',           type:'stock', sector:'Technology' },
  { id:'NFLX',  symbol:'NFLX',  name:'Netflix Inc.',             type:'stock', sector:'Technology' },
  { id:'JPM',   symbol:'JPM',   name:'JPMorgan Chase',           type:'stock', sector:'Financials' },
  { id:'BAC',   symbol:'BAC',   name:'Bank of America',          type:'stock', sector:'Financials' },
  { id:'GS',    symbol:'GS',    name:'Goldman Sachs',            type:'stock', sector:'Financials' },
  { id:'JNJ',   symbol:'JNJ',   name:'Johnson & Johnson',        type:'stock', sector:'Health Care' },
  { id:'PFE',   symbol:'PFE',   name:'Pfizer Inc.',              type:'stock', sector:'Health Care' },
  { id:'XOM',   symbol:'XOM',   name:'ExxonMobil Corp.',         type:'stock', sector:'Energy' },
  { id:'CVX',   symbol:'CVX',   name:'Chevron Corp.',            type:'stock', sector:'Energy' },
  { id:'WMT',   symbol:'WMT',   name:'Walmart Inc.',             type:'stock', sector:'Consumer Staples' },
  { id:'KO',    symbol:'KO',    name:'Coca-Cola Co.',            type:'stock', sector:'Consumer Staples' },
  { id:'DIS',   symbol:'DIS',   name:'Walt Disney Co.',          type:'stock', sector:'Communication' },
  { id:'PYPL',  symbol:'PYPL',  name:'PayPal Holdings',          type:'stock', sector:'Financials' },
  { id:'AMD',   symbol:'AMD',   name:'Advanced Micro Devices',   type:'stock', sector:'Technology' },
  { id:'INTC',  symbol:'INTC',  name:'Intel Corp.',              type:'stock', sector:'Technology' },
  { id:'BABA',  symbol:'BABA',  name:'Alibaba Group',            type:'stock', sector:'Technology' },
  { id:'V',     symbol:'V',     name:'Visa Inc.',                type:'stock', sector:'Financials' },
  { id:'MA',    symbol:'MA',    name:'Mastercard Inc.',          type:'stock', sector:'Financials' },
  { id:'ADBE',  symbol:'ADBE',  name:'Adobe Inc.',               type:'stock', sector:'Technology' },
  { id:'CRM',   symbol:'CRM',   name:'Salesforce Inc.',          type:'stock', sector:'Technology' },
  { id:'ORCL',  symbol:'ORCL',  name:'Oracle Corp.',             type:'stock', sector:'Technology' },
];

// Default watchlist
const DEFAULT_WATCHLIST = ['BTC','ETH','AAPL','MSFT','NVDA','TSLA','GOOGL','SOL'];

// Indices (simulated)
const INDICES_DATA = [
  { sym:'SPX',  name:'S&P 500',      base:5280,  vol:0.008 },
  { sym:'NDX',  name:'NASDAQ 100',   base:18500, vol:0.010 },
  { sym:'DJI',  name:'DOW JONES',    base:39100, vol:0.006 },
  { sym:'VIX',  name:'VIX',          base:18.5,  vol:0.04  },
  { sym:'RUT',  name:'RUSSELL 2000', base:2050,  vol:0.012 },
  { sym:'FTSE', name:'FTSE 100',     base:8200,  vol:0.007 },
  { sym:'DAX',  name:'DAX',          base:18400, vol:0.008 },
  { sym:'N225', name:'NIKKEI 225',   base:38800, vol:0.009 },
];

// Commodities (simulated)
const COMMODITIES_DATA = [
  { sym:'GOLD', name:'Gold',           base:2340, vol:0.005 },
  { sym:'SLVR', name:'Silver',         base:29.5, vol:0.010 },
  { sym:'WTI',  name:'Crude Oil WTI',  base:82.0, vol:0.012 },
  { sym:'BRENT',name:'Brent Crude',    base:86.5, vol:0.012 },
  { sym:'NATG', name:'Natural Gas',    base:2.45, vol:0.025 },
  { sym:'COPR', name:'Copper',         base:4.35, vol:0.010 },
  { sym:'WHET', name:'Wheat',          base:545,  vol:0.015 },
];

// Sector data
const SECTORS = [
  { name:'Technology',      base: 2.1  },
  { name:'Financials',      base: 0.8  },
  { name:'Health Care',     base:-0.4  },
  { name:'Energy',          base: 1.5  },
  { name:'Consumer Disc.',  base:-0.6  },
  { name:'Consumer Stpl.',  base: 0.3  },
  { name:'Industrials',     base: 1.1  },
  { name:'Materials',       base: 0.7  },
  { name:'Real Estate',     base:-1.2  },
  { name:'Utilities',       base:-0.3  },
  { name:'Communication',   base: 1.8  },
];

// Stock base prices
const STOCK_PRICES = {
  AAPL:213, MSFT:420, GOOGL:175, AMZN:195, TSLA:248, NVDA:885, META:508,
  NFLX:640, JPM:198, BAC:38, GS:455, JNJ:152, PFE:27, XOM:115, CVX:157,
  WMT:65, KO:62, DIS:105, PYPL:62, AMD:178, INTC:31, BABA:82, V:280,
  MA:470, ADBE:475, CRM:280, ORCL:125,
};

// ══════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => [...ctx.querySelectorAll(sel)];

function fmt(n, decimals=2) {
  if (n == null || isNaN(n)) return '--';
  if (Math.abs(n) >= 1e12) return (n/1e12).toFixed(2) + 'T';
  if (Math.abs(n) >= 1e9)  return (n/1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6)  return (n/1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3)  return n.toLocaleString('en-US', {minimumFractionDigits:decimals, maximumFractionDigits:decimals});
  return n.toFixed(decimals);
}
function fmtPrice(n) {
  if (n == null || isNaN(n)) return '--';
  if (n >= 1000) return '$' + n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  if (n >= 1)    return '$' + n.toFixed(2);
  if (n >= 0.01) return '$' + n.toFixed(4);
  return '$' + n.toFixed(8);
}
function fmtPct(n) {
  if (n == null || isNaN(n)) return '--';
  const sign = n >= 0 ? '+' : '';
  return sign + n.toFixed(2) + '%';
}
function colorClass(n) { return n >= 0 ? 'up' : 'down'; }
function arrow(n) { return n >= 0 ? '▲' : '▼'; }

function toast(msg, type='info') {
  let c = document.getElementById('toast-container');
  if (!c) { c = document.createElement('div'); c.id = 'toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 350); }, 3000);
}

function flashCell(el, dir) {
  el.classList.remove('flash-up','flash-down');
  void el.offsetWidth;
  el.classList.add(dir === 'up' ? 'flash-up' : 'flash-down');
}

// Seeded random for consistent simulated prices
function seededRng(seed) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// Generate OHLCV candles using GBM
function generateOHLCV(startPrice, numBars, volatility=0.02, trend=0.0001, interval='1D') {
  const bars = [];
  let price = startPrice;
  const now = Date.now();
  const intervalMs = { '1D':86400000,'1H':3600000,'15m':900000,'5m':300000,'1m':60000 }[interval] || 86400000;

  for (let i = numBars; i >= 0; i--) {
    const t = Math.floor((now - i * intervalMs) / 1000);
    const open = price;
    const move = (Math.random() - 0.5) * 2 * volatility + trend;
    const close = open * (1 + move);
    const high  = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
    const low   = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
    const vol   = startPrice * (500000 + Math.random() * 1000000);
    bars.push({ time: t, open: +open.toFixed(8), high: +high.toFixed(8), low: +low.toFixed(8), close: +close.toFixed(8), value: +vol.toFixed(0) });
    price = close;
  }
  return bars;
}

// Calculate Moving Average
function calcMA(bars, period) {
  return bars.map((b, i) => {
    if (i < period - 1) return { time: b.time, value: null };
    const avg = bars.slice(i - period + 1, i + 1).reduce((a, x) => a + x.close, 0) / period;
    return { time: b.time, value: +avg.toFixed(4) };
  }).filter(x => x.value !== null);
}

// Calculate Bollinger Bands
function calcBB(bars, period=20, mult=2) {
  const upper = [], mid = [], lower = [];
  for (let i = period - 1; i < bars.length; i++) {
    const slice = bars.slice(i - period + 1, i + 1).map(b => b.close);
    const avg = slice.reduce((a,b) => a+b, 0) / period;
    const std = Math.sqrt(slice.reduce((a,b) => a + (b-avg)**2, 0) / period);
    upper.push({ time: bars[i].time, value: +(avg + mult * std).toFixed(4) });
    mid.push({ time: bars[i].time, value: +avg.toFixed(4) });
    lower.push({ time: bars[i].time, value: +(avg - mult * std).toFixed(4) });
  }
  return { upper, mid, lower };
}

// Calculate RSI
function calcRSI(bars, period=14) {
  const result = [];
  let gains = 0, losses = 0;
  for (let i = 1; i < bars.length; i++) {
    const delta = bars[i].close - bars[i-1].close;
    if (i <= period) {
      gains  += Math.max(0, delta);
      losses += Math.max(0, -delta);
      if (i === period) {
        const rs = gains / (losses || 1);
        result.push({ time: bars[i].time, value: +(100 - 100/(1+rs)).toFixed(2) });
      }
    } else {
      gains  = (gains  * (period-1) + Math.max(0, delta)) / period;
      losses = (losses * (period-1) + Math.max(0, -delta)) / period;
      const rs = gains / (losses || 1);
      result.push({ time: bars[i].time, value: +(100 - 100/(1+rs)).toFixed(2) });
    }
  }
  return result;
}

// ══════════════════════════════════════════════
// API LAYER
// ══════════════════════════════════════════════
const API = {
  // CoinGecko — no API key, no CORS issues
  async getCryptoPrices(ids) {
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;
      const r = await fetch(url);
      if (!r.ok) throw new Error('CoinGecko error');
      return await r.json();
    } catch (e) {
      console.warn('CoinGecko prices failed:', e.message);
      return null;
    }
  },

  async getCryptoChart(id, days=30) {
    try {
      const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error('CoinGecko chart error');
      const d = await r.json();
      // Convert to OHLCV format
      const prices = d.prices;
      const vols   = d.total_volumes;
      if (!prices || prices.length < 2) throw new Error('No data');
      // Build candles from hourly/daily prices
      const bars = [];
      for (let i = 0; i < prices.length; i++) {
        const t = Math.floor(prices[i][0] / 1000);
        const c = prices[i][1];
        const v = vols[i] ? vols[i][1] : 0;
        const prev = i > 0 ? prices[i-1][1] : c;
        const spread = Math.abs(c - prev) * 0.5;
        bars.push({
          time:  t,
          open:  prev,
          close: c,
          high:  Math.max(prev, c) + spread * Math.random(),
          low:   Math.min(prev, c) - spread * Math.random(),
          value: v,
        });
      }
      return bars;
    } catch (e) {
      console.warn('CoinGecko chart failed:', e.message);
      return null;
    }
  },

  async getCryptoMarkets(limit=20) {
    try {
      const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=true&price_change_percentage=1h%2C24h%2C7d`;
      const r = await fetch(url);
      if (!r.ok) throw new Error('CoinGecko markets error');
      return await r.json();
    } catch (e) {
      console.warn('CoinGecko markets failed:', e.message);
      return null;
    }
  },

  // Open Exchange Rates — no API key needed
  async getForexRates() {
    try {
      const r = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!r.ok) throw new Error('Forex error');
      const d = await r.json();
      return d.rates || {};
    } catch (e) {
      console.warn('Forex fetch failed:', e.message);
      return null;
    }
  },

  // Yahoo Finance unofficial (CORS may block in some browsers)
  async getYahooQuote(symbol) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=3mo`;
      const r = await fetch(url, { mode: 'cors' });
      if (!r.ok) throw new Error('Yahoo error');
      const d = await r.json();
      return d?.chart?.result?.[0] || null;
    } catch (e) {
      return null;
    }
  },

  // World Bank API — economic indicators
  async getWorldBankIndicator(country, indicator) {
    try {
      const url = `https://api.worldbank.org/v2/country/${country}/indicator/${indicator}?format=json&mrv=5`;
      const r = await fetch(url);
      if (!r.ok) throw new Error('WorldBank error');
      const d = await r.json();
      return d[1] || [];
    } catch (e) {
      return [];
    }
  },

  // REST Countries
  async getCountryData(code) {
    try {
      const r = await fetch(`https://restcountries.com/v3.1/alpha/${code}`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      return d[0] || null;
    } catch (e) { return null; }
  },
};

// ══════════════════════════════════════════════
// CHART MANAGER
// ══════════════════════════════════════════════
const ChartMgr = {
  chart: null,
  mainSeries: null,
  ma20: null, ma50: null, ma200: null,
  bbUpper: null, bbLower: null, bbMid: null,
  volSeries: null,
  subChart: null,
  rsiSeries: null,
  macdSeries: null,
  macdSignal: null,
  macdHist: null,

  init() {
    const container = document.getElementById('main-chart');
    this.chart = LightweightCharts.createChart(container, {
      layout: {
        background: { color: '#060a0f' },
        textColor:  '#8b9bb4',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize:   11,
      },
      grid: {
        vertLines:   { color: '#111827', style: 1 },
        horzLines:   { color: '#111827', style: 1 },
      },
      crosshair: {
        mode: LightweightCharts.CrosshairMode.Normal,
        vertLine: { color: '#e8a200', width: 1, style: 1 },
        horzLine: { color: '#e8a200', width: 1, style: 1 },
      },
      rightPriceScale: {
        borderColor: '#1c2333',
        textColor:   '#8b9bb4',
      },
      timeScale: {
        borderColor: '#1c2333',
        textColor:   '#8b9bb4',
        timeVisible: true,
      },
      watermark: {
        visible: true,
        text: 'BLOOMBERG TERMINAL',
        color: 'rgba(232,162,0,0.04)',
        fontSize: 42,
        fontFamily: "'JetBrains Mono', monospace",
        fontStyle: 'bold',
        horzAlign: 'center',
        vertAlign: 'center',
      },
    });

    // Resize observer
    new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) this.chart.resize(w, h);
    }).observe(container);

    this.createMainSeries('candlestick');
  },

  createMainSeries(type) {
    if (this.mainSeries) {
      try { this.chart.removeSeries(this.mainSeries); } catch(e){}
      this.mainSeries = null;
    }
    const upColor   = '#00d95f';
    const downColor = '#ff4757';

    switch (type) {
      case 'candlestick':
        this.mainSeries = this.chart.addCandlestickSeries({
          upColor, downColor, borderUpColor: upColor, borderDownColor: downColor,
          wickUpColor: upColor, wickDownColor: downColor,
        }); break;
      case 'bar':
        this.mainSeries = this.chart.addBarSeries({ upColor, downColor }); break;
      case 'line':
        this.mainSeries = this.chart.addLineSeries({ color: '#00d4ff', lineWidth: 2 }); break;
      case 'area':
        this.mainSeries = this.chart.addAreaSeries({
          lineColor: '#00d4ff', topColor: 'rgba(0,212,255,0.25)', bottomColor: 'rgba(0,212,255,0.02)', lineWidth: 2,
        }); break;
      default:
        this.mainSeries = this.chart.addCandlestickSeries({ upColor, downColor });
    }
  },

  loadBars(bars, chartType='candlestick') {
    this.createMainSeries(chartType);
    const sorted = [...bars].sort((a, b) => a.time - b.time);

    if (chartType === 'line' || chartType === 'area') {
      this.mainSeries.setData(sorted.map(b => ({ time: b.time, value: b.close })));
    } else {
      this.mainSeries.setData(sorted.map(b => ({
        time: b.time, open: b.open, high: b.high, low: b.low, close: b.close
      })));
    }

    // Redraw indicators
    this.refreshIndicators(sorted);
    this.chart.timeScale().fitContent();

    // Update stats row
    if (sorted.length) {
      const last = sorted[sorted.length - 1];
      const prev = sorted[sorted.length - 2] || last;
      const chg     = last.close - prev.close;
      const chgPct  = (chg / prev.close) * 100;
      const high52  = Math.max(...sorted.map(b => b.high));
      const low52   = Math.min(...sorted.map(b => b.low));
      const avgVol  = sorted.reduce((a,b) => a + (b.value||0), 0) / sorted.length;

      $('#stat-open').textContent  = fmtPrice(last.open);
      $('#stat-high').textContent  = fmtPrice(last.high);
      $('#stat-low').textContent   = fmtPrice(last.low);
      $('#stat-close').textContent = fmtPrice(last.close);
      $('#stat-vol').textContent   = fmt(last.value || 0, 0);
      $('#stat-52h').textContent   = fmtPrice(high52);
      $('#stat-52l').textContent   = fmtPrice(low52);
      $('#stat-avgvol').textContent = fmt(avgVol, 0);

      const cp = $('#chart-price');
      const cc = $('#chart-change');
      cp.textContent = fmtPrice(last.close);
      cc.textContent = `${arrow(chg)} ${fmtPct(chgPct)} (${fmtPrice(Math.abs(chg))})`;
      cp.className = chg >= 0 ? 'price-up' : 'price-down';
      cc.className = chg >= 0 ? 'price-up' : 'price-down';
    }
  },

  refreshIndicators(bars) {
    // Clear existing
    [this.ma20, this.ma50, this.ma200, this.bbUpper, this.bbMid, this.bbLower].forEach(s => {
      if (s) try { this.chart.removeSeries(s); } catch(e) {}
    });
    this.ma20 = this.ma50 = this.ma200 = null;
    this.bbUpper = this.bbMid = this.bbLower = null;

    const ind = STATE.indicators;

    if (ind.ma && bars.length >= 20) {
      this.ma20 = this.chart.addLineSeries({ color: '#f97316', lineWidth: 1, lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false });
      this.ma20.setData(calcMA(bars, 20));
      if (bars.length >= 50) {
        this.ma50 = this.chart.addLineSeries({ color: '#a855f7', lineWidth: 1, lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false });
        this.ma50.setData(calcMA(bars, 50));
      }
      if (bars.length >= 200) {
        this.ma200 = this.chart.addLineSeries({ color: '#3b82f6', lineWidth: 1, lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false });
        this.ma200.setData(calcMA(bars, 200));
      }
    }

    if (ind.bb && bars.length >= 20) {
      const bb = calcBB(bars);
      this.bbUpper = this.chart.addLineSeries({ color: 'rgba(0,212,255,0.6)', lineWidth: 1, lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false });
      this.bbUpper.setData(bb.upper);
      this.bbMid   = this.chart.addLineSeries({ color: 'rgba(0,212,255,0.3)', lineWidth: 1, lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false });
      this.bbMid.setData(bb.mid);
      this.bbLower = this.chart.addLineSeries({ color: 'rgba(0,212,255,0.6)', lineWidth: 1, lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false });
      this.bbLower.setData(bb.lower);
    }
  },

  showSubChart(type, bars) {
    const sub = document.getElementById('sub-chart');
    if (!type || !bars.length) { sub.classList.add('hidden'); return; }
    sub.classList.remove('hidden');

    if (this.subChart) {
      try { this.subChart.chart.remove(); } catch(e){}
      this.subChart = null;
    }

    const subC = LightweightCharts.createChart(sub, {
      layout: { background: { color: '#060a0f' }, textColor: '#8b9bb4', fontFamily: "'JetBrains Mono', monospace", fontSize: 10 },
      grid: { vertLines: { color: '#0d1117' }, horzLines: { color: '#0d1117' } },
      rightPriceScale: { borderColor: '#1c2333', textColor: '#8b9bb4', scaleMargins: { top: 0.1, bottom: 0.1 } },
      timeScale: { borderColor: '#1c2333', textColor: '#8b9bb4', timeVisible: true },
      crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
    });
    new ResizeObserver(() => subC.resize(sub.clientWidth, sub.clientHeight)).observe(sub);

    let series;
    if (type === 'rsi') {
      series = subC.addLineSeries({ color: '#f97316', lineWidth: 1, priceLineVisible: false });
      const rsiData = calcRSI(bars);
      series.setData(rsiData);
      // Overbought/Oversold lines
      const ob = subC.addLineSeries({ color: 'rgba(255,71,87,0.4)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      const os = subC.addLineSeries({ color: 'rgba(0,217,95,0.4)',  lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      if (rsiData.length) {
        const t0 = rsiData[0].time, t1 = rsiData[rsiData.length-1].time;
        ob.setData([{time:t0,value:70},{time:t1,value:70}]);
        os.setData([{time:t0,value:30},{time:t1,value:30}]);
      }
    } else if (type === 'vol') {
      series = subC.addHistogramSeries({
        color: '#3b82f6',
        priceFormat: { type: 'volume' },
        priceScaleId: 'vol',
      });
      series.setData(bars.map(b => ({
        time: b.time,
        value: b.value || 0,
        color: b.close >= b.open ? 'rgba(0,217,95,0.5)' : 'rgba(255,71,87,0.5)',
      })));
    } else if (type === 'macd') {
      const ema = (arr, p) => {
        const k = 2/(p+1), res = [];
        let e = arr[0];
        for (const v of arr) { e = v * k + e * (1-k); res.push(e); }
        return res;
      };
      const closes = bars.map(b => b.close);
      const ema12  = ema(closes, 12);
      const ema26  = ema(closes, 26);
      const macdLine = ema12.map((v,i) => v - ema26[i]);
      const signal   = ema(macdLine, 9);
      const hist     = macdLine.map((v,i) => v - signal[i]);

      const ms = subC.addLineSeries({ color: '#00d4ff', lineWidth: 1, priceLineVisible: false });
      const sg = subC.addLineSeries({ color: '#f97316', lineWidth: 1, priceLineVisible: false });
      const hs = subC.addHistogramSeries({ color: '#3b82f6', priceLineVisible: false });

      ms.setData(bars.map((b,i) => ({ time: b.time, value: macdLine[i] })));
      sg.setData(bars.map((b,i) => ({ time: b.time, value: signal[i] })));
      hs.setData(bars.map((b,i) => ({ time: b.time, value: hist[i], color: hist[i] >= 0 ? 'rgba(0,217,95,0.5)' : 'rgba(255,71,87,0.5)' })));
    }

    subC.timeScale().fitContent();
    this.subChart = { chart: subC, series };
  },
};

// ══════════════════════════════════════════════
// TICKER TAPE
// ══════════════════════════════════════════════
const Ticker = {
  items: [],

  async init() {
    await this.refresh();
    setInterval(() => this.refresh(), CFG.REFRESH_CRYPTO);
  },

  async refresh() {
    const ids = SYMBOLS.filter(s => s.type === 'crypto').slice(0, 12).map(s => s.id);
    const data = await API.getCryptoPrices(ids);
    if (!data) { this.renderFallback(); return; }

    this.items = SYMBOLS.filter(s => s.type === 'crypto').slice(0, 12).map(s => {
      const d = data[s.id] || {};
      return {
        symbol: s.symbol,
        price:  d.usd || 0,
        chg:    d.usd_24h_change || 0,
      };
    });

    // Add some index data (simulated)
    INDICES_DATA.slice(0, 4).forEach(idx => {
      this.items.push({ symbol: idx.sym, price: idx.base * (1 + (Math.random()-0.5)*0.01), chg: (Math.random()-0.5)*2 });
    });

    this.render();
  },

  renderFallback() {
    this.items = INDICES_DATA.map(i => ({ symbol: i.sym, price: i.base, chg: (Math.random()-0.5)*2 }));
    this.render();
  },

  render() {
    const tape = document.getElementById('ticker-tape');
    const makeHTML = (items) => items.map(item => `
      <span class="ticker-item" data-sym="${item.symbol}">
        <span class="ticker-sym">${item.symbol}</span>
        <span class="ticker-price">${fmtPrice(item.price)}</span>
        <span class="ticker-chg ${item.chg >= 0 ? 'up' : 'down'}">${arrow(item.chg)} ${Math.abs(item.chg).toFixed(2)}%</span>
      </span>
    `).join('');
    // Duplicate for seamless loop
    tape.innerHTML = makeHTML(this.items) + makeHTML(this.items);
    tape.querySelectorAll('.ticker-item').forEach(el => {
      el.addEventListener('click', () => loadSymbol(el.dataset.sym));
    });
  },
};

// ══════════════════════════════════════════════
// WATCHLIST
// ══════════════════════════════════════════════
const Watchlist = {
  async init() {
    STATE.watchlist = JSON.parse(localStorage.getItem('bbg_watchlist') || 'null') || [...DEFAULT_WATCHLIST];
    await this.render();
  },

  async render() {
    const body = document.getElementById('watchlist-body');
    body.innerHTML = '';

    for (const sym of STATE.watchlist) {
      const info = SYMBOLS.find(s => s.symbol === sym) || { symbol: sym, name: sym, type: 'stock' };
      let price = 0, chg = 0;

      if (info.type === 'crypto') {
        const d = STATE.cryptoPrices[info.id];
        if (d) { price = d.usd; chg = d.usd_24h_change || 0; }
      } else {
        const base = STOCK_PRICES[sym] || 100;
        price = base * (1 + (Math.sin(Date.now()/10000 + sym.charCodeAt(0)) * 0.015));
        chg   = (Math.sin(Date.now()/8000 + sym.charCodeAt(0)*1.3) * 3);
      }

      const row = document.createElement('div');
      row.className = 'wl-item' + (STATE.activeSymbol.symbol === sym ? ' active' : '');
      row.dataset.sym = sym;
      row.innerHTML = `
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="wl-sym">${sym}</span>
            <span class="wl-price ${colorClass(chg)}">${fmtPrice(price)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="wl-name">${info.name}</span>
            <span class="wl-chg ${colorClass(chg)}">${arrow(chg)} ${Math.abs(chg).toFixed(2)}%</span>
          </div>
          <div class="wl-bar"><div class="wl-bar-fill" style="width:${Math.min(Math.abs(chg)*10,100)}%;background:${chg>=0?'var(--green)':'var(--red)'}"></div></div>
        </div>
        <span class="wl-remove" title="Remove">✕</span>
      `;
      row.addEventListener('click', () => loadSymbol(sym));
      row.querySelector('.wl-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        this.remove(sym);
      });
      body.appendChild(row);
    }
  },

  add(sym) {
    if (!STATE.watchlist.includes(sym)) {
      STATE.watchlist.push(sym);
      localStorage.setItem('bbg_watchlist', JSON.stringify(STATE.watchlist));
      this.render();
      toast(`${sym} added to watchlist`, 'success');
    }
  },

  remove(sym) {
    STATE.watchlist = STATE.watchlist.filter(s => s !== sym);
    localStorage.setItem('bbg_watchlist', JSON.stringify(STATE.watchlist));
    this.render();
  },
};

// ══════════════════════════════════════════════
// INDICES PANEL
// ══════════════════════════════════════════════
const Indices = {
  data: {},
  render() {
    const body = document.getElementById('indices-body');
    body.innerHTML = '';
    INDICES_DATA.forEach(idx => {
      const price = idx.base * (1 + (Math.sin(Date.now()/12000 + idx.sym.length*0.7) * 0.008));
      const chg   = (Math.sin(Date.now()/9000 + idx.sym.length) * 1.5);
      const row   = document.createElement('div');
      row.className = 'idx-item';
      row.innerHTML = `
        <span class="idx-name">${idx.name}</span>
        <span class="idx-val">${fmt(price, idx.base < 100 ? 2 : 0)}</span>
        <span class="idx-chg ${colorClass(chg)}">${arrow(chg)} ${Math.abs(chg).toFixed(2)}%</span>
      `;
      body.appendChild(row);
    });
  },
  start() {
    this.render();
    setInterval(() => this.render(), 5000);
  },
};

// ══════════════════════════════════════════════
// SECTOR HEATMAP
// ══════════════════════════════════════════════
const SectorMap = {
  render() {
    const body = document.getElementById('sector-body');
    body.innerHTML = '';
    SECTORS.forEach(s => {
      const chg = s.base + (Math.random() - 0.5) * 0.5;
      const intensity = Math.min(Math.abs(chg) * 30, 90);
      const bg = chg >= 0
        ? `rgba(0,${100+intensity},${60+intensity/2}, 0.7)`
        : `rgba(${100+intensity},${40},${40}, 0.7)`;
      const cell = document.createElement('div');
      cell.className = 'sector-cell';
      cell.style.background = bg;
      cell.style.color = '#fff';
      cell.title = `${s.name}: ${fmtPct(chg)}`;
      cell.innerHTML = `<div style="font-size:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.name.split(' ')[0].substring(0,8)}</div><div style="font-size:10px">${fmtPct(chg)}</div>`;
      cell.addEventListener('click', () => toast(`${s.name}: ${fmtPct(chg)} today`, 'info'));
      body.appendChild(cell);
    });
  },
  start() {
    this.render();
    setInterval(() => this.render(), 30000);
  },
};

// ══════════════════════════════════════════════
// CRYPTO PANEL
// ══════════════════════════════════════════════
const CryptoPanel = {
  async refresh() {
    const ids = SYMBOLS.filter(s => s.type === 'crypto').slice(0, 8).map(s => s.id);
    const data = await API.getCryptoPrices(ids);
    if (data) {
      STATE.cryptoPrices = data;
      this.render(data);
      Watchlist.render();
    }
  },

  render(data) {
    const body = document.getElementById('crypto-body');
    body.innerHTML = '';
    SYMBOLS.filter(s => s.type === 'crypto').slice(0, 8).forEach(s => {
      const d = data[s.id] || {};
      const price = d.usd || 0;
      const chg   = d.usd_24h_change || 0;
      const row = document.createElement('div');
      row.className = 'asset-row';
      row.innerHTML = `
        <span class="asset-sym">${s.symbol}</span>
        <span class="asset-name">${s.name}</span>
        <span class="asset-price ${colorClass(chg)}">${fmtPrice(price)}</span>
        <span class="asset-chg  ${colorClass(chg)}">${arrow(chg)} ${Math.abs(chg).toFixed(2)}%</span>
      `;
      row.addEventListener('click', () => loadSymbol(s.symbol));
      body.appendChild(row);
    });
  },

  start() {
    this.refresh();
    const t = setInterval(() => this.refresh(), CFG.REFRESH_CRYPTO);
    STATE.refreshTimers.push(t);
  },
};

// ══════════════════════════════════════════════
// FOREX PANEL
// ══════════════════════════════════════════════
const ForexPanel = {
  pairs: [
    { from:'EUR', to:'USD', label:'EUR/USD' },
    { from:'GBP', to:'USD', label:'GBP/USD' },
    { from:'USD', to:'JPY', label:'USD/JPY' },
    { from:'USD', to:'CHF', label:'USD/CHF' },
    { from:'AUD', to:'USD', label:'AUD/USD' },
    { from:'USD', to:'CAD', label:'USD/CAD' },
    { from:'NZD', to:'USD', label:'NZD/USD' },
    { from:'USD', to:'CNY', label:'USD/CNY' },
    { from:'USD', to:'NOK', label:'USD/NOK' },
    { from:'USD', to:'SEK', label:'USD/SEK' },
  ],

  async refresh() {
    const rates = await API.getForexRates();
    if (rates) {
      STATE.forexRates = rates;
      this.render(rates);
    }
  },

  render(rates) {
    const body = document.getElementById('forex-body');
    body.innerHTML = '';
    this.pairs.forEach(p => {
      let rate = 0;
      if (p.from === 'USD') {
        rate = rates[p.to] || 0;
      } else if (p.to === 'USD') {
        rate = rates[p.from] ? 1 / rates[p.from] : 0;
      } else {
        rate = (rates[p.to] || 0) / (rates[p.from] || 1);
      }
      // Add small simulated intra-day change
      const chg = (Math.sin(Date.now()/15000 + p.label.length) * 0.4);
      const row = document.createElement('div');
      row.className = 'asset-row';
      row.innerHTML = `
        <span class="asset-sym" style="color:var(--amber);min-width:56px">${p.label}</span>
        <span class="asset-price">${rate.toFixed(4)}</span>
        <span class="asset-chg ${colorClass(chg)}">${arrow(chg)} ${Math.abs(chg).toFixed(3)}</span>
      `;
      body.appendChild(row);
    });
  },

  start() {
    this.refresh();
    const t = setInterval(() => this.refresh(), CFG.REFRESH_FOREX);
    STATE.refreshTimers.push(t);
  },
};

// ══════════════════════════════════════════════
// COMMODITIES PANEL
// ══════════════════════════════════════════════
const CommoditiesPanel = {
  render() {
    const body = document.getElementById('commodities-body');
    body.innerHTML = '';
    COMMODITIES_DATA.forEach(c => {
      const price = c.base * (1 + (Math.sin(Date.now()/11000 + c.sym.length*0.9) * c.vol));
      const chg   = (Math.sin(Date.now()/8500 + c.sym.length*1.1) * 2);
      const row = document.createElement('div');
      row.className = 'asset-row';
      row.innerHTML = `
        <span class="asset-sym" style="color:var(--amber-dim)">${c.sym}</span>
        <span class="asset-name">${c.name}</span>
        <span class="asset-price ${colorClass(chg)}">${fmtPrice(price)}</span>
        <span class="asset-chg  ${colorClass(chg)}">${arrow(chg)} ${Math.abs(chg).toFixed(2)}%</span>
      `;
      body.appendChild(row);
    });
  },
  start() {
    this.render();
    setInterval(() => this.render(), 10000);
  },
};

// ══════════════════════════════════════════════
// MINI CHARTS
// ══════════════════════════════════════════════
const MiniCharts = {
  instances: {},

  async init() {
    const wraps = document.querySelectorAll('.mini-chart-wrap');
    for (const wrap of wraps) {
      const sym  = wrap.dataset.symbol;
      const cvs  = wrap.querySelector('.mini-chart');
      const info = SYMBOLS.find(s => s.symbol === sym);
      if (!info) continue;

      // Get 7-day chart from CoinGecko
      let prices = [];
      try {
        const bars = await API.getCryptoChart(info.id, 7);
        if (bars) prices = bars.map(b => b.close);
      } catch(e) {}

      if (prices.length < 5) {
        const base = { BTC:65000, ETH:3200, SOL:145, BNB:570 }[sym] || 100;
        prices = Array.from({length:50}, (_,i) => base * (1 + (Math.sin(i*0.3+sym.length)*0.05)));
      }

      const chg = prices.length > 1 ? ((prices[prices.length-1] - prices[0]) / prices[0]) * 100 : 0;
      wrap.querySelector('.mini-chart-label').innerHTML =
        `${sym} <span style="font-size:8px;color:${chg>=0?'var(--green)':'var(--red)'}">${fmtPct(chg)}</span>`;

      const ctx = cvs.getContext('2d');
      if (this.instances[sym]) this.instances[sym].destroy();
      this.instances[sym] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: prices.map((_,i) => i),
          datasets: [{
            data: prices,
            borderColor: chg >= 0 ? '#00d95f' : '#ff4757',
            backgroundColor: chg >= 0 ? 'rgba(0,217,95,0.08)' : 'rgba(255,71,87,0.08)',
            borderWidth: 1.5,
            fill: true,
            tension: 0.3,
            pointRadius: 0,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: { x: { display: false }, y: { display: false } },
          animation: false,
        },
      });

      wrap.addEventListener('click', () => loadSymbol(sym));
    }
  },
};

// ══════════════════════════════════════════════
// NEWS FEED
// ══════════════════════════════════════════════
const NewsFeed = {
  sources: [
    'Reuters', 'Bloomberg', 'CNBC', 'WSJ', 'FT', 'MarketWatch',
    'Barron\'s', 'Forbes', 'CoinDesk', 'Seeking Alpha',
  ],
  headlines: [
    'Fed signals potential rate cut amid cooling inflation data',
    'NVIDIA surges as AI chip demand hits record quarterly earnings',
    'Bitcoin breaks resistance level, analysts eye next price target',
    'European markets mixed as ECB holds rates steady',
    'Oil prices steady ahead of OPEC+ output decision',
    'Tech sector leads S&P 500 higher; growth stocks outperform',
    'Dollar weakens against major currencies on softer jobs data',
    'Treasury yields fall as investors price in Fed pivot timeline',
    'Ethereum network activity surges following protocol upgrade',
    'Bank of Japan maintains ultra-low rates, yen slides',
    'Apple unveils new AI features ahead of WWDC developer conference',
    'Goldman Sachs raises S&P 500 year-end target to 5,400',
    'Crypto market cap crosses $2.5 trillion for first time in 2024',
    'Tesla deliveries miss estimates, shares drop in pre-market',
    'China stimulus measures boost commodity and emerging market assets',
    'Amazon AWS revenue growth accelerates, beats estimates',
    'VIX falls to multi-year low as volatility compression continues',
    'Microsoft Azure growth impresses; cloud adoption remains robust',
    'Warren Buffett reveals new position in energy sector at Berkshire',
    'Coinbase launches new institutional staking product',
    'US CPI data shows inflation easing; core at lowest in two years',
    'Meta\'s AI investments drive ad revenue to record high',
    'BlackRock Bitcoin ETF sees record daily inflows this week',
    'Palantir wins $480M defense contract, shares jump 8%',
    'Solana ecosystem TVL reaches new all-time high',
  ],

  generate(n=15) {
    const items = [];
    const now = Date.now();
    for (let i = 0; i < n; i++) {
      const headline = this.headlines[Math.floor(Math.random() * this.headlines.length)];
      const source   = this.sources[Math.floor(Math.random() * this.sources.length)];
      const minAgo   = Math.floor(Math.random() * 120);
      const sentiment = Math.random() > 0.5 ? 'pos' : Math.random() > 0.5 ? 'neg' : 'neu';
      items.push({ headline, source, minAgo, sentiment, ts: now - minAgo * 60000 });
    }
    return items.sort((a,b) => a.minAgo - b.minAgo);
  },

  render(items) {
    const feed = document.getElementById('news-feed');
    feed.innerHTML = '';
    items.forEach(n => {
      const el = document.createElement('div');
      el.className = 'news-item';
      const timeStr = n.minAgo < 1 ? 'just now' : n.minAgo < 60 ? `${n.minAgo}m ago` : `${Math.floor(n.minAgo/60)}h ago`;
      el.innerHTML = `
        <span class="news-time">${timeStr}</span>
        <span class="news-source">${n.source}</span>
        <span class="news-headline">${n.headline}</span>
        <span class="news-sentiment sentiment-${n.sentiment}">${n.sentiment === 'pos' ? 'BULL' : n.sentiment === 'neg' ? 'BEAR' : 'NEUT'}</span>
      `;
      el.addEventListener('click', () => showModal('NEWS — ' + n.source, `<p style="color:var(--text-primary);line-height:1.6;font-size:12px">${n.headline}</p><p style="color:var(--text-dim);margin-top:8px;font-size:10px">Source: ${n.source} · ${timeStr} · Sentiment: ${n.sentiment.toUpperCase()}</p>`));
      feed.appendChild(el);
    });
  },

  start() {
    const items = this.generate(20);
    STATE.news = items;
    this.render(items);
    setInterval(() => {
      const fresh = this.generate(20);
      STATE.news = fresh;
      this.render(fresh);
    }, CFG.REFRESH_NEWS);
  },
};

// ══════════════════════════════════════════════
// ORDER BOOK
// ══════════════════════════════════════════════
const OrderBook = {
  generateBook(midPrice, levels=12) {
    const asks = [], bids = [];
    const spread = midPrice * 0.0002;
    let askTotal = 0, bidTotal = 0;

    for (let i = 0; i < levels; i++) {
      const askPrice = midPrice + spread + i * midPrice * 0.0003 * (1 + Math.random()*0.5);
      const askSize  = (Math.random() * 10 + 0.5).toFixed(4);
      askTotal += parseFloat(askSize);
      asks.push({ price: askPrice, size: askSize, total: askTotal.toFixed(4) });

      const bidPrice = midPrice - spread - i * midPrice * 0.0003 * (1 + Math.random()*0.5);
      const bidSize  = (Math.random() * 12 + 0.5).toFixed(4);
      bidTotal += parseFloat(bidSize);
      bids.push({ price: bidPrice, size: bidSize, total: bidTotal.toFixed(4) });
    }
    return { asks: asks.reverse(), bids, spread: (spread * 2).toFixed(8) };
  },

  render(midPrice) {
    const book = this.generateBook(midPrice);
    const maxTotal = Math.max(...book.asks.map(a => parseFloat(a.total)), ...book.bids.map(b => parseFloat(b.total)));

    const asksEl  = document.getElementById('orderbook-asks');
    const bidsEl  = document.getElementById('orderbook-bids');
    const spreadEl = document.getElementById('orderbook-spread');

    asksEl.innerHTML = book.asks.map(a => {
      const w = (parseFloat(a.total)/maxTotal*100).toFixed(1);
      return `<div class="ob-row ob-ask">
        <div class="ob-bar" style="width:${w}%"></div>
        <span class="ob-price">${fmtPrice(a.price)}</span>
        <span class="ob-size">${a.size}</span>
        <span class="ob-total">${a.total}</span>
      </div>`;
    }).join('');

    spreadEl.textContent = `SPREAD: ${book.spread} — MID: ${fmtPrice(midPrice)}`;

    bidsEl.innerHTML = book.bids.map(b => {
      const w = (parseFloat(b.total)/maxTotal*100).toFixed(1);
      return `<div class="ob-row ob-bid">
        <div class="ob-bar" style="width:${w}%"></div>
        <span class="ob-price">${fmtPrice(b.price)}</span>
        <span class="ob-size">${b.size}</span>
        <span class="ob-total">${b.total}</span>
      </div>`;
    }).join('');
  },

  start(midPrice) {
    this.render(midPrice);
    if (STATE.orderbookTimer) clearInterval(STATE.orderbookTimer);
    STATE.orderbookTimer = setInterval(() => {
      const jitter = midPrice * (1 + (Math.random()-0.5)*0.002);
      this.render(jitter);
    }, CFG.REFRESH_ORDERBOOK);
  },
};

// ══════════════════════════════════════════════
// OPTIONS CHAIN
// ══════════════════════════════════════════════
const OptionsChain = {
  generateChain(spotPrice) {
    const strikes = [];
    const base = Math.round(spotPrice / 50) * 50;
    for (let i = -10; i <= 10; i++) strikes.push(base + i * (spotPrice > 1000 ? 50 : spotPrice > 100 ? 5 : 1));

    const expiries = ['2024-07-19', '2024-08-16', '2024-09-20', '2024-12-20', '2025-01-17'];
    $('#options-expiry').innerHTML = expiries.map(e => `<option>${e}</option>`).join('');

    return strikes.map(strike => {
      const moneyness = (spotPrice - strike) / spotPrice;
      const callIV = (0.25 + Math.abs(moneyness)*2 + Math.random()*0.05).toFixed(3);
      const putIV  = (0.27 + Math.abs(moneyness)*2 + Math.random()*0.05).toFixed(3);
      const callPrice = Math.max(0, spotPrice - strike) + spotPrice*parseFloat(callIV)*0.15;
      const putPrice  = Math.max(0, strike - spotPrice) + spotPrice*parseFloat(putIV)*0.15;
      const isATM = Math.abs(moneyness) < 0.025;

      return {
        strike,
        call: {
          last: callPrice.toFixed(2),
          bid:  (callPrice*0.98).toFixed(2),
          ask:  (callPrice*1.02).toFixed(2),
          iv:   callIV,
          oi:   Math.floor(Math.random()*5000+100),
        },
        put: {
          last: putPrice.toFixed(2),
          bid:  (putPrice*0.98).toFixed(2),
          ask:  (putPrice*1.02).toFixed(2),
          iv:   putIV,
          oi:   Math.floor(Math.random()*5000+100),
        },
        atm: isATM,
        itmCall: strike < spotPrice,
        itmPut:  strike > spotPrice,
      };
    });
  },

  render(spotPrice) {
    const chain = this.generateChain(spotPrice);
    const tbody = document.getElementById('options-tbody');
    tbody.innerHTML = chain.map(row => `
      <tr class="${row.atm ? 'atm-row' : ''}">
        <td class="${row.itmCall ? 'itm-call' : ''}">${row.call.last}</td>
        <td class="${row.itmCall ? 'itm-call' : ''}">${row.call.bid}</td>
        <td class="${row.itmCall ? 'itm-call' : ''}">${row.call.ask}</td>
        <td class="${row.itmCall ? 'itm-call' : ''}">${(parseFloat(row.call.iv)*100).toFixed(1)}%</td>
        <td class="${row.itmCall ? 'itm-call' : ''}">${row.call.oi.toLocaleString()}</td>
        <td class="strike-col">${fmtPrice(row.strike)}</td>
        <td class="${row.itmPut ? 'itm-put' : ''}">${row.put.last}</td>
        <td class="${row.itmPut ? 'itm-put' : ''}">${row.put.bid}</td>
        <td class="${row.itmPut ? 'itm-put' : ''}">${row.put.ask}</td>
        <td class="${row.itmPut ? 'itm-put' : ''}">${(parseFloat(row.put.iv)*100).toFixed(1)}%</td>
        <td class="${row.itmPut ? 'itm-put' : ''}">${row.put.oi.toLocaleString()}</td>
      </tr>
    `).join('');
  },
};

// ══════════════════════════════════════════════
// ECONOMIC DATA TAB
// ══════════════════════════════════════════════
const EconomicsTab = {
  data: [
    { category:'US MACRO', items: [
      { key:'GDP Growth (QoQ)',      val:'1.6%',   prev:'3.4%',   date:'Q1 2024' },
      { key:'CPI Inflation (YoY)',   val:'3.4%',   prev:'3.5%',   date:'Apr 2024' },
      { key:'Core CPI (YoY)',        val:'3.6%',   prev:'3.8%',   date:'Apr 2024' },
      { key:'Unemployment Rate',     val:'3.9%',   prev:'3.8%',   date:'Apr 2024' },
      { key:'Non-Farm Payrolls',     val:'175K',   prev:'315K',   date:'Apr 2024' },
      { key:'Fed Funds Rate',        val:'5.25-5.50%', prev:'5.25-5.50%', date:'May 2024' },
      { key:'10Y Treasury Yield',    val:'4.43%',  prev:'4.20%',  date:'Live' },
      { key:'2Y Treasury Yield',     val:'4.85%',  prev:'4.62%',  date:'Live' },
      { key:'Retail Sales (MoM)',    val:'0.0%',   prev:'0.6%',   date:'Apr 2024' },
      { key:'ISM Manufacturing',     val:'49.2',   prev:'50.3',   date:'Apr 2024' },
    ]},
    { category:'GLOBAL', items: [
      { key:'ECB Rate',              val:'4.50%',  prev:'4.50%',  date:'Apr 2024' },
      { key:'BOE Rate',              val:'5.25%',  prev:'5.25%',  date:'May 2024' },
      { key:'BOJ Rate',              val:'-0.10%', prev:'-0.10%', date:'Mar 2024' },
      { key:'Eurozone CPI (YoY)',    val:'2.4%',   prev:'2.6%',   date:'Apr 2024' },
      { key:'UK CPI (YoY)',          val:'3.2%',   prev:'3.4%',   date:'Mar 2024' },
      { key:'China GDP (YoY)',       val:'5.3%',   prev:'5.2%',   date:'Q1 2024' },
      { key:'Japan CPI (YoY)',       val:'2.7%',   prev:'2.8%',   date:'Mar 2024' },
      { key:'Germany PMI Mfg.',      val:'42.5',   prev:'41.9',   date:'Apr 2024' },
    ]},
    { category:'UPCOMING EVENTS', items: [
      { key:'FOMC Meeting',          val:'Jun 11-12', prev:'',    date:'2024' },
      { key:'US CPI Release',        val:'Jun 12',  prev:'',      date:'2024' },
      { key:'ECB Meeting',           val:'Jun 6',   prev:'',      date:'2024' },
      { key:'US NFP Report',         val:'Jun 7',   prev:'',      date:'2024' },
      { key:'BoC Rate Decision',     val:'Jun 5',   prev:'',      date:'2024' },
    ]},
  ],

  render() {
    const container = document.getElementById('economics-container');
    container.innerHTML = this.data.map(section => `
      <div class="econ-section">
        <h4>${section.category}</h4>
        ${section.items.map(item => `
          <div class="econ-row">
            <span class="econ-key">${item.key}</span>
            <span class="econ-val ${item.val > item.prev ? 'up' : item.val < item.prev ? 'down' : ''}">${item.val}</span>
            <span class="econ-prev">${item.prev || '—'}</span>
            <span class="econ-date">${item.date}</span>
          </div>
        `).join('')}
      </div>
    `).join('');
  },
};

// ══════════════════════════════════════════════
// EARNINGS
// ══════════════════════════════════════════════
const Earnings = {
  data: [
    { sym:'NVDA',  date:'May 22', eps_est:5.59,  eps_act:6.12,  rev_est:24.6, rev_act:26.0,  beat:true  },
    { sym:'AAPL',  date:'May 2',  eps_est:1.50,  eps_act:1.53,  rev_est:90.3, rev_act:90.8,  beat:true  },
    { sym:'MSFT',  date:'Apr 25', eps_est:2.82,  eps_act:2.94,  rev_est:60.8, rev_act:61.9,  beat:true  },
    { sym:'META',  date:'Apr 24', eps_est:4.32,  eps_act:4.71,  rev_est:36.2, rev_act:36.5,  beat:true  },
    { sym:'GOOGL', date:'Apr 25', eps_est:1.51,  eps_act:1.89,  rev_est:78.7, rev_act:80.5,  beat:true  },
    { sym:'AMZN',  date:'Apr 30', eps_est:0.83,  eps_act:0.98,  rev_est:142.5,rev_act:143.3, beat:true  },
    { sym:'TSLA',  date:'Apr 23', eps_est:0.52,  eps_act:0.45,  rev_est:22.2, rev_act:21.3,  beat:false },
    { sym:'JPM',   date:'Apr 12', eps_est:4.17,  eps_act:4.44,  rev_est:41.9, rev_act:41.9,  beat:true  },
  ],
  upcoming: [
    { sym:'ORCL',  date:'Jun 11', eps_est:1.65,  sector:'Technology'    },
    { sym:'ADBE',  date:'Jun 13', eps_est:4.38,  sector:'Technology'    },
    { sym:'KR',    date:'Jun 20', eps_est:1.47,  sector:'Consumer Stpl.'},
    { sym:'NKE',   date:'Jun 27', eps_est:0.84,  sector:'Consumer Disc.'},
    { sym:'FDX',   date:'Jun 25', eps_est:5.18,  sector:'Industrials'   },
  ],
  render() {
    const c = document.getElementById('earnings-container');
    c.innerHTML = `
      <div class="econ-section">
        <h4>RECENT EARNINGS (Q1 2024)</h4>
        <table style="width:100%;border-collapse:collapse;font-size:10px">
          <thead><tr style="color:var(--text-secondary)">
            <th style="text-align:left;padding:3px 6px">SYMBOL</th>
            <th style="text-align:right;padding:3px 6px">DATE</th>
            <th style="text-align:right;padding:3px 6px">EPS EST</th>
            <th style="text-align:right;padding:3px 6px">EPS ACT</th>
            <th style="text-align:right;padding:3px 6px">REV EST</th>
            <th style="text-align:right;padding:3px 6px">REV ACT</th>
            <th style="text-align:right;padding:3px 6px">BEAT?</th>
          </tr></thead>
          <tbody>
            ${this.data.map(e => `
              <tr style="border-bottom:1px solid var(--border)">
                <td style="padding:3px 6px;color:var(--amber);font-weight:700">${e.sym}</td>
                <td style="padding:3px 6px;text-align:right;color:var(--text-secondary)">${e.date}</td>
                <td style="padding:3px 6px;text-align:right">${e.eps_est}</td>
                <td style="padding:3px 6px;text-align:right;color:${e.beat?'var(--green)':'var(--red)'}">${e.eps_act}</td>
                <td style="padding:3px 6px;text-align:right">$${e.rev_est}B</td>
                <td style="padding:3px 6px;text-align:right;color:${e.eps_act>e.eps_est?'var(--green)':'var(--red)'}">$${e.rev_act}B</td>
                <td style="padding:3px 6px;text-align:right;color:${e.beat?'var(--green)':'var(--red)'};font-weight:700">${e.beat?'BEAT':'MISS'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="econ-section" style="margin-top:12px">
        <h4>UPCOMING EARNINGS</h4>
        <table style="width:100%;border-collapse:collapse;font-size:10px">
          <thead><tr style="color:var(--text-secondary)">
            <th style="text-align:left;padding:3px 6px">SYMBOL</th>
            <th style="text-align:right;padding:3px 6px">DATE</th>
            <th style="text-align:right;padding:3px 6px">EPS EST</th>
            <th style="text-align:right;padding:3px 6px">SECTOR</th>
          </tr></thead>
          <tbody>
            ${this.upcoming.map(e => `
              <tr style="border-bottom:1px solid var(--border)">
                <td style="padding:3px 6px;color:var(--cyan);font-weight:700">${e.sym}</td>
                <td style="padding:3px 6px;text-align:right;color:var(--amber)">${e.date}</td>
                <td style="padding:3px 6px;text-align:right">${e.eps_est}</td>
                <td style="padding:3px 6px;text-align:right;color:var(--text-secondary)">${e.sector}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },
};

// ══════════════════════════════════════════════
// SCREENER
// ══════════════════════════════════════════════
const Screener = {
  run(filters) {
    let stocks = SYMBOLS.filter(s => s.type === 'stock').map(s => {
      const base  = STOCK_PRICES[s.symbol] || 100;
      const price = base * (1 + (Math.sin(Date.now()/10000 + s.symbol.charCodeAt(0)) * 0.015));
      const chg   = (Math.sin(Date.now()/8000 + s.symbol.charCodeAt(0)*1.3) * 3);
      const pe    = (10 + Math.random() * 40).toFixed(1);
      const mktcap = price * (Math.random() * 1e10 + 1e9);
      const vol   = Math.floor(Math.random() * 50e6 + 1e6);
      return { ...s, price, chg, pe: parseFloat(pe), mktcap, vol };
    });

    if (filters.sector)  stocks = stocks.filter(s => s.sector.toLowerCase().includes(filters.sector.toLowerCase()));
    if (filters.maxPE)   stocks = stocks.filter(s => s.pe <= parseFloat(filters.maxPE));
    if (filters.minVol)  stocks = stocks.filter(s => s.vol >= parseFloat(filters.minVol));

    return stocks;
  },

  render(stocks) {
    const c = document.getElementById('screener-results');
    if (!stocks.length) { c.innerHTML = '<p style="color:var(--text-dim);padding:12px">No results matching filters.</p>'; return; }
    c.innerHTML = `
      <table>
        <thead><tr>
          <th>SYMBOL</th><th>NAME</th><th>SECTOR</th>
          <th>PRICE</th><th>CHG%</th><th>MKT CAP</th><th>P/E</th><th>VOLUME</th>
        </tr></thead>
        <tbody>
          ${stocks.map(s => `
            <tr onclick="loadSymbol('${s.symbol}');document.querySelector('[data-tab=news]').click()" style="cursor:pointer">
              <td style="color:var(--amber);font-weight:700;text-align:left">${s.symbol}</td>
              <td style="text-align:left">${s.name}</td>
              <td style="text-align:left;color:var(--text-secondary)">${s.sector}</td>
              <td class="${colorClass(s.chg)}">${fmtPrice(s.price)}</td>
              <td class="${colorClass(s.chg)}">${fmtPct(s.chg)}</td>
              <td>${fmt(s.mktcap, 2)}</td>
              <td>${s.pe}</td>
              <td>${fmt(s.vol, 0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },
};

// ══════════════════════════════════════════════
// PORTFOLIO
// ══════════════════════════════════════════════
const Portfolio = {
  load() {
    STATE.portfolio = JSON.parse(localStorage.getItem('bbg_portfolio') || '[]');
  },
  save() {
    localStorage.setItem('bbg_portfolio', JSON.stringify(STATE.portfolio));
  },
  add(symbol, qty, avgCost) {
    const existing = STATE.portfolio.find(p => p.symbol === symbol);
    if (existing) {
      existing.qty = existing.qty + qty;
      existing.avgCost = (existing.avgCost * (existing.qty - qty) + avgCost * qty) / existing.qty;
    } else {
      STATE.portfolio.push({ symbol, qty, avgCost });
    }
    this.save();
    this.render();
    toast(`${symbol} × ${qty} added to portfolio`, 'success');
  },
  remove(symbol) {
    STATE.portfolio = STATE.portfolio.filter(p => p.symbol !== symbol);
    this.save();
    this.render();
  },
  getCurrentPrice(symbol) {
    const info = SYMBOLS.find(s => s.symbol === symbol);
    if (!info) return 100;
    if (info.type === 'crypto') {
      const d = STATE.cryptoPrices[info.id];
      return d ? d.usd : 100;
    }
    const base = STOCK_PRICES[symbol] || 100;
    return base * (1 + (Math.sin(Date.now()/10000 + symbol.charCodeAt(0)) * 0.015));
  },
  render() {
    const tbody = document.getElementById('portfolio-tbody');
    let totalVal = 0, totalCost = 0;
    tbody.innerHTML = '';
    STATE.portfolio.forEach(pos => {
      const current = this.getCurrentPrice(pos.symbol);
      const value   = current * pos.qty;
      const cost    = pos.avgCost * pos.qty;
      const pnl     = value - cost;
      const pnlPct  = (pnl / cost) * 100;
      totalVal  += value;
      totalCost += cost;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${pos.symbol}</td>
        <td>${pos.qty}</td>
        <td>${fmtPrice(pos.avgCost)}</td>
        <td>${fmtPrice(current)}</td>
        <td class="${colorClass(pnl)}">${pnl >= 0 ? '+' : ''}${fmtPrice(Math.abs(pnl))}</td>
        <td class="${colorClass(pnlPct)}">${fmtPct(pnlPct)}</td>
        <td>${fmtPrice(value)}</td>
        <td><button class="btn-remove" data-sym="${pos.symbol}">✕</button></td>
      `;
      tr.querySelector('.btn-remove').addEventListener('click', () => this.remove(pos.symbol));
      tbody.appendChild(tr);
    });
    const totalPnl = totalVal - totalCost;
    const totalPct = totalCost ? (totalPnl / totalCost) * 100 : 0;
    $('#p-total-val').textContent = fmtPrice(totalVal);
    const pnlEl = $('#p-total-pnl');
    pnlEl.textContent = (totalPnl >= 0 ? '+' : '') + fmtPrice(Math.abs(totalPnl));
    pnlEl.className = 'stat-value ' + colorClass(totalPnl);
    const pctEl = $('#p-total-pct');
    pctEl.textContent = fmtPct(totalPct);
    pctEl.className = 'stat-value ' + colorClass(totalPct);
  },
};

// ══════════════════════════════════════════════
// ALERTS
// ══════════════════════════════════════════════
const Alerts = {
  load() {
    STATE.alerts = JSON.parse(localStorage.getItem('bbg_alerts') || '[]');
  },
  save() {
    localStorage.setItem('bbg_alerts', JSON.stringify(STATE.alerts));
  },
  add(symbol, direction, targetPrice) {
    STATE.alerts.push({ symbol, direction, targetPrice: parseFloat(targetPrice), triggered: false, id: Date.now() });
    this.save();
    this.render();
    toast(`Alert set: ${symbol} ${direction} ${fmtPrice(targetPrice)}`, 'success');
  },
  remove(id) {
    STATE.alerts = STATE.alerts.filter(a => a.id !== id);
    this.save();
    this.render();
  },
  check() {
    STATE.alerts.forEach(a => {
      if (a.triggered) return;
      const price = Portfolio.getCurrentPrice(a.symbol);
      const fired = (a.direction === 'above' && price >= a.targetPrice) ||
                    (a.direction === 'below'  && price <= a.targetPrice);
      if (fired) {
        a.triggered = true;
        this.save();
        const banner = document.getElementById('alert-banner');
        banner.textContent = `⚡ ALERT: ${a.symbol} is ${a.direction} ${fmtPrice(a.targetPrice)} — Current: ${fmtPrice(price)}`;
        banner.classList.remove('hidden');
        setTimeout(() => banner.classList.add('hidden'), 10000);
        toast(`ALERT TRIGGERED: ${a.symbol} ${fmtPct((price-a.targetPrice)/a.targetPrice*100)} target`, 'error');
      }
    });
  },
  render() {
    const list = document.getElementById('alert-list');
    list.innerHTML = '';
    if (!STATE.alerts.length) {
      list.innerHTML = '<p style="color:var(--text-dim);padding:8px;font-size:10px">No alerts set.</p>';
      return;
    }
    STATE.alerts.forEach(a => {
      const el = document.createElement('div');
      el.className = 'alert-item';
      el.innerHTML = `
        <span class="alert-sym">${a.symbol}</span>
        <span class="alert-dir">${a.direction.toUpperCase()}</span>
        <span class="alert-target">${fmtPrice(a.targetPrice)}</span>
        <span class="alert-triggered">${a.triggered ? '✓ TRIGGERED' : 'ACTIVE'}</span>
        <button class="btn-remove" data-id="${a.id}">✕</button>
      `;
      el.querySelector('.btn-remove').addEventListener('click', () => this.remove(a.id));
      list.appendChild(el);
    });
  },
};

// ══════════════════════════════════════════════
// CLOCK
// ══════════════════════════════════════════════
function updateClock() {
  const now    = new Date();
  const est    = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const hours  = est.getHours();
  const isOpen = hours >= 9.5 && hours < 16 && est.getDay() >= 1 && est.getDay() <= 5;

  $('#clock-time').textContent = est.toLocaleTimeString('en-US', { hour12:false });
  $('#clock-date').textContent = est.toLocaleDateString('en-US', { month:'short', day:'2-digit', year:'numeric' });

  const dot  = $('#market-status-dot');
  const txt  = $('#market-status-text');
  if (isOpen) {
    dot.className = '';
    txt.className = '';
    txt.textContent = 'MARKET OPEN';
  } else {
    dot.className = 'closed';
    txt.className = 'closed';
    txt.textContent = hours >= 4 && hours < 9.5 ? 'PRE-MARKET' :
                      hours >= 16 && hours < 20  ? 'AFTER-HOURS' : 'MARKET CLOSED';
  }
}

// ══════════════════════════════════════════════
// MODAL
// ══════════════════════════════════════════════
function showModal(title, bodyHTML) {
  $('#modal-title').textContent = title;
  $('#modal-body').innerHTML = bodyHTML;
  $('#modal-overlay').classList.remove('hidden');
}
function hideModal() {
  $('#modal-overlay').classList.add('hidden');
}

// ══════════════════════════════════════════════
// LOAD SYMBOL (Main chart + header update)
// ══════════════════════════════════════════════
async function loadSymbol(sym) {
  const info = SYMBOLS.find(s => s.symbol === sym.toUpperCase()) ||
               SYMBOLS.find(s => s.id === sym.toLowerCase()) ||
               { id: sym, symbol: sym.toUpperCase(), name: sym.toUpperCase(), type: 'crypto' };

  STATE.activeSymbol = info;

  // Update header
  $('#chart-symbol-name').textContent   = info.name;
  $('#chart-symbol-ticker').textContent = info.symbol + (info.type === 'crypto' ? '-USD' : '');
  $('#chart-price').textContent = '--';
  $('#chart-change').textContent = '--';

  // Mark active in watchlist
  $$('.wl-item').forEach(el => el.classList.toggle('active', el.dataset.sym === info.symbol));

  // Load chart data
  let bars = null;

  if (info.type === 'crypto') {
    const days = { '1D': 1, '5D': 5, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '5Y': 1825 }[STATE.chartRange] || 30;
    bars = await API.getCryptoChart(info.id, days);
    // Update mktcap and P/E
    const d = STATE.cryptoPrices[info.id];
    if (d) {
      $('#stat-mktcap').textContent = fmt(d.usd_market_cap, 2);
      $('#stat-pe').textContent = 'N/A';
    }
  } else {
    // Simulate stock data
    const base = STOCK_PRICES[info.symbol] || 100;
    const numBars = { '1D': 390, '5D': 390*5, '1M': 30, '3M': 90, '6M': 180, '1Y': 252, '5Y': 1260 }[STATE.chartRange] || 90;
    const interval = STATE.chartRange === '1D' ? '1m' : '1D';
    bars = generateOHLCV(base, numBars, 0.012, 0.0002, interval);
    const pe = (15 + Math.random()*20).toFixed(1);
    $('#stat-pe').textContent = pe;
    $('#stat-mktcap').textContent = fmt(bars[bars.length-1]?.close * (Math.random()*1e10+1e9), 2);
  }

  if (!bars || !bars.length) {
    const base = STOCK_PRICES[info.symbol] || 1000;
    bars = generateOHLCV(base, 100, 0.015, 0.0002);
    toast('Using simulated data — API unavailable', 'error');
  }

  ChartMgr.loadBars(bars, STATE.chartType);
  OrderBook.start(bars[bars.length-1]?.close || 100);

  // Update sub chart if indicator active
  updateSubChart(bars);

  // Update options chain
  OptionsChain.render(bars[bars.length-1]?.close || 100);
}

function updateSubChart(bars) {
  const ind = STATE.indicators;
  if (ind.rsi) {
    document.getElementById('sub-chart').classList.remove('hidden');
    ChartMgr.showSubChart('rsi', bars);
  } else if (ind.macd) {
    document.getElementById('sub-chart').classList.remove('hidden');
    ChartMgr.showSubChart('macd', bars);
  } else if (ind.vol) {
    document.getElementById('sub-chart').classList.remove('hidden');
    ChartMgr.showSubChart('vol', bars);
  } else {
    document.getElementById('sub-chart').classList.add('hidden');
    ChartMgr.showSubChart(null, []);
  }
}

// ══════════════════════════════════════════════
// COMMAND LINE
// ══════════════════════════════════════════════
const CMD = {
  commands: {
    'HELP': () => showHelpModal(),
    'WEI':  () => { switchTab('news'); toast('Loading World Equity Indices...'); Indices.render(); },
    'FXIP': () => { switchNav('forex'); toast('Loading Forex Overview...'); },
    'NWSA': () => { switchTab('news'); toast('Loading News Analysis...'); },
    'CRYP': () => { switchNav('crypto'); toast('Loading Crypto Markets...'); },
    'PORT': () => { document.getElementById('portfolio-modal').classList.remove('hidden'); },
    'ALRT': () => { document.getElementById('alert-modal').classList.remove('hidden'); },
    'SCRN': () => { switchTab('screener'); },
    'ECON': () => { switchTab('economics'); },
    'OPTS': () => { switchTab('options'); },
    'EARN': () => { switchTab('earnings'); },
    'BOOK': () => { switchTab('orderbook'); },
    'CANDLE': () => { setChartType('candlestick'); },
    'LINE':   () => { setChartType('line'); },
    'AREA':   () => { setChartType('area'); },
    'BAR':    () => { setChartType('bar'); },
    'MA':     () => { toggleIndicator('ma'); },
    'BB':     () => { toggleIndicator('bb'); },
    'RSI':    () => { toggleIndicator('rsi'); },
    'MACD':   () => { toggleIndicator('macd'); },
    'VOL':    () => { toggleIndicator('vol'); },
    '1D': () => setRange('1D'), '5D': () => setRange('5D'),
    '1M': () => setRange('1M'), '3M': () => setRange('3M'),
    '6M': () => setRange('6M'), '1Y': () => setRange('1Y'),
    '5Y': () => setRange('5Y'),
    'ADD':    (arg) => { if (arg) Watchlist.add(arg.toUpperCase()); },
    'REMOVE': (arg) => { if (arg) Watchlist.remove(arg.toUpperCase()); },
    'CLEAR':  () => { $( '#cmd-input').value = ''; },
  },

  execute(raw) {
    const parts = raw.trim().toUpperCase().split(' ');
    const cmd   = parts[0];
    const arg   = parts.slice(1).join(' ');

    // History
    STATE.cmdHistory.unshift(raw);
    if (STATE.cmdHistory.length > 50) STATE.cmdHistory.pop();
    STATE.cmdHistoryIdx = -1;

    // Exact command match
    if (this.commands[cmd]) {
      this.commands[cmd](arg);
      return;
    }

    // Symbol lookup
    const info = SYMBOLS.find(s => s.symbol === cmd || s.id === cmd.toLowerCase());
    if (info) {
      loadSymbol(info.symbol);
      Watchlist.add(info.symbol);
      return;
    }

    // Prefix search
    const match = SYMBOLS.find(s => s.symbol.startsWith(cmd));
    if (match) {
      loadSymbol(match.symbol);
      return;
    }

    toast(`Unknown command: ${cmd}. Type HELP for commands.`, 'error');
  },
};

function showHelpModal() {
  showModal('BLOOMBERG TERMINAL — HELP', `
    <div class="help-grid">
      <div class="help-section">
        <h4>NAVIGATION</h4>
        <div class="help-row"><span class="help-key">WEI</span><span class="help-desc">World Equity Indices</span></div>
        <div class="help-row"><span class="help-key">FXIP</span><span class="help-desc">Forex Overview</span></div>
        <div class="help-row"><span class="help-key">CRYP</span><span class="help-desc">Crypto Markets</span></div>
        <div class="help-row"><span class="help-key">NWSA</span><span class="help-desc">News Analysis</span></div>
        <div class="help-row"><span class="help-key">SCRN</span><span class="help-desc">Stock Screener</span></div>
        <div class="help-row"><span class="help-key">ECON</span><span class="help-desc">Economic Data</span></div>
        <div class="help-row"><span class="help-key">PORT</span><span class="help-desc">Portfolio Manager</span></div>
        <div class="help-row"><span class="help-key">ALRT</span><span class="help-desc">Price Alerts</span></div>
        <div class="help-row"><span class="help-key">BOOK</span><span class="help-desc">Order Book</span></div>
        <div class="help-row"><span class="help-key">OPTS</span><span class="help-desc">Options Chain</span></div>
        <div class="help-row"><span class="help-key">EARN</span><span class="help-desc">Earnings Calendar</span></div>
      </div>
      <div class="help-section">
        <h4>SYMBOLS (type then ENTER)</h4>
        <div class="help-row"><span class="help-key">BTC</span><span class="help-desc">Bitcoin</span></div>
        <div class="help-row"><span class="help-key">ETH</span><span class="help-desc">Ethereum</span></div>
        <div class="help-row"><span class="help-key">SOL</span><span class="help-desc">Solana</span></div>
        <div class="help-row"><span class="help-key">AAPL</span><span class="help-desc">Apple Inc.</span></div>
        <div class="help-row"><span class="help-key">NVDA</span><span class="help-desc">NVIDIA Corp.</span></div>
        <div class="help-row"><span class="help-key">TSLA</span><span class="help-desc">Tesla Inc.</span></div>
        <div class="help-row"><span class="help-key">MSFT</span><span class="help-desc">Microsoft</span></div>
      </div>
      <div class="help-section">
        <h4>CHART TYPES</h4>
        <div class="help-row"><span class="help-key">CANDLE</span><span class="help-desc">Candlestick chart</span></div>
        <div class="help-row"><span class="help-key">LINE</span><span class="help-desc">Line chart</span></div>
        <div class="help-row"><span class="help-key">AREA</span><span class="help-desc">Area chart</span></div>
        <div class="help-row"><span class="help-key">BAR</span><span class="help-desc">OHLC Bar chart</span></div>
      </div>
      <div class="help-section">
        <h4>INDICATORS & RANGES</h4>
        <div class="help-row"><span class="help-key">MA</span><span class="help-desc">Moving Averages (20/50/200)</span></div>
        <div class="help-row"><span class="help-key">BB</span><span class="help-desc">Bollinger Bands</span></div>
        <div class="help-row"><span class="help-key">RSI</span><span class="help-desc">Relative Strength Index</span></div>
        <div class="help-row"><span class="help-key">MACD</span><span class="help-desc">MACD Indicator</span></div>
        <div class="help-row"><span class="help-key">VOL</span><span class="help-desc">Volume Histogram</span></div>
        <div class="help-row"><span class="help-key">1D/5D/1M...</span><span class="help-desc">Set chart range</span></div>
        <div class="help-row"><span class="help-key">ADD AAPL</span><span class="help-desc">Add to watchlist</span></div>
      </div>
    </div>
    <div style="margin-top:16px;padding:8px;background:var(--bg);border:1px solid var(--border);font-size:10px;color:var(--text-dim)">
      KEYBOARD: ESC=clear input | ↑↓=command history | F1=Help | F2=Markets | F8=Crypto
    </div>
  `);
}

// ══════════════════════════════════════════════
// AUTOCOMPLETE
// ══════════════════════════════════════════════
const Autocomplete = {
  selected: -1,

  show(query) {
    if (!query || query.length < 1) { this.hide(); return; }
    const q = query.toUpperCase();
    const matches = SYMBOLS.filter(s =>
      s.symbol.startsWith(q) || s.name.toUpperCase().includes(q) || s.id.toUpperCase().includes(q)
    ).slice(0, 8);

    // Also add commands
    const cmdMatches = Object.keys(CMD.commands).filter(c => c.startsWith(q)).slice(0, 4).map(c => ({
      symbol: c, name: `Command: ${c}`, type: 'command', id: c,
    }));

    const all = [...cmdMatches, ...matches];
    if (!all.length) { this.hide(); return; }

    const el = document.getElementById('cmd-autocomplete');
    el.innerHTML = all.map((s, i) => `
      <div class="autocomplete-item${i === this.selected ? ' selected' : ''}" data-idx="${i}" data-sym="${s.symbol}">
        <span class="ac-sym">${s.symbol}</span>
        <span class="ac-name">${s.name}</span>
        <span class="ac-type">${s.type}</span>
      </div>
    `).join('');
    el.classList.remove('hidden');

    el.querySelectorAll('.autocomplete-item').forEach(item => {
      item.addEventListener('click', () => {
        $('#cmd-input').value = item.dataset.sym;
        this.hide();
        CMD.execute(item.dataset.sym);
        $('#cmd-input').value = '';
      });
    });
  },

  hide() {
    this.selected = -1;
    document.getElementById('cmd-autocomplete').classList.add('hidden');
  },

  navigate(dir) {
    const items = $$('.autocomplete-item');
    if (!items.length) return false;
    this.selected = (this.selected + dir + items.length) % items.length;
    items.forEach((el, i) => el.classList.toggle('selected', i === this.selected));
    return true;
  },

  getSelected() {
    const el = $('.autocomplete-item.selected');
    return el ? el.dataset.sym : null;
  },
};

// ══════════════════════════════════════════════
// UI HELPERS
// ══════════════════════════════════════════════
function switchTab(name) {
  $$('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  $$('.tab-pane').forEach(p => p.classList.toggle('hidden', p.id !== 'tab-' + name));
  STATE.activeTab = name;
}

function switchNav(name) {
  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.panel === name));
}

function setChartType(type) {
  STATE.chartType = type;
  $$('.ctrl-btn[data-type]').forEach(b => b.classList.toggle('active', b.dataset.type === type));
  loadSymbol(STATE.activeSymbol.symbol);
}

function setRange(range) {
  STATE.chartRange = range;
  $$('.ctrl-btn[data-range]').forEach(b => b.classList.toggle('active', b.dataset.range === range));
  loadSymbol(STATE.activeSymbol.symbol);
}

function toggleIndicator(name) {
  STATE.indicators[name] = !STATE.indicators[name];
  const btn = $(`#toggle-${name}`);
  if (btn) btn.classList.toggle('indicator-on', STATE.indicators[name]);
  loadSymbol(STATE.activeSymbol.symbol);
}

// ══════════════════════════════════════════════
// EVENT BINDING
// ══════════════════════════════════════════════
function bindEvents() {
  // Nav buttons
  $$('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchNav(btn.dataset.panel);
      if (btn.dataset.panel === 'crypto')    switchTab('news');
      if (btn.dataset.panel === 'portfolio') { document.getElementById('portfolio-modal').classList.remove('hidden'); }
    });
  });

  // Tab buttons
  $$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Chart type buttons
  $$('.ctrl-btn[data-type]').forEach(btn => {
    btn.addEventListener('click', () => setChartType(btn.dataset.type));
  });

  // Range buttons
  $$('.ctrl-btn[data-range]').forEach(btn => {
    btn.addEventListener('click', () => setRange(btn.dataset.range));
  });

  // Indicator buttons
  ['ma','bb','rsi','macd','vol'].forEach(ind => {
    const btn = $(`#toggle-${ind}`);
    if (btn) btn.addEventListener('click', () => toggleIndicator(ind));
  });

  // Command input
  const input = $('#cmd-input');
  input.addEventListener('input', () => Autocomplete.show(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const sel = Autocomplete.getSelected();
      const val = sel || input.value.trim();
      if (val) { CMD.execute(val); input.value = ''; Autocomplete.hide(); }
    } else if (e.key === 'Escape') {
      input.value = '';
      Autocomplete.hide();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!Autocomplete.navigate(-1)) {
        STATE.cmdHistoryIdx = Math.min(STATE.cmdHistoryIdx + 1, STATE.cmdHistory.length - 1);
        input.value = STATE.cmdHistory[STATE.cmdHistoryIdx] || '';
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!Autocomplete.navigate(1)) {
        STATE.cmdHistoryIdx = Math.max(STATE.cmdHistoryIdx - 1, -1);
        input.value = STATE.cmdHistoryIdx >= 0 ? STATE.cmdHistory[STATE.cmdHistoryIdx] : '';
      }
    }
  });

  // Global keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target === input) return;
    if (e.key === 'F1') { e.preventDefault(); showHelpModal(); }
    if (e.key === 'F2') { e.preventDefault(); switchNav('markets'); }
    if (e.key === 'F8') { e.preventDefault(); switchNav('crypto'); }
    if (e.key === 'Escape') { hideModal(); document.getElementById('portfolio-modal').classList.add('hidden'); document.getElementById('alert-modal').classList.add('hidden'); }
    if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1) {
      input.focus();
    }
  });

  // Modal close
  $('#modal-close').addEventListener('click', hideModal);
  $('#modal-overlay').addEventListener('click', (e) => { if (e.target === $('#modal-overlay')) hideModal(); });

  // Portfolio modal
  $('#portfolio-close').addEventListener('click', () => document.getElementById('portfolio-modal').classList.add('hidden'));
  $('#p-add-btn').addEventListener('click', () => {
    const sym  = $('#p-symbol').value.trim().toUpperCase();
    const qty  = parseFloat($('#p-qty').value);
    const cost = parseFloat($('#p-price').value);
    if (sym && qty > 0 && cost > 0) {
      Portfolio.add(sym, qty, cost);
      $('#p-symbol').value = '';
      $('#p-qty').value = '';
      $('#p-price').value = '';
    }
  });

  // Alert modal
  $('#alert-close').addEventListener('click', () => document.getElementById('alert-modal').classList.add('hidden'));
  $('#al-add-btn').addEventListener('click', () => {
    const sym  = $('#al-symbol').value.trim().toUpperCase();
    const dir  = $('#al-direction').value;
    const tgt  = $('#al-price').value;
    if (sym && tgt) {
      Alerts.add(sym, dir, tgt);
      $('#al-symbol').value = '';
      $('#al-price').value = '';
    }
  });

  // Add to watchlist button
  $('#add-watchlist-btn').addEventListener('click', () => {
    const sym = prompt('Enter symbol to add to watchlist:');
    if (sym) Watchlist.add(sym.toUpperCase());
  });

  // Screener run
  $('#run-screener').addEventListener('click', () => {
    const stocks = Screener.run({
      sector: $('#filter-sector').value,
      maxPE:  $('#filter-max-pe').value,
      minVol: $('#filter-min-vol').value,
    });
    Screener.render(stocks);
  });

  // Close autocomplete on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#command-bar') && !e.target.closest('#cmd-autocomplete')) {
      Autocomplete.hide();
    }
  });

  // Watchlist panel focus
  document.addEventListener('click', (e) => {
    const item = e.target.closest('.ticker-item');
    if (item) loadSymbol(item.dataset.sym);
  });
}

// ══════════════════════════════════════════════
// MAIN INIT
// ══════════════════════════════════════════════
async function init() {
  // Clock
  updateClock();
  setInterval(updateClock, 1000);

  // Bind all UI events
  bindEvents();

  // Init chart
  ChartMgr.init();

  // Initial data loads (parallel)
  await Promise.all([
    Watchlist.init(),
    CryptoPanel.start(),
    ForexPanel.start(),
  ]);

  // Other panels
  Indices.start();
  SectorMap.start();
  CommoditiesPanel.start();
  NewsFeed.start();
  EconomicsTab.render();
  Earnings.render();

  // Mini charts
  MiniCharts.init();

  // Load initial symbol
  await loadSymbol('BTC');

  // Portfolio & alerts
  Portfolio.load();
  Portfolio.render();
  Alerts.load();
  Alerts.render();

  // Check alerts periodically
  setInterval(() => Alerts.check(), 15000);

  // Refresh watchlist prices
  setInterval(() => Watchlist.render(), 15000);

  // Focus command input
  setTimeout(() => {
    $('#cmd-input').focus();
  }, 500);

  // Initial screener populate
  Screener.render(Screener.run({}));

  console.log('%cBLOOMBERG TERMINAL LOADED', 'color:#e8a200;font-size:16px;font-weight:bold;font-family:monospace');
  toast('Bloomberg Terminal loaded — type HELP for commands', 'success');
}

// Boot
document.addEventListener('DOMContentLoaded', init);
