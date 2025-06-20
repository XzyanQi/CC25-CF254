import os
import time
import json
import numpy as np
import faiss
import tensorflow as tf
from flask import Flask, request, jsonify
from transformers import AutoTokenizer, TFAutoModel
from scripts.nlp_translate import preprocess_text as preprocess_text_indonesian
from difflib import SequenceMatcher

application = Flask(__name__, static_folder="static")

tokenizer = None
model = None
index = None
corpus = None
corpus_embeddings = None

MIN_CONFIDENCE = 0.05
SAFE_CONFIDENCE = 0.15

def initialize_components():
    global tokenizer, model, index, corpus, corpus_embeddings

    try:
        print(" Memuat tokenizer lokal...")
        tokenizer_path = "model/indobert_local"
        tokenizer = AutoTokenizer.from_pretrained(tokenizer_path)

        print(" Memuat model HuggingFace lokal...")
        model = TFAutoModel.from_pretrained(tokenizer_path)

        print(" Memuat FAISS index...")
        index_path = "model/mindfulness_index.faiss"
        if not os.path.exists(index_path):
            raise FileNotFoundError(" File FAISS tidak ditemukan.")
        index = faiss.read_index(index_path)

        print(" Memuat corpus...")
        corpus_path = "model/corpus_final.json"
        if not os.path.exists(corpus_path):
            raise FileNotFoundError(" File corpus tidak ditemukan.")
        with open(corpus_path, "r", encoding="utf-8") as f:
            corpus = json.load(f)

        print(" Memuat context_embeddings...")
        embeddings_path = "model/context_embeddings.npy"
        if not os.path.exists(embeddings_path):
            raise FileNotFoundError(" File embeddings tidak ditemukan.")
        corpus_embeddings = np.load(embeddings_path)

        print(f" Jumlah FAISS index: {index.ntotal}")
        print(f" Jumlah corpus: {len(corpus)}")
        if index.ntotal != len(corpus):
            raise ValueError(f"ERROR: Jumlah index ({index.ntotal}) dan corpus ({len(corpus)}) tidak sinkron. Rebuild FAISS index dulu.")

    except Exception as e:
        print(f" ERROR saat inisialisasi komponen: {e}")
        raise

def get_embedding(text):
    clean_text = preprocess_text_indonesian(text)
    inputs = tokenizer(clean_text, return_tensors="tf", truncation=True, padding=True, max_length=512)
    outputs = model(inputs).last_hidden_state
    vec = tf.reduce_mean(outputs, axis=1)
    return vec[0].numpy()

def keyword_match(query, corpus):
    """Mencari dokumen berdasarkan kecocokan frasa dalam kata kunci"""
    query_lower = query.lower()
    query_words = query_lower.split()
    matches = []
    
    print(f"\n[DEBUG] Query: '{query_lower}'")
    print(f"[DEBUG] Kata-kata dalam query: {query_words}")
    
    for doc in corpus:
        for keyword in doc.get("keywords", []):
            keyword_lower = keyword.lower()
            keyword_words = keyword_lower.split()
            
            if keyword_lower in query_lower:
                print(f"[DEBUG] Ditemukan frasa lengkap: '{keyword_lower}'")
                matches.append((doc, len(keyword_words), 2))
                continue

            for i in range(len(query_words) - len(keyword_words) + 1):
                if query_words[i:i+len(keyword_words)] == keyword_words:
                    print(f"[DEBUG] Ditemukan kata berurutan: '{keyword_lower}'")
                    matches.append((doc, len(keyword_words), 1)) 
                    break

            if not matches:
                matched_words = sum(1 for w in keyword_words if w in query_words)
                if matched_words >= len(keyword_words) * 0.7:  
                    print(f"[DEBUG] Ditemukan {matched_words}/{len(keyword_words)} kata: '{keyword_lower}'")
                    matches.append((doc, matched_words, 0))  
    
    matches.sort(key=lambda x: (x[2], x[1]), reverse=True)
    return [doc for doc, _, _ in matches]

