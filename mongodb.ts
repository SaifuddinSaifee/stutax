import { MongoClient, Db, ServerApiVersion } from 'mongodb';
import { config } from './config';

// Optional override, falls back to a sensible default
const DEFAULT_DB_NAME = process.env.MONGODB_DB || 'stutax';

let cachedClient: MongoClient | null = null;
let cachedDbName: string = DEFAULT_DB_NAME;

export async function getMongoClient(): Promise<MongoClient> {
  if (cachedClient) return cachedClient;

  const client = new MongoClient(config.mongodb.MONGODB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  await client.connect();
  cachedClient = client;
  return client;
}

export async function getDb(dbName: string = cachedDbName): Promise<Db> {
  const client = await getMongoClient();
  cachedDbName = dbName;
  return client.db(dbName);
}

export async function closeMongoClient(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
  }
}
