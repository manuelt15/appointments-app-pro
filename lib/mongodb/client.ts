import mongoose from 'mongoose'
import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined')

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

interface MongoClientCache {
  client: MongoClient | null
  promise: Promise<MongoClient> | null
}

declare global {
  var __mongoose: MongooseCache | undefined
  var __mongoClient: MongoClientCache | undefined
}

// Cache connections across hot reloads in development.
const mongooseCache = globalThis.__mongoose ?? { conn: null, promise: null }
globalThis.__mongoose = mongooseCache

export async function connectDB() {
  if (mongooseCache.conn) return mongooseCache.conn
  if (!mongooseCache.promise) {
    mongooseCache.promise = mongoose.connect(MONGODB_URI)
  }
  mongooseCache.conn = await mongooseCache.promise
  return mongooseCache.conn
}

const mongoClientCache = globalThis.__mongoClient ?? { client: null, promise: null }
globalThis.__mongoClient = mongoClientCache

if (!mongoClientCache.promise) {
  mongoClientCache.client = new MongoClient(MONGODB_URI)
  mongoClientCache.promise = mongoClientCache.client.connect()
}

export const clientPromise: Promise<MongoClient> = mongoClientCache.promise
