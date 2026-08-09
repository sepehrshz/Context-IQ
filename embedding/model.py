from FlagEmbedding import BGEM3FlagModel


model = BGEM3FlagModel(
    "BAAI/bge-m3",
    use_fp16=True,
)


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    result = model.encode(
        texts,
        batch_size=12,
        max_length=8192,
    )

    dense_vectors = result["dense_vecs"]

    return dense_vectors.tolist()