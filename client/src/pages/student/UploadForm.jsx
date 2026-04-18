import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function SelectProgram({ value, onChange }) {
  return (
    <select name="program" value={value} onChange={onChange} required style={styles.select}>
      <option value="" disabled>Select Program</option>
      <option value="BSIT">BSIT</option>
      <option value="BSEMC">BSEMC</option>
      <option value="BSCS">BSCS</option>
    </select>
  );
}

export default function UploadForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    authors: "",
    program: "",
    year: "",
    adviser_id: "",
  });

  const [advisers, setAdvisers] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingAdvisers, setFetchingAdvisers] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const fetchAdvisers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/advisers", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setAdvisers(res.data);
      } catch (err) {
        console.error("Failed to load advisers", err);
      } finally {
        setFetchingAdvisers(false);
      }
    };
    fetchAdvisers();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    validateAndSetFile(selected);
  };

  const validateAndSetFile = (selected) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (selected && !allowedTypes.includes(selected.type)) {
      alert("Only PDF, DOC, DOCX allowed");
      return;
    }
    setFile(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    validateAndSetFile(dropped);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please upload a file");
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("authors", form.authors);
      formData.append("program", form.program);
      formData.append("year", form.year);
      formData.append("adviser_id", form.adviser_id);
      formData.append("file", file);

      const res = await axios.post("http://localhost:5000/api/papers/upload", formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      alert(`Uploaded successfully! Version: ${res.data.version}`);
      setForm({ title: "", authors: "", program: "", year: "", adviser_id: "" });
      setFile(null);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Top Bar */}
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      {/* Form Card */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Upload Your Research</h2>
        <p style={styles.cardSubtitle}>
          Submit your thesis, capstone, or proposal to the centralized archive. Ensure all details are accurate before submitting.
        </p>

        <form onSubmit={handleSubmit}>

          {/* Row 1: Title + Authors */}
          <div style={styles.formGrid}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>RESEARCH TITLE</label>
              <input
                type="text"
                name="title"
                placeholder="e.g., Impact of AI on Modern Education"
                value={form.title}
                onChange={handleChange}
                required
                style={styles.input}
                onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={e => Object.assign(e.target.style, styles.inputBlur)}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>AUTHOR(S)</label>
              <input
                type="text"
                name="authors"
                placeholder="Separate with commas"
                value={form.authors}
                onChange={handleChange}
                required
                style={styles.input}
                onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={e => Object.assign(e.target.style, styles.inputBlur)}
              />
            </div>
          </div>

          {/* Row 2: Program + Year */}
          <div style={styles.formGrid}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>ACADEMIC PROGRAM</label>
              <SelectProgram value={form.program} onChange={handleChange} />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>YEAR</label>
              <input
                type="number"
                name="year"
                placeholder="2024"
                value={form.year}
                onChange={handleChange}
                required
                style={styles.input}
                onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={e => Object.assign(e.target.style, styles.inputBlur)}
              />
            </div>
          </div>

          {/* Row 3: Adviser (full width) */}
          <div style={styles.fieldGroupFull}>
            <label style={styles.label}>ASSIGN ADVISER</label>
            <select
              name="adviser_id"
              value={form.adviser_id}
              onChange={handleChange}
              disabled={fetchingAdvisers}
              required
              style={{
                ...styles.select,
                opacity: fetchingAdvisers ? 0.5 : 1,
              }}
            >
              <option value="" disabled>
                {fetchingAdvisers ? "Loading advisers..." : "Select Adviser"}
              </option>
              {advisers.map((adv) => (
                <option key={adv.user_id} value={adv.user_id}>
                  {adv.name}
                </option>
              ))}
            </select>
          </div>

          {/* File Drop Zone */}
          <div style={styles.fieldGroupFull}>
            <label style={styles.label}>RESEARCH FILE (PDF PREFERRED)</label>
            <div
              style={{
                ...styles.dropZone,
                ...(dragOver ? styles.dropZoneActive : {}),
                ...(file ? styles.dropZoneFilled : {}),
              }}
              onClick={() => document.getElementById("fileInput").click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <input
                id="fileInput"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              {file ? (
                <>
                  <span style={styles.fileIcon}>📄</span>
                  <p style={styles.fileName}>{file.name}</p>
                  <p style={styles.fileHint}>Click to replace file</p>
                </>
              ) : (
                <>
                  <span style={styles.uploadIcon}>↑</span>
                  <p style={styles.dropText}>Click to browse or drag and drop file here</p>
                  <p style={styles.dropHint}>Maximum file size: 50MB</p>
                </>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              ...(loading ? styles.submitBtnDisabled : {}),
            }}
          >
            {loading ? "Uploading..." : "Submit Research"}
          </button>

        </form>
      </div>
    </>
  );
}

const styles = {
  topBar: {
    marginBottom: "1.5rem",
  },
  backBtn: {
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.7)",
    fontSize: "14px",
    cursor: "pointer",
    padding: "0",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  card: {
    background: "#ffffff0f",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "18px",
    padding: "2rem 2.25rem",
  },
  cardTitle: {
    fontSize: "clamp(1.4rem, 3vw, 2rem)",
    fontWeight: "700",
    margin: "0 0 0.5rem 0",
    color: "#fff",
  },
  cardSubtitle: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.5)",
    marginBottom: "2rem",
    lineHeight: 1.5,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1.25rem",
    marginBottom: "1.25rem",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  fieldGroupFull: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "1.25rem",
  },
  label: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#FFBE4F",
    letterSpacing: "0.08em",
  },
  input: {
    background: "#ffffff0d",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "10px",
    padding: "12px 14px",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  inputFocus: {
    borderColor: "#FFBE4F",
  },
  inputBlur: {
    borderColor: "rgba(255,255,255,0.15)",
  },
  select: {
    background: "#1e2a6e",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "10px",
    padding: "12px 14px",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    cursor: "pointer",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23FFBE4F' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
  },
  dropZone: {
    border: "2px dashed rgba(255,255,255,0.2)",
    borderRadius: "14px",
    padding: "2.5rem 1rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "border-color 0.2s, background 0.2s",
    textAlign: "center",
    gap: "8px",
  },
  dropZoneActive: {
    borderColor: "#FFBE4F",
    background: "rgba(255,190,79,0.05)",
  },
  dropZoneFilled: {
    borderColor: "#22c55e",
    background: "rgba(34,197,94,0.05)",
  },
  uploadIcon: {
    fontSize: "28px",
    color: "rgba(255,255,255,0.4)",
    fontWeight: "300",
    lineHeight: 1,
  },
  fileIcon: {
    fontSize: "28px",
    lineHeight: 1,
  },
  dropText: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.6)",
    margin: 0,
  },
  dropHint: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.3)",
    margin: 0,
  },
  fileName: {
    fontSize: "14px",
    color: "#22c55e",
    fontWeight: "600",
    margin: 0,
  },
  fileHint: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.3)",
    margin: 0,
  },
  submitBtn: {
    marginTop: "0.75rem",
    padding: "13px 32px",
    background: "#FFBE4F",
    color: "#1e2a6e",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  submitBtnDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
};