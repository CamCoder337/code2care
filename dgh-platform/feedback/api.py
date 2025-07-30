# api.py
import time
import torch
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from transformers import AutoTokenizer, AutoModelForSequenceClassification

from feedback.hf_config import HF_MODEL_ID

# 🚀 Optimisations dès le début
torch.set_grad_enabled(False)
torch.set_num_threads(1)

# 🔁 Chargement du modèle (une seule fois)
tokenizer = AutoTokenizer.from_pretrained(HF_MODEL_ID)
model = AutoModelForSequenceClassification.from_pretrained(HF_MODEL_ID)
model.eval()

label_mapping = {0: "negative", 1: "neutral", 2: "positive"}

class TextInput(BaseModel):
    texts: List[str]

app = FastAPI()

@app.post("/classify_text/")
async def classify(input: TextInput):
    texts = input.texts
    start = time.time()
    # 🔹 Tokenisation batch
    inputs = tokenizer(texts, return_tensors="pt", padding=True, truncation=True)
    # 🔹 Inference
    logits = model(**inputs).logits
    probs = torch.softmax(logits, dim=-1).tolist()
    end = time.time()
    elapsed = round(end - start, 3)

    results = []
    for text, logit, prob in zip(texts, logits, probs):
        pred_id = int(torch.argmax(logit))
        results.append({
            "text": text,
            "prediction": label_mapping[pred_id],
            "confidence": {
                "negative": round(prob[0] * 100, 2),
                "neutral": round(prob[1] * 100, 2),
                "positive": round(prob[2] * 100, 2)
            },
            "processing_time_seconds": elapsed
        })

    return {"results": results}
