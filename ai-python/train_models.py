from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

import joblib
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

TEXT_EXTENSIONS = {
    ".txt",
    ".md",
    ".rtf",
    ".py",
    ".json",
    ".jsonl",
    ".html",
    ".htm",
    ".ipynb",
}
TABULAR_EXTENSIONS = {".csv", ".xlsx", ".xls", ".jsonl"}
BINARY_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".bmp",
    ".webp",
    ".pdf",
    ".docx",
    ".zip",
    ".rar",
    ".7z",
}

TITLE_KEYS = {
    "title",
    "jobtitle",
    "projecttitle",
    "gigtitle",
    "postingtitle",
    "positiontitle",
    "role",
}
DESC_KEYS = {
    "description",
    "jobdescription",
    "projectdescription",
    "details",
    "summary",
    "overview",
}
SKILL_KEYS = {"skills", "skill", "requiredskills", "tags", "skillset"}
CATEGORY_KEYS = {"category", "categories", "industry", "domain", "sector", "topic"}
AMOUNT_KEYS = {
    "amount",
    "transactionamount",
    "transactionvalue",
    "value",
    "paymentamount",
    "numitems",
    "accountbalance",
}
LABEL_KEYS = {"isfraud", "fraud", "label", "target", "class", "isfraudulent"}


def normalized_col(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "", str(name).lower())


def rel(path: Path, root: Path) -> str:
    try:
        return str(path.relative_to(root))
    except Exception:
        return str(path)


def iter_all_dataset_files(dataset_dir: Path) -> List[Path]:
    return sorted(
        [
            p
            for p in dataset_dir.rglob("*")
            if p.is_file() and "__pycache__" not in p.parts and not p.name.startswith(".")
        ]
    )


def read_csv_safely(path: Path) -> pd.DataFrame:
    for encoding in ["utf-8", "utf-8-sig", "latin-1", "cp1252"]:
        try:
            return pd.read_csv(path, low_memory=False, encoding=encoding, on_bad_lines="skip")
        except Exception:
            continue
    return pd.read_csv(path, low_memory=False, engine="python", encoding_errors="ignore", on_bad_lines="skip")


def read_excel_safely(path: Path) -> pd.DataFrame:
    return pd.read_excel(path)


def find_column(df: pd.DataFrame, keyset: Set[str], fuzzy_contains: bool = False) -> Optional[str]:
    if df.empty:
        return None

    for c in df.columns:
        if normalized_col(c) in keyset:
            return c
    if fuzzy_contains:
        for c in df.columns:
            nc = normalized_col(c)
            if any(k in nc for k in keyset):
                return c
    return None


def to_binary_target(series: pd.Series) -> Optional[pd.Series]:
    raw = series.fillna(0)
    numeric = pd.to_numeric(raw, errors="coerce")
    unique_numeric = sorted([v for v in numeric.dropna().unique().tolist()])
    if unique_numeric and len(unique_numeric) <= 3:
        # Accept 0/1, 1/2, -1/1 style labels
        if min(unique_numeric) == max(unique_numeric):
            return None
        threshold = (min(unique_numeric) + max(unique_numeric)) / 2.0
        return (numeric.fillna(0) > threshold).astype(int)

    lowered = raw.astype(str).str.strip().str.lower()
    mapping = {
        "true": 1,
        "false": 0,
        "yes": 1,
        "no": 0,
        "fraud": 1,
        "legit": 0,
        "legitimate": 0,
        "1": 1,
        "0": 0,
    }
    mapped = lowered.map(mapping)
    if mapped.notna().sum() < max(20, int(len(mapped) * 0.2)):
        return None
    return mapped.fillna(0).astype(int)


def sample_rows(df: pd.DataFrame, max_rows: int) -> pd.DataFrame:
    if len(df) <= max_rows:
        return df
    return df.sample(n=max_rows, random_state=42)


def parse_tabular_file(file: Path) -> Optional[pd.DataFrame]:
    suffix = file.suffix.lower()
    if suffix == ".csv":
        return read_csv_safely(file)
    if suffix in {".xlsx", ".xls"}:
        return read_excel_safely(file)
    if suffix == ".jsonl":
        rows: List[Dict[str, Any]] = []
        for line in file.read_text(encoding="utf-8", errors="ignore").splitlines()[:120000]:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                if isinstance(obj, dict):
                    rows.append(obj)
            except Exception:
                continue
        if not rows:
            return None
        return pd.DataFrame(rows)
    return None


