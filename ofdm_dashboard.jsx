import { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ScatterChart, Scatter, BarChart, Bar, Cell,
  AreaChart, Area, ReferenceLine
} from "recharts";
import { Radio, Activity, Zap, Brain, FlaskConical, Download,
  Layers, Cpu, Wifi, BarChart2, Info, ChevronRight } from "lucide-react";

/* =========================================================
   FONTS & GLOBAL STYLES
   ========================================================= */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&family=Inter:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body { background: #020810; }

  .ofdm-app {
    font-family: 'Inter', sans-serif;
    background: #020810;
    color: #cbd5e1;
    min-height: 100vh;
    display: flex;
    overflow: hidden;
  }

  .grid-bg {
    background-image:
      linear-gradient(rgba(56,189,248,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(56,189,248,0.04) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .heading { font-family: 'Rajdhani', sans-serif; letter-spacing: 0.04em; }
  .mono    { font-family: 'Share Tech Mono', monospace; }

  /* Sidebar */
  .sidebar {
    width: 220px;
    min-height: 100vh;
    background: linear-gradient(180deg, #080f1e 0%, #050c19 100%);
    border-right: 1px solid #1e293b;
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 100;
    overflow-y: auto;
  }

  .sidebar-logo {
    padding: 20px 16px 16px;
    border-bottom: 1px solid #1e293b;
  }

  .sidebar-logo-text {
    font-family: 'Rajdhani', sans-serif;
    font-size: 18px;
    font-weight: 700;
    background: linear-gradient(90deg, #38bdf8, #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 0.08em;
  }

  .sidebar-subtitle {
    font-size: 9px;
    color: #475569;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-top: 2px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    cursor: pointer;
    border-radius: 0;
    transition: all 0.15s;
    border-left: 2px solid transparent;
    font-size: 13px;
    color: #64748b;
    text-decoration: none;
  }

  .nav-item:hover { background: rgba(56,189,248,0.06); color: #94a3b8; }

  .nav-item.active {
    background: linear-gradient(90deg, rgba(56,189,248,0.12), rgba(56,189,248,0.03));
    border-left-color: #38bdf8;
    color: #38bdf8;
  }

  .nav-label { font-family: 'Rajdhani', sans-serif; font-weight: 500; letter-spacing: 0.05em; font-size: 13px; }

  /* Main */
  .main-content {
    margin-left: 220px;
    flex: 1;
    min-height: 100vh;
    overflow-y: auto;
  }

  .top-bar {
    height: 52px;
    background: rgba(8,15,30,0.9);
    border-bottom: 1px solid #1e293b;
    display: flex;
    align-items: center;
    padding: 0 24px;
    gap: 12px;
    position: sticky;
    top: 0;
    z-index: 50;
    backdrop-filter: blur(8px);
  }

  .top-bar-pill {
    display: flex; align-items: center; gap: 6px;
    background: rgba(56,189,248,0.08);
    border: 1px solid rgba(56,189,248,0.2);
    border-radius: 20px;
    padding: 3px 10px;
    font-size: 11px;
    color: #38bdf8;
    font-family: 'Share Tech Mono', monospace;
  }

  .pulse-dot {
    width: 6px; height: 6px;
    background: #4ade80;
    border-radius: 50%;
    box-shadow: 0 0 6px #4ade80;
    animation: pulse 2s infinite;
  }

  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.85)} }

  .section-container { padding: 24px; max-width: 1400px; }

  /* Cards */
  .card {
    background: linear-gradient(135deg, #0f172a, #0b1526);
    border: 1px solid #1e293b;
    border-radius: 10px;
    padding: 20px;
    position: relative;
    overflow: hidden;
  }

  .card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(56,189,248,0.3), transparent);
  }

  .card-glow-cyan::after {
    content: '';
    position: absolute;
    top: -40px; right: -40px;
    width: 120px; height: 120px;
    background: rgba(56,189,248,0.05);
    border-radius: 50%;
    pointer-events: none;
  }

  .card-glow-purple::after {
    content: '';
    position: absolute;
    top: -40px; right: -40px;
    width: 120px; height: 120px;
    background: rgba(167,139,250,0.05);
    border-radius: 50%;
    pointer-events: none;
  }

  /* Section header */
  .section-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(56,189,248,0.08);
    border: 1px solid rgba(56,189,248,0.15);
    border-radius: 4px;
    padding: 3px 8px;
    font-size: 10px;
    color: #38bdf8;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-family: 'Share Tech Mono', monospace;
    margin-bottom: 8px;
  }

  .section-title {
    font-family: 'Rajdhani', sans-serif;
    font-size: 26px;
    font-weight: 700;
    color: #f1f5f9;
    letter-spacing: 0.05em;
    margin-bottom: 4px;
  }

  .section-desc { font-size: 13px; color: #475569; margin-bottom: 24px; line-height: 1.5; }

  /* Stat cards */
  .stat-card {
    background: linear-gradient(135deg, #0f172a, #0b1526);
    border: 1px solid #1e293b;
    border-radius: 8px;
    padding: 14px 18px;
  }

  .stat-value {
    font-family: 'Share Tech Mono', monospace;
    font-size: 22px;
    color: #38bdf8;
    line-height: 1;
  }

  .stat-label { font-size: 11px; color: #475569; margin-top: 4px; letter-spacing: 0.06em; text-transform: uppercase; }

  /* Toggle */
  .toggle-group { display: flex; gap: 4px; background: #0b1526; border: 1px solid #1e293b; border-radius: 6px; padding: 3px; }

  .toggle-btn {
    padding: 5px 14px;
    border-radius: 4px;
    font-size: 12px;
    font-family: 'Rajdhani', sans-serif;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.15s;
    letter-spacing: 0.05em;
    background: transparent;
    color: #475569;
  }

  .toggle-btn.active { background: rgba(56,189,248,0.15); color: #38bdf8; }
  .toggle-btn.active-purple { background: rgba(167,139,250,0.15); color: #a78bfa; }
  .toggle-btn.active-orange { background: rgba(249,115,22,0.15); color: #f97316; }

  /* Checkbox toggles */
  .check-toggle {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    border: 1px solid #1e293b;
    background: #0b1526;
    font-size: 12px;
    transition: all 0.15s;
    user-select: none;
  }

  .check-toggle.active-cyan  { border-color: rgba(56,189,248,0.4);  background: rgba(56,189,248,0.08);  color: #38bdf8; }
  .check-toggle.active-purple{ border-color: rgba(167,139,250,0.4); background: rgba(167,139,250,0.08); color: #a78bfa; }
  .check-toggle.active-orange{ border-color: rgba(249,115,22,0.4);  background: rgba(249,115,22,0.08);  color: #f97316; }
  .check-toggle.active-green { border-color: rgba(74,222,128,0.4);  background: rgba(74,222,128,0.08);  color: #4ade80; }

  /* Slider */
  .snr-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, #38bdf8, #1e293b);
    border-radius: 2px;
    outline: none;
    cursor: pointer;
  }

  .snr-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px; height: 16px;
    border-radius: 50%;
    background: #38bdf8;
    box-shadow: 0 0 8px rgba(56,189,248,0.6);
    cursor: pointer;
  }

  /* Block diagram */
  .block-node {
    background: linear-gradient(135deg, #0f172a, #131f3a);
    border: 1px solid #1e3a5f;
    border-radius: 8px;
    padding: 10px 16px;
    text-align: center;
    position: relative;
  }

  .block-arrow { color: #1e3a5f; font-size: 20px; }

  /* Equation box */
  .eq-box {
    background: #060e1d;
    border: 1px solid #1e293b;
    border-left: 3px solid #38bdf8;
    border-radius: 4px;
    padding: 10px 14px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 12px;
    color: #7dd3fc;
    line-height: 1.7;
  }

  /* Chart tooltip */
  .custom-tooltip {
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 6px;
    padding: 10px 14px;
    font-size: 12px;
    font-family: 'Share Tech Mono', monospace;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: #020810; }
  ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #2d3f5a; }

  /* Fade in */
  @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  .fade-in { animation: fadeInUp 0.4s ease forwards; }

  @keyframes scanline {
    0%{transform:translateY(-100%)} 100%{transform:translateY(100%)}
  }
`;

/* =========================================================
   SIMULATED DATA
   ========================================================= */
const SNR = [0,2,4,6,8,10,12,14,16,18,20];

const RAW_BER = {
  ai_awgn:      [0.352,0.272,0.187,0.113,0.056,0.022,0.0078,0.0021,0.00043,0.000072,0.0000098],
  qam_awgn:     [0.381,0.307,0.218,0.143,0.082,0.041,0.0165,0.0054, 0.00148,0.000320,0.0000560],
  ai_rayleigh:  [0.423,0.358,0.282,0.207,0.138,0.080,0.0405,0.0183, 0.00692,0.002180,0.000590],
  qam_rayleigh: [0.448,0.393,0.321,0.248,0.177,0.108,0.0595,0.0289, 0.01150,0.004200,0.001300],
};

const berData = SNR.map((snr,i)=>({
  snr,
  ai_awgn:      Math.log10(Math.max(RAW_BER.ai_awgn[i],1e-7)),
  qam_awgn:     Math.log10(Math.max(RAW_BER.qam_awgn[i],1e-7)),
  ai_rayleigh:  Math.log10(Math.max(RAW_BER.ai_rayleigh[i],1e-7)),
  qam_rayleigh: Math.log10(Math.max(RAW_BER.qam_rayleigh[i],1e-7)),
}));

const paprBarData = [
  { name:"Baseline", value:8.72 },
  { name:"SLM",      value:6.84 },
  { name:"Clipping", value:5.18 },
  { name:"Tone Res", value:7.41 },
];
const PAPR_COLORS = ["#38bdf8","#a78bfa","#f97316","#4ade80"];

const ccdfData = (() => {
  const xs = Array.from({length:50},(_,i)=>2+i*0.22);
  return xs.map(x=>({
    x:+x.toFixed(2),
    baseline: +Math.max(1-Math.pow(1-Math.exp(-Math.pow(10,x/10)/1.0),16),4e-4).toFixed(6),
    slm:      +Math.max(1-Math.pow(1-Math.exp(-Math.pow(10,x/10)/0.72),16),4e-4).toFixed(6),
    clipping: +Math.max(1-Math.pow(1-Math.exp(-Math.pow(10,x/10)/0.52),16),4e-4).toFixed(6),
    toneRes:  +Math.max(1-Math.pow(1-Math.exp(-Math.pow(10,x/10)/0.86),16),4e-4).toFixed(6),
  }));
})();

const ccdfLog = ccdfData.map(d=>({
  x:d.x,
  baseline: Math.log10(d.baseline),
  slm:      Math.log10(d.slm),
  clipping: Math.log10(d.clipping),
  toneRes:  Math.log10(d.toneRes),
}));

/* Loss curve */
const lossData = (() => {
  let prev=2.82;
  return Array.from({length:200},(_,i)=>{
    const e=i*10;
    const base=2.78*Math.exp(-0.0028*e)+0.215;
    const noise=(Math.sin(i*0.8+1.3)*0.05+Math.cos(i*0.4)*0.03)*Math.exp(-0.003*e);
    prev=prev*0.92+base*0.08;
    return {epoch:e, loss:+Math.max(base+noise,0.18).toFixed(4), smooth:+Math.max(prev,0.18).toFixed(4)};
  });
})();

/* Constellations */
const QAM16 = [
  [-3,-3],[-3,-1],[-3,1],[-3,3],
  [-1,-3],[-1,-1],[-1,1],[-1,3],
  [1,-3],[1,-1],[1,1],[1,3],
  [3,-3],[3,-1],[3,1],[3,3],
].map(([i,q],idx)=>({i:+(i/Math.sqrt(10)).toFixed(4),q:+(q/Math.sqrt(10)).toFixed(4),label:idx}));

const perturbSeeds = [0.12,-0.09,0.05,-0.13,0.08,-0.11,0.07,-0.04,0.06,-0.14,0.10,-0.07,0.09,-0.08,0.04,-0.11];
const AI_CONST = QAM16.map(({i,q,label},idx)=>({
  i:+(i+perturbSeeds[idx]*0.28).toFixed(4),
  q:+(q+perturbSeeds[(idx+5)%16]*0.22).toFixed(4),
  label
}));

/* Distance histogram */
const makeDists = (pts) => {
  const d=[];
  for(let a=0;a<pts.length;a++) for(let b=a+1;b<pts.length;b++)
    d.push(+Math.sqrt((pts[a].i-pts[b].i)**2+(pts[a].q-pts[b].q)**2).toFixed(3));
  return d;
};
const makeHist = (data,bins=14)=>{
  const mn=Math.min(...data),mx=Math.max(...data),w=(mx-mn)/bins;
  return Array.from({length:bins},(_,i)=>({
    bin:+(mn+i*w+w/2).toFixed(2),
    ai:data.filter(d=>d>=mn+i*w&&d<mn+(i+1)*w).length
  }));
};
const aiDists=makeDists(AI_CONST);
const qamDists=makeDists(QAM16);
const distHistData=makeHist(aiDists,14).map((d,i)=>({...d,qam:makeHist(qamDists,14)[i]?.ai||0}));

/* BER improvement */
const berImprovData = SNR.map((snr,i)=>({
  snr,
  awgn:  +(RAW_BER.qam_awgn[i]-RAW_BER.ai_awgn[i]).toFixed(5),
  rayleigh:+(RAW_BER.qam_rayleigh[i]-RAW_BER.ai_rayleigh[i]).toFixed(5),
}));

/* =========================================================
   REUSABLE COMPONENTS
   ========================================================= */

const SectionHeader = ({badge,icon:Icon,title,desc}) => (
  <div className="fade-in">
    <div className="section-badge"><Icon size={10}/>{badge}</div>
    <h2 className="section-title heading">{title}</h2>
    <p className="section-desc">{desc}</p>
  </div>
);

const Card = ({children,className="",style={}}) => (
  <div className={`card ${className}`} style={style}>{children}</div>
);

const CardTitle = ({children,accent="#38bdf8"}) => (
  <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:14,fontWeight:600,letterSpacing:"0.07em",color:accent,textTransform:"uppercase",marginBottom:12}}>{children}</div>
);

const StatCard = ({label,value,unit,accent="#38bdf8"}) => (
  <div className="stat-card">
    <div className="stat-value" style={{color:accent}}>{value}<span style={{fontSize:12,color:"#475569",marginLeft:4}}>{unit}</span></div>
    <div className="stat-label">{label}</div>
  </div>
);

const EqBox = ({children}) => <div className="eq-box">{children}</div>;

const BerTooltip = ({active,payload,label}) => {
  if(!active||!payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div style={{color:"#94a3b8",marginBottom:6}}>SNR = {label} dB</div>
      {payload.map(p=>(
        <div key={p.name} style={{color:p.color,marginBottom:2}}>
          {p.name}: 10<sup>{Math.round(p.value)}</sup>
        </div>
      ))}
    </div>
  );
};

const CCDFTooltip = ({active,payload,label}) => {
  if(!active||!payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div style={{color:"#94a3b8",marginBottom:6}}>PAPR = {label} dB</div>
      {payload.map(p=>(
        <div key={p.name} style={{color:p.color,marginBottom:2}}>
          {p.name}: 10<sup>{p.value?.toFixed(2)}</sup>
        </div>
      ))}
    </div>
  );
};

const DownloadBtn = ({label}) => (
  <button
    style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",
      background:"rgba(56,189,248,0.08)",border:"1px solid rgba(56,189,248,0.2)",
      borderRadius:5,fontSize:11,color:"#38bdf8",cursor:"pointer",fontFamily:"'Rajdhani',sans-serif",fontWeight:600,letterSpacing:"0.05em"}}
    onClick={()=>alert("Export: "+label+" (connect to backend for live data)")}
  >
    <Download size={11}/>{label}
  </button>
);

/* =========================================================
   SECTION: OVERVIEW
   ========================================================= */
const OverviewSection = () => (
  <div className="section-container fade-in">
    <SectionHeader
      badge="SYSTEM OVERVIEW"
      icon={Radio}
      title="AI-OFDM Communication System"
      desc="End-to-end learned OFDM system combining neural network-based constellation mapping, encoding, and equalization with traditional OFDM modulation."
    />

    {/* Stats row */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:24}}>
      {[
        {label:"Subcarriers",value:"N = 16",accent:"#38bdf8"},
        {label:"Cyclic Prefix",value:"CP = 4",accent:"#a78bfa"},
        {label:"Modulation",value:"16-QAM",accent:"#f97316"},
        {label:"Batch Size",value:"256",accent:"#4ade80"},
        {label:"Epochs",value:"2,000",accent:"#fbbf24"},
        {label:"Learning Rate",value:"0.001",accent:"#38bdf8"},
      ].map(s=>(
        <div key={s.label} className="stat-card">
          <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:18,color:s.accent}}>{s.value}</div>
          <div className="stat-label">{s.label}</div>
        </div>
      ))}
    </div>

    {/* Block Diagram */}
    <Card className="card-glow-cyan" style={{marginBottom:24}}>
      <CardTitle>Transmit / Receive Chain</CardTitle>
      <div style={{overflowX:"auto",paddingBottom:8}}>
        <div style={{display:"flex",alignItems:"center",gap:4,minWidth:780,justifyContent:"center",flexWrap:"nowrap"}}>
          {[
            {label:"Source Bits",sub:"Random M-ary",color:"#475569",accent:"#64748b"},
            null,
            {label:"Constellation\nMapper",sub:"AI Embedding",color:"#0c2240",accent:"#38bdf8"},
            null,
            {label:"Neural\nEncoder",sub:"256-unit MLP",color:"#0c2240",accent:"#38bdf8"},
            null,
            {label:"OFDM Mod",sub:"IFFT + CP",color:"#1a0c3a",accent:"#a78bfa"},
            null,
            {label:"Channel",sub:"AWGN / Rayleigh",color:"#1a200c",accent:"#f97316"},
            null,
            {label:"OFDM Demod",sub:"CP Remove + FFT",color:"#1a0c3a",accent:"#a78bfa"},
            null,
            {label:"Equalizer",sub:"Subcarrier NN",color:"#0c2240",accent:"#38bdf8"},
            null,
            {label:"Neural\nDecoder",sub:"256-unit MLP",color:"#0c2240",accent:"#38bdf8"},
            null,
            {label:"Decoded Bits",sub:"argmax output",color:"#475569",accent:"#4ade80"},
          ].map((node,idx)=>{
            if(!node) return <div key={idx} style={{color:"#1e3a5f",fontSize:18}}>→</div>;
            return (
              <div key={idx} style={{
                background:node.color==="#475569"?"rgba(255,255,255,0.03)":"linear-gradient(135deg,"+node.color+",rgba(0,0,0,0))",
                border:`1px solid ${node.accent}33`,
                borderRadius:8,padding:"10px 12px",textAlign:"center",minWidth:90,
                position:"relative",overflow:"hidden"
              }}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${node.accent},transparent)`}}/>
                <div style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:12,color:node.accent,whiteSpace:"pre-line",lineHeight:1.2}}>{node.label}</div>
                <div style={{fontSize:9,color:"#475569",marginTop:3}}>{node.sub}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>

    {/* Architecture cards + equations */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
      <Card>
        <CardTitle accent="#38bdf8">Neural Architecture</CardTitle>
        {[
          ["ConstellationMapper","Embedding(16,2)"],
          ["Encoder","Linear 32→256→256→32"],
          ["Equalizer","Per-subcarrier 2→16→2"],
          ["Decoder","Linear 32→256→256→256"],
        ].map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,padding:"6px 0",borderBottom:"1px solid #111d30"}}>
            <span style={{fontSize:12,color:"#94a3b8",fontFamily:"'Rajdhani',sans-serif",fontWeight:600}}>{k}</span>
            <span style={{fontSize:11,color:"#38bdf8",fontFamily:"'Share Tech Mono',monospace"}}>{v}</span>
          </div>
        ))}
      </Card>

      <Card>
        <CardTitle accent="#a78bfa">Key Equations</CardTitle>
        <EqBox>
          {"OFDM: x[n] = IFFT{X[k]}\n"}
          {"CP: x_cp = [x[N-Ncp:N], x]\n"}
          {"SNR: γ = P_signal / P_noise\n"}
          {"PAPR = max|x|² / E[|x|²]"}
        </EqBox>
      </Card>

      <Card>
        <CardTitle accent="#f97316">Channel Models</CardTitle>
        <EqBox>
          {"AWGN:    y = x + n\n"}
          {"         n ~ CN(0, σ²I)\n\n"}
          {"Rayleigh: y = h·x + n\n"}
          {"         h ~ CN(0, 1)\n"}
          {"         Equalized: y/h"}
        </EqBox>
      </Card>
    </div>
  </div>
);

/* =========================================================
   SECTION: CONSTELLATION
   ========================================================= */
const ConstellationSection = () => {
  const [mode, setMode] = useState("both");
  const [showLabels, setShowLabels] = useState(true);

  return (
    <div className="section-container fade-in">
      <SectionHeader badge="CONSTELLATION" icon={Layers} title="Constellation Visualization"
        desc="AI-learned vs classical 16-QAM symbol placement in the complex I-Q plane. The neural mapper optimizes symbol positions end-to-end for minimum BER."
      />

      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <div className="toggle-group">
          {["qam","ai","both"].map(m=>(
            <button key={m} className={`toggle-btn ${mode===m?"active":""}`} onClick={()=>setMode(m)}>
              {m==="qam"?"16-QAM":m==="ai"?"AI Learned":"Both"}
            </button>
          ))}
        </div>
        <div className={`check-toggle ${showLabels?"active-cyan":""}`} onClick={()=>setShowLabels(!showLabels)}>
          <span style={{width:8,height:8,borderRadius:2,background:showLabels?"#38bdf8":"#1e293b",display:"block"}}/>
          Symbol Labels
        </div>
        <div style={{marginLeft:"auto"}}><DownloadBtn label="Export PNG"/></div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        {/* Main scatter */}
        <Card className="card-glow-cyan" style={{gridColumn:"1/2"}}>
          <CardTitle>I-Q Plane</CardTitle>
          <div style={{position:"relative"}}>
            <svg width="100%" viewBox="-1.3 -1.3 2.6 2.6" style={{background:"radial-gradient(circle at 50% 50%,#0c1a2e,#060e1c)",borderRadius:8,border:"1px solid #1e293b"}}>
              {/* Grid lines */}
              {[-1,-0.5,0,0.5,1].map(v=>(
                <g key={v}>
                  <line x1={v} y1="-1.3" x2={v} y2="1.3" stroke="#1e293b" strokeWidth="0.01"/>
                  <line x1="-1.3" y1={v} x2="1.3" y2={v} stroke="#1e293b" strokeWidth="0.01"/>
                </g>
              ))}
              {/* Axes */}
              <line x1="-1.3" y1="0" x2="1.3" y2="0" stroke="#2d3f5a" strokeWidth="0.015"/>
              <line x1="0" y1="-1.3" x2="0" y2="1.3" stroke="#2d3f5a" strokeWidth="0.015"/>
              <text x="1.2" y="-0.05" fill="#475569" fontSize="0.08" fontFamily="Share Tech Mono">I</text>
              <text x="0.04" y="-1.2" fill="#475569" fontSize="0.08" fontFamily="Share Tech Mono">Q</text>

              {/* QAM points */}
              {(mode==="qam"||mode==="both") && QAM16.map(p=>(
                <g key={`q${p.label}`}>
                  <circle cx={p.i} cy={-p.q} r="0.055" fill="#38bdf8" fillOpacity="0.85"/>
                  <circle cx={p.i} cy={-p.q} r="0.09" fill="#38bdf8" fillOpacity="0.12"/>
                  {showLabels&&<text x={p.i+0.07} y={-p.q+0.05} fill="#38bdf8" fontSize="0.07" fontFamily="Share Tech Mono" opacity="0.8">{p.label}</text>}
                </g>
              ))}

              {/* AI points */}
              {(mode==="ai"||mode==="both") && AI_CONST.map(p=>(
                <g key={`a${p.label}`}>
                  <circle cx={p.i} cy={-p.q} r="0.055" fill="#f97316" fillOpacity="0.85"/>
                  <circle cx={p.i} cy={-p.q} r="0.09" fill="#f97316" fillOpacity="0.12"/>
                  {showLabels&&<text x={p.i+0.07} y={-p.q+0.05} fill="#f97316" fontSize="0.07" fontFamily="Share Tech Mono" opacity="0.8">{p.label}</text>}
                </g>
              ))}

              {/* Lines between QAM and AI when both */}
              {mode==="both" && QAM16.map((q,i)=>(
                <line key={`l${i}`} x1={q.i} y1={-q.q} x2={AI_CONST[i].i} y2={-AI_CONST[i].q}
                  stroke="#94a3b8" strokeWidth="0.008" strokeDasharray="0.04 0.03" opacity="0.4"/>
              ))}
            </svg>
          </div>
          <div style={{display:"flex",gap:16,marginTop:12,justifyContent:"center"}}>
            {(mode==="qam"||mode==="both")&&<div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#38bdf8"}}><span style={{width:10,height:10,borderRadius:"50%",background:"#38bdf8",display:"block"}}/> 16-QAM</div>}
            {(mode==="ai"||mode==="both")&&<div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#f97316"}}><span style={{width:10,height:10,borderRadius:"50%",background:"#f97316",display:"block"}}/> AI Learned</div>}
          </div>
        </Card>

        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {/* Distance distribution */}
          <Card>
            <CardTitle accent="#a78bfa">Minimum Distance Distribution</CardTitle>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={distHistData} margin={{top:4,right:4,bottom:4,left:-10}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                <XAxis dataKey="bin" tick={{fontSize:9,fill:"#475569"}} tickFormatter={v=>v.toFixed(1)}/>
                <YAxis tick={{fontSize:9,fill:"#475569"}}/>
                <Tooltip contentStyle={{background:"#0f172a",border:"1px solid #1e293b",fontSize:11}}/>
                <Bar dataKey="qam" fill="#38bdf8" fillOpacity={0.6} name="16-QAM"/>
                <Bar dataKey="ai"  fill="#f97316" fillOpacity={0.7} name="AI Learned"/>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Stats */}
          <Card>
            <CardTitle accent="#4ade80">Constellation Metrics</CardTitle>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[
                {label:"QAM Min Dist",value:(Math.min(...qamDists).toFixed(4)),accent:"#38bdf8"},
                {label:"AI Min Dist", value:(Math.min(...aiDists).toFixed(4)), accent:"#f97316"},
                {label:"QAM Avg Dist",value:(qamDists.reduce((a,b)=>a+b,0)/qamDists.length).toFixed(4),accent:"#38bdf8"},
                {label:"AI Avg Dist", value:(aiDists.reduce((a,b)=>a+b,0)/aiDists.length).toFixed(4), accent:"#f97316"},
              ].map(s=>(
                <div key={s.label} style={{background:"#060e1d",borderRadius:6,padding:"10px 12px"}}>
                  <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:16,color:s.accent}}>{s.value}</div>
                  <div style={{fontSize:10,color:"#475569",marginTop:2,letterSpacing:"0.06em",textTransform:"uppercase"}}>{s.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   SECTION: BER ANALYSIS
   ========================================================= */
const BERSection = () => {
  const [showAI,    setShowAI]    = useState(true);
  const [showQAM,   setShowQAM]   = useState(true);
  const [showAWGN,  setShowAWGN]  = useState(true);
  const [showRay,   setShowRay]   = useState(true);
  const [snrMark,   setSnrMark]   = useState(10);

  const berYTicks = [-6,-5,-4,-3,-2,-1,0];
  const fmtY = v => `10^${v}`;
  const fmtX = v => `${v}`;

  return (
    <div className="section-container fade-in">
      <SectionHeader badge="BER ANALYSIS" icon={BarChart2} title="Bit Error Rate vs SNR"
        desc="Comparison of AI-learned constellation vs classical 16-QAM across AWGN and Rayleigh fading channels. Y-axis in logarithmic scale."
      />

      {/* Controls */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        <div style={{fontSize:11,color:"#475569",fontFamily:"'Rajdhani',sans-serif",fontWeight:600,letterSpacing:"0.06em"}}>SYSTEM:</div>
        {[
          {key:"ai",label:"AI Learned",active:showAI,setActive:setShowAI,cls:"active-cyan"},
          {key:"qam",label:"16-QAM",active:showQAM,setActive:setShowQAM,cls:"active-orange"},
        ].map(t=>(
          <div key={t.key} className={`check-toggle ${t.active?t.cls:""}`} onClick={()=>t.setActive(!t.active)}>
            <span style={{width:8,height:8,borderRadius:2,background:t.active?(t.cls.includes("cyan")?"#38bdf8":"#f97316"):"#1e293b",display:"block"}}/>
            {t.label}
          </div>
        ))}
        <div style={{width:1,height:20,background:"#1e293b",margin:"0 4px"}}/>
        <div style={{fontSize:11,color:"#475569",fontFamily:"'Rajdhani',sans-serif",fontWeight:600,letterSpacing:"0.06em"}}>CHANNEL:</div>
        {[
          {key:"awgn",label:"AWGN",active:showAWGN,setActive:setShowAWGN,cls:"active-cyan"},
          {key:"ray",label:"Rayleigh",active:showRay,setActive:setShowRay,cls:"active-purple"},
        ].map(t=>(
          <div key={t.key} className={`check-toggle ${t.active?t.cls:""}`} onClick={()=>t.setActive(!t.active)}>
            <span style={{width:8,height:8,borderRadius:2,background:t.active?(t.cls.includes("cyan")?"#38bdf8":"#a78bfa"):"#1e293b",display:"block"}}/>
            {t.label}
          </div>
        ))}
        <div style={{marginLeft:"auto"}}><DownloadBtn label="Export CSV"/></div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16}}>
        <Card className="card-glow-cyan">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <CardTitle>BER vs SNR (Log Scale)</CardTitle>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:11,color:"#475569"}}>SNR Marker:</span>
              <input type="range" min={0} max={20} step={2} value={snrMark} onChange={e=>setSnrMark(+e.target.value)}
                className="snr-slider" style={{width:100}}/>
              <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:12,color:"#38bdf8",minWidth:30}}>{snrMark} dB</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={berData} margin={{top:4,right:16,bottom:20,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
              <XAxis dataKey="snr" label={{value:"SNR (dB)",position:"insideBottom",offset:-10,fill:"#64748b",fontSize:12}} tick={{fontSize:11,fill:"#475569"}} tickFormatter={fmtX}/>
              <YAxis domain={[-6.5,0.5]} ticks={berYTicks} tickFormatter={fmtY} tick={{fontSize:10,fill:"#475569"}}
                label={{value:"BER",angle:-90,position:"insideLeft",offset:10,fill:"#64748b",fontSize:12}}/>
              <Tooltip content={<BerTooltip/>}/>
              <Legend wrapperStyle={{fontSize:11,color:"#94a3b8",paddingTop:8}}/>
              <ReferenceLine x={snrMark} stroke="#fbbf24" strokeDasharray="5 3" strokeWidth={1.5}/>
              {showAI&&showAWGN&&<Line type="monotone" dataKey="ai_awgn" name="AI AWGN" stroke="#38bdf8" strokeWidth={2} dot={{r:3,fill:"#38bdf8"}} activeDot={{r:5}}/>}
              {showQAM&&showAWGN&&<Line type="monotone" dataKey="qam_awgn" name="QAM AWGN" stroke="#f97316" strokeWidth={2} strokeDasharray="6 3" dot={{r:3,fill:"#f97316"}} activeDot={{r:5}}/>}
              {showAI&&showRay&&<Line type="monotone" dataKey="ai_rayleigh" name="AI Rayleigh" stroke="#a78bfa" strokeWidth={2} dot={{r:3,fill:"#a78bfa"}} activeDot={{r:5}}/>}
              {showQAM&&showRay&&<Line type="monotone" dataKey="qam_rayleigh" name="QAM Rayleigh" stroke="#4ade80" strokeWidth={2} strokeDasharray="6 3" dot={{r:3,fill:"#4ade80"}} activeDot={{r:5}}/>}
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card>
            <CardTitle accent="#38bdf8">BER @ Marker SNR</CardTitle>
            {(()=>{
              const idx=SNR.indexOf(snrMark);
              if(idx<0) return null;
              return [
                {label:"AI AWGN",    v:RAW_BER.ai_awgn[idx],    accent:"#38bdf8"},
                {label:"QAM AWGN",   v:RAW_BER.qam_awgn[idx],   accent:"#f97316"},
                {label:"AI Rayleigh",v:RAW_BER.ai_rayleigh[idx], accent:"#a78bfa"},
                {label:"QAM Rayleigh",v:RAW_BER.qam_rayleigh[idx],accent:"#4ade80"},
              ].map(r=>(
                <div key={r.label} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #111d30"}}>
                  <span style={{fontSize:11,color:"#64748b",fontFamily:"'Rajdhani',sans-serif",fontWeight:600}}>{r.label}</span>
                  <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:r.accent}}>
                    {r.v>=0.01?r.v.toFixed(4):r.v.toExponential(2)}
                  </span>
                </div>
              ));
            })()}
          </Card>
          <Card>
            <CardTitle accent="#4ade80">AI Gain over QAM</CardTitle>
            {(()=>{
              const idx=SNR.indexOf(snrMark);
              if(idx<0) return null;
              const gainAWGN = (RAW_BER.qam_awgn[idx]-RAW_BER.ai_awgn[idx]);
              const gainRay  = (RAW_BER.qam_rayleigh[idx]-RAW_BER.ai_rayleigh[idx]);
              return (
                <div style={{display:"grid",gap:10}}>
                  {[{label:"AWGN Reduction",v:gainAWGN,acc:"#38bdf8"},{label:"Rayleigh Reduction",v:gainRay,acc:"#a78bfa"}].map(g=>(
                    <div key={g.label} style={{background:"#060e1d",borderRadius:6,padding:"10px 12px"}}>
                      <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:18,color:g.acc}}>
                        {g.v>=0?"↓":"↑"} {Math.abs(g.v).toExponential(2)}
                      </div>
                      <div style={{fontSize:10,color:"#475569",marginTop:2,textTransform:"uppercase",letterSpacing:"0.06em"}}>{g.label}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </Card>
          <Card>
            <CardTitle accent="#fbbf24">Reference</CardTitle>
            <EqBox>{"BER₁₆QAM ≈\n  3/8 · erfc(√(4γ/5))\n\nγ = E_b/N_0 per bit"}</EqBox>
          </Card>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   SECTION: PAPR ANALYSIS
   ========================================================= */
const PAPRSection = () => {
  const [showBase,   setShowBase]   = useState(true);
  const [showSLM,    setShowSLM]    = useState(true);
  const [showClip,   setShowClip]   = useState(true);
  const [showToneRes,setShowToneRes]= useState(true);

  return (
    <div className="section-container fade-in">
      <SectionHeader badge="PAPR ANALYSIS" icon={Zap} title="Peak-to-Average Power Ratio"
        desc="PAPR reduction technique comparison using CCDF plots and average PAPR bar chart. Lower PAPR means better power amplifier efficiency."
      />

      <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        {[
          {label:"Baseline",  active:showBase,   set:setShowBase,   cls:"active-cyan"},
          {label:"SLM",       active:showSLM,    set:setShowSLM,    cls:"active-purple"},
          {label:"Clipping",  active:showClip,   set:setShowClip,   cls:"active-orange"},
          {label:"Tone Res.", active:showToneRes, set:setShowToneRes,cls:"active-green"},
        ].map(t=>(
          <div key={t.label} className={`check-toggle ${t.active?t.cls:""}`} onClick={()=>t.set(!t.active)}>
            <span style={{width:8,height:8,borderRadius:2,background:t.active?(
              t.cls.includes("cyan")?"#38bdf8":t.cls.includes("purple")?"#a78bfa":t.cls.includes("orange")?"#f97316":"#4ade80"
            ):"#1e293b",display:"block"}}/>
            {t.label}
          </div>
        ))}
        <div style={{marginLeft:"auto"}}><DownloadBtn label="Export CSV"/></div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16}}>
        {/* CCDF chart */}
        <Card className="card-glow-purple">
          <CardTitle accent="#a78bfa">CCDF: Pr(PAPR &gt; x) — Log Scale</CardTitle>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={ccdfLog} margin={{top:4,right:16,bottom:20,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
              <XAxis dataKey="x" label={{value:"PAPR (dB)",position:"insideBottom",offset:-10,fill:"#64748b",fontSize:12}} tick={{fontSize:10,fill:"#475569"}}/>
              <YAxis domain={[-4.5,0.5]} ticks={[-4,-3,-2,-1,0]}
                tickFormatter={v=>`10^${v}`}
                label={{value:"CCDF",angle:-90,position:"insideLeft",offset:10,fill:"#64748b",fontSize:12}}
                tick={{fontSize:10,fill:"#475569"}}/>
              <Tooltip content={<CCDFTooltip/>}/>
              <Legend wrapperStyle={{fontSize:11,color:"#94a3b8",paddingTop:8}}/>
              {showBase&&   <Line type="monotone" dataKey="baseline" name="Baseline"    stroke="#38bdf8" strokeWidth={2} dot={false}/>}
              {showSLM&&    <Line type="monotone" dataKey="slm"      name="SLM"         stroke="#a78bfa" strokeWidth={2} dot={false}/>}
              {showClip&&   <Line type="monotone" dataKey="clipping" name="Clipping"    stroke="#f97316" strokeWidth={2} dot={false}/>}
              {showToneRes&&<Line type="monotone" dataKey="toneRes"  name="Tone Res."   stroke="#4ade80" strokeWidth={2} dot={false}/>}
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {/* Bar chart */}
          <Card>
            <CardTitle accent="#f97316">Mean PAPR Comparison</CardTitle>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={paprBarData} margin={{top:4,right:4,bottom:4,left:-18}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                <XAxis dataKey="name" tick={{fontSize:10,fill:"#64748b"}}/>
                <YAxis domain={[0,12]} tick={{fontSize:10,fill:"#475569"}} tickFormatter={v=>`${v}dB`}/>
                <Tooltip contentStyle={{background:"#0f172a",border:"1px solid #1e293b",fontSize:11}} formatter={v=>[`${v} dB`,"PAPR"]}/>
                <Bar dataKey="value" radius={[3,3,0,0]}>
                  {paprBarData.map((_,i)=><Cell key={i} fill={PAPR_COLORS[i]} fillOpacity={0.85}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Reduction gains */}
          <Card>
            <CardTitle accent="#4ade80">Reduction vs Baseline</CardTitle>
            {paprBarData.slice(1).map((d,i)=>{
              const gain = (paprBarData[0].value - d.value).toFixed(2);
              return (
                <div key={d.name} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:12,color:"#94a3b8",fontFamily:"'Rajdhani',sans-serif",fontWeight:600}}>{d.name}</span>
                    <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:12,color:PAPR_COLORS[i+1]}}>-{gain} dB</span>
                  </div>
                  <div style={{height:4,background:"#0b1526",borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${(gain/paprBarData[0].value)*100}%`,background:PAPR_COLORS[i+1],borderRadius:2}}/>
                  </div>
                </div>
              );
            })}
          </Card>

          <Card>
            <CardTitle accent="#a78bfa">PAPR Equation</CardTitle>
            <EqBox>{"PAPR =\n  max|x(t)|²\n  ─────────\n  (1/T)∫|x(t)|²dt\n\nIn dB:\n  PAPR_dB = 10·log₁₀(PAPR)"}</EqBox>
          </Card>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   SECTION: AI MODEL INSIGHTS
   ========================================================= */
const ModelSection = () => {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="section-container fade-in">
      <SectionHeader badge="AI MODEL" icon={Brain} title="Neural Network Insights"
        desc="Training convergence, learned constellation evolution, and architectural details of the end-to-end learned OFDM system."
      />

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        {/* Loss curve */}
        <Card className="card-glow-purple">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <CardTitle accent="#a78bfa">Training Loss (Cross-Entropy)</CardTitle>
            <div className={`check-toggle ${showRaw?"active-purple":""}`} onClick={()=>setShowRaw(!showRaw)} style={{fontSize:11}}>
              <span style={{width:7,height:7,borderRadius:1,background:showRaw?"#a78bfa":"#1e293b",display:"block"}}/>
              Raw Loss
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={lossData} margin={{top:4,right:16,bottom:20,left:4}}>
              <defs>
                <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
              <XAxis dataKey="epoch" label={{value:"Epoch",position:"insideBottom",offset:-10,fill:"#64748b",fontSize:12}} tick={{fontSize:10,fill:"#475569"}}/>
              <YAxis domain={[0,3]} tick={{fontSize:10,fill:"#475569"}} label={{value:"Loss",angle:-90,position:"insideLeft",offset:10,fill:"#64748b",fontSize:12}}/>
              <Tooltip contentStyle={{background:"#0f172a",border:"1px solid #1e293b",fontSize:11}} formatter={v=>[v.toFixed(4),"Loss"]}/>
              <Area type="monotone" dataKey="smooth" name="Smoothed" stroke="#a78bfa" strokeWidth={2} fill="url(#lg1)"/>
              {showRaw&&<Line type="monotone" dataKey="loss" name="Raw" stroke="#a78bfa" strokeWidth={1} strokeOpacity={0.4} dot={false}/>}
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Architecture diagram */}
        <Card>
          <CardTitle accent="#38bdf8">Encoder-Decoder Architecture</CardTitle>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[
              {name:"Input: Constellation Points",size:"(B, 32)",color:"#38bdf8"},
              {name:"Linear 32 → 256 + ReLU",size:"256",color:"#7dd3fc"},
              {name:"Linear 256 → 256 + ReLU",size:"256",color:"#7dd3fc"},
              {name:"Linear 256 → 32",size:"(B, 32)",color:"#38bdf8"},
              {name:"Power Normalization",size:"‖·‖=1",color:"#fbbf24"},
              {name:"Complex Reshape (B, 16, 2)",size:"→ OFDM",color:"#a78bfa"},
            ].map((l,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:24,height:24,borderRadius:"50%",border:`2px solid ${l.color}`,display:"flex",alignItems:"center",justifyContent:"center",
                  fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:l.color,flexShrink:0}}>{i+1}</div>
                <div style={{flex:1,background:"#060e1d",borderRadius:5,padding:"6px 10px",borderLeft:`2px solid ${l.color}33`}}>
                  <div style={{fontSize:12,color:"#94a3b8",fontFamily:"'Rajdhani',sans-serif",fontWeight:600}}>{l.name}</div>
                </div>
                <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:l.color,minWidth:50,textAlign:"right"}}>{l.size}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
        {/* Final stats */}
        {[
          {label:"Final Training Loss",value:"0.223",unit:"nats",accent:"#a78bfa"},
          {label:"Total Parameters",value:"~198K",unit:"params",accent:"#38bdf8"},
          {label:"Training SNR",value:"15 dB",unit:"AWGN",accent:"#f97316"},
        ].map(s=>(
          <Card key={s.label}>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:26,color:s.accent,marginBottom:6}}>{s.value}</div>
            <div style={{fontSize:10,color:"#475569",textTransform:"uppercase",letterSpacing:"0.07em"}}>{s.label}</div>
            <div style={{fontSize:10,color:s.accent+"88",marginTop:2}}>{s.unit}</div>
          </Card>
        ))}
      </div>
    </div>
  );
};

/* =========================================================
   SECTION: ADVANCED INSIGHTS
   ========================================================= */
const AdvancedSection = () => (
  <div className="section-container fade-in">
    <SectionHeader badge="ADVANCED" icon={FlaskConical} title="Advanced Analysis"
      desc="BER improvement gain, PAPR CDF, and error reduction visualization — research-grade metrics for system evaluation."
    />

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
      {/* BER improvement */}
      <Card className="card-glow-cyan">
        <CardTitle>BER Improvement: AI over 16-QAM</CardTitle>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={berImprovData} margin={{top:4,right:16,bottom:20,left:10}}>
            <defs>
              <linearGradient id="lg2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="lg3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
            <XAxis dataKey="snr" label={{value:"SNR (dB)",position:"insideBottom",offset:-10,fill:"#64748b",fontSize:12}} tick={{fontSize:10,fill:"#475569"}}/>
            <YAxis tick={{fontSize:10,fill:"#475569"}} label={{value:"ΔBER",angle:-90,position:"insideLeft",offset:10,fill:"#64748b",fontSize:12}}/>
            <Tooltip contentStyle={{background:"#0f172a",border:"1px solid #1e293b",fontSize:11}}/>
            <Legend wrapperStyle={{fontSize:11,color:"#94a3b8",paddingTop:8}}/>
            <Area type="monotone" dataKey="awgn"     name="AWGN Gain"     stroke="#38bdf8" strokeWidth={2} fill="url(#lg2)"/>
            <Area type="monotone" dataKey="rayleigh" name="Rayleigh Gain" stroke="#a78bfa" strokeWidth={2} fill="url(#lg3)"/>
            <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 2"/>
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* PAPR CDF */}
      <Card className="card-glow-purple">
        <CardTitle accent="#a78bfa">PAPR CDF (Cumulative Distribution)</CardTitle>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={ccdfData.map(d=>({x:d.x,baseline:1-d.baseline,slm:1-d.slm,clipping:1-d.clipping,toneRes:1-d.toneRes}))}
            margin={{top:4,right:16,bottom:20,left:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
            <XAxis dataKey="x" label={{value:"PAPR (dB)",position:"insideBottom",offset:-10,fill:"#64748b",fontSize:12}} tick={{fontSize:10,fill:"#475569"}}/>
            <YAxis domain={[0,1]} tickFormatter={v=>v.toFixed(1)} tick={{fontSize:10,fill:"#475569"}}
              label={{value:"CDF",angle:-90,position:"insideLeft",offset:10,fill:"#64748b",fontSize:12}}/>
            <Tooltip contentStyle={{background:"#0f172a",border:"1px solid #1e293b",fontSize:11}} formatter={v=>[v.toFixed(4)]}/>
            <Legend wrapperStyle={{fontSize:11,color:"#94a3b8",paddingTop:8}}/>
            <Line type="monotone" dataKey="baseline" name="Baseline"   stroke="#38bdf8" strokeWidth={2} dot={false}/>
            <Line type="monotone" dataKey="slm"      name="SLM"        stroke="#a78bfa" strokeWidth={2} dot={false}/>
            <Line type="monotone" dataKey="clipping" name="Clipping"   stroke="#f97316" strokeWidth={2} dot={false}/>
            <Line type="monotone" dataKey="toneRes"  name="Tone Res."  stroke="#4ade80" strokeWidth={2} dot={false}/>
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>

    {/* Summary table */}
    <Card>
      <CardTitle>System Performance Summary</CardTitle>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'Share Tech Mono',monospace",fontSize:12}}>
          <thead>
            <tr style={{borderBottom:"1px solid #1e3a5f"}}>
              {["Metric","AI AWGN","16-QAM AWGN","AI Rayleigh","QAM Rayleigh","AI Gain"].map(h=>(
                <th key={h} style={{padding:"10px 14px",textAlign:"left",color:"#38bdf8",fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:12,letterSpacing:"0.06em",textTransform:"uppercase"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              {metric:"BER @ 0dB", vals:["0.352","0.381","0.423","0.448"], gain:"+0.029"},
              {metric:"BER @ 10dB",vals:["0.022","0.041","0.080","0.108"], gain:"+0.019"},
              {metric:"BER @ 20dB",vals:["9.8e-6","5.6e-5","5.9e-4","1.3e-3"],gain:"+4.6e-5"},
            ].map((r,i)=>(
              <tr key={i} style={{borderBottom:"1px solid #0f1c2e",background:i%2===0?"transparent":"rgba(14,27,50,0.3)"}}>
                <td style={{padding:"9px 14px",color:"#94a3b8",fontFamily:"'Rajdhani',sans-serif",fontWeight:600}}>{r.metric}</td>
                {r.vals.map((v,j)=>(
                  <td key={j} style={{padding:"9px 14px",color:j%2===0?"#38bdf8":"#f97316"}}>{v}</td>
                ))}
                <td style={{padding:"9px 14px",color:"#4ade80"}}>{r.gain}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  </div>
);

/* =========================================================
   NAV CONFIG
   ========================================================= */
const NAV = [
  {id:"overview",     icon:Radio,     label:"System Overview"},
  {id:"constellation",icon:Layers,    label:"Constellation"},
  {id:"ber",          icon:BarChart2, label:"BER Analysis"},
  {id:"papr",         icon:Zap,       label:"PAPR Analysis"},
  {id:"model",        icon:Brain,     label:"AI Model"},
  {id:"advanced",     icon:FlaskConical,label:"Advanced"},
];

/* =========================================================
   MAIN APP
   ========================================================= */
export default function App() {
  const [section, setSection] = useState("overview");

  const content = {
    overview:      <OverviewSection/>,
    constellation: <ConstellationSection/>,
    ber:           <BERSection/>,
    papr:          <PAPRSection/>,
    model:         <ModelSection/>,
    advanced:      <AdvancedSection/>,
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="ofdm-app grid-bg">

        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-text">AI-OFDM</div>
            <div className="sidebar-subtitle">Research Dashboard v1.0</div>
          </div>

          <nav style={{padding:"12px 0",flex:1}}>
            {NAV.map(({id,icon:Icon,label})=>(
              <div key={id} className={`nav-item ${section===id?"active":""}`} onClick={()=>setSection(id)}>
                <Icon size={15}/>
                <span className="nav-label">{label}</span>
                {section===id&&<ChevronRight size={12} style={{marginLeft:"auto"}}/>}
              </div>
            ))}
          </nav>

          <div style={{padding:"12px 16px",borderTop:"1px solid #1e293b"}}>
            <div style={{fontSize:10,color:"#334155",fontFamily:"'Share Tech Mono',monospace",lineHeight:1.6}}>
              PyTorch · FastAPI<br/>
              16-QAM · N=16 · CP=4<br/>
              AWGN + Rayleigh
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="main-content">
          <header className="top-bar">
            <div className="pulse-dot"/>
            <span style={{fontSize:13,fontFamily:"'Rajdhani',sans-serif",fontWeight:600,color:"#94a3b8",letterSpacing:"0.05em"}}>
              {NAV.find(n=>n.id===section)?.label}
            </span>
            <div style={{flex:1}}/>
            <div className="top-bar-pill"><Cpu size={10}/>PyTorch Backend</div>
            <div className="top-bar-pill"><Wifi size={10}/>Simulation Active</div>
            <div className="top-bar-pill"><Activity size={10}/>SNR 0–20 dB</div>
          </header>

          <div key={section}>
            {content[section]}
          </div>
        </div>
      </div>
    </>
  );
}
