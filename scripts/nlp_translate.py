import re
import string
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from transformers import AutoTokenizer, TFAutoModel
import tensorflow as tf

tokenizer = None
model = None

def preprocess_text(text):
    if isinstance(text, str):
        text = text.lower()
        text = text.translate(str.maketrans('', '', string.punctuation))
        text = re.sub(r'\d+', '', text)
        stop_words = set(stopwords.words('indonesian'))
        words = word_tokenize(text)
        return ' '.join([word for word in words if word not in stop_words])
    return ''

def load_tokenizer_and_model():
    global tokenizer, model
    if tokenizer is None or model is None:
        model_name = "cahya/distilbert-base-indonesian"
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = TFAutoModel.from_pretrained(model_name)

def encode_text(text):
    load_tokenizer_and_model()
    preprocessed = preprocess_text(text)
    inputs = tokenizer(preprocessed, return_tensors='tf', padding=True, truncation=True, max_length=128)
    outputs = model(inputs)
    embeddings = tf.reduce_mean(outputs.last_hidden_state, axis=1).numpy()
    return embeddings.squeeze()
