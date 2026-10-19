export interface StoredObject {
  /** Key relative to the storage root, e.g. users/alice/workspace/src/index.js. Folders end with "/". */
  key: string;
  size: number;
  lastModified: Date;
}

/**
 * Object-store style persistence for project files. Folders are represented by
 * zero-byte marker objects whose key ends in "/", like S3 / Azure Blob.
 */
export interface StorageDriver {
  put(key: string, content: Buffer): Promise<void>;
  get(key: string): Promise<Buffer>;
  exists(key: string): Promise<boolean>;
  list(prefix: string): Promise<StoredObject[]>;
  delete(key: string): Promise<void>;
  copy(sourceKey: string, destinationKey: string): Promise<void>;
}

export class NotFoundError extends Error {
  constructor(key: string) {
    super(`Object not found: ${key}`);
  }
}