def train_job_recommender(dataset_dir: Path, model_dir: Path, files: List[Path], max_rows: int) -> Dict[str, Any]:
    texts: List[str] = []
    titles: List[str] = []
    used_files: List[str] = []
    skipped_files: List[str] = []

    remaining = max_rows
    for file in files:
        if remaining <= 0:
            break
        if file.suffix.lower() not in TABULAR_EXTENSIONS:
            continue

        try:
            df = parse_tabular_file(file)
        except Exception:
            skipped_files.append(rel(file, dataset_dir))
            continue
        if df is None or df.empty:
            continue

        title_col = find_column(df, TITLE_KEYS, fuzzy_contains=True)
        desc_col = find_column(df, DESC_KEYS, fuzzy_contains=True)
        skills_col = find_column(df, SKILL_KEYS, fuzzy_contains=True)
        category_col = find_column(df, CATEGORY_KEYS, fuzzy_contains=True)

        if title_col is None:
            continue

        block = sample_rows(df.fillna(""), min(remaining, 40000))
        title_values = block[title_col].astype(str).str.strip()
        if title_values.str.len().gt(1).sum() == 0:
            continue

        series_list = [title_values]
        if desc_col:
            series_list.append(block[desc_col].astype(str))
        if skills_col:
            series_list.append(block[skills_col].astype(str))
        if category_col:
            series_list.append(block[category_col].astype(str))

        merged_text = pd.Series("", index=block.index)
        for s in series_list:
            merged_text = merged_text + " " + s

        merged_text = merged_text.str.lower().str.replace(r"\s+", " ", regex=True).str.slice(0, 1800)
        valid_mask = merged_text.str.len() > 8
        merged_text = merged_text[valid_mask]
        title_values = title_values[valid_mask]

        if merged_text.empty:
            continue

        texts.extend(merged_text.tolist())
        titles.extend(title_values.tolist())
        used_files.append(rel(file, dataset_dir))
        remaining -= len(merged_text)

    if not texts:
        return {"trained": False, "reason": "No usable job records found", "usedFiles": []}

    vectorizer = TfidfVectorizer(max_features=45000, ngram_range=(1, 2), min_df=2, sublinear_tf=True)
    matrix = vectorizer.fit_transform(texts)
    meta = [{"title": str(v)} for v in titles]

    model_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump({"vectorizer": vectorizer, "matrix": matrix, "meta": meta}, model_dir / "job_recommender.joblib")
    return {
        "trained": True,
        "rows": int(len(texts)),
        "vocabulary": int(len(vectorizer.get_feature_names_out())),
        "usedFiles": sorted(set(used_files)),
        "skippedFiles": sorted(set(skipped_files)),
    }


