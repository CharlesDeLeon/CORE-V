import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const PROGRAMS = ["BSIT", "BSEMC", "BSCS"];

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function generateSchoolYears(count = 5) {
  const current = new Date().getFullYear();
  return Array.from({ length: count }, (_, i) => {
    const start = current - 2 + i;
    return `${start}-${start + 1}`;
  });
}

function FieldLabel({ children }) {
  return <label style={styles.label}>{children}</label>;
}

function TextInput({ name, placeholder, value, onChange, required = true, type = "text" }) {
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      style={styles.input}
      onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
      onBlur={e => Object.assign(e.target.style, styles.inputBlur)}
    />
  );
}

function SelectField({ name, value, onChange, required = true, disabled = false, children }) {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      style={{ ...styles.select, opacity: disabled ? 0.5 : 1 }}
    >
      {children}
    </select>
  );
}

export default function UploadForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    abstract: "",
    keywords: "",
    authors: "",
    program: "",
    school_year: "",
  });

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [charCounts, setCharCounts] = useState({ abstract: 0, keywords: 0 });

  const schoolYears = generateSchoolYears();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    if (name === "abstract" || name === "keywords") {
      setCharCounts(prev => ({ ...prev, [name]: value.length }));
    }
  };

  const validateAndSetFile = (selected) => {
    if (!selected) return;
    if (!ALLOWED_TYPES.includes(selected.type)) {
      alert("Only PDF, DOC, or DOCX files are allowed.");
      return;
    }
    if (selected.size > 50 * 1024 * 1024) {
      alert("File exceeds the 50 MB limit.");
      return;
    }
    setFile(selected);
  };

  const handleFileChange = (e) => validateAndSetFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    validateAndSetFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { alert("Please attach a research file before submitting."); return; }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title",       form.title);
      formData.append("abstract",    form.abstract);
      formData.append("keywords",    form.keywords);
      formData.append("authors",     form.authors);
      formData.append("program",     form.program);
      formData.append("school_year", form.school_year);
      formData.append("file",        file);

      const res = await api.post("/papers/upload", formData);

      alert(`Submitted successfully! Paper ID: ${res.data.paperId} · Version: ${res.data.version}`);

      setForm({ title: "", abstract: "", keywords: "", authors: "", program: "", school_year: "" });
      setFile(null);
      setCharCounts({ abstract: 0, keywords: 0 });
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Upload failed. Please try again.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
      </div>

      {/* Card */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Upload Research</h2>
        <p style={styles.cardSubtitle}>
          Submit your thesis, capstone, or proposal to the CORE-V vault.
          Ensure all details are accurate before submitting.
        </p>

        <form onSubmit={handleSubmit}>

          <div style={styles.formGrid}>
            <div style={styles.fieldGroup}>
              <FieldLabel>RESEARCH TITLE</FieldLabel>
              <TextInput name="title" placeholder="e.g., Impact of AI on Modern Education"
                value={form.title} onChange={handleChange} />
            </div>
            <div style={styles.fieldGroup}>
              <FieldLabel>AUTHOR(S)</FieldLabel>
              <TextInput name="authors" placeholder="Separate names with commas"
                value={form.authors} onChange={handleChange} />
            </div>
          </div>

          <div style={styles.formGrid}>
            <div style={styles.fieldGroup}>
              <FieldLabel>ACADEMIC PROGRAM</FieldLabel>
              <SelectField name="program" value={form.program} onChange={handleChange}>
                <option value="" disabled>Select Program</option>
                {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
              </SelectField>
            </div>
            <div style={styles.fieldGroup}>
              <FieldLabel>SCHOOL YEAR</FieldLabel>
              <SelectField name="school_year" value={form.school_year} onChange={handleChange}>
                <option value="" disabled>Select School Year</option>
                {schoolYears.map(y => <option key={y} value={y}>{y}</option>)}
              </SelectField>
            </div>
          </div>

          <div style={styles.fieldGroupFull}>
            <FieldLabel>ABSTRACT</FieldLabel>
            <div style={{ position: "relative" }}>
              <textarea
                name="abstract"
                placeholder="Provide a brief summary of your research..."
                value={form.abstract}
                onChange={handleChange}
                maxLength={2000}
                style={styles.textarea}
                onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={e => Object.assign(e.target.style, styles.inputBlur)}
              />
              <span style={styles.charCount}>{charCounts.abstract}/2000</span>
            </div>
          </div>

          <div style={styles.fieldGroupFull}>
            {/* submissions.keywords — comma-separated, new field */}
            <FieldLabel>KEYWORDS</FieldLabel>
            <div style={{ position: "relative" }}>
              <TextInput
                name="keywords"
                placeholder="e.g., machine learning, education, AI"
                value={form.keywords}
                onChange={handleChange}
                required={false}
              />
              <span style={{ ...styles.charCount, top: "50%", transform: "translateY(-50%)" }}>
                {charCounts.keywords}/300
              </span>
            </div>
            <p style={styles.hint}>Separate keywords with commas. Used for vault search.</p>
          </div>

          <div style={styles.fieldGroupFull}>
            <FieldLabel>RESEARCH FILE (PDF PREFERRED)</FieldLabel>
            <div
              style={{
                ...styles.dropZone,
                ...(dragOver ? styles.dropZoneActive : {}),
                ...(file ? styles.dropZoneFilled : {}),
              }}
              onClick={() => document.getElementById("fileInput").click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
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
                  <p style={styles.fileSize}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <p style={styles.fileHint}>Click to replace file</p>
                </>
              ) : (
                <>
                  <span style={styles.uploadIcon}>↑</span>
                  <p style={styles.dropText}>Click to browse or drag and drop</p>
                  <p style={styles.dropHint}>PDF, DOC, DOCX · Max 50 MB</p>
                </>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.submitBtn, ...(loading ? styles.submitBtnDisabled : {}) }}
          >
            {loading ? "Uploading..." : "Submit Research"}
          </button>

        </form>
      </div>
    </>
  );
}

