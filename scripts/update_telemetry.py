#!/usr/bin/env python3
"""Fetch live GitHub profile, repo stars, contribution graph, and upstream PR states.

Writes a static JSON snapshot to assets/data/telemetry.json so the portfolio and
Research Hub render reliably without runtime API rate limits, while preserving
previously cached fields if any individual upstream request fails.
"""

from __future__ import annotations

from datetime import datetime, timezone
import json
import os
from pathlib import Path
from typing import Any
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
OUT_PATH = ROOT / "assets" / "data" / "telemetry.json"

GITHUB_USER = "DevCop95"
FLAGSHIP_REPO = "DevCop95/bugbounty-lab101"

TRACKED_PRS = [
    "LOLBAS-Project/LOLBAS#525",
    "LOLBAS-Project/LOLBAS#532",
    "LOLBAS-Project/LOLBAS#539",
    "redcanaryco/atomic-red-team#3433",
    "redcanaryco/atomic-red-team#3439",
    "magicsword-io/LOLRMM#253",
    "elastic/detection-rules#6946",
    "SigmaHQ/sigma#6310",
    "SigmaHQ/sigma#6323",
    "SigmaHQ/sigma#6585",
    "Azure/Azure-Sentinel#15693",
    "NVIDIA/garak#2357",
]


def load_previous() -> dict[str, Any]:
    if not OUT_PATH.exists():
        return {}
    try:
        return json.loads(OUT_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def fetch_json(url: str, github_api: bool = False) -> Any:
    headers = {"User-Agent": "dev101x-telemetry-snapshot"}
    if github_api:
        headers["Accept"] = "application/vnd.github+json"
        token = os.environ.get("GITHUB_TOKEN", "").strip()
        if token:
            headers["Authorization"] = f"Bearer {token}"

    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def count_latest_approvals(owner_repo: str, number: str) -> int | None:
    try:
        reviews = fetch_json(
            f"https://api.github.com/repos/{owner_repo}/pulls/{number}/reviews?per_page=100",
            github_api=True,
        )
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        print(f"[warn] reviews fetch failed for {owner_repo}#{number}: {exc}")
        return None

    latest_by_user: dict[str, str] = {}
    for review in reviews:
        user = (review.get("user") or {}).get("login")
        state = review.get("state")
        if not user or not state or state == "COMMENTED":
            continue
        latest_by_user[user] = state

    return sum(1 for state in latest_by_user.values() if state == "APPROVED")


def main() -> None:
    prev = load_previous()
    prev_github = prev.get("github", {}) if isinstance(prev.get("github"), dict) else {}
    prev_prs = prev.get("prs", {}) if isinstance(prev.get("prs"), dict) else {}

    github_data: dict[str, Any] = {
        "followers": prev_github.get("followers"),
        "public_repos": prev_github.get("public_repos"),
        "bugbounty_lab101_stars": prev_github.get("bugbounty_lab101_stars"),
    }

    try:
        user = fetch_json(f"https://api.github.com/users/{GITHUB_USER}", github_api=True)
        if isinstance(user.get("followers"), int):
            github_data["followers"] = user["followers"]
        if isinstance(user.get("public_repos"), int):
            github_data["public_repos"] = user["public_repos"]
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        print(f"[warn] GitHub user fetch failed: {exc}")

    try:
        repo = fetch_json(f"https://api.github.com/repos/{FLAGSHIP_REPO}", github_api=True)
        if isinstance(repo.get("stargazers_count"), int):
            github_data["bugbounty_lab101_stars"] = repo["stargazers_count"]
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        print(f"[warn] GitHub repo fetch failed: {exc}")

    contributions_data = prev.get("contributions", {})
    try:
        contrib = fetch_json(
            f"https://github-contributions-api.jogruber.de/v4/{GITHUB_USER}?y=last",
            github_api=False,
        )
        days = contrib.get("contributions")
        total = (contrib.get("total") or {}).get("lastYear")
        if isinstance(days, list) and days:
            contributions_data = {
                "total_last_year": total if isinstance(total, int) else None,
                "days": days,
            }
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        print(f"[warn] Contributions fetch failed: {exc}")

    prs_data: dict[str, Any] = {}
    for key in TRACKED_PRS:
        owner_repo, number = key.split("#", 1)
        prev_entry = prev_prs.get(key, {}) if isinstance(prev_prs.get(key), dict) else {}
        try:
            pr = fetch_json(
                f"https://api.github.com/repos/{owner_repo}/pulls/{number}",
                github_api=True,
            )
            merged = bool(pr.get("merged"))
            state = pr.get("state", "open")
            entry: dict[str, Any] = {
                "state": state,
                "merged": merged,
            }
            if state == "open" and not merged:
                approvals = count_latest_approvals(owner_repo, number)
                if approvals is not None:
                    entry["approvals"] = approvals
                elif "approvals" in prev_entry:
                    entry["approvals"] = prev_entry["approvals"]
            prs_data[key] = entry
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            print(f"[warn] PR fetch failed for {key}: {exc}")
            if prev_entry:
                prs_data[key] = prev_entry

    snapshot = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "github": github_data,
        "contributions": contributions_data,
        "prs": prs_data,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(snapshot, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote telemetry snapshot to {OUT_PATH} ({len(prs_data)} PRs tracked)")


if __name__ == "__main__":
    main()
