import { promises as fs } from "fs";
import path from "path";
import { NotFoundError, type StorageDriver, type StoredObject } from "./types";

// Folder markers can't be files on disk, so a trailing-slash key maps to a directory.
export class LocalStorageDriver implements StorageDriver {
  constructor(private readonly root: string) {}

  private resolve(key: string): string {
    const resolved = path.resolve(this.root, key);
    if (resolved !== this.root && !resolved.startsWith(this.root + path.sep)) {
      throw new Error(`Key escapes storage root: ${key}`);
    }
    return resolved;
  }

  async put(key: string, content: Buffer): Promise<void> {
    const target = this.resolve(key);
    if (key.endsWith("/")) {
      await fs.mkdir(target, { recursive: true });
      return;
    }
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content);
  }

  async get(key: string): Promise<Buffer> {
    try {
      return await fs.readFile(this.resolve(key));
    } catch (err: any) {
      if (err.code === "ENOENT" || err.code === "EISDIR") throw new NotFoundError(key);
      throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const stat = await fs.stat(this.resolve(key));
      return key.endsWith("/") ? stat.isDirectory() : stat.isFile();
    } catch {
      return false;
    }
  }

  async list(prefix: string): Promise<StoredObject[]> {
    // Walk from the deepest existing directory covered by the prefix.
    const baseDir = prefix.endsWith("/") ? prefix : path.posix.dirname(prefix) + "/";
    const results: StoredObject[] = [];

    const walk = async (relDir: string) => {
      let entries;
      try {
        entries = await fs.readdir(this.resolve(relDir), { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        const relPath = relDir + entry.name;
        if (entry.isDirectory()) {
          const key = relPath + "/";
          if (key.startsWith(prefix)) {
            const stat = await fs.stat(this.resolve(key));
            results.push({ key, size: 0, lastModified: stat.mtime });
          }
          if (key.startsWith(prefix) || prefix.startsWith(key)) await walk(key);
        } else if (entry.isFile() && relPath.startsWith(prefix)) {
          const stat = await fs.stat(this.resolve(relPath));
          results.push({ key: relPath, size: stat.size, lastModified: stat.mtime });
        }
      }
    };

    await walk(baseDir === "./" ? "" : baseDir);
    return results;
  }

  async delete(key: string): Promise<void> {
    await fs.rm(this.resolve(key), { recursive: key.endsWith("/"), force: true });
  }

  async copy(sourceKey: string, destinationKey: string): Promise<void> {
    await this.put(destinationKey, await this.get(sourceKey));
  }
}
