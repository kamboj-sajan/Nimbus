import { config } from "../config";
import { HttpError } from "../lib/http-error";
import { buildTree, type FileNode } from "../lib/tree";
import { AzureBlobStorageDriver } from "./azure";
import { LocalStorageDriver } from "./local";
import { NotFoundError, type StorageDriver } from "./types";

function createDriver(): StorageDriver {
  if (config.storageDriver === "azure") {
    console.log(`☁️  Storage: Azure Blob container "${config.azureContainer}"`);
    return new AzureBlobStorageDriver(config.azureConnectionString, config.azureContainer);
  }
  console.log(`💾 Storage: local disk at ${config.storageLocalRoot}`);
  return new LocalStorageDriver(config.storageLocalRoot);
}

const driver = createDriver();

const STARTER_FILES: Record<string, string> = {
  "README.md": `# Welcome to Nimbus ☁️

This is your cloud workspace. Everything here is saved automatically.

- Open a file from the explorer on the left to start editing.
- Use the terminal below to run commands — try \`node index.js\`.
- Start a web server (e.g. \`node server.js\`) and open its port in the preview panel.
`,
  "index.js": `const greet = (name) => \`Hello, \${name}! 👋\`;

console.log(greet("Nimbus"));
`,
  "server.js": `const http = require("http");

const PORT = 8080;

http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>Hello from your Nimbus workspace 🚀</h1>");
  })
  .listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
`,
};

/** All file operations for one user's workspace (users/<username>/<project>/). */
export class Workspace {
  readonly prefix: string;

  constructor(username: string) {
    this.prefix = `users/${username}/${config.projectName}/`;
  }

  private key(relPath: string, type: "file" | "folder" = "file"): string {
    return this.prefix + relPath + (type === "folder" ? "/" : "");
  }

  async tree(): Promise<FileNode[]> {
    const objects = await driver.list(this.prefix);
    return buildTree(
      objects
        .filter((o) => o.key !== this.prefix)
        .map((o) => ({ ...o, key: o.key.slice(this.prefix.length) }))
    );
  }

  async list() {
    const objects = await driver.list(this.prefix);
    return objects
      .filter((o) => o.key !== this.prefix)
      .map((o) => ({ ...o, key: o.key.slice(this.prefix.length) }));
  }

  async read(relPath: string): Promise<Buffer> {
    try {
      return await driver.get(this.key(relPath));
    } catch (err) {
      if (err instanceof NotFoundError) throw new HttpError(404, "File not found");
      throw err;
    }
  }

  async write(relPath: string, content: string | Buffer): Promise<void> {
    await driver.put(this.key(relPath), Buffer.isBuffer(content) ? content : Buffer.from(content));
  }

  async create(relPath: string, type: "file" | "folder", content = ""): Promise<void> {
    if (type === "folder") {
      await driver.put(this.key(relPath, "folder"), Buffer.alloc(0));
    } else {
      await this.write(relPath, content);
    }
  }

  async delete(relPath: string, type: "file" | "folder"): Promise<void> {
    if (type === "folder") {
      // Remove every object under the folder, including nested markers.
      const objects = await driver.list(this.key(relPath, "folder"));
      for (const obj of objects) await driver.delete(obj.key);
      await driver.delete(this.key(relPath, "folder"));
    } else {
      await driver.delete(this.key(relPath));
    }
  }

  /** Renames / moves a file or folder. Returns the new workspace-relative path. */
  async rename(relPath: string, newRelPath: string): Promise<{ type: "file" | "folder" }> {
    if (await driver.exists(this.key(relPath))) {
      await driver.copy(this.key(relPath), this.key(newRelPath));
      await driver.delete(this.key(relPath));
      return { type: "file" };
    }

    const sourcePrefix = this.key(relPath, "folder");
    const objects = (await driver.list(sourcePrefix)).filter((o) => o.key !== sourcePrefix);
    if (objects.length === 0 && !(await driver.exists(sourcePrefix))) {
      throw new HttpError(404, "Path not found");
    }

    const destinationPrefix = this.key(newRelPath, "folder");
    await driver.put(destinationPrefix, Buffer.alloc(0));
    for (const obj of objects) {
      const destination = destinationPrefix + obj.key.slice(sourcePrefix.length);
      if (obj.key.endsWith("/")) await driver.put(destination, Buffer.alloc(0));
      else await driver.copy(obj.key, destination);
    }
    await this.delete(relPath, "folder");
    return { type: "folder" };
  }

  /** Every file (base64 encoded) and folder — used to hydrate a runtime container. */
  async snapshot() {
    const objects = await this.list();
    const folders = objects.filter((o) => o.key.endsWith("/")).map((o) => o.key.slice(0, -1));
    const files = await Promise.all(
      objects
        .filter((o) => !o.key.endsWith("/"))
        .map(async (o) => ({
          path: o.key,
          content: (await driver.get(this.prefix + o.key)).toString("base64"),
        }))
    );
    return { folders, files };
  }

  async seedStarterProject(): Promise<void> {
    const existing = await driver.list(this.prefix);
    if (existing.length > 0) return;
    await driver.put(this.prefix, Buffer.alloc(0));
    for (const [relPath, content] of Object.entries(STARTER_FILES)) {
      await this.write(relPath, content);
    }
  }
}
