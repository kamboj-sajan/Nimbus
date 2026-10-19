import { BlobServiceClient, type ContainerClient } from "@azure/storage-blob";
import { NotFoundError, type StorageDriver, type StoredObject } from "./types";

export class AzureBlobStorageDriver implements StorageDriver {
  private readonly container: ContainerClient;
  private ready: Promise<unknown>;

  constructor(connectionString: string, containerName: string) {
    if (!connectionString) {
      throw new Error("AZURE_STORAGE_CONNECTION_STRING is required for the azure storage driver");
    }
    this.container = BlobServiceClient.fromConnectionString(connectionString).getContainerClient(
      containerName
    );
    this.ready = this.container.createIfNotExists();
  }

  async put(key: string, content: Buffer): Promise<void> {
    await this.ready;
    await this.container.getBlockBlobClient(key).uploadData(content, {
      blobHTTPHeaders: { blobContentType: "application/octet-stream" },
    });
  }

  async get(key: string): Promise<Buffer> {
    await this.ready;
    try {
      return await this.container.getBlockBlobClient(key).downloadToBuffer();
    } catch (err: any) {
      if (err.statusCode === 404) throw new NotFoundError(key);
      throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    await this.ready;
    return this.container.getBlockBlobClient(key).exists();
  }

  async list(prefix: string): Promise<StoredObject[]> {
    await this.ready;
    const results: StoredObject[] = [];
    for await (const blob of this.container.listBlobsFlat({ prefix })) {
      results.push({
        key: blob.name,
        size: blob.properties.contentLength ?? 0,
        lastModified: blob.properties.lastModified,
      });
    }
    return results;
  }

  async delete(key: string): Promise<void> {
    await this.ready;
    if (key.endsWith("/")) {
      for (const obj of await this.list(key)) {
        await this.container.deleteBlob(obj.key, { deleteSnapshots: "include" }).catch(() => {});
      }
    }
    await this.container.getBlockBlobClient(key).deleteIfExists();
  }

  async copy(sourceKey: string, destinationKey: string): Promise<void> {
    await this.ready;
    const source = this.container.getBlockBlobClient(sourceKey);
    const poller = await this.container
      .getBlockBlobClient(destinationKey)
      .beginCopyFromURL(source.url);
    await poller.pollUntilDone();
  }
}
