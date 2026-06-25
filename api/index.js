// Superseded by api/handler.mjs — see vercel.json rewrites
module.exports = (req, res) => {
  res.status(404).json({ error: "Use /api/* routes" });
};
