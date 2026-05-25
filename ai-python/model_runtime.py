from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import numpy as np

from taxonomy_engine import PlatformTaxonomyEngine


@dataclass
class LoadedArtifacts:
    recommender_vectorizer: Any = None
    recommender_matrix: Any = None
    recommender_meta: Optional[List[Dict[str, Any]]] = None
    fraud_model: Any = None
    fraud_features: Optional[List[str]] = None
    intent_vectorizer: Any = None
    intent_model: Any = None
    intent_labels: Optional[List[str]] = None


class LocalModelRuntime:
    def __init__(self, model_dir: str | Path):
        self.model_dir = Path(model_dir)
        self.current_model_dir = self.model_dir
        self.active_version: Optional[str] = None
        self.artifacts = LoadedArtifacts()
        self.taxonomy_engine = PlatformTaxonomyEngine(self.model_dir)
        self.reload()

    def reload(self) -> None:
        self.artifacts = LoadedArtifacts()
        resolved_dir, active_version = self._resolve_model_dir()
        self.current_model_dir = resolved_dir
        self.active_version = active_version
        self.taxonomy_engine.reload()

        if not resolved_dir.exists():
            return

        rec_file = resolved_dir / "job_recommender.joblib"
        if rec_file.exists():
            obj = joblib.load(rec_file)
            self.artifacts.recommender_vectorizer = obj.get("vectorizer")
            self.artifacts.recommender_matrix = obj.get("matrix")
            self.artifacts.recommender_meta = obj.get("meta")

        fraud_file = resolved_dir / "fraud_model.joblib"
        if fraud_file.exists():
            obj = joblib.load(fraud_file)
            self.artifacts.fraud_model = obj.get("model")
            self.artifacts.fraud_features = obj.get("features")

        intent_file = resolved_dir / "intent_model.joblib"
        if intent_file.exists():
            obj = joblib.load(intent_file)
            self.artifacts.intent_vectorizer = obj.get("vectorizer")
            self.artifacts.intent_model = obj.get("model")
            self.artifacts.intent_labels = obj.get("labels")

    def status(self) -> Dict[str, Any]:
        status = {
            "jobRecommenderLoaded": self.artifacts.recommender_vectorizer is not None,
            "fraudModelLoaded": self.artifacts.fraud_model is not None,
            "intentModelLoaded": self.artifacts.intent_model is not None,
            "activeVersion": self.active_version,
            "modelPath": str(self.current_model_dir),
        }
        status.update(self.taxonomy_engine.status())
        return status

    def rerank_jobs(self, items: List[Dict[str, Any]], user_skills: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        user_skills = user_skills or []
        if self.artifacts.recommender_vectorizer is None or self.artifacts.recommender_matrix is None:
            return items

        query_text = " ".join(user_skills).strip().lower()
        if not query_text:
            return items

        vec = self.artifacts.recommender_vectorizer.transform([query_text])
        scores = (self.artifacts.recommender_matrix @ vec.T).toarray().ravel()

        by_title: Dict[str, float] = {}
        for i, meta in enumerate(self.artifacts.recommender_meta or []):
            title = str(meta.get("title", "")).strip().lower()
            if title:
                by_title[title] = max(by_title.get(title, 0.0), float(scores[i]))

        boosted: List[Dict[str, Any]] = []
        for item in items:
            score = float(item.get("score", 0))
            title = str(item.get("title", "")).strip().lower()
            ml = by_title.get(title, 0.0)
            final = min(100.0, score + (ml * 12.0))
            out = dict(item)
            out["score"] = round(final, 2)
            out["mlBoost"] = round(ml * 100.0, 4)
            boosted.append(out)
        boosted.sort(key=lambda x: float(x.get("score", 0)), reverse=True)
        return boosted

    def fraud_score(self, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if self.artifacts.fraud_model is None or not self.artifacts.fraud_features:
            return None
        features = self._build_fraud_vector(payload)
        prob = float(self.artifacts.fraud_model.predict_proba([features])[0][1])
        score = round(prob * 100.0, 2)
        level = "HIGH" if score >= 70 else "MEDIUM" if score >= 35 else "LOW"
        return {"riskScore": score, "riskLevel": level, "modelType": "ml_classifier"}

    def classify_intent(self, prompt: str) -> Optional[Dict[str, Any]]:
        if self.artifacts.intent_model is None or self.artifacts.intent_vectorizer is None:
            return None
        X = self.artifacts.intent_vectorizer.transform([prompt])
        pred = self.artifacts.intent_model.predict(X)[0]
        probs = self.artifacts.intent_model.predict_proba(X)[0]
        confidence = float(np.max(probs))
        return {"intent": str(pred), "confidence": confidence}

    def admin_assist(self, command: str, data: Dict[str, Any]) -> Dict[str, Any]:
        command_l = command.lower().strip()
        
        if "summary" in command_l or "analyze" in command_l:
            return self._generate_analytics_summary(data)
        
        if "anomaly" in command_l or "outlier" in command_l:
            return self._detect_anomalies(data)
            
        if "moderation" in command_l or "flag" in command_l:
            return self._suggest_moderation(data)
            
        if "search" in command_l:
            return self._smart_search(command, data)

        return {
            "answer": "I can help with analytics summaries, anomaly detection, and content moderation suggestions. Try 'Analyze platform stats' or 'Find anomalies in transactions'.",
            "confidence": 0.5
        }

    def _generate_analytics_summary(self, data: Dict[str, Any]) -> Dict[str, Any]:
        # Heuristic-based summary generation
        users = data.get("totalUsers", 0)
        revenue = data.get("revenue", 0.0)
        active = data.get("activeUsers", 0)
        
        summary = f"Platform health is stable with {users} total users and ${revenue:,.2f} in revenue. "
        if active > (users * 0.2):
            summary += "Engagement is high with over 20% active user ratio. "
        else:
            summary += "Engagement is slightly below target; consider user retention campaigns. "
            
        if data.get("failedTransactions", 0) > 10:
            summary += "ALERT: High transaction failure rate detected."
            
        return {
            "answer": summary,
            "confidence": 0.85,
            "suggestedActions": ["View detailed analytics", "Check failed transactions", "Run user retention campaign"]
        }

    def _detect_anomalies(self, data: Dict[str, Any]) -> Dict[str, Any]:
        # Statistical anomaly detection (simplified)
        items = data.get("items", []) # e.g., list of transaction amounts or login counts
        if not items:
            return {"answer": "No data provided for anomaly detection.", "confidence": 1.0}
            
        values = [float(i.get("value", 0)) for i in items if "value" in i]
        if not values:
            return {"answer": "No numeric values found for anomaly detection.", "confidence": 1.0}
            
        mean = np.mean(values)
        std = np.std(values)
        threshold = 2.0 # 2 standard deviations
        
        anomalies = [items[i] for i, v in enumerate(values) if abs(v - mean) > threshold * std]
        
        if anomalies:
            return {
                "answer": f"Detected {len(anomalies)} anomalies in the provided data set.",
                "anomalies": anomalies,
                "confidence": 0.9,
                "suggestedActions": ["Investigate anomalies", "Adjust sensitivity threshold"]
            }
            
        return {"answer": "No significant anomalies detected in the current data set.", "confidence": 0.95}

    def _suggest_moderation(self, data: Dict[str, Any]) -> Dict[str, Any]:
        text = data.get("text", "")
        # Basic keyword-based moderation for now
        flagged_words = ["scam", "spam", "fraud", "violation", "fake"]
        found = [word for word in flagged_words if word in text.lower()]
        
        if found:
            return {
                "answer": f"Content contains suspicious terms: {', '.join(found)}. Suggesting manual review.",
                "riskLevel": "MEDIUM",
                "confidence": 0.8,
                "suggestedActions": ["Flag for review", "Auto-suspend user", "Contact user for clarification"]
            }
            
        return {"answer": "Content appears clean and compliant with platform policies.", "confidence": 0.9}

    def _smart_search(self, query: str, data: Dict[str, Any]) -> Dict[str, Any]:
        # Semantic search using vectorizer if loaded
        items = data.get("items", [])
        if self.artifacts.recommender_vectorizer is None or not items:
            return {"answer": "Smart search is initializing or no items provided.", "items": items, "confidence": 0.5}
            
        query_vec = self.artifacts.recommender_vectorizer.transform([query])
        
        results = []
        for item in items:
            text = f"{item.get('title', '')} {item.get('description', '')}"
            item_vec = self.artifacts.recommender_vectorizer.transform([text])
            score = (query_vec @ item_vec.T).toarray()[0][0]
            results.append({"item": item, "score": float(score)})
            
        results.sort(key=lambda x: x["score"], reverse=True)
        return {
            "answer": f"Found {len(results)} matches for your search.",
            "results": results[:10],
            "confidence": 0.88
        }

    def classify_taxonomy(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return self.taxonomy_engine.classify(payload)

    def taxonomy_learning_summary(self) -> Dict[str, Any]:
        return self.taxonomy_engine.learning_summary()

    def _build_fraud_vector(self, payload: Dict[str, Any]) -> List[float]:
        amt = float(payload.get("amount", 0) or 0)
        identity = 1.0 if payload.get("identityVerified") else 0.0
        email = 1.0 if payload.get("emailVerified") else 0.0
        phone = 1.0 if payload.get("phoneVerified") else 0.0
        crypto = 1.0 if "CRYPTO" in str(payload.get("paymentMethod", "")).upper() else 0.0
        return [amt, identity, email, phone, crypto]

    def _resolve_model_dir(self) -> tuple[Path, Optional[str]]:
        if not self.model_dir.exists():
            return self.model_dir, None

        active_file = self.model_dir / "ACTIVE_VERSION"
        releases_dir = self.model_dir / "releases"
        if active_file.exists() and releases_dir.exists():
            active_version = active_file.read_text(encoding="utf-8").strip()
            if active_version:
                candidate = releases_dir / active_version
                if candidate.exists() and candidate.is_dir():
                    return candidate, active_version

        return self.model_dir, None


def save_json(path: Path, data: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")
