// src/pages/InspectionDashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import { io } from "socket.io-client";
import "../components/Dashboard.css";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import api from "../api";

export default function InspectionDashboard() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    year: "All",
    month: "All",
    inspector: "All",
    status: "All",
  });

  // WebSocket setup
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_BASE_URL || "https://data-production-bc01.up.railway.app/api", {
      transports: ["websocket"],
    });
    socket.on("inspection:update", fetchData);
    return () => socket.disconnect();
  }, []);

  // Fetch API data
  const fetchData = () => {
    setLoading(true);
    api.get("/inspections")
      .then((res) => {
        const sorted = res.data?.sort((a,b)=> new Date(a.inspectionDate)-new Date(b.inspectionDate));
        const cleaned = sorted.map(d=>({
          ...d,
          year: d.year || new Date(d.inspectionDate).getFullYear(),
          month: d.month || "Self Set",
          inspectorName: d.inspectorName || "Self Set",
          inspectionStatus: d.inspectionStatus || "Self Set",
        }));
        setData(cleaned);
        setFilteredData(cleaned);
      })
      .catch(console.error)
      .finally(()=>setLoading(false));
  };

  useEffect(()=>{ fetchData() }, []);

  // Apply filters
useEffect(() => {
  let result = data;

  if (filters.year !== "All") 
    result = result.filter(d => d.year === Number(filters.year));

  if (filters.month !== "All") 
    result = result.filter(d => d.month === filters.month);

  if (filters.inspector !== "All") 
    result = result.filter(d => d.inspectorName === filters.inspector);

  if (filters.status !== "All") 
    result = result.filter(d => d.inspectionStatus === filters.status);

  setFilteredData(result);
}, [filters, data]);


  // KPI metrics
  const kpi = useMemo(()=>{
    const total = filteredData.length;
    const totalPass = filteredData.reduce((s,d)=>s+(d.pass||0),0);
    const totalFail = filteredData.reduce((s,d)=>s+(d.fail||0),0);
    const totalAbort = filteredData.reduce((s,d)=>s+(d.abort||0),0);
    const totalPending = filteredData.reduce((s,d)=>s+(d.pending||0),0);
    const totalInspections = totalPass+totalFail+totalAbort+totalPending;
    const passRate = totalInspections ? ((totalPass/totalInspections)*100).toFixed(1):0;
    return { total, totalPass, totalFail, totalAbort, totalPending, passRate };
  }, [filteredData]);

  // Monthly summary
  const monthlyStats = useMemo(()=>{
    const grouped={};
    filteredData.forEach(d=>{
      const key=d.month||"Self Set";
      if(!grouped[key]) grouped[key]={month:key, pass:0, fail:0, abort:0, pending:0};
      grouped[key].pass += d.pass||0;
      grouped[key].fail += d.fail||0;
      grouped[key].abort += d.abort||0;
      grouped[key].pending += d.pending||0;
    });
    return Object.values(grouped);
  }, [filteredData]);

  // Defect Radar
  const defectRadar = useMemo(()=>{
    const sum = f=>filteredData.reduce((t,d)=>t+(d[f]||0),0);
    return [
      { type: "Major", count: sum("major") },
      { type: "Minor", count: sum("minor") },
      { type: "Critical", count: sum("critical") },
      { type: "Actual Major", count: sum("actualMajor") },
      { type: "Actual Minor", count: sum("actualMinor") },
      { type: "Actual OQL", count: sum("actualOql") },
    ];
  }, [filteredData]);

  // Defects Distribution
  const defectsDistribution = useMemo(()=>{
    const allMajor=["pulledTerry","rawEdge","weaving","uncutThread","stainMajor","skipStitch","brokenStitch","runoffStitch","poorShape","pleat","insecureLabel","missingLabel","contaminationMajor","slantLabel","damageFabric","hole","looseStitch"];
    const allMinor=["singleUntrimmedThread","contaminationMinor","flyYarn","dustMark","stainMinor"];
    const sum=f=>filteredData.reduce((t,d)=>t+(d[f]||0),0);
    const majorData=allMajor.map(k=>({name:k, Major:sum(k)})).filter(x=>x.Major>0);
    const minorData=allMinor.map(k=>({name:k, Minor:sum(k)})).filter(x=>x.Minor>0);
    return [...majorData,...minorData];
  }, [filteredData]);

  // Pie chart
  const statusPie = useMemo(()=>[
    {name:"Pass", value:kpi.totalPass},
    {name:"Fail", value:kpi.totalFail},
    {name:"Abort", value:kpi.totalAbort},
    {name:"Pending", value:kpi.totalPending},
  ], [kpi]);

  // Inspector-based stats
  const inspectorStats = useMemo(()=>{
    const grouped = {};
    filteredData.forEach(d=>{
      const key = d.inspectorName || "Self Set";
      if(!grouped[key]) grouped[key] = { inspectorName: key, pass: 0, fail: 0 };
      grouped[key].pass += d.pass || 0;
      grouped[key].fail += d.fail || 0;
    });
    return Object.values(grouped);
  }, [filteredData]);

  // Chart 1: Critical Defects Trend
  const criticalTrend = useMemo(()=>{
    const grouped={};
    filteredData.forEach(d=>{
      const key=d.month||"Self Set";
      if(!grouped[key]) grouped[key]={month:key, critical:0};
      grouped[key].critical += d.critical || 0;
    });
    return Object.values(grouped);
  }, [filteredData]);

  // Chart 2: Major vs Minor Defects Ratio per Month
  const defectsRatio = useMemo(()=>{
    const grouped={};
    filteredData.forEach(d=>{
      const key=d.month||"Self Set";
      if(!grouped[key]) grouped[key]={month:key, Major:0, Minor:0};
      grouped[key].Major += d.major || 0;
      grouped[key].Minor += d.minor || 0;
    });
    return Object.values(grouped);
  }, [filteredData]);

  // Chart 3: Inspector Efficiency
  const inspectorEfficiency = useMemo(()=>{
    const grouped = {};
    filteredData.forEach(d=>{
      const key=d.inspectorName||"Self Set";
      if(!grouped[key]) grouped[key]={inspectorName:key, pass:0, fail:0, total:0};
      grouped[key].pass += d.pass||0;
      grouped[key].fail += d.fail||0;
      grouped[key].total += (d.pass||0)+(d.fail||0)+(d.abort||0)+(d.pending||0);
    });
    return Object.values(grouped).map(g=>({
      ...g,
      passRate: g.total ? ((g.pass/g.total)*100).toFixed(1) : 0
    }));
  }, [filteredData]);

  // Chart 4: Defects by Inspector
  const defectsByInspector = useMemo(()=>{
    const grouped = {};
    filteredData.forEach(d=>{
      const key=d.inspectorName||"Self Set";
      if(!grouped[key]) grouped[key]={inspectorName:key, major:0, minor:0, critical:0};
      grouped[key].major += d.major||0;
      grouped[key].minor += d.minor||0;
      grouped[key].critical += d.critical||0;
    });
    return Object.values(grouped);
  }, [filteredData]);

  // Chart 5: Status Trend (Abort & Pending)
  const statusTrend = useMemo(()=>{
    const grouped={};
    filteredData.forEach(d=>{
      const key=d.month||"Self Set";
      if(!grouped[key]) grouped[key]={month:key, abort:0, pending:0};
      grouped[key].abort += d.abort||0;
      grouped[key].pending += d.pending||0;
    });
    return Object.values(grouped);
  }, [filteredData]);

  const months = ["All", ...new Set(data.map(d=>d.month || "Self Set"))];
  const inspectors = ["All", ...new Set(data.map(d=>d.inspectorName || "Self Set"))];
  const statuses = ["All", ...new Set(data.map(d=>d.inspectionStatus || "Self Set"))];
  const years = ["All", ...new Set(data.map(d=>d.year))];

  if(loading) return <div className="text-center text-gray-400 p-20 text-xl">Loading...</div>;

  return (
    <div className="flex flex-col p-8 min-h-screen bg-slate-900 text-gray-100 font-sans gap-8">

      {/* Filters */}
      <div className="filters-section">
        {[
          { name: "year", label: "Year", options: years },
          { name: "month", label: "Month", options: months },
          { name: "inspector", label: "Inspector", options: inspectors },
          { name: "status", label: "Status", options: statuses }
        ].map(f=>(
          <div key={f.name} className="filter-group">
            <label>{f.label}</label>
            <select value={filters[f.name]} onChange={e=>setFilters({...filters,[f.name]:e.target.value})} className="filter-btn">
              {f.options.map(opt=><option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        ))}
      </div>

      {/* KPI */}
      <div className="kpi-section">
        {[{title:"Total",value:kpi.total},
          {title:"Passed",value:kpi.totalPass},
          {title:"Failed",value:kpi.totalFail},
          {title:"Aborted",value:kpi.totalAbort},
          {title:"Pass Rate (%)",value:kpi.passRate}].map(c=>(
          <div key={c.title} className="kpi-card">
            <h2 className="kpi-title">{c.title}</h2>
            <p className="kpi-value">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-section">
        <ChartCard title="Monthly Status Overview" chartKpis={[
          {title:"Total",value:kpi.total},
          {title:"Passed",value:kpi.totalPass},
          {title:"Failed",value:kpi.totalFail},
          {title:"Aborted",value:kpi.totalAbort},
          {title:"Pass Rate",value:kpi.passRate}
        ]}>
          <BarChartComponent data={monthlyStats}/>
        </ChartCard>

        <ChartCard title="Defect Category Radar" chartKpis={[
          {title:"Major",value:defectRadar[0].count},
          {title:"Minor",value:defectRadar[1].count},
          {title:"Critical",value:defectRadar[2].count}
        ]}>
          <RadarChartComponent data={defectRadar}/>
        </ChartCard>

        <ChartCard title="Defects Distribution" chartKpis={[
          {title:"Major Defects",value:defectsDistribution.reduce((a,c)=>a+(c.Major||0),0)},
          {title:"Minor Defects",value:defectsDistribution.reduce((a,c)=>a+(c.Minor||0),0)}
        ]}>
          <DefectsBarChart data={defectsDistribution}/>
        </ChartCard>

        <ChartCard title="Inspection Status Ratio" chartKpis={[
          {title:"Pass",value:kpi.totalPass},
          {title:"Fail",value:kpi.totalFail},
          {title:"Abort",value:kpi.totalAbort},
          {title:"Pending",value:kpi.totalPending}
        ]}>
          <PieChartComponent data={statusPie}/>
        </ChartCard>

        <ChartCard title="Monthly Pass/Fail Trend" chartKpis={[
          {title:"Passed",value:kpi.totalPass},
          {title:"Failed",value:kpi.totalFail}
        ]}>
          <LineChartComponent data={monthlyStats} dataKeys={["pass","fail"]}/>
        </ChartCard>

        <ChartCard title="Pass/Fail per Inspector" chartKpis={[]}>
          <LineChartComponent data={inspectorStats} dataKeys={["pass","fail"]} xKey="inspectorName"/>
        </ChartCard>

        <ChartCard title="Critical Defects Trend" chartKpis={[
          { title: "Critical", value: criticalTrend.reduce((a, c) => a + c.critical, 0) }
        ]}>
          <LineChartComponent data={criticalTrend} dataKeys={["critical"]}/>
        </ChartCard>

        <ChartCard title="Major vs Minor Defects Ratio per Month" chartKpis={[
          { title: "Major", value: defectsRatio.reduce((a, c) => a + c.Major, 0) },
          { title: "Minor", value: defectsRatio.reduce((a, c) => a + c.Minor, 0) }
        ]}>
          <StackedBarChartComponent data={defectsRatio} keys={["Major","Minor"]}/>
        </ChartCard>
      </div>
    </div>
  );
}

/* --- Subcomponents --- */
function ChartCard({ title, children, chartKpis=[] }) {
  return (
    <div className="ChartCard">
      <h2>{title}</h2>
      {chartKpis.length>0 && (
        <div className="chart-kpis">
          {chartKpis.map((c,i)=>(
            <div key={i} className="kpi-small">
              <div className="title">{c.title}</div>
              <div className="value">{c.value}</div>
            </div>
          ))}
        </div>
      )}
      <ResponsiveContainer width="100%" height={300}>{children}</ResponsiveContainer>
    </div>
  );
}

/* --- Chart Components with labels --- */
function BarChartComponent({ data }){
  return(
    <BarChart data={data}>
      <XAxis dataKey="month" stroke="#9ca3af"/>
      <YAxis stroke="#9ca3af"/>
      <Tooltip contentStyle={{backgroundColor:"#1f2937",border:0}}/>
      <Legend/>
      <Bar dataKey="pass" fill="#22c55e" label={{position:"top",fill:"#fff"}}/>
      <Bar dataKey="fail" fill="#ef4444" label={{position:"top",fill:"#fff"}}/>
      <Bar dataKey="abort" fill="#facc15" label={{position:"top",fill:"#fff"}}/>
      <Bar dataKey="pending" fill="#3b82f6" label={{position:"top",fill:"#fff"}}/>
    </BarChart>
  );
}
function RadarChartComponent({ data }){
  return(
    <RadarChart data={data}>
      <PolarGrid stroke="#374151"/>
      <PolarAngleAxis dataKey="type" stroke="#9ca3af"/>
      <PolarRadiusAxis stroke="#6b7280"/>
      <Radar dataKey="count" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6}/>
    </RadarChart>
  );
}
function DefectsBarChart({ data }){
  return(
    <BarChart data={data}>
      <XAxis dataKey="name" stroke="#9ca3af" tick={{fontSize:10}}/>
      <YAxis stroke="#9ca3af"/>
      <Tooltip contentStyle={{backgroundColor:"#1f2937",border:0}}/>
      <Legend/>
      <Bar dataKey="Major" fill="#f87171" label={{position:"top",fill:"#fff",fontSize:10}}/>
      <Bar dataKey="Minor" fill="#60a5fa" label={{position:"top",fill:"#fff",fontSize:10}}/>
    </BarChart>
  );
}
function PieChartComponent({ data }){
  const COLORS=["#22c55e","#ef4444","#facc15","#3b82f6"];
  return(
    <PieChart>
      <Pie
        data={data}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={100}
        label={({name,value})=>`${name}: ${value}`}
      >
        {data.map((_,i)=><Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
      </Pie>
      <Tooltip contentStyle={{backgroundColor:"#1f2937",border:0}}/>
    </PieChart>
  );
}
function LineChartComponent({ data, dataKeys, xKey = "month" }) {
  return (
    <LineChart data={data}>
      <XAxis dataKey={xKey} stroke="#9ca3af" />
      <YAxis stroke="#9ca3af" />
      <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: 0 }} />
      <Legend />
      {dataKeys.map((k, i) => (
        <Line key={i} type="monotone" dataKey={k} stroke={i===0?"#22c55e":"#ef4444"} strokeWidth={2} label={{position:"top",fill:"#fff",fontSize:12}}/>
      ))}
    </LineChart>
  );
}
function StackedBarChartComponent({ data, keys }) {
  return (
    <BarChart data={data}>
      <XAxis dataKey="month" stroke="#9ca3af" />
      <YAxis stroke="#9ca3af" />
      <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: 0 }} />
      <Legend />
      {keys.map((k,i)=><Bar key={i} dataKey={k} stackId="a" fill={i===0?"#f87171":"#60a5fa"} label={{position:"top",fill:"#fff"}}/>)}
    </BarChart>
  );
}
