// frontend/src/app/api/ingest/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone"; // server-side only

// env:
// PINECONE_API_KEY, PINECONE_INDEX, PINECONE_ENV (or region)
const pineconeApiKey = process.env.PINECONE_API_KEY!;
const pineconeIndexName = process.env.PINECONE_INDEX!;

// helper - write a simple numeric id
const makeId = (base: string, i: number) => `${base.replace(/\W/g, "_")}_chunk_${i}`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const sessionId = (formData.get("sessionId") as string) || "default";

    if (!file) return NextResponse.json({ error: "missing file" }, { status: 400 });

    // 1) convert uploaded file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2) extract text from PDF
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text || "";
    if (!text.trim()) {
      return NextResponse.json({ error: "no text extracted" }, { status: 400 });
    }

    // 3) chunk text with LangChain splitter
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,    // tweak as needed (500-1500 chars common)
      chunkOverlap: 200,
    });
    // create a single Document (pageContent) and split it
    const doc = new Document({ pageContent: text, metadata: { source: file.name, sessionId } });
    const chunks = await splitter.splitDocuments([doc]); // returns Document[]

    // 4) instantiate the HuggingFace/Transformers embeddings wrapper (uses transformers.js)
    const hfEmbedder = new HuggingFaceTransformersEmbeddings({
      model: "Xenova/all-MiniLM-L6-v2", // small, fast; change if you need other dims
      // you can pass options here if needed per docs
    });

    // 5) create embeddings for each chunk
    const texts = chunks.map((c) => c.pageContent);
    const embeddings = await hfEmbedder.embedDocuments(texts); // returns number[][]

    // 6) upsert to Pinecone
    const pinecone = new PineconeClient();
    await pinecone.init({ apiKey: pineconeApiKey, environment: process.env.PINECONE_ENV || "" });
    const index = pinecone.Index(pineconeIndexName);

    const vectors = embeddings.map((values, i) => ({
      id: makeId(file.name, i),
      values, // embedding array
      metadata: {
        source: file.name,
        sessionId,
        text: texts[i].slice(0, 400), // store short preview
        page: i,
      },
    }));

    // Pinecone upsert (namespaced by sessionId if desired)
    await index.upsert({ upsertRequest: { namespace: sessionId, vectors } });

    return NextResponse.json({ message: "ingested", chunks: vectors.length });
  } catch (err) {
    console.error("ingest error", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
