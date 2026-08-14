# Context-IQ

Context-IQ is a Retrieval-Augmented Generation (RAG) application that allows users to upload documents, process them automatically, index their content in a vector database, and ask questions about the uploaded documents.

The system is designed as an end-to-end document retrieval and question-answering pipeline.

---

## Overview

The main workflow of Context-IQ is:

```text
User
  ↓
Document Upload
  ↓
Ingestion Pipeline
  ↓
Document Parsing
  ↓
Text Chunking
  ↓
Embedding Generation
  ↓
Vector Indexing
  ↓
Document Retrieval
  ↓
LLM
  ↓
Answer + Sources
```

The goal is to allow the LLM to answer questions using the user's documents rather than relying on external knowledge.

---

# Architecture

Context-IQ consists of several main layers:

- Frontend
- API layer
- Document processing pipeline
- Database
- Embedding service
- Vector database
- LLM service

### Main Technologies

- Nuxt
- Vue
- Tailwind CSS
- TypeScript
- Nitro server APIs
- Prisma
- PostgreSQL
- Qdrant
- Python Embedding Service
- OpenRouter
- NVIDIA Nemotron

---

# Document Ingestion Pipeline

The ingestion pipeline is responsible for transforming an uploaded document into searchable vector representations.

The entire process is triggered automatically after a document is uploaded.

```text
Upload
  ↓
Create Document
  ↓
Parse
  ↓
Store Extracted Text
  ↓
Chunk
  ↓
Generate Embeddings
  ↓
Store Chunks
  ↓
Index Vectors in Qdrant
  ↓
Completed
```

---

## 1. Upload

The user uploads a supported document through the frontend.

Currently supported formats:

- PDF
- DOCX
- TXT
- Markdown

During upload, the system:

- Validates the file type
- Generates a SHA-256 hash
- Detects duplicate files
- Generates a unique filename
- Stores the file on disk
- Creates a document record in PostgreSQL

The hash is used to prevent uploading the same document multiple times.

---

## 2. Document Creation

After the file is stored, a document record is created in PostgreSQL.

The document contains information such as:

- ID
- Original filename
- Saved filename
- File path
- MIME type
- File size
- Hash
- Processing status
- Extracted text
- Creation/update timestamps

The document status is updated during the ingestion process.

Example:

```text
PENDING
  ↓
PARSING
  ↓
CHUNKING
  ↓
EMBEDDING
  ↓
INDEXING
  ↓
COMPLETED
```

If an error occurs, the document enters an error state.

---

# 3. Document Parsing

The parsing stage extracts raw text from the uploaded document.

Different parsers are used depending on the MIME type.

### PDF

PDF files are processed using `pdf-parse`.

### DOCX

DOCX files are processed using `mammoth`.

### TXT / Markdown

Text files are read directly from the filesystem.

The result of this stage is plain text.

```text
Document
   ↓
Parser
   ↓
Extracted Text
```

The extracted text is stored in PostgreSQL and is then passed to the chunking stage.

---

# 4. Chunking

Large documents cannot efficiently be sent to the embedding model as a single piece of text.

Therefore, the extracted text is divided into smaller chunks.

The current chunking configuration uses:

```text
Chunk size: 500
Overlap: 100
```

The overlap allows neighboring chunks to share some context.

For example:

```text
Chunk 1
[--------------------]

             Chunk 2
             [--------------------]

                         Chunk 3
                         [--------------------]
```

Each chunk receives:

- Chunk ID
- Document ID
- Content
- Index

Chunks are stored in PostgreSQL.

---

# 5. Embedding Generation

Each chunk is converted into a numerical vector using the embedding service.

The backend sends the chunk texts to the embedding API:

```text
Chunks
  ↓
Embedding Service
  ↓
Vectors
```

The current embedding vectors contain:

```text
1024 dimensions
```

These vectors represent the semantic meaning of the text.

Similar pieces of text should produce vectors that are close to each other in vector space.

---

# 6. Vector Indexing

Generated embeddings are stored in Qdrant.

Each Qdrant point contains:

```text
Vector
+
chunkId
+
documentId
+
content
+
index
```

Qdrant uses cosine similarity to compare vectors.

The vector collection is automatically initialized if it does not already exist.

---

# Retrieval Pipeline

The retrieval pipeline is used when the user asks a question.

```text
User Question
     ↓
Question Embedding
     ↓
Vector Search
     ↓
Top K Chunks
     ↓
Context Construction
```

---

## 1. Query

The user sends a natural-language question.

Example:

```text
یک طرفه بودن داده یعنی چی؟
```

---

## 2. Query Embedding

The question is converted into an embedding using the same embedding service used during ingestion.

This is important because document chunks and user queries must exist in the same vector space.

```text
Question
   ↓
Embedding Model
   ↓
Query Vector
```

---

