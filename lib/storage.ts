import { head } from "@vercel/blob";

const BLOB_FILENAME = process.env.PRODUCT_BLOB_FILENAME ?? "produto.zip";

export async function getProductBlob(): Promise<{
  stream: ReadableStream;
  size: number;
  contentType: string;
}> {
  const blobUrl = process.env.PRODUCT_BLOB_URL;

  if (!blobUrl) {
    throw new Error("PRODUCT_BLOB_URL not configured");
  }

  const metadata = await head(blobUrl, {
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  const res = await fetch(blobUrl, {
    headers: {
      Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
    },
  });

  if (!res.ok || !res.body) {
    throw new Error(`Failed to fetch blob: ${res.status}`);
  }

  return {
    stream: res.body,
    size: metadata.size,
    contentType: metadata.contentType ?? "application/zip",
  };
}

export { BLOB_FILENAME };
