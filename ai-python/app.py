from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI
from pydantic import BaseModel, Field

from model_runtime import LocalModelRuntime

BASE_DIR = Path(__file__).resolve().parent
DATASET_DIR = Path(os.getenv("AI_DATASET_DIR", str(BASE_DIR / "ADATASETES")))
MODEL_DIR = Path(os.getenv("AI_MODEL_DIR", str(BASE_DIR / "models")))
RELEASES_DIR = MODEL_DIR / "releases"
ACTIVE_VERSION_FILE = MODEL_DIR / "ACTIVE_VERSION"
RELEASE_META_FILE = "release_meta.json"

app = FastAPI(title="SabaHub Local Python AI", version="2.1.0")
runtime = LocalModelRuntime(MODEL_DIR)


class GenericItemsPayload(BaseModel):
    items: List[Dict[str, Any]] = Field(default_factory=list)
    userId: Optional[str] = None
    jobId: Optional[str] = None
    skills: Optional[List[str]] = None
    preferredCategories: Optional[List[str]] = None
    requiredSkills: Optional[List[str]] = None


class FraudPayload(BaseModel):
    amount: float = 0.0
    currency: Optional[str] = "USD"
    paymentMethod: Optional[str] = None
    recipientCountry: Optional[str] = None
    identityVerified: bool = False
    emailVerified: bool = False
    phoneVerified: bool = False


class ChatPayload(BaseModel):
    prompt: str
    contextType: Optional[str] = None
    contextId: Optional[str] = None
    localAnswer: Optional[str] = None


class TaxonomyPayload(BaseModel):
    type: str
    title: str = ""
    description: str = ""
    skills: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    existing_taxonomy: Dict[str, Any] = Field(default_factory=dict)


class TrainRequest(BaseModel):
    activate: bool = True


class ActivateRequest(BaseModel):
    version: str


class RollbackRequest(BaseModel):
    steps: int = Field(default=1, ge=1, le=20)


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _active_version() -> Optional[str]:
    if not ACTIVE_VERSION_FILE.exists():
        return None
    value = ACTIVE_VERSION_FILE.read_text(encoding="utf-8").strip()
    return value or None


def _set_active_version(version: str) -> None:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    ACTIVE_VERSION_FILE.write_text(version.strip(), encoding="utf-8")


def _list_release_versions() -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    if not RELEASES_DIR.exists():
        return out

    for entry in sorted(RELEASES_DIR.iterdir(), reverse=True):
        if not entry.is_dir():
            continue
        meta_path = entry / RELEASE_META_FILE
        trained_at = None
        summary = None
        if meta_path.exists():
            try:
                meta = json.loads(meta_path.read_text(encoding="utf-8"))
                trained_at = meta.get("trainedAt")
                summary = meta.get("trainingSummary")
            except Exception:
                pass
        out.append(
            {
                "version": entry.name,
                "path": str(entry),
                "trainedAt": trained_at,
                "trainingSummary": summary,
            }
        )
    return out


def _create_version_from_trained_models() -> Dict[str, Any]:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    version = f"v{stamp}"
    target = RELEASES_DIR / version
    target.mkdir(parents=True, exist_ok=True)

    copied: List[str] = []
    for file_name in [
        "job_recommender.joblib",
        "fraud_model.joblib",
        "intent_model.joblib",
        "training_summary.json",
    ]:
        src = MODEL_DIR / file_name
        if src.exists() and src.is_file():
            shutil.copy2(src, target / file_name)
            copied.append(file_name)

    summary_payload: Dict[str, Any] = {}
    summary_file = target / "training_summary.json"
    if summary_file.exists():
        try:
            summary_payload = json.loads(summary_file.read_text(encoding="utf-8"))
        except Exception:
            summary_payload = {}

    meta = {
        "version": version,
        "trainedAt": _utc_now(),
        "files": copied,
        "trainingSummary": summary_payload,
    }
    (target / RELEASE_META_FILE).write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return meta


def _load_release_meta(version: str) -> Optional[Dict[str, Any]]:
    file = RELEASES_DIR / version / RELEASE_META_FILE
    if not file.exists():
        return None
    try:
        return json.loads(file.read_text(encoding="utf-8"))
    except Exception:
        return None


@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "ok": True,
        "engine": "SabaHub Python Local AI",
        "datasetDir": str(DATASET_DIR),
        "modelDir": str(MODEL_DIR),
        "models": runtime.status(),
        "activeVersion": _active_version(),
        "externalAiApiUsed": False,
    }


@app.post("/admin/train")
def train_models(request: Optional[TrainRequest] = None) -> Dict[str, Any]:
    cmd = [
        sys.executable,
        str(BASE_DIR / "train_models.py"),
        "--dataset-dir",
        str(DATASET_DIR),
        "--model-dir",
        str(MODEL_DIR),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)

    release = None
    activated_version = _active_version()
    if proc.returncode == 0:
        release = _create_version_from_trained_models()
        if (request is None or request.activate) and release:
            _set_active_version(release["version"])
            activated_version = release["version"]

    runtime.reload()
    return {
        "ok": proc.returncode == 0,
        "returncode": proc.returncode,
        "stdout": proc.stdout[-4000:],
        "stderr": proc.stderr[-4000:],
        "release": release,
        "activeVersion": activated_version,
        "models": runtime.status(),
        "externalAiApiUsed": False,
    }


@app.post("/admin/reload")
def reload_models() -> Dict[str, Any]:
    runtime.reload()
    return {
        "ok": True,
        "activeVersion": _active_version(),
        "models": runtime.status(),
        "externalAiApiUsed": False,
    }


