import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get directory name - works in both ES modules (dev) and CJS (production build)
// In production, the server is compiled to dist/index.cjs, so __dirname will be dist/
function getDirname(): string {
  // In ES module context (development), use import.meta.url
  if (typeof import.meta !== "undefined" && import.meta.url) {
    return path.dirname(fileURLToPath(import.meta.url));
  }
  // In CJS context (production build after esbuild compilation), __dirname exists
  // TypeScript doesn't know about __dirname in ES modules, but it exists at runtime in CJS
  // @ts-expect-error - __dirname is available in compiled CJS output
  return typeof __dirname !== "undefined" ? __dirname : process.cwd();
}

export function serveStatic(app: Express) {
  // In production build, server is at dist/index.cjs, so public is at dist/public
  const distPath = path.resolve(getDirname(), "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
