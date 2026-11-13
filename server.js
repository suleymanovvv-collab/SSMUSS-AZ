require("dotenv").config();
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  console.error("Set ADMIN_PASSWORD in .env before starting.");
  process.exit(1);
}

const dataDir = path.join(__dirname, "data");
const uploadDir = path.join(__dirname, "uploads");
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadDir, { recursive: true });

const db = new Database(path.join(dataDir, "ssmuss.sqlite"));
db.pragma("journal_mode = WAL");
db.exec(`CREATE TABLE IF NOT EXISTS songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  filename TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = /^\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(ext) ? ext : ".audio";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${safeExt}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^audio\//.test(file.mimetype) ||
      /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.originalname);
    cb(ok ? null : new Error("Yalnız audio faylları qəbul edilir."), ok);
  }
});

function requireAdmin(req, res, next) {
  const supplied = req.get("x-admin-password");
  if (!supplied || supplied !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Admin şifrəsi yanlışdır." });
  }
  next();
}

app.get("/api/songs", (req, res) => {
  const q = String(req.query.q || "").trim();
  const rows = q
    ? db.prepare("SELECT id,title,artist,created_at FROM songs WHERE title LIKE ? OR artist LIKE ? ORDER BY id DESC")
        .all(`%${q}%`, `%${q}%`)
    : db.prepare("SELECT id,title,artist,created_at FROM songs ORDER BY id DESC").all();
  res.json(rows);
});

app.get("/api/songs/:id/stream", (req, res) => {
  const song = db.prepare("SELECT filename FROM songs WHERE id=?").get(req.params.id);
  if (!song) return res.status(404).send("Mahnı tapılmadı.");
  const file = path.join(uploadDir, path.basename(song.filename));
  if (!fs.existsSync(file)) return res.status(404).send("Audio faylı tapılmadı.");
  res.sendFile(file);
});

app.get("/api/songs/:id/download", (req, res) => {
  const song = db.prepare("SELECT filename,original_name FROM songs WHERE id=?").get(req.params.id);
  if (!song) return res.status(404).send("Mahnı tapılmadı.");
  const file = path.join(uploadDir, path.basename(song.filename));
  if (!fs.existsSync(file)) return res.status(404).send("Audio faylı tapılmadı.");
  res.download(file, path.basename(song.original_name));
});

app.post("/api/admin/songs", requireAdmin, upload.single("audio"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Audio faylı seçilməyib." });
  const title = String(req.body.title || "").trim();
  const artist = String(req.body.artist || "").trim();
  if (!title || !artist) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: "Mahnı adı və ifaçı mütləqdir." });
  }
  try {
    const result = db.prepare(
      "INSERT INTO songs(title,artist,filename,original_name) VALUES(?,?,?,?)"
    ).run(title, artist, req.file.filename, req.file.originalname);
    res.status(201).json({ id: result.lastInsertRowid, title, artist });
  } catch (err) {
    fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "Mahnını yadda saxlamaq mümkün olmadı." });
  }
});

app.delete("/api/admin/songs/:id", requireAdmin, (req, res) => {
  const song = db.prepare("SELECT filename FROM songs WHERE id=?").get(req.params.id);
  if (!song) return res.status(404).json({ error: "Mahnı tapılmadı." });
  db.prepare("DELETE FROM songs WHERE id=?").run(req.params.id);
  const file = path.join(uploadDir, path.basename(song.filename));
  if (fs.existsSync(file)) fs.unlinkSync(file);
  res.json({ ok: true });
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.use((err, _req, res, _next) => {
  res.status(400).json({ error: err.message || "Sorğu xətası." });
});

app.listen(PORT, () => console.log(`SSMUSS.AZ: http://localhost:${PORT}`));
