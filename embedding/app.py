from fastapi import FastAPI
from pydantic import BaseModel

from model import generate_embeddings


app = FastAPI()


class EmbeddingRequest(BaseModel):
    texts: list[str]


@app.post("/embed")
def embed(request: EmbeddingRequest):
    embeddings = generate_embeddings(request.texts)

    return {
        "embeddings": embeddings,
    }