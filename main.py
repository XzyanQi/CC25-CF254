from flask import Flask, request, jsonify, send_from_directory
from transformers import AutoTokenizer, TFAutoModel
import faiss 
import json
import numpy as np 
import tensorflow as tf 
from scripts.nlp_translate import preprocess_text_indonesian
import time 

# Load FAISS index
index = faiss.read_index("mindfulness_index.faiss")

# Load corpus.json
with open("model/corpus_final.json", "r", encoding="utf-8") as f:
    corpus = json.load(f)

# Load corpus embeddings 
corpus_embeddings = np.load("context_embeddings.npy") 

# Load tokenizer dan model dari lokal
tokenizer = AutoTokenizer.from_pretrained("model/indobert_local/")
model = TFAutoModel.from_pretrained("model/indobert_local/")

print(" Semua model, index, dan tokenizer berhasil dimuat dari lokal.")

# Flask App 
app = Flask(__name__, static_folder="static")

def get_embedding(text):
    clean_text = preprocess_text_indonesian(text)
    # Tambah max_length untuk menghindari warning dan memastikan truncation bekerja
    inputs = tokenizer(clean_text, return_tensors="tf", truncation=True, padding=True, max_length=512) 
    outputs = model(inputs).last_hidden_state
    vec = tf.reduce_mean(outputs, axis=1)  # [batch_size, hidden_size]
    return vec[0].numpy()  # ambil sebagai numpy array

@app.route("/search", methods=["POST"])
def search():
    overall_start_time = time.time() # time sudah terdefinisi
    data = request.get_json()
    query = data.get("text", "")
    top_k = data.get("top_k", 3) # Frontend mengirimkan top_k: 3
    
    print(f"\n[Python /search] Menerima query: '{query}' pukul {time.strftime('%Y-%m-%d %H:%M:%S')}")

    start_embedding_call = time.time()
    query_vec = get_embedding(query).reshape(1, -1).astype("float32")
    end_embedding_call = time.time()
    print(f"  [Python /search] Pembuatan query embedding selesai dalam: {(end_embedding_call - start_embedding_call)*1000:.2f} ms")
    
    start_faiss = time.time()
    distances, indices = index.search(query_vec, top_k)
    end_faiss = time.time()
    print(f"  [Python /search] Pencarian FAISS selesai dalam: {(end_faiss - start_faiss)*1000:.2f} ms")
    
    results_texts_to_display = []
    if indices.size > 0 and len(indices[0]) > 0: 
        for i in indices[0]:
            if 0 <= i < len(corpus):  
                document_object = corpus[i] 
                
                if "response_to_display" in document_object:
                    results_texts_to_display.append(document_object["response_to_display"])
                else:
                    print(f"PERINGATAN: Kunci 'response_to_display' tidak ada di corpus[{i}]")
                    results_texts_to_display.append("Maaf, format data respons tidak sesuai.")
            else:
                print(f"PERINGATAN: Indeks {i} dari FAISS di luar jangkauan untuk list corpus (panjang: {len(corpus)}).")
                results_texts_to_display.append("Maaf, terjadi kesalahan saat mengambil detail dokumen.")
    else:
        print("[Python /search] FAISS tidak menemukan hasil (indices kosong atau format tidak terduga).")
        results_texts_to_display.append("Maaf, saya tidak menemukan jawaban yang relevan saat ini.")
 
    overall_end_time = time.time()
    print(f"  [Python /search] Total waktu proses di /search: {(overall_end_time - overall_start_time)*1000:.2f} ms")
    
    return jsonify({"query": query, "results": results_texts_to_display})

@app.route("/")
def root():
    return send_from_directory("static", "index.html")

@app.route("/static/<path:path>")
def serve_static(path):
    return send_from_directory("static", path)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f" Flask siap jalan di http://0.0.0.0:{port}/")
    app.run(host="0.0.0.0", port=port)
