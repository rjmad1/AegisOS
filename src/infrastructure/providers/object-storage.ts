// src/infrastructure/providers/object-storage.ts
// Swappable Object Storage Platform Provider supporting MinIO, S3, Azure Blob, GCS, and Local FS.

import { IArtifactProviderAdapter } from '../contracts/artifact';
import { HealthCheckResult } from '../health/types';
import { CapabilityReport } from '../discovery/types';
import { LocalArtifactStorageProvider } from './local-artifact-storage';

export class ObjectStoragePlatformProvider implements IArtifactProviderAdapter {
  id = 'object-storage-provider';
  name = 'Enterprise Object Storage Platform Provider';
  type = 'artifact-provider' as const;

  private activeProvider: IArtifactProviderAdapter;
  private localFallback: LocalArtifactStorageProvider;

  constructor() {
    this.localFallback = new LocalArtifactStorageProvider();
    this.activeProvider = this.localFallback;

    // Detect cloud configurations from env
    const provider = process.env.OBJECT_STORAGE_PROVIDER || 'local';
    
    if (provider === 's3' || provider === 'minio') {
      try {
        const { S3Client } = require('@aws-sdk/client-s3');
        this.activeProvider = new S3ArtifactProvider(provider);
        console.log(`[ObjectStoragePlatform] Configured active provider: ${provider}`);
      } catch (err: any) {
        console.warn(`[ObjectStoragePlatform] AWS SDK not found. Falling back to local FS: ${err.message}`);
      }
    } else if (provider === 'gcs') {
      try {
        const { Storage } = require('@google-cloud/storage');
        this.activeProvider = new GcsArtifactProvider();
        console.log('[ObjectStoragePlatform] Configured active provider: Google Cloud Storage');
      } catch (err: any) {
        console.warn(`[ObjectStoragePlatform] GCP GCS SDK not found. Falling back to local FS: ${err.message}`);
      }
    } else if (provider === 'azure') {
      try {
        const { BlobServiceClient } = require('@azure/storage-blob');
        this.activeProvider = new AzureArtifactProvider();
        console.log('[ObjectStoragePlatform] Configured active provider: Azure Blob Storage');
      } catch (err: any) {
        console.warn(`[ObjectStoragePlatform] Azure Storage SDK not found. Falling back to local FS: ${err.message}`);
      }
    }
  }

  async initialize(config: Record<string, any>): Promise<void> {
    await this.localFallback.initialize(config);
    await this.activeProvider.initialize(config);
  }

  async shutdown(): Promise<void> {
    await this.activeProvider.shutdown();
  }

  async checkHealth(): Promise<HealthCheckResult> {
    return this.activeProvider.checkHealth();
  }

  async getCapabilities(): Promise<CapabilityReport> {
    return this.activeProvider.getCapabilities();
  }

  async save(key: string, data: Uint8Array, mimeType: string): Promise<string> {
    return this.activeProvider.save(key, data, mimeType);
  }

  async read(uri: string): Promise<Uint8Array> {
    return this.activeProvider.read(uri);
  }

  async delete(uri: string): Promise<boolean> {
    return this.activeProvider.delete(uri);
  }

  async exists(uri: string): Promise<boolean> {
    return this.activeProvider.exists(uri);
  }

  async scan(): Promise<any[]> {
    if (typeof (this.activeProvider as any).scan === 'function') {
      return (this.activeProvider as any).scan();
    }
    return (this.localFallback as any).scan();
  }
}


// -------------------------------------------------------------
// S3 / MinIO Provider Implementation
// -------------------------------------------------------------
class S3ArtifactProvider implements IArtifactProviderAdapter {
  id = 's3-artifact-provider';
  name = 'S3 / MinIO Artifact Provider';
  type = 'artifact-provider' as const;

  private client: any;
  private bucket: string = '';
  private initialized = false;

  constructor(private mode: 's3' | 'minio') {}

  async initialize(config: Record<string, any>): Promise<void> {
    const { S3Client } = require('@aws-sdk/client-s3');
    
    this.bucket = process.env.AWS_S3_BUCKET || config.bucket || 'openclaw-artifacts';
    const region = process.env.AWS_REGION || config.region || 'us-east-1';

    const clientConfig: any = {
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      }
    };