def train_fraud_model(dataset_dir: Path, model_dir: Path, files: List[Path], max_rows: int) -> Dict[str, Any]:
    frames: List[pd.DataFrame] = []
    used_files: List[str] = []
    skipped_files: List[str] = []
    remaining = max_rows

    for file in files:
        if remaining <= 0:
            break
        if file.suffix.lower() not in TABULAR_EXTENSIONS:
            continue

        try:
            df = parse_tabular_file(file)
        except Exception:
            skipped_files.append(rel(file, dataset_dir))
            continue
        if df is None or df.empty:
            continue

        amount_col = find_column(df, AMOUNT_KEYS, fuzzy_contains=True)
        label_col = find_column(df, LABEL_KEYS, fuzzy_contains=True)
        if amount_col is None or label_col is None:
            continue

        block = sample_rows(df[[amount_col, label_col]].copy(), min(remaining, 100000))
        block.columns = ["amount", "label_raw"]
        block["label"] = to_binary_target(block["label_raw"])
        block = block.dropna(subset=["label"])
        if block.empty or block["label"].nunique() < 2:
            continue

        frames.append(block[["amount", "label"]])
        used_files.append(rel(file, dataset_dir))
        remaining -= len(block)

    if not frames:
        return {"trained": False, "reason": "No usable fraud dataset found", "usedFiles": []}

    df = pd.concat(frames, ignore_index=True).fillna(0)
    y = df["label"].astype(int)
    x = pd.DataFrame(
        {
            "amount": pd.to_numeric(df["amount"], errors="coerce").fillna(0.0),
            "identityVerified": 0.5,
            "emailVerified": 0.5,
            "phoneVerified": 0.5,
            "cryptoMethod": 0.0,
        }
    )

    if y.nunique() < 2:
        return {
            "trained": False,
            "reason": "Fraud labels collapsed to a single class after normalization",
            "usedFiles": sorted(set(used_files)),
        }

    X_train, X_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42, stratify=y)
    model = HistGradientBoostingClassifier(max_depth=6, learning_rate=0.06, max_leaf_nodes=31)
    model.fit(X_train, y_train)
    score = float(model.score(X_test, y_test))

    model_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "features": list(x.columns), "accuracy": score}, model_dir / "fraud_model.joblib")
    return {
        "trained": True,
        "rows": int(len(df)),
        "holdoutAccuracy": round(score, 4),
        "positiveRate": round(float(y.mean()), 4),
        "usedFiles": sorted(set(used_files)),
        "skippedFiles": sorted(set(skipped_files)),
    }


def collect_intent_samples_from_json(payload: Any) -> Tuple[List[str], List[str]]:
    samples: List[str] = []
    labels: List[str] = []

    intents = payload.get("intents", payload if isinstance(payload, list) else []) if isinstance(payload, (dict, list)) else []
    if isinstance(intents, list):
        for intent in intents:
            if not isinstance(intent, dict):
                continue
            tag = str(intent.get("tag", intent.get("intent", "general"))).strip() or "general"
            patterns = intent.get("patterns", intent.get("examples", []))
            if isinstance(patterns, list):
                for p in patterns:
                    p = str(p).strip().lower()
                    if p:
                        samples.append(p)
                        labels.append(tag)
    return samples, labels


def infer_intent_label_from_path(file: Path) -> str:
    name = file.stem.lower()
    if "payment" in name or "fraud" in name or "invoice" in name:
        return "payment_help"
    if "proposal" in name or "freelance" in name or "job" in name:
        return "proposal_help"
    if "chat" in name or "dialog" in name or "conversation" in name:
        return "conversation"
    return "general"


def train_intent_model(dataset_dir: Path, model_dir: Path, files: List[Path], max_samples: int) -> Dict[str, Any]:
    samples: List[str] = []
    labels: List[str] = []
    used_files: List[str] = []
    skipped_files: List[str] = []

    for file in files:
        if len(samples) >= max_samples:
            break
        suffix = file.suffix.lower()
        rp = rel(file, dataset_dir)

        try:
            if suffix == ".json":
                payload = json.loads(file.read_text(encoding="utf-8", errors="ignore"))
                s, l = collect_intent_samples_from_json(payload)
                if s:
                    take = min(len(s), max_samples - len(samples))
                    samples.extend(s[:take])
                    labels.extend(l[:take])
                    used_files.append(rp)
                continue

            if suffix == ".jsonl":
                local_added = 0
                for line in file.read_text(encoding="utf-8", errors="ignore").splitlines()[:100000]:
                    if len(samples) >= max_samples:
                        break
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        row = json.loads(line)
                    except Exception:
                        continue
                    if not isinstance(row, dict):
                        continue
                    message = str(row.get("text", row.get("message", row.get("prompt", "")))).strip().lower()
                    label = str(row.get("label", row.get("intent", infer_intent_label_from_path(file)))).strip() or "general"
                    if message:
                        samples.append(message[:300])
                        labels.append(label)
                        local_added += 1
                if local_added > 0:
                    used_files.append(rp)
                continue

            if suffix in {".txt", ".md", ".csv"}:
                label = infer_intent_label_from_path(file)
                if suffix == ".csv":
                    df = read_csv_safely(file).fillna("")
                    text_col = find_column(df, {"text", "message", "prompt", "review", "comment"}, fuzzy_contains=True)
                    if text_col:
                        col_texts = df[text_col].astype(str).str.strip().str.lower()
                        for text in col_texts.head(3000).tolist():
                            if len(samples) >= max_samples:
                                break
                            if text:
                                samples.append(text[:300])
                                labels.append(label)
                        used_files.append(rp)
                else:
                    for line in file.read_text(encoding="utf-8", errors="ignore").splitlines()[:5000]:
                        if len(samples) >= max_samples:
                            break
                        text = line.strip().lower()
                        if len(text) >= 8:
                            samples.append(text[:300])
                            labels.append(label)
                    used_files.append(rp)
        except Exception:
            skipped_files.append(rp)
            continue

    if len(samples) < 100:
        return {
            "trained": False,
            "reason": "Not enough intent samples",
            "samples": len(samples),
            "usedFiles": sorted(set(used_files)),
        }

    vectorizer = TfidfVectorizer(max_features=25000, ngram_range=(1, 2), min_df=2, sublinear_tf=True)
    X = vectorizer.fit_transform(samples)
    model = LogisticRegression(max_iter=1000, n_jobs=1, class_weight="balanced")
    model.fit(X, labels)

    model_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {"vectorizer": vectorizer, "model": model, "labels": sorted(list(set(labels)))},
        model_dir / "intent_model.joblib",
    )
    return {
        "trained": True,
        "samples": len(samples),
        "classes": len(set(labels)),
        "usedFiles": sorted(set(used_files)),
        "skippedFiles": sorted(set(skipped_files)),
    }


