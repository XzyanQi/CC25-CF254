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

# Global variables
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
    q = preprocess_text_indonesian(query).lower()
    q_set = set(q.split())
    matches = []
    for doc in corpus:
        keywords = [k.lower() for k in doc.get("keywords",[])]
        if q_set & set(keywords):
            matches.append(doc)
    return matches

def most_similar_index(user_answer, follow_up_answers):
    user_answer = user_answer.lower().strip()
    max_score = 0
    best_idx = 0
    for i, ans in enumerate(follow_up_answers):
        score = SequenceMatcher(None, user_answer, ans.lower()).ratio()
        if score > max_score:
            max_score = score
            best_idx = i
    return best_idx, max_score

@application.route("/search", methods=["POST"])
def search():
    start_time = time.time()
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
                "follow_up_questions": [],
                "follow_up_answers": [],
                "recomended_responses_to_follow_up_answers": []
            }]
        }), 400

    print(f"\n Query asli: '{query}'")

    try:
        clean_query = preprocess_text_indonesian(query)
        print(f"🧹 Query setelah preprocessing: '{clean_query}'")

        query_vec = get_embedding(query).reshape(1, -1).astype("float32")
        distances, indices = index.search(query_vec, top_k)

        print(f" Distances: {distances}")
        print(f" Indices: {indices}")

        confidences = []
        for d in distances[0]:
            if d == 0:
                conf = 1.0
            else:
                conf = np.exp(-d)
            confidences.append(float(conf))

        print(f" Confidences: {confidences}")

        results = []
        for idx, i in enumerate(indices[0]):
            if 0 <= i < len(corpus):
                confidence = confidences[idx]
                doc = corpus[i]
                results.append({
                    "response_to_display": doc.get("response_to_display", "Format tidak sesuai."),
                    "intent": doc.get("intent", ""),
                    "keywords": doc.get("keywords", []),
                    "confidence_score": confidence,
                    "follow_up_questions": doc.get("follow_up_questions", []),
                    "follow_up_answers": doc.get("follow_up_answers", []),
                    "recomended_responses_to_follow_up_answers": doc.get("recomended_responses_to_follow_up_answers", [])
                })

        filtered_results = [r for r in results if r["confidence_score"] >= MIN_CONFIDENCE]

        best_conf = results[0]['confidence_score'] if results else 0.0
        if not filtered_results or best_conf < SAFE_CONFIDENCE:
            print(f" Tidak ada hasil dengan confidence >= {MIN_CONFIDENCE} atau skor terbaik < {SAFE_CONFIDENCE}")
            keyword_results = keyword_match(query, corpus)
            if keyword_results:
                print(f" Keyword match ditemukan: {len(keyword_results)}")
                doc = keyword_results[0]
                filtered_results = [{
                    "response_to_display": doc.get("response_to_display", "Format tidak sesuai."),
                    "intent": doc.get("intent", ""),
                    "keywords": doc.get("keywords", []),
                    "confidence_score": 0.5,
                    "follow_up_questions": doc.get("follow_up_questions", []),
                    "follow_up_answers": doc.get("follow_up_answers", []),
                    "recomended_responses_to_follow_up_answers": doc.get("recomended_responses_to_follow_up_answers", [])
                }]
            else:
                filtered_results = [{
                    "response_to_display": "Maaf, aku belum punya jawaban relevan untuk pertanyaan itu. Bisakah kamu ceritakan atau tanyakan dengan cara lain?",
                    "intent": "clarification_needed",
                    "keywords": [],
                    "confidence_score": float(best_conf),
                    "follow_up_questions": [
                        "Bisa ceritakan lebih detail tentang situasimu?",
                        "Apa yang paling membuatmu khawatir saat ini?",
                        "Bagaimana perasaanmu secara keseluruhan hari ini?"
                    ],
                    "follow_up_answers": [],
                    "recomended_responses_to_follow_up_answers": []
                }]

        elapsed_ms = (time.time() - start_time) * 1000
        print(f" Total waktu proses: {elapsed_ms:.2f} ms")
        print(f" Mengembalikan {len(filtered_results)} hasil")

        return jsonify({
            "query": query,
            "results": filtered_results
        })

    except Exception as e:
        print(f" ERROR saat search FAISS: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "query": query,
            "results": [{
                "response_to_display": "Terjadi kesalahan teknis. Coba lagi nanti.",
                "intent": "technical_error",
                "keywords": [],
                "confidence_score": 0.0,
                "follow_up_questions": [],
                "follow_up_answers": [],
                "recomended_responses_to_follow_up_answers": []
            }]
        }), 500

@application.route("/followup", methods=["POST"])
def followup():
    data = request.get_json()
    intent = data.get("intent")
    answer_index = data.get("answer_index")  
    user_answer = data.get("user_answer")    
    if not intent:
        return jsonify({"error": "Parameter intent wajib diisi."}), 400

    doc = next((d for d in corpus if d.get('intent') == intent), None)
    if not doc:
        return jsonify({"error": "Data tidak ditemukan untuk intent tersebut."}), 404

    follow_up_answers = doc.get("follow_up_answers", [])
    rrfa = doc.get("recomended_responses_to_follow_up_answers", [])

    if answer_index is not None:
        if answer_index < 0 or answer_index >= len(rrfa):
            return jsonify({"error": "Index follow up answer tidak valid."}), 400
        response = rrfa[answer_index]
        return jsonify({
            "recommended_response": response,
            "matched_index": answer_index,
            "matched_answer": follow_up_answers[answer_index] if answer_index < len(follow_up_answers) else ""
        })

    if user_answer:
        idx, score = most_similar_index(user_answer, follow_up_answers)
        response = rrfa[idx] if idx < len(rrfa) else "Maaf, saya tidak menemukan tanggapan yang relevan."
        return jsonify({
            "recommended_response": response,
            "matched_index": idx,
            "matched_answer": follow_up_answers[idx] if idx < len(follow_up_answers) else "",
            "similarity_score": score
        })

    return jsonify({"error": "Harus ada salah satu: answer_index atau user_answer"}), 400

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