    if (this.mode === 'minio') {
      clientConfig.endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
      clientConfig.forcePathStyle = true;
    }

    this.client = new S3Client(clientConfig);
    this.initialized = true;
  }

  async shutdown(): Promise<void> {}

  async checkHealth(): Promise<HealthCheckResult> {
    try {
      const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
      await this.client.send(new ListObjectsV2Command({ Bucket: this.bucket, MaxKeys: 1 }));
      return {
        status: 'healthy',
        latencyMs: 15,
        lastCheckedAt: new Date().toISOString(),
        version: 's3-v3'
      };
    } catch (err: any) {
      return {
        status: 'unhealthy',
        latencyMs: 0,
        lastCheckedAt: new Date().toISOString(),
        errorMessage: err.message
      };
    }
  }

  async getCapabilities(): Promise<CapabilityReport> {
    return {
      providerId: this.id,
      providerName: this.name,
      version: '1.0.0',
      capabilities: [{ name: 's3-storage', description: 'Store and retrieve blobs in AWS/MinIO' }],
      supportedOperations: ['save', 'read', 'delete', 'exists'],
      limitations: [],
      dependencies: [],
      authRequirements: 'token'
    };
  }

  async save(key: string, data: Uint8Array, mimeType: string): Promise<string> {
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: Buffer.from(data),
      ContentType: mimeType
    }));
    return `${this.mode}://${this.bucket}/${key}`;
  }

  async read(uri: string): Promise<Uint8Array> {
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const key = uri.substring(uri.indexOf('/', 8) + 1); // remove mode://bucket/
    const response = await this.client.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: key
    }));
    const streamToBuffer = (stream: any): Promise<Buffer> =>
      new Promise((resolve, reject) => {
        const chunks: any[] = [];
        stream.on('data', (chunk: any) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
      });
    const buffer = await streamToBuffer(response.Body);
    return new Uint8Array(buffer);
  }

  async delete(uri: string): Promise<boolean> {
    try {
      const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
      const key = uri.substring(uri.indexOf('/', 8) + 1);
      await this.client.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      }));
      return true;
    } catch {
      return false;
    }
  }

  async exists(uri: string): Promise<boolean> {
    try {
      const { HeadObjectCommand } = require('@aws-sdk/client-s3');
      const key = uri.substring(uri.indexOf('/', 8) + 1);
      await this.client.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key
      }));
      return true;
    } catch {
      return false;
    }
  }
}

// -------------------------------------------------------------
// GCS Provider Implementation
// -------------------------------------------------------------
class GcsArtifactProvider implements IArtifactProviderAdapter {
  id = 'gcs-artifact-provider';
  name = 'Google Cloud Storage Provider';
  type = 'artifact-provider' as const;

  private storage: any;
  private bucketName: string = '';

  async initialize(config: Record<string, any>): Promise<void> {
    const { Storage } = require('@google-cloud/storage');
    this.bucketName = process.env.GCS_BUCKET || config.bucket || 'openclaw-gcs';
    this.storage = new Storage();
  }

  async shutdown(): Promise<void> {}

  async checkHealth(): Promise<HealthCheckResult> {
    try {
      await this.storage.bucket(this.bucketName).exists();
      return { status: 'healthy', latencyMs: 20, lastCheckedAt: new Date().toISOString(), version: 'gcs' };
    } catch (err: any) {
      return { status: 'unhealthy', latencyMs: 0, lastCheckedAt: new Date().toISOString(), errorMessage: err.message };
    }
  }

  async getCapabilities(): Promise<CapabilityReport> {
    return {
      providerId: this.id,
      providerName: this.name,
      version: '1.0.0',
      capabilities: [{ name: 'gcs-storage', description: 'Store and retrieve blobs in GCP GCS' }],
      supportedOperations: ['save', 'read', 'delete', 'exists'],
      limitations: [],
      dependencies: [],
      authRequirements: 'token'
    };
  }

  async save(key: string, data: Uint8Array, mimeType: string): Promise<string> {
    const file = this.storage.bucket(this.bucketName).file(key);
    await file.save(Buffer.from(data), { metadata: { contentType: mimeType } });
    return `gcs://${this.bucketName}/${key}`;
  }

