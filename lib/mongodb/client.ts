import mongoose from 'mongoose'
import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined')

// Mongoose connection (for models)
const mongooseCache = (global as any).__mongoose ?? { conn: null, promise: null }
;(global as any).__mongoose = mongooseCache

export async function connectDB() {
  if (mongooseCache.conn) return mongooseCache.conn
  if (!mongooseCache.promise) {
    mongooseCache.promise = mongoose.connect(MONGODB_URI)
  }
  mongooseCache.conn = await mongooseCache.promise
  return mongooseCache.conn
}

// Native MongoClient (for NextAuth adapter)
const mongoClientCache = (global as any).__mongoClient ?? { client: null, promise: null }
;(global as any).__mongoClient = mongoClientCache

if (!mongoClientCache.promise) {
  mongoClientCache.client = new MongoClient(MONGODB_URI)
  mongoClientCache.promise = mongoClientCache.client.connect()
}

export const clientPromise: Promise<MongoClient> = mongoClientCache.promise
