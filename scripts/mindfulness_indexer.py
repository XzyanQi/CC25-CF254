import json
import numpy as np
import faiss
from transformers import AutoTokenizer, TFAutoModel
import tensorflow as tf
import os
from nlp_translate import preprocess_text as preprocess_text_indonesian

MODEL_PATH = "model/indobert_local"
CORPUS_PATH = "model/corpus_final.json"
EMBEDDINGS_PATH = "model/context_embeddings.npy"
FAISS_PATH = "model/mindfulness_index.faiss"

def get_embedding(text, tokenizer, model):
    clean_text = preprocess_text_indonesian(text)
    inputs = tokenizer(clean_text, return_tensors="tf", truncation=True, padding=True, max_length=512)
    outputs = model(inputs).last_hidden_state
    vec = tf.reduce_mean(outputs, axis=1)
    return vec[0].numpy()

def main():
    print("Memuat tokenizer dan model...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
    model = TFAutoModel.from_pretrained(MODEL_PATH)
    
    print("Memuat korpus...")
    with open(CORPUS_PATH, "r", encoding="utf-8") as f:
        corpus = json.load(f)

    print("Menghitung embeddings untuk setiap context_for_indexing...")
    all_embeddings = []
    for doc in corpus:
        context = doc.get("context_for_indexing", doc.get("response_to_display", ""))
        emb = get_embedding(context, tokenizer, model)
        all_embeddings.append(emb)
    
    all_embeddings = np.array(all_embeddings).astype("float32")
    print("Shape embeddings:", all_embeddings.shape)

    print(f"Simpan embeddings ke {EMBEDDINGS_PATH} ...")
    np.save(EMBEDDINGS_PATH, all_embeddings)

    print(f"Bangun dan simpan FAISS index ke {FAISS_PATH} ...")
    index = faiss.IndexFlatL2(all_embeddings.shape[1])
    index.add(all_embeddings)
    faiss.write_index(index, FAISS_PATH)
    print("Selesai!")

if __name__ == "__main__":
    main()