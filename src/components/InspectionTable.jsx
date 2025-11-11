import { useEffect, useState } from "react";
import api from "../api";
import "./Table.css";

function Toast({ message, type, onClose }) {
  return (
    <div className={`toast ${type}`}>
      <span>{message}</span>
      <button className="close-btn" onClick={onClose}>×</button>
    </div>
  );
}

function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div className="confirm-overlay">
      <div className="confirm-box">
        <h4>{title}</h4>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="btn-confirm" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default function InspectionTable() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [formData, setFormData] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  const numberFields = [
    "serialNo","year","inspectionId","offeredQtyCtn","offeredQtyPacks","noOfInspection",
    "pass","fail","abort","pending","sampleSize",
    "major","minor","oql","percentAllowed","critical","actualMajor","actualMinor","actualOql",
    "pulledTerry","rawEdge","weaving","uncutThread","stainMajor","skipStitch","brokenStitch",
    "runoffStitch","poorShape","pleat","insecureLabel","missingLabel","contaminationMajor",
    "slantLabel","damageFabric","hole","looseStitch","singleUntrimmedThread","contaminationMinor",
    "flyYarn","dustMark","stainMinor"
  ];

  const dateFields = ["inspectionDate"];

  useEffect(() => { fetchInspections(); }, []);

  const fetchInspections = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/inspections");
      setInspections(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load inspection data.");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const deleteInspection = async (id) => {
    try {
      await api.delete(`/inspections/${id}`);
      showToast("Inspection deleted successfully!");
      // Adjust page if last item removed
      const newFiltered = inspections.filter((item) => item._id !== id);
      const newTotalPages = Math.ceil(newFiltered.length / rowsPerPage);
      if (currentPage > newTotalPages) setCurrentPage(newTotalPages || 1);
      fetchInspections();
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Failed to delete inspection.", "error");
    }
  };

  const openEditModal = (row) => {
    setEditingRow(row);
    setFormData({ ...row });
    setIsEditing(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: numberFields.includes(name) && value !== "" ? Number(value) : value
    }));
  };

  const saveEdit = async () => {
    try {
      const cleanData = { ...formData };
      delete cleanData._id;
      delete cleanData.__v;

      // Convert date fields
      dateFields.forEach((field) => {
        if (cleanData[field]) cleanData[field] = new Date(cleanData[field]);
      });

      await api.put(`/inspections/${editingRow._id}`, cleanData);
      showToast("Inspection updated successfully!");
      setIsEditing(false);
      fetchInspections();
    } catch (err) {
      console.error("Update error:", err);
      showToast("Failed to update inspection.", "error");
    }
  };

  if (loading) return <p className="center-msg">Loading...</p>;
  if (error) return <p className="center-msg error">{error}</p>;

  const columns = Object.keys(inspections[0] || {}).filter(
    (k) => !["_id", "__v", "createdAt", "updatedAt"].includes(k)
  );

  const filtered = inspections.filter((row) =>
    columns.some((col) =>
      row[col]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const current = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  return (
    <div className="inspection-table-container">
      <div className="table-header">
        <h3>Inspection Records</h3>
        <input
          className="search-input"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              {columns.map((col) => <th key={col}>{col.replace(/([A-Z])/g, " $1")}</th>)}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {current.map((row, i) => (
              <tr key={row._id}>
                <td>{indexOfFirst + i + 1}</td>
                {columns.map((col) => (
                  <td key={col}>
                    {dateFields.includes(col) && row[col]
                      ? new Date(row[col]).toLocaleDateString()
                      : row[col] ?? "-"}
                  </td>
                ))}
                <td className="actions">
                  <button className="btn-edit" onClick={() => openEditModal(row)}>Edit</button>
                  <button className="btn-delete" onClick={() => setConfirmDelete(row._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Prev</button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            className={currentPage === i + 1 ? "active" : ""}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
      </div>

      {isEditing && (
        <div className="modal-overlay">
          <div className="modal wide professional">
            <div className="modal-header">
              <h2>Edit Inspection Record</h2>
              <button className="modal-close" onClick={() => setIsEditing(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-grid">
                {columns.map((col) => (
                  <div key={col} className="modal-field">
                    <label>{col.replace(/([A-Z])/g, " $1")}</label>
                    <input
                      type={dateFields.includes(col) ? "date" : numberFields.includes(col) ? "number" : "text"}
                      name={col}
                      value={
                        dateFields.includes(col) && formData[col]
                          ? new Date(formData[col]).toISOString().split("T")[0]
                          : formData[col] ?? ""
                      }
                      onChange={handleChange}
                      className="field-input"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsEditing(false)}>Cancel</button>
              <button className="btn-save" onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Confirmation"
          message="Are you sure you want to delete this inspection record?"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => { deleteInspection(confirmDelete); setConfirmDelete(null); }}
        />
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