  async read(uri: string): Promise<Uint8Array> {
    const key = uri.substring(uri.indexOf('/', 6) + 1); // remove gcs://bucket/
    const file = this.storage.bucket(this.bucketName).file(key);
    const [content] = await file.download();
    return new Uint8Array(content);
  }

  async delete(uri: string): Promise<boolean> {
    try {
      const key = uri.substring(uri.indexOf('/', 6) + 1);
      await this.storage.bucket(this.bucketName).file(key).delete();
      return true;
    } catch {
      return false;
    }
  }

  async exists(uri: string): Promise<boolean> {
    try {
      const key = uri.substring(uri.indexOf('/', 6) + 1);
      const [exists] = await this.storage.bucket(this.bucketName).file(key).exists();
      return exists;
    } catch {
      return false;
    }
  }
}

// -------------------------------------------------------------
// Azure Provider Implementation
// -------------------------------------------------------------
class AzureArtifactProvider implements IArtifactProviderAdapter {
  id = 'azure-artifact-provider';
  name = 'Azure Blob Storage Provider';
  type = 'artifact-provider' as const;

  private containerClient: any;

  async initialize(config: Record<string, any>): Promise<void> {
    const { BlobServiceClient } = require('@azure/storage-blob');
    const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
    const containerName = process.env.AZURE_CONTAINER || config.container || 'openclaw-azure';
    const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
    this.containerClient = blobServiceClient.getContainerClient(containerName);
  }

  async shutdown(): Promise<void> {}

  async checkHealth(): Promise<HealthCheckResult> {
    try {
      await this.containerClient.exists();
      return { status: 'healthy', latencyMs: 25, lastCheckedAt: new Date().toISOString(), version: 'azure' };
    } catch (err: any) {
      return { status: 'unhealthy', latencyMs: 0, lastCheckedAt: new Date().toISOString(), errorMessage: err.message };
    }
  }

  async getCapabilities(): Promise<CapabilityReport> {
    return {
      providerId: this.id,
      providerName: this.name,
      version: '1.0.0',
      capabilities: [{ name: 'azure-storage', description: 'Store and retrieve blobs in Azure Storage' }],
      supportedOperations: ['save', 'read', 'delete', 'exists'],
      limitations: [],
      dependencies: [],
      authRequirements: 'custom'
    };
  }

  async save(key: string, data: Uint8Array, mimeType: string): Promise<string> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(key);
    await blockBlobClient.uploadData(Buffer.from(data), { blobHTTPHeaders: { blobContentType: mimeType } });
    return `azure://${this.containerClient.containerName}/${key}`;
  }

  async read(uri: string): Promise<Uint8Array> {
    const key = uri.substring(uri.indexOf('/', 8) + 1); // remove azure://container/
    const blockBlobClient = this.containerClient.getBlockBlobClient(key);
    const downloadBlockBlobResponse = await blockBlobClient.download(0);
    const streamToBuffer = (readableStream: any): Promise<Buffer> =>
      new Promise((resolve, reject) => {
        const chunks: any[] = [];
        readableStream.on('data', (data: any) => chunks.push(data instanceof Buffer ? data : Buffer.from(data)));
        readableStream.on('end', () => resolve(Buffer.concat(chunks)));
        readableStream.on('error', reject);
      });
    const buffer = await streamToBuffer(downloadBlockBlobResponse.readableStreamBody);
    return new Uint8Array(buffer);
  }

  async delete(uri: string): Promise<boolean> {
    try {
      const key = uri.substring(uri.indexOf('/', 8) + 1);
      await this.containerClient.getBlockBlobClient(key).delete();
      return true;
    } catch {
      return false;
    }
  }

  async exists(uri: string): Promise<boolean> {
    try {
      const key = uri.substring(uri.indexOf('/', 8) + 1);
      return await this.containerClient.getBlockBlobClient(key).exists();
    } catch {
      return false;
    }
  }
}

export const objectStoragePlatformProvider = new ObjectStoragePlatformProvider();
export default objectStoragePlatformProvider;
