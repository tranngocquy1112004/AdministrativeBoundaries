import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const LOCAL_URI = process.env.LOCAL_MONGO_URI || "mongodb://127.0.0.1:27017";
const REMOTE_URI = process.env.REMOTE_MONGO_URI || "mongodb://103.98.152.198:27017";
const DB_NAME = process.env.DB_NAME || "administrative_boundaries";
const SOURCE_COLLECTION = process.env.SOURCE_COLLECTION || "units";

const BATCH_SIZE = Number(process.env.BATCH_SIZE || 1000);
const PRUNE_EXTRAS = String(process.env.PRUNE_EXTRAS || "false").toLowerCase() === "true";

async function run() {
	let localClient;
	let remoteClient;
	try {
		console.log("🟡 Connecting to local MongoDB:", LOCAL_URI);
		localClient = await MongoClient.connect(LOCAL_URI, { maxPoolSize: 10 });
		const localDb = localClient.db(DB_NAME);
		const sourceCol = localDb.collection(SOURCE_COLLECTION);

		console.log("🟡 Connecting to remote MongoDB:", REMOTE_URI);
		remoteClient = await MongoClient.connect(REMOTE_URI, { maxPoolSize: 10 });
		const remoteDb = remoteClient.db(DB_NAME);
		const v1Col = remoteDb.collection("v1");
		const v2Col = remoteDb.collection("v2");

		// Ensure helpful indexes on destination collections
		await Promise.all([
			v1Col.createIndex({ uniqueKey: 1 }, { unique: false }),
			v1Col.createIndex({ code: 1, level: 1 }),
			v2Col.createIndex({ uniqueKey: 1 }, { unique: false }),
			v2Col.createIndex({ code: 1, level: 1 }),
		]);

		// Normalize: ensure uniqueKey populated on destination to avoid duplicates
		await Promise.all([
			v1Col.updateMany(
				{ $or: [ { uniqueKey: { $exists: false } }, { uniqueKey: null }, { uniqueKey: "" } ] },
				[
					{ $set: { uniqueKey: { $concat: ["v1-", "$level", "-", { $toString: "$code" }] } } },
				]
			),
			v2Col.updateMany(
				{ $or: [ { uniqueKey: { $exists: false } }, { uniqueKey: null }, { uniqueKey: "" } ] },
				[
					{ $set: { uniqueKey: { $concat: ["", "$level", "-", { $toString: "$code" }] } } },
				]
			),
		]);

		console.log("🔎 Counting documents in source collection...");
		const total = await sourceCol.countDocuments();
		console.log(`📦 Source documents: ${total}`);

		const cursor = sourceCol.find({}, { noCursorTimeout: true }).batchSize(BATCH_SIZE);
		let batchV1 = [];
		let batchV2 = [];
		let processed = 0;
		// Keep set of keys to optionally prune extras later
		const sourceKeysV1 = new Set();
		const sourceKeysV2 = new Set();

		const flush = async () => {
			const ops = [];
			if (batchV1.length) {
				ops.push(v1Col.bulkWrite(
					batchV1.map((doc) => {
						const key = doc.uniqueKey || `v1-${doc.level}-${doc.code}`;
						return {
							updateOne: {
								filter: { $or: [ { uniqueKey: key }, { uniqueKey: { $exists: false }, level: doc.level, code: doc.code } ] },
								update: { $set: { ...doc, uniqueKey: key } },
								upsert: true,
							},
						};
					}),
					{ ordered: false }
				));
			}
			if (batchV2.length) {
				ops.push(v2Col.bulkWrite(
					batchV2.map((doc) => {
						const key = doc.uniqueKey || `${doc.level}-${doc.code}`;
						return {
							updateOne: {
								filter: { $or: [ { uniqueKey: key }, { uniqueKey: { $exists: false }, level: doc.level, code: doc.code } ] },
								update: { $set: { ...doc, uniqueKey: key } },
								upsert: true,
							},
						};
					}),
					{ ordered: false }
				));
			}
			if (ops.length) await Promise.all(ops);
			batchV1 = [];
			batchV2 = [];
		};

		while (await cursor.hasNext()) {
			const doc = await cursor.next();
			// Determine version
			const version = doc?.schemaVersion === "v2" ? "v2" : "v1";

			// Clean up transient fields if any
			const clean = { ...doc };
			// Keep _id for idempotent upserts. Remove any cursor-specific fields
			// If migrating to v2 collection and you want to drop schemaVersion, uncomment:
			// if (version === "v2") delete clean.schemaVersion;

			if (version === "v1") {
				batchV1.push(clean);
				const key = clean.uniqueKey || `v1-${clean.level}-${clean.code}`;
				sourceKeysV1.add(key);
			} else {
				batchV2.push(clean);
				const key = clean.uniqueKey || `${clean.level}-${clean.code}`;
				sourceKeysV2.add(key);
			}

			processed += 1;
			if (processed % BATCH_SIZE === 0) {
				await flush();
				console.log(`➡️  Processed ${processed}/${total}`);
			}
		}

		await flush();

		if (PRUNE_EXTRAS) {
			console.log("🧹 Pruning extras not present in source...");
			const [delV1, delV2] = await Promise.all([
				v1Col.deleteMany({ $or: [ { uniqueKey: { $nin: Array.from(sourceKeysV1) } }, { uniqueKey: { $exists: false } } ] }),
				v2Col.deleteMany({ $or: [ { uniqueKey: { $nin: Array.from(sourceKeysV2) } }, { uniqueKey: { $exists: false } } ] }),
			]);
			console.log(`🧹 Removed extras -> v1: ${delV1.deletedCount}, v2: ${delV2.deletedCount}`);
		}

		console.log(`✅ Completed. Total processed: ${processed}`);
	} catch (err) {
		console.error("❌ Migration failed:", err);
		process.exitCode = 1;
	} finally {
		try { await localClient?.close(); } catch {}
		try { await remoteClient?.close(); } catch {}
	}
}

run();


