/* eslint-disable no-console */

require("dotenv").config();

const { Client } = require("typesense");

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

async function main() {
  const host = required("TYPESENSE_HOST");
  const port = Number(required("TYPESENSE_PORT"));
  const protocol = required("TYPESENSE_PROTOCOL");
  const apiKey = required("TYPESENSE_ADMIN_API_KEY");
  const indexName = process.env.TYPESENSE_COLLECTION_LISTINGS || "listings";

  const client = new Client({
    nodes: [{ host, port, protocol }],
    apiKey,
    retryIntervalSeconds: 5,
    connectionTimeoutSeconds: 60,
  });

  const schema = {
    name: indexName,
    fields: [
      { name: "id", type: "string" },
      { name: "title", type: "string" },
      { name: "description", type: "string", optional: true },
      { name: "status", type: "string", facet: true },
      { name: "propertyType", type: "string", facet: true, optional: true },
      { name: "currency", type: "string", facet: true },
      { name: "priceAmount", type: "float" },
      { name: "createdAt", type: "int64" },
      {
        name: "embedding",
        type: "float[]",
        embed: {
          from: ["title", "description"],
          model_config: {
            model_name: "ts/all-MiniLM-L12-v2",
          },
        },
      },
    ],
    default_sorting_field: "createdAt",
  };

  try {
    await client.collections(indexName).delete();
    console.log(`Deleted existing collection: ${indexName}`);
  } catch {
    // ignore if missing
  }

  await client.collections().create(schema);
  console.log(`Created collection: ${indexName}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
