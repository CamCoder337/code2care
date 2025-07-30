# model_utils.py
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
from feedback.hf_config import HF_MODEL_ID  # Utilisation de la nouvelle config

# Chargement depuis le Hub HF
tokenizer = AutoTokenizer.from_pretrained(HF_MODEL_ID)
model = AutoModelForSequenceClassification.from_pretrained(HF_MODEL_ID)
model.eval()

# Mapping 3 classes pour ce modèle
label_mapping = {
    0: "negative",
    1: "neutral",
    2: "positive"
}

def predict_text(text: str):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        logits = model(**inputs).logits
        probs = torch.softmax(logits, dim=-1).squeeze().tolist()

    predicted_class = int(torch.argmax(logits, dim=-1))
    prediction = label_mapping[predicted_class]

    return prediction, {
        "negative": round(probs[0] * 100, 2),
        "neutral": round(probs[1] * 100, 2),
        "positive": round(probs[2] * 100, 2)
    }
