import { useState } from "react";
import api from "../api";
import "../components/Form.css";

export default function InspectionForm() {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);  
  const months = [
    "January","February","March","April","May","June","July","August",
    "September","October","November","December"
  ];

  const initialState = {
    serialNo: "",
    year: years[0],
    month: months[0],
    inspectionId: "",
    inspectionDate: "",
    servicePerformed: "",
    inspectionType: "",
    dpi: "",
    bvFinal: "",
    aktiSelf: "",
    inspectorName: "",
    offeredQtyCtn: "",
    offeredQtyPacks: "",
    noOfInspection: "",
    pass: "",
    fail: "",
    abort: "",
    pending: "",
    inspectionStatus: "",
    sampleSize: "",
    major: "",
    minor: "",
    oql: "",
    percentAllowed: "",
    critical: "",
    actualMajor: "",
    actualMinor: "",
    actualOql: "",
    pulledTerry: "",
    rawEdge: "",
    weaving: "",
    uncutThread: "",
    stainMajor: "",
    skipStitch: "",
    brokenStitch: "",
    runoffStitch: "",
    poorShape: "",
    pleat: "",
    insecureLabel: "",
    missingLabel: "",
    contaminationMajor: "",
    slantLabel: "",
    damageFabric: "",
    hole: "",
    looseStitch: "",
    singleUntrimmedThread: "",
    contaminationMinor: "",
    flyYarn: "",
    dustMark: "",
    stainMinor: "",
  };

  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ---------------- Handle Change ----------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // Numeric fields
    const numericFields = [
      "serialNo","offeredQtyCtn","offeredQtyPacks","noOfInspection","dpi","bvFinal","aktiSelf",
      "major","minor","oql","percentAllowed","critical","actualMajor","actualMinor","actualOql",
      "pulledTerry","rawEdge","weaving","uncutThread","stainMajor","skipStitch","brokenStitch",
      "runoffStitch","poorShape","pleat","insecureLabel","missingLabel","contaminationMajor",
      "slantLabel","damageFabric","hole","looseStitch","singleUntrimmedThread","contaminationMinor",
      "flyYarn","dustMark","stainMinor","sampleSize"
    ];

    // Text-only fields
    const textFields = ["inspectionType","servicePerformed","inspectorName"];

    // Numeric validation
    if (numericFields.includes(name)) {
      if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) newValue = value;
      else return;
    }

    // Text validation
    if (textFields.includes(name)) {
      if (!/^[a-zA-Z\s]*$/.test(value)) return;
      newValue = value;
    }

    // Only allow 0 or 1 for pass/fail/abort/pending
    const statusFields = ["pass","fail","abort","pending"];
    if (statusFields.includes(name)) {
      if (value !== "0" && value !== "1" && value !== "") return;
      if (value === "1") {
        const updated = { ...form, [name]: 1 };
        statusFields.forEach(f => {
          if (f !== name) updated[f] = 0;
        });
        updated.inspectionStatus =
          name === "pass" ? "Passed" :
          name === "fail" ? "Failed" :
          name === "pending" ? "Pending" :
          name === "abort" ? "Aborted" : "";
        setForm(updated);
        return;
      }
    }

    setForm({ ...form, [name]: newValue });
  };

  // ---------------- Handle Submit ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // Validate: no empty fields
    for (let key in form) {
      if (form[key] === "" || form[key] === null) {
        setMessage(`⚠️ Please fill the field: ${key.replace(/([A-Z])/g, " $1")}`);
        return;
      }
    }

    // Validate Offered QTY CTN <= Offered QTY Packs
    if (Number(form.offeredQtyCtn) > Number(form.offeredQtyPacks)) {
      setMessage("⚠️ Offered QTY CTN cannot be greater than Offered QTY Packs");
      return;
    }

    setLoading(true);
    try {
      const processed = Object.fromEntries(
        Object.entries(form).map(([key, value]) => {
          if (key === "inspectionDate") return [key, new Date(value)];
          return [key, !isNaN(Number(value)) ? Number(value) : value];
        })
      );

      await api.post("/inspections", processed);
      setMessage("✅ Inspection added successfully!");
      setForm(initialState);
    } catch (err) {
      console.error("Form submit error:", err);
      setMessage("❌ Failed to save inspection");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Form Sections ----------------
  const sections = [
    {
      title: "BASIC INFORMATION",
      color: "#4B5563",
      fields: [
        "serialNo","year","month","inspectionId","inspectionDate","servicePerformed",
        "inspectionType","dpi","bvFinal","aktiSelf","inspectorName","offeredQtyCtn",
        "offeredQtyPacks","noOfInspection","pass","fail","abort","pending","inspectionStatus","sampleSize"
      ]
    },
    { title: "REQUIRED OQL 2.5 (M) / 4.0 (m)", color: "#FFD700", fields: ["major","minor","oql","percentAllowed"] },
    { title: "ACTUAL FINDINGS", color: "#2ECC71", fields: ["critical","actualMajor","actualMinor","actualOql"] },
    {
      title: "MAJOR DEFECTS DETAILS",
      color: "#f73c3c",
      fields: [
        "pulledTerry","rawEdge","weaving","uncutThread","stainMajor","skipStitch","brokenStitch",
        "runoffStitch","poorShape","pleat","insecureLabel","missingLabel","contaminationMajor",
        "slantLabel","damageFabric","hole","looseStitch"
      ]
    },
    {
      title: "MINOR DEFECTS DETAILS",
      color: "#FFA500",
      fields: ["singleUntrimmedThread","contaminationMinor","flyYarn","dustMark","stainMinor"]
    }
  ];

  return (
    <div className="inspection-form-wrapper">
      <form onSubmit={handleSubmit} className="inspection-form">
        <h1 className="text-2xl font-bold mb-4">Add New Inspection</h1>

        {sections.map((section, idx) => (
          <div key={idx} className="form-section">
            <h3 className="section-header" style={{ backgroundColor: section.color }}>
              {section.title}
            </h3>
            <div className="fields-grid">
              {section.fields.map((key) => (
                <div key={key} className="form-field">
                  <label>{key.replace(/([A-Z])/g, " $1")}</label>

                  {/* Year & Month Dropdowns */}
                  {key === "year" ? (
                    <select name="year" value={form.year} onChange={handleChange}>
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  ) : key === "month" ? (
                    <select name="month" value={form.month} onChange={handleChange}>
                      {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  ) : key === "inspectionStatus" ? (
                    <input type="text" name="inspectionStatus" value={form.inspectionStatus} disabled />
                  ) : (["pass","fail","abort","pending"].includes(key) ? (
                    <input
                      type="number"
                      name={key}
                      value={form[key]}
                      onChange={handleChange}
                      min={0}
                      max={1}
                      placeholder="0 or 1"
                    />
                  ) : (
                    <input
                      type={key === "inspectionDate" ? "date" : "text"}
                      name={key}
                      value={form[key]}
                      onChange={handleChange}
                      placeholder={`Enter ${key.replace(/([A-Z])/g, " $1").toLowerCase()}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="form-footer">
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Saving..." : "Add Inspection"}
          </button>
          {message && (
            <p className={`status-message ${message.startsWith("✅") ? "success" : "error"}`}>
              {message}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