## 3. Similarity Search

The query vector is sent to Qdrant.

Qdrant returns the most semantically similar chunks.

Currently the system retrieves the top 5 results.

Each result contains:

- Chunk ID
- Document ID
- Content
- Index
- Similarity score

Example:

```text
Query
  ↓
Qdrant
  ↓
Result 1   score: 0.53
Result 2   score: 0.38
Result 3   score: 0.37
...
```

---

# RAG / Chat Pipeline

After retrieving relevant chunks, they are combined into a context and sent to the LLM.

```text
User Question
      ↓
Query Embedding
      ↓
Qdrant Search
      ↓
Relevant Chunks
      ↓
Context Construction
      ↓
LLM
      ↓
Answer
      ↓
Sources
```

The LLM receives a system prompt containing the retrieved context.

The model is instructed to:

- Use only the provided context
- Avoid external knowledge
- Avoid inventing information
- Clearly answer the question
- Say when the context does not contain enough information

This makes the LLM operate as the generation component of the RAG system rather than the source of knowledge.

---

# Sources

Every answer can contain the chunks that were used to generate the response.

Sources include:

- Document ID
- Chunk ID
- Chunk index
- Similarity score
- Original chunk content

This allows the user to inspect the retrieved context behind an answer.

---

# Current Pipeline

The current system can be summarized as:

```text
                    INGESTION
                       │
                       ▼
                  File Upload
                       │
                       ▼
                Duplicate Check
                       │
                       ▼
               Document Creation
                       │
                       ▼
                    Parsing
                       │
                       ▼
                   Chunking
                       │
                       ▼
                Embedding API
                       │
                       ▼
                 Vector Indexing
                       │
                       ▼
                    Qdrant
                       │
                       │
                       ▼
                    RETRIEVAL
                       │
                 User Question
                       │
                       ▼
                Query Embedding
                       │
                       ▼
                 Qdrant Search
                       │
                       ▼
                Top-K Chunks
                       │
                       ▼
                Context Builder
                       │
                       ▼
                      LLM
                       │
                       ▼
                 Final Answer
                       │
                       ▼
                    Sources
```

---

# Database Responsibilities

PostgreSQL is used for structured application data.

It stores:

### Documents

Information about uploaded documents and their processing state.

### Chunks

The text chunks extracted from documents.

Qdrant is used separately for semantic vector search.

This separation allows PostgreSQL to act as the primary application database while Qdrant handles vector similarity search.

---

# Error Handling

The ingestion pipeline updates document status when processing succeeds or fails.

Possible processing stages include:

```text
PENDING
PARSING
CHUNKING
EMBEDDING
INDEXING
COMPLETED
FAILED
```

If a stage fails, the error is logged and the document can be identified through its processing status.

---

# Project Structure

A simplified structure of the backend is:

```text
server/
│
├── api/
│   ├── upload/
│   ├── documents/
│   └── chat/
│
├── repositories/
│   ├── document.repository.ts
│   └── chunk.repository.ts
│
├── services/
│   ├── upload.service.ts
│   ├── parsing.service.ts
│   ├── chunking.service.ts
│   ├── embedding.service.ts
│   ├── vector.service.ts
│   ├── document.processing.service.ts
│   └── llm.service.ts
│
├── libs/
│   └── prisma.ts
│
└── utils/
    └── qdrant.ts
```

The frontend contains the document upload dashboard and chat interface.

---

# Roadmap

The initial RAG pipeline is functional, but several improvements can make the system more robust.

## Retrieval Improvements

- [ ] Reranking
- [ ] Hybrid search
- [ ] Better chunking strategies
- [ ] Metadata filtering
- [ ] Retrieval evaluation
- [ ] Context compression

## Chat Improvements

- [ ] Streaming LLM responses
- [ ] Conversation history
- [ ] Multi-turn conversations
- [ ] Better source visualization
- [ ] Source citation inside answers
- [ ] Conversation persistence

## Ingestion Improvements

- [ ] Background job queue
- [ ] Retry failed processing jobs
- [ ] Parallel document processing
- [ ] Better progress reporting
- [ ] OCR support
- [ ] More document formats

## Production Improvements

- [ ] Authentication
- [ ] User-specific documents
- [ ] Access control
- [ ] Dockerized deployment
- [ ] Environment-based configuration
- [ ] Logging and monitoring
- [ ] Rate limiting
- [ ] Automated tests

---

# Current Status

The project currently provides an end-to-end RAG pipeline:

```text
Document Upload
       ✓
Document Parsing
       ✓
Text Chunking
       ✓
Embedding Generation
       ✓
Vector Indexing
       ✓
Semantic Retrieval
       ✓
LLM Generation
       ✓
Source Display
       ✓
```

Future development will focus primarily on improving retrieval quality, conversation capabilities, evaluation, and production readiness.