const styles = {
  topBar: { marginBottom: "1.5rem" },
  backBtn: {
    background: "transparent", border: "none",
    color: "rgba(255,255,255,0.7)", fontSize: "14px",
    cursor: "pointer", padding: "0",
    display: "flex", alignItems: "center", gap: "6px",
  },
  card: {
    background: "#ffffff0f",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "18px",
    padding: "2rem 2.25rem",
  },
  cardTitle: {
    fontSize: "clamp(1.4rem, 3vw, 2rem)",
    fontWeight: "700", margin: "0 0 0.5rem 0", color: "#fff",
  },
  cardSubtitle: {
    fontSize: "13px", color: "rgba(255,255,255,0.5)",
    marginBottom: "2rem", lineHeight: 1.5,
  },
  formGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr",
    gap: "1.25rem", marginBottom: "1.25rem",
  },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  fieldGroupFull: {
    display: "flex", flexDirection: "column",
    gap: "8px", marginBottom: "1.25rem",
  },
  label: {
    fontSize: "11px", fontWeight: "700",
    color: "#FFBE4F", letterSpacing: "0.08em",
  },
  input: {
    background: "#ffffff0d",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "10px", padding: "12px 14px",
    color: "#fff", fontSize: "14px", outline: "none",
    width: "100%", boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  inputFocus: { borderColor: "#FFBE4F" },
  inputBlur: { borderColor: "rgba(255,255,255,0.15)" },
  textarea: {
    background: "#ffffff0d",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "10px", padding: "12px 14px",
    color: "#fff", fontSize: "14px", outline: "none",
    width: "100%", boxSizing: "border-box",
    transition: "border-color 0.2s",
    resize: "vertical", minHeight: "100px",
    fontFamily: "inherit",
  },
  charCount: {
    position: "absolute", bottom: "10px", right: "12px",
    fontSize: "11px", color: "rgba(255,255,255,0.3)",
  },
  hint: {
    fontSize: "11px", color: "rgba(255,255,255,0.3)",
    margin: "2px 0 0 2px",
  },
  select: {
    background: "#1e2a6e",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "10px", padding: "12px 14px",
    color: "#fff", fontSize: "14px", outline: "none",
    width: "100%", boxSizing: "border-box",
    cursor: "pointer", appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23FFBE4F' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center",
  },
  stageGroup: { display: "flex", gap: "10px", flexWrap: "wrap" },
  stageOption: {
    padding: "9px 20px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "rgba(255,255,255,0.6)",
    fontSize: "13px", fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    userSelect: "none",
  },
  stageOptionActive: {
    background: "#FFBE4F",
    border: "1px solid #FFBE4F",
    color: "#1e2a6e",
  },
  dropZone: {
    border: "2px dashed rgba(255,255,255,0.2)",
    borderRadius: "14px", padding: "2.5rem 1rem",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    cursor: "pointer",
    transition: "border-color 0.2s, background 0.2s",
    textAlign: "center", gap: "8px",
  },
  dropZoneActive: { borderColor: "#FFBE4F", background: "rgba(255,190,79,0.05)" },
  dropZoneFilled: { borderColor: "#22c55e", background: "rgba(34,197,94,0.05)" },
  uploadIcon: { fontSize: "28px", color: "rgba(255,255,255,0.4)", fontWeight: "300", lineHeight: 1 },
  fileIcon: { fontSize: "28px", lineHeight: 1 },
  dropText: { fontSize: "14px", color: "rgba(255,255,255,0.6)", margin: 0 },
  dropHint: { fontSize: "12px", color: "rgba(255,255,255,0.3)", margin: 0 },
  fileName: { fontSize: "14px", color: "#22c55e", fontWeight: "600", margin: 0 },
  fileSize: { fontSize: "12px", color: "rgba(34,197,94,0.7)", margin: 0 },
  fileHint: { fontSize: "12px", color: "rgba(255,255,255,0.3)", margin: 0 },
  submitBtn: {
    marginTop: "0.75rem", padding: "13px 32px",
    background: "#FFBE4F", color: "#1e2a6e",
    border: "none", borderRadius: "10px",
    fontSize: "14px", fontWeight: "700", cursor: "pointer",
  },
  submitBtnDisabled: { opacity: 0.6, cursor: "not-allowed" },
};