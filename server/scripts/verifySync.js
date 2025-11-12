import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const LOCAL_URI = process.env.LOCAL_MONGO_URI || "mongodb://127.0.0.1:27017";
const REMOTE_URI = process.env.REMOTE_MONGO_URI || "mongodb://103.98.152.198:27017";
const DB_NAME = process.env.DB_NAME || "administrative_boundaries";
const SOURCE_COLLECTION = process.env.SOURCE_COLLECTION || "units";
const MISSING_LIMIT = Number(process.env.MISSING_LIMIT || 100);

function hashString(input) {
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		hash = ((hash << 5) - hash) + input.charCodeAt(i);
		hash |= 0;
	}
	return hash >>> 0; // unsigned
}

function hashOfKeys(keys) {
	// Stable: sort then hash joined string
	const joined = keys.slice().sort().join("|");
	return hashString(joined);
}

async function fetchSourceSummary(localDb) {
	const col = localDb.collection(SOURCE_COLLECTION);
	const v1Query = { $or: [ { schemaVersion: { $exists: false } }, { schemaVersion: { $ne: "v2" } } ] };
	const v2Query = { schemaVersion: "v2" };

	const [srcV1, srcV2] = await Promise.all([
		col.countDocuments(v1Query),
		col.countDocuments(v2Query),
	]);

	const srcV1Keys = await col.find(v1Query, { projection: { uniqueKey: 1, level: 1, code: 1, _id: 0 } })
		.map(d => d.uniqueKey ?? `v1-${d.level}-${d.code}`)
		.toArray();
	const srcV2Keys = await col.find(v2Query, { projection: { uniqueKey: 1, level: 1, code: 1, _id: 0 } })
		.map(d => d.uniqueKey ?? `${d.level}-${d.code}`)
		.toArray();

	return {
		srcV1,
		srcV2,
		srcV1Keys,
		srcV2Keys,
		srcV1Hash: hashOfKeys(srcV1Keys),
		srcV2Hash: hashOfKeys(srcV2Keys),
	};
}

async function fetchDestSummary(remoteDb) {
	const v1Col = remoteDb.collection("v1");
	const v2Col = remoteDb.collection("v2");
	const [dstV1, dstV2] = await Promise.all([
		v1Col.countDocuments(),
		v2Col.countDocuments(),
	]);
	const dstV1Keys = await v1Col.find({}, { projection: { uniqueKey: 1, level: 1, code: 1, _id: 0 } })
		.map(d => d.uniqueKey ?? `v1-${d.level}-${d.code}`)
		.toArray();
	const dstV2Keys = await v2Col.find({}, { projection: { uniqueKey: 1, level: 1, code: 1, _id: 0 } })
		.map(d => d.uniqueKey ?? `${d.level}-${d.code}`)
		.toArray();
	return {
		dstV1,
		dstV2,
		dstV1Keys,
		dstV2Keys,
		dstV1Hash: hashOfKeys(dstV1Keys),
		dstV2Hash: hashOfKeys(dstV2Keys),
	};
}

function diffMissing(sourceKeys, destKeys, limit = 100) {
	const destSet = new Set(destKeys);
	const missing = [];
	for (const k of sourceKeys) {
		if (!destSet.has(k)) {
			missing.push(k);
			if (missing.length >= limit) break;
		}
	}
	return missing;
}

function diffExtras(sourceKeys, destKeys, limit = 100) {
	const srcSet = new Set(sourceKeys);
	const extras = [];
	for (const k of destKeys) {
		if (!srcSet.has(k)) {
			extras.push(k);
			if (extras.length >= limit) break;
		}
	}
	return extras;
}

async function run() {
	let localClient;
	let remoteClient;
	try {
		console.log("🟡 Connecting...");
		localClient = await MongoClient.connect(LOCAL_URI);
		remoteClient = await MongoClient.connect(REMOTE_URI);
		const localDb = localClient.db(DB_NAME);
		const remoteDb = remoteClient.db(DB_NAME);

		const [src, dst] = await Promise.all([
			fetchSourceSummary(localDb),
			fetchDestSummary(remoteDb),
		]);

		console.log("\n=== COUNTS ===");
		console.table([
			{ side: "source", v1: src.srcV1, v2: src.srcV2 },
			{ side: "dest", v1: dst.dstV1, v2: dst.dstV2 },
		]);

		console.log("\n=== HASHES (uniqueKey) ===");
		console.table([
			{ side: "source", v1Hash: src.srcV1Hash, v2Hash: src.srcV2Hash },
			{ side: "dest", v1Hash: dst.dstV1Hash, v2Hash: dst.dstV2Hash },
		]);

		const missingV1 = diffMissing(src.srcV1Keys, dst.dstV1Keys, MISSING_LIMIT);
		const missingV2 = diffMissing(src.srcV2Keys, dst.dstV2Keys, MISSING_LIMIT);
		const extrasV1 = diffExtras(src.srcV1Keys, dst.dstV1Keys, MISSING_LIMIT);
		const extrasV2 = diffExtras(src.srcV2Keys, dst.dstV2Keys, MISSING_LIMIT);

		console.log("\n=== MISSING (first", MISSING_LIMIT, ") ===");
		console.log("V1:", missingV1.length ? missingV1 : "None");
		console.log("V2:", missingV2.length ? missingV2 : "None");

		console.log("\n=== EXTRAS on DEST (first", MISSING_LIMIT, ") ===");
		console.log("V1 extras:", extrasV1.length ? extrasV1 : "None");
		console.log("V2 extras:", extrasV2.length ? extrasV2 : "None");

		const okV1 = src.srcV1 === dst.dstV1 && src.srcV1Hash === dst.dstV1Hash && missingV1.length === 0 && extrasV1.length === 0;
		const okV2 = src.srcV2 === dst.dstV2 && src.srcV2Hash === dst.dstV2Hash && missingV2.length === 0 && extrasV2.length === 0;
		console.log("\nResult:", okV1 && okV2 ? "✅ MATCH" : "❌ NOT MATCH");
		process.exitCode = okV1 && okV2 ? 0 : 2;
	} catch (err) {
		console.error("❌ verify failed:", err);
		process.exitCode = 1;
	} finally {
		try { await localClient?.close(); } catch {}
		try { await remoteClient?.close(); } catch {}
	}
}

run();