def extract_text_for_corpus(file: Path, max_chars: int) -> str:
    suffix = file.suffix.lower()

    if suffix in BINARY_EXTENSIONS:
        return ""

    if suffix == ".csv":
        df = read_csv_safely(file).fillna("")
        head = sample_rows(df, 1500)
        return "\n".join(head.astype(str).agg(" ".join, axis=1).tolist())[:max_chars]

    if suffix in {".xlsx", ".xls"}:
        try:
            df = read_excel_safely(file).fillna("")
            head = sample_rows(df, 1200)
            return "\n".join(head.astype(str).agg(" ".join, axis=1).tolist())[:max_chars]
        except Exception:
            return ""

    if suffix == ".json":
        payload = json.loads(file.read_text(encoding="utf-8", errors="ignore"))
        return json.dumps(payload, ensure_ascii=False)[:max_chars]

    if suffix == ".jsonl":
        lines = file.read_text(encoding="utf-8", errors="ignore").splitlines()[:6000]
        return "\n".join(lines)[:max_chars]

    if suffix in TEXT_EXTENSIONS:
        return file.read_text(encoding="utf-8", errors="ignore")[:max_chars]

    return ""


def train_dataset_corpus(
    dataset_dir: Path,
    model_dir: Path,
    files: List[Path],
    max_chars_per_file: int,
    max_docs: int,
) -> Dict[str, Any]:
    texts: List[str] = []
    meta: List[Dict[str, Any]] = []
    used_files: List[str] = []
    skipped_files: List[str] = []

    for file in files:
        if len(texts) >= max_docs:
            break
        rp = rel(file, dataset_dir)
        suffix = file.suffix.lower()
        try:
            content = extract_text_for_corpus(file, max_chars=max_chars_per_file)
        except Exception:
            content = ""

        if not content.strip():
            try:
                size = file.stat().st_size
            except Exception:
                size = -1
            content = f"metadata_only file={rp} suffix={suffix} size_bytes={size}"

        normalized = re.sub(r"\s+", " ", content).strip()
        if len(normalized) < 10:
            continue

        texts.append(normalized)
        used_files.append(rp)
        meta.append({"file": rp, "suffix": suffix, "chars": len(normalized)})

    if not texts:
        return {
            "trained": False,
            "reason": "No text corpus could be built",
            "usedFiles": [],
            "skippedFiles": sorted(set(skipped_files)),
        }

    vectorizer = TfidfVectorizer(max_features=70000, ngram_range=(1, 2), min_df=2, sublinear_tf=True)
    matrix = vectorizer.fit_transform(texts)

    model_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {"vectorizer": vectorizer, "matrix": matrix, "meta": meta},
        model_dir / "dataset_corpus.joblib",
    )
    return {
        "trained": True,
        "docs": len(texts),
        "vocabulary": int(len(vectorizer.get_feature_names_out())),
        "usedFiles": sorted(set(used_files)),
        "skippedFiles": sorted(set(skipped_files)),
    }


