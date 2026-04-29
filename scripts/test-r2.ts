import { config } from "dotenv";
import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";

config({ path: ".env.local" });

const r2Vars = [
  { prefix: "PUBLIC_R2_", name: "public" },
  { prefix: "PRIVATE_R2_", name: "private" },
];

async function testR2Connection() {
  for (const { prefix, name } of r2Vars) {
    const endpoint = process.env[`${prefix}ENDPOINT`];
    const accessKeyId = process.env[`${prefix}ACCESS_KEY_ID`];
    const secretAccessKey = process.env[`${prefix}SECRET_ACCESS_KEY`];
    const bucketName = process.env[`${prefix}BUCKET_NAME`];

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      console.log(`⚠️  ${name} R2: Missing env vars (${prefix}*)`);
      continue;
    }

    console.log(`\nTesting ${name} R2...`);
    console.log("Endpoint:", endpoint);
    console.log("Bucket:", bucketName);

    const client = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });

    try {
      const command = new ListBucketsCommand({});
      const response = await client.send(command);
      console.log(`✅ ${name} R2 Connection successful!`);
      console.log("Buckets:", response.Buckets?.map(b => b.Name).join(", ") || "No buckets");
    } catch (error: any) {
      console.log(`❌ ${name} R2 failed:`, error.message);
    }
  }
}

testR2Connection();
