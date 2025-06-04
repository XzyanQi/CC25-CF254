from flask import Flask, request, jsonify, send_from_directory
from transformers import AutoTokenizer, TFAutoModel
import faiss
import json
import numpy as np
import tensorflow as tf
from scripts.nlp_translate import preprocess_text as preprocess_text_indonesian
import time
import os

application = Flask(__name__, static_folder="static")

# Global variables
tokenizer = None
model = None
index = None
corpus = None
corpus_embeddings = None

def initialize_components():
    global tokenizer, model, index, corpus, corpus_embeddings

    print(" Memuat tokenizer lokal...")
    tokenizer_path = "model/indobert_local"
    tokenizer = AutoTokenizer.from_pretrained(tokenizer_path)

    print(" Memuat model HuggingFace lokal...")
    model = TFAutoModel.from_pretrained(tokenizer_path)
    print(" Model berhasil dimuat.")

    print(" Memuat FAISS index...")
    index_path = "model/mindfulness_index.faiss"
    if not os.path.exists(index_path):
        raise FileNotFoundError("File FAISS tidak ditemukan.")
    index = faiss.read_index(index_path)

    print(" Memuat corpus...")
    corpus_path = "model/corpus_final.json"
    if not os.path.exists(corpus_path):
        raise FileNotFoundError("File corpus tidak ditemukan.")
    with open(corpus_path, "r", encoding="utf-8") as f:
        corpus = json.load(f)

    print(" Memuat context_embeddings...")
    embeddings_path = "model/context_embeddings.npy"
    if not os.path.exists(embeddings_path):
        raise FileNotFoundError("File embeddings tidak ditemukan.")
    corpus_embeddings = np.load(embeddings_path)

def get_embedding(text):
    clean_text = preprocess_text_indonesian(text)
    inputs = tokenizer(clean_text, return_tensors="tf", truncation=True, padding=True, max_length=512)
    outputs = model(inputs).last_hidden_state
    vec = tf.reduce_mean(outputs, axis=1)
    return vec[0].numpy()

@application.route("/search", methods=["POST"])
def search():
    overall_start_time = time.time()
    data = request.get_json()
    query = data.get("text", "")
    top_k = data.get("top_k", 3)

    print(f"\n Menerima query: '{query}'")

    query_vec = get_embedding(query).reshape(1, -1).astype("float32")
    distances, indices = index.search(query_vec, top_k)

    results = []
    if indices.size > 0 and len(indices[0]) > 0:
     for idx, i in enumerate(indices[0]):
            if 0 <= i < len(corpus):
                doc = corpus[i]
                confidence = float(1 / (1 + distances[0][idx])) if distances[0][idx] > 0 else 1.0
                results.append({
                    "response_to_display": doc.get("response_to_display", "Format tidak sesuai."),
                    "intent": doc.get("intent", ""),
                    "keywords": doc.get("keywords", []),
                    "confidence_score": confidence,
                    "follow_up_questions": doc.get("follow_up_questions", []),
                    "follow_up_answers": doc.get("follow_up_answers", [])
                })
            # jangan tambahkan jika index -1/out of range
    else:
        results.append({
            "response_to_display": "Tidak ada jawaban relevan ditemukan.",
            "intent": "",
            "keywords": [],
            "confidence_score": 0.0,
            "follow_up_questions": [],
            "follow_up_answers": [] 
        })

    print(f" Total waktu proses: {(time.time() - overall_start_time) * 1000:.2f} ms")
    return jsonify({
        "query": query,
        "results": results
    })

@application.route("/")
def root():
    return send_from_directory("static", "index.html")

@application.route("/static/<path:path>")
def serve_static(path):
    return send_from_directory("static", path)

# Jalankan inisialisasi saat start
initialize_components()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    application.run(host="0.0.0.0", port=port)