def build_dataset_inventory(dataset_dir: Path, files: List[Path]) -> List[Dict[str, Any]]:
    inventory: List[Dict[str, Any]] = []
    for file in files:
        suffix = file.suffix.lower()
        category = (
            "tabular" if suffix in TABULAR_EXTENSIONS else "text" if suffix in TEXT_EXTENSIONS else "binary" if suffix in BINARY_EXTENSIONS else "other"
        )
        try:
            size = file.stat().st_size
        except Exception:
            size = None
        inventory.append(
            {
                "file": rel(file, dataset_dir),
                "suffix": suffix,
                "sizeBytes": size,
                "category": category,
            }
        )
    return inventory


def summarize_categories(inventory: List[Dict[str, Any]]) -> Dict[str, int]:
    counts: Dict[str, int] = {"tabular": 0, "text": 0, "binary": 0, "other": 0}
    for row in inventory:
        category = str(row.get("category", "other"))
        counts[category] = counts.get(category, 0) + 1
    return counts


def main() -> None:
    parser = argparse.ArgumentParser(description="Train local AI models from ADATASETES")
    parser.add_argument("--dataset-dir", default="ADATASETES")
    parser.add_argument("--model-dir", default="models")
    parser.add_argument("--max-job-rows", type=int, default=220000)
    parser.add_argument("--max-fraud-rows", type=int, default=300000)
    parser.add_argument("--max-intent-samples", type=int, default=160000)
    parser.add_argument("--max-corpus-docs", type=int, default=25000)
    parser.add_argument("--max-corpus-chars-per-file", type=int, default=120000)
    args = parser.parse_args()

    dataset_dir = Path(args.dataset_dir).resolve()
    model_dir = Path(args.model_dir).resolve()

    all_files = iter_all_dataset_files(dataset_dir)
    inventory = build_dataset_inventory(dataset_dir, all_files)

    job_summary = train_job_recommender(dataset_dir, model_dir, all_files, max_rows=max(5000, args.max_job_rows))
    fraud_summary = train_fraud_model(dataset_dir, model_dir, all_files, max_rows=max(5000, args.max_fraud_rows))
    intent_summary = train_intent_model(
        dataset_dir,
        model_dir,
        all_files,
        max_samples=max(1000, args.max_intent_samples),
    )
    corpus_summary = train_dataset_corpus(
        dataset_dir,
        model_dir,
        all_files,
        max_chars_per_file=max(3000, args.max_corpus_chars_per_file),
        max_docs=max(500, args.max_corpus_docs),
    )

    used: Set[str] = set()
    for section in [job_summary, fraud_summary, intent_summary, corpus_summary]:
        for f in section.get("usedFiles", []):
            used.add(str(f))

    discovered = [x["file"] for x in inventory]
    not_used = sorted([f for f in discovered if f not in used])
    category_counts = summarize_categories(inventory)

    inventory_file = model_dir / "dataset_inventory.json"
    inventory_file.parent.mkdir(parents=True, exist_ok=True)
    inventory_file.write_text(json.dumps(inventory, indent=2), encoding="utf-8")

    summary = {
        "datasetDir": str(dataset_dir),
        "modelDir": str(model_dir),
        "datasetCoverage": {
            "discoveredFiles": len(discovered),
            "usedFiles": len(used),
            "unusedFiles": len(not_used),
            "unusedFileListPreview": not_used[:200],
            "unusedFileListTruncated": len(not_used) > 200,
            "categoryCounts": category_counts,
            "inventoryFile": str(inventory_file),
        },
        "jobRecommender": job_summary,
        "fraudModel": fraud_summary,
        "intentModel": intent_summary,
        "datasetCorpusModel": corpus_summary,
    }

    out_file = model_dir / "training_summary.json"
    out_file.parent.mkdir(parents=True, exist_ok=True)
    out_file.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
