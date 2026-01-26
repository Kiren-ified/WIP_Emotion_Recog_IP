# Analyze extracted frames with Gemini API
# Works locally (CLI) and in Colab (function call)
#
# Dependencies: google-genai, pandas, python-dotenv (optional)

import json
from pathlib import Path
from datetime import datetime
import argparse
import os

from google import genai
from google.genai import types

# Load .env file if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

DEFAULT_MODEL = "gemini-2.0-flash"


def get_api_key():
    """Get API key from environment, .env file, or Colab userdata."""
    # Try environment variable first (local / .env)
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        return api_key

    # Try Colab userdata
    try:
        from google.colab import userdata
        api_key = userdata.get("GEMINI_API_KEY")
        if api_key:
            return api_key
    except ImportError:
        pass

    raise ValueError(
        "GEMINI_API_KEY not found.\n"
        "Local: export GEMINI_API_KEY='your-key' or add to .env\n"
        "Colab: Add to Secrets with name 'GEMINI_API_KEY'"
    )


def analyze_image(filepath, client, model, max_retries=3):
    """Analyze single image for emotion with rate limit retry."""
    import time
    from google.genai.errors import ClientError

    for attempt in range(max_retries):
        try:
            with open(filepath, 'rb') as f:
                image_bytes = f.read()

            response = client.models.generate_content(
                model=model,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type='image/jpeg'),
                    'Analyze the facial expression. Return JSON: {"emotion": "disgust|sadness|happiness|fear|anger|surprise|neutral", "confidence": "low|high", "description": "brief description"}'
                ]
            )

            if not response.text:
                return {"error": "Empty response"}

            # Parse JSON from response
            text = response.text
            start = text.find('{')
            end = text.rfind('}')
            if start == -1 or end == -1:
                return {"error": "No JSON found", "raw": text}
            return json.loads(text[start:end + 1])

        except ClientError as e:
            error_str = str(e)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                wait_time = (attempt + 1) * 30  # 30s, 60s, 90s
                print(f"    Rate limited, waiting {wait_time}s...")
                time.sleep(wait_time)
                continue
            return {"error": f"API error: {error_str[:200]}"}
        except json.JSONDecodeError:
            return {"error": "JSON parse failed", "raw": response.text}
        except Exception as e:
            return {"error": str(e)}

    return {"error": "Max retries exceeded (rate limit)"}


def analyze_frames(extraction_dir, api_key=None, model=DEFAULT_MODEL):
    """
    Analyze extracted frames using Gemini API.

    Args:
        extraction_dir: Directory containing frames and extraction_metadata.json
        api_key: Gemini API key (auto-detected if None)
        model: Model to use

    Returns:
        DataFrame with analysis results
    """
    import pandas as pd

    extraction_dir = Path(extraction_dir)
    metadata_path = extraction_dir / "extraction_metadata.json"

    with open(metadata_path) as f:
        metadata = json.load(f)

    if api_key is None:
        api_key = get_api_key()

    client = genai.Client(api_key=api_key)

    results = []

    for stim in metadata["stimuli"]:
        stimulus_name = stim["stimulus_name"]
        print(f"Analyzing {stimulus_name}...")

        # Analyze baseline
        baseline_path = extraction_dir / stim["baseline_file"]
        baseline_analysis = analyze_image(baseline_path, client, model) if baseline_path.exists() else {"error": "file not found"}

        # Analyze FOI
        foi_path = extraction_dir / stim["foi_file"]
        foi_analysis = analyze_image(foi_path, client, model) if foi_path.exists() else {"error": "file not found"}

        baseline_emotion = baseline_analysis.get("emotion")
        foi_emotion = foi_analysis.get("emotion")

        # Show errors if any
        if "error" in baseline_analysis:
            print(f"  baseline ERROR: {baseline_analysis['error']}")
        if "error" in foi_analysis:
            print(f"  foi ERROR: {foi_analysis['error']}")

        print(f"  baseline: {baseline_emotion}, foi: {foi_emotion}")

        results.append({
            "stimulus": stimulus_name,
            "image_name": stim["image_name"],
            "correct": stim["correct_emotion"],
            "participant": stim["user_response"],
            "baseline": baseline_emotion,
            "foi": foi_emotion,
            "baseline_confidence": baseline_analysis.get("confidence"),
            "foi_confidence": foi_analysis.get("confidence"),
            "reaction_ms": stim["reaction_time_ms"],
            "foi_offset_ms": stim["foi_offset_ms"],
        })

    df = pd.DataFrame(results)

    # Add computed columns
    def norm(s):
        return s.lower().strip() if pd.notna(s) and s else None

    df["participant_correct"] = df.apply(
        lambda r: norm(r["participant"]) == norm(r["correct"]) if norm(r["participant"]) and norm(r["correct"]) else None, axis=1
    )
    df["model_changed"] = df.apply(
        lambda r: norm(r["baseline"]) != norm(r["foi"]) if norm(r["baseline"]) and norm(r["foi"]) else None, axis=1
    )
    df["foi_matches"] = df.apply(
        lambda r: norm(r["foi"]) in [norm(r["correct"]), norm(r["participant"])] if norm(r["foi"]) else None, axis=1
    )

    # Save results
    output_path = extraction_dir / "analysis_results.csv"
    df.to_csv(output_path, index=False)

    # Also save as JSON for compatibility
    json_output = {
        "analysis_timestamp": datetime.now().isoformat(),
        "model": model,
        "participant_id": metadata.get("participant_id"),
        "results": df.to_dict(orient="records")
    }
    with open(extraction_dir / "analysis_results.json", "w") as f:
        json.dump(json_output, f, indent=2)

    # Print summary
    n = len(df)
    def pct(col):
        valid = df[col].notna()
        total = valid.sum()
        correct = df.loc[valid, col].sum()
        return f"{int(correct)}/{int(total)} ({100*correct/total:.1f}%)" if total > 0 else "N/A"

    print(f"\n=== Summary ===")
    print(f"Stimuli: {n}")
    print(f"Participant Accuracy: {pct('participant_correct')}")
    print(f"Model Detected Change: {pct('model_changed')}")
    print(f"Model FOI Matches (correct OR participant): {pct('foi_matches')}")
    print(f"Model: {model}")
    print(f"\nSaved to {output_path}")

    return df


def main():
    parser = argparse.ArgumentParser(description="Analyze extracted frames with Gemini")
    parser.add_argument("extraction_dir", type=Path, help="Directory with extracted frames")
    parser.add_argument("--model", type=str, default=DEFAULT_MODEL, help="Gemini model to use")
    parser.add_argument("--api-key", type=str, help="Gemini API key (or set GEMINI_API_KEY env var)")

    args = parser.parse_args()

    analyze_frames(
        extraction_dir=args.extraction_dir,
        api_key=args.api_key,
        model=args.model
    )


if __name__ == "__main__":
    main()