@application.route("/search", methods=["POST"])
def search():
    """Endpoint utama untuk pencarian"""
    waktu_mulai = time.time()
    data = request.get_json()
    query = data.get("text", "").strip()
    top_k = data.get("top_k", 5)

    if not query:
        return jsonify({
            "query": query,
            "results": [{
                "response_to_display": "Teks kosong. Silakan masukkan pertanyaan atau cerita.",
                "intent": "",
                "keywords": [],
                "confidence_score": 0.0,
            }]
        }), 400

    print(f"\nQuery asli: '{query}'")

    try:
        print("\nMencoba pencocokan kata kunci...")
        hasil_keyword = keyword_match(query, corpus)
        
        if hasil_keyword:
            doc = hasil_keyword[0]
            print(f"Ditemukan kecocokan kata kunci! Intent: {doc.get('intent')}")
            print(f"Keywords yang cocok: {doc.get('keywords')}")
            return jsonify({
                "query": query,
                "results": [{
                    "response_to_display": doc.get("response_to_display", "Format tidak sesuai."),
                    "intent": doc.get("intent", ""),
                    "keywords": doc.get("keywords", []),
                    "confidence_score": 0.9,  
                    "matched_by": "keyword"
                }]
            })

        print("\nTidak ada kecocokan kata kunci, mencoba FAISS...")
        clean_query = preprocess_text_indonesian(query)
        print(f"Query setelah preprocessing: '{clean_query}'")

        query_vec = get_embedding(query).reshape(1, -1).astype("float32")
        distances, indices = index.search(query_vec, top_k)

        print(f"Jarak FAISS: {distances}")
        print(f"Indeks FAISS: {indices}")

        confidences = [float(np.exp(-d)) if d != 0 else 1.0 for d in distances[0]]
        print(f"Skor kepercayaan: {confidences}")

        results = []
        for idx, i in enumerate(indices[0]):
            if 0 <= i < len(corpus):
                doc = corpus[i]
                results.append({
                    "response_to_display": doc.get("response_to_display", "Format tidak sesuai."),
                    "intent": doc.get("intent", ""),
                    "keywords": doc.get("keywords", []),
                    "confidence_score": confidences[idx],
                    "matched_by": "faiss"
                })

        filtered_results = [r for r in results if r["confidence_score"] >= MIN_CONFIDENCE]

        if not filtered_results:
            filtered_results = [{
                "response_to_display": "Maaf, saya belum memahami pertanyaan Anda. Bisakah Anda menjelaskan dengan cara lain?",
                "intent": "clarification_needed",
                "keywords": [],
                "confidence_score": 0.0,
                "matched_by": "none"
            }]

        waktu_proses = (time.time() - waktu_mulai) * 1000
        print(f"Total waktu proses: {waktu_proses:.2f} ms")
        print(f"Mengembalikan {len(filtered_results)} hasil")

        return jsonify({
            "query": query,
            "results": filtered_results
        })

    except Exception as e:
        print(f"ERROR saat pencarian: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "query": query,
            "results": [{
                "response_to_display": "Maaf, terjadi kesalahan teknis. Silakan coba lagi.",
                "intent": "technical_error",
                "keywords": [],
                "confidence_score": 0.0,
                "matched_by": "error"
            }]
        }), 500
    
@application.errorhandler(Exception)
def handle_exception(e):
    print(f" Global error handler: {e}")
    return jsonify({
        "error": "Terjadi kesalahan di server.",
        "details": str(e)
    }), 500

@application.route("/debug_corpus/<int:doc_id>", methods=["GET"])
def debug_corpus(doc_id):
    doc = next((d for d in corpus if d.get('id') == doc_id), None)
    if doc:
        return jsonify(doc)
    return jsonify({"error": "Document not found"}), 404

@application.route("/debug_search", methods=["POST"])
def debug_search():
    data = request.get_json()
    query = data.get("text", "").strip()
    if not query:
        return jsonify({"error": "Empty query"}), 400

    clean_query = preprocess_text_indonesian(query)
    query_vec = get_embedding(query)
    distances, indices = index.search(query_vec.reshape(1, -1).astype("float32"), 10)

    results = []
    for idx, i in enumerate(indices[0]):
        if 0 <= i < len(corpus):
            doc = corpus[i]
            confidence = float(np.exp(-distances[0][idx]))
            results.append({
                "index": int(i),
                "distance": float(distances[0][idx]),
                "confidence": confidence,
                "id": doc.get('id'),
                "intent": doc.get('intent'),
                "context": doc.get('context_for_indexing', '')[:200],
                "response": doc.get('response_to_display', '')[:200]
            })

    return jsonify({
        "original_query": query,
        "preprocessed_query": clean_query,
        "embedding_shape": query_vec.shape,
        "corpus_size": len(corpus),
        "index_size": index.ntotal,
        "results": results
    })

initialize_components()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    application.run(host="0.0.0.0", port=port)
