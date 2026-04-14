import { useState } from "react";
import axios from "axios";

export default function UploadForm() {
  const [form, setForm] = useState({
    title: "",
    authors: "",
    program: "",
    year: "",
  });

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];

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
      formData.append("file", file);

      const res = await axios.post(
        "http://localhost:5000/papers/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      console.log(res.data);

      alert(`Uploaded successfully! Version: ${res.data.version}`);

      setForm({
        title: "",
        authors: "",
        program: "",
        year: "",
      });
      setFile(null);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Upload Research Paper</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            name="title"
            placeholder="Research Title"
            value={form.title}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <input
            type="text"
            name="authors"
            placeholder="Authors (comma separated)"
            value={form.authors}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <input
            type="text"
            name="program"
            placeholder="Academic Program"
            value={form.program}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <input
            type="number"
            name="year"
            placeholder="Year"
            value={form.year}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>
    </div>
  );
}