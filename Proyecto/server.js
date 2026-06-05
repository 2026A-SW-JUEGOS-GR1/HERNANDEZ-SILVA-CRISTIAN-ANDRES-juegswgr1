/**
 * ==========================================================================
 * NEXUS LIFE - Servidor Web Local de Desarrollo (Sin Dependencias)
 * ==========================================================================
 * Para evitar errores de CORS (Cross-Origin Resource Sharing) al cargar
 * archivos locales (JSON de Tiled, imágenes), inicia este servidor con:
 *
 *   node server.js
 *
 * Luego, abre en tu navegador: http://localhost:3000
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
};

const server = http.createServer((req, res) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);

  // Limpiar la URL para evitar ataques de escape de directorio
  // Importante decodificar la URL para soportar rutas con espacios (ej. "2 Background")
  const requestPath = decodeURI(req.url.split("?")[0]);
  const safeRequestPath = requestPath === "/" ? "/index.html" : requestPath;
  const relativePath = safeRequestPath.replace(/^\/+/, "");

  // Resolver ruta absoluta
  const resolvedPath = path.resolve(ROOT_DIR, relativePath);

  // Seguridad básica: Asegurar que el archivo esté dentro del directorio del proyecto
  if (path.relative(ROOT_DIR, resolvedPath).startsWith("..")) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    return res.end("Acceso denegado: Fuera del directorio raíz");
  }

  const extname = String(path.extname(resolvedPath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || "application/octet-stream";

  fs.readFile(resolvedPath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        // Servir index.html si no encuentra la ruta (útil para SPA, aunque aquí servimos 404 clásico)
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(`Archivo no encontrado (404): ${req.url}`);
      } else {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(`Error interno del servidor (500): ${error.code}`);
      }
    } else {
      // Servir el archivo con el tipo MIME correcto
      res.writeHead(200, {
        "Content-Type": contentType,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Access-Control-Allow-Origin": "*", // Prevenir bloqueos CORS en pruebas avanzadas
      });
      res.end(content, "utf-8");
    }
  });
});

server.listen(PORT, () => {
  console.log(
    "\n=============================================================",
  );
  console.log("      🚀 ¡NEXUS LIFE - SERVIDOR DE DESARROLLO ACTIVO! 🚀      ");
  console.log("=============================================================");
  console.log(`\n  Accede desde tu navegador en:  http://localhost:${PORT}`);
  console.log("  Presiona Ctrl+C para detener el servidor.\n");
});