@app.get("/admin/models")
def list_models() -> Dict[str, Any]:
    active = _active_version()
    versions = _list_release_versions()
    return {
        "ok": True,
        "activeVersion": active,
        "versions": versions,
        "count": len(versions),
        "externalAiApiUsed": False,
    }


@app.post("/admin/models/activate")
def activate_model(request: ActivateRequest) -> Dict[str, Any]:
    version = request.version.strip()
    if not version:
        return {"ok": False, "message": "version is required", "externalAiApiUsed": False}

    target = RELEASES_DIR / version
    if not target.exists() or not target.is_dir():
        return {"ok": False, "message": f"version not found: {version}", "externalAiApiUsed": False}

    previous = _active_version()
    _set_active_version(version)
    runtime.reload()
    return {
        "ok": True,
        "previousVersion": previous,
        "activeVersion": version,
        "release": _load_release_meta(version),
        "models": runtime.status(),
        "externalAiApiUsed": False,
    }


@app.post("/admin/models/rollback")
def rollback_model(request: Optional[RollbackRequest] = None) -> Dict[str, Any]:
    versions = _list_release_versions()
    if not versions:
        return {"ok": False, "message": "No model versions available", "externalAiApiUsed": False}

    active = _active_version()
    if not active:
        latest = versions[0]["version"]
        _set_active_version(latest)
        runtime.reload()
        return {
            "ok": True,
            "previousVersion": None,
            "activeVersion": latest,
            "externalAiApiUsed": False,
            "models": runtime.status(),
        }

    ordered = [v["version"] for v in versions]
    try:
        idx = ordered.index(active)
    except ValueError:
        idx = 0

    steps = request.steps if request else 1
    target_idx = min(len(ordered) - 1, idx + steps)
    target = ordered[target_idx]
    _set_active_version(target)
    runtime.reload()
    return {
        "ok": True,
        "previousVersion": active,
        "activeVersion": target,
        "steps": steps,
        "externalAiApiUsed": False,
        "models": runtime.status(),
    }


@app.post("/score/jobs/recommend")
def score_jobs(payload: GenericItemsPayload) -> Dict[str, Any]:
    out = runtime.rerank_jobs(payload.items, payload.skills or [])
    return {"items": out, "engine": "python-local-ml", "externalAiApiUsed": False}


@app.post("/score/freelancers/match")
def score_freelancers(payload: GenericItemsPayload) -> Dict[str, Any]:
    # Reuse same ranking strategy for now (title/score blend remains from Spring)
    out = sorted(payload.items, key=lambda x: float(x.get("score", 0)), reverse=True)
    return {"items": out, "engine": "python-local-ml", "externalAiApiUsed": False}


@app.post("/score/fraud")
def fraud_score(payload: FraudPayload) -> Dict[str, Any]:
    local = runtime.fraud_score(payload.model_dump())
    if local:
        local["externalAiApiUsed"] = False
        local["engine"] = "python-local-ml"
        return local

    # fallback heuristic if model not trained yet
    risk = 0.0
    flags: List[str] = []
    if payload.amount >= 5000:
        risk += 35
        flags.append("High-value transaction")
    elif payload.amount >= 1000:
        risk += 20
        flags.append("Medium-value transaction")
    if not payload.identityVerified:
        risk += 30
        flags.append("Identity not verified")
    if not payload.emailVerified:
        risk += 10
        flags.append("Email not verified")
    if not payload.phoneVerified:
        risk += 10
        flags.append("Phone not verified")
    if "CRYPTO" in (payload.paymentMethod or "").upper():
        risk += 15
        flags.append("Crypto payment method")

    risk = max(0.0, min(100.0, risk))
    level = "HIGH" if risk >= 70 else "MEDIUM" if risk >= 35 else "LOW"
    return {
        "riskScore": round(risk, 2),
        "riskLevel": level,
        "flags": flags,
        "engine": "python-local-heuristic",
        "externalAiApiUsed": False,
    }


@app.post("/assist/chatbot")
def assist_chatbot(payload: ChatPayload) -> Dict[str, Any]:
    intent = runtime.classify_intent(payload.prompt)
    prompt_l = payload.prompt.strip().lower()

    answer = payload.localAnswer or "Ask a specific platform workflow question."
    actions = ["Open AI dashboard", "Review recommendations", "Run fraud check"]
    confidence = 0.62

    if intent:
        confidence = max(confidence, float(intent.get("confidence", 0.0)))
        if intent["intent"] in {"proposal_help", "proposal"} or "proposal" in prompt_l:
            answer = "Use skill-specific examples, quantifiable outcomes, and tailor every proposal to the job scope."
            actions = ["Open proposals page", "Improve proposal template", "Attach portfolio evidence"]
        elif intent["intent"] in {"payment_help", "payment"} or "payment" in prompt_l or "invoice" in prompt_l:
            answer = "Use escrow milestones, verify deliverables before release, and keep payment evidence for audits."
            actions = ["Check wallet", "Review escrow milestones", "Run risk check"]
        elif "job" in prompt_l or "match" in prompt_l:
            answer = "Improve profile skill coverage and category alignment to boost recommendation and match scores."
            actions = ["Update profile skills", "Open AI recommendations", "Adjust category preferences"]

    return {
        "answer": answer,
        "suggestedActions": actions,
        "confidence": round(confidence, 4),
        "engine": "python-local-nlp",
        "externalAiApiUsed": False,
    }


@app.post("/classify/taxonomy")
def classify_taxonomy(payload: TaxonomyPayload) -> Dict[str, Any]:
    return runtime.classify_taxonomy(payload.model_dump())


@app.get("/classify/taxonomy/learning")
def taxonomy_learning_summary() -> Dict[str, Any]:
    return runtime.taxonomy_learning_summary()
