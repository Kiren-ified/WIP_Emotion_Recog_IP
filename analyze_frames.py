# Analyze extracted frames with Gemini API
# Works locally (CLI) and in Colab (function call)
#
# Dependencies: google-genai, pandas, python-dotenv (optional), nest_asyncio

import json
from pathlib import Path
from datetime import datetime
import argparse
import os
import asyncio
from typing import Dict, Any, List, Optional

from google import genai
from google.genai import types

# For Colab compatibility with async
try:
    import nest_asyncio
    nest_asyncio.apply()
except ImportError:
    pass

# Load .env file if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Configuration
DEFAULT_MODEL = "gemini-2.5-flash-preview-05-20"
MAX_API_CALLS = 5  # Set to None for unlimited, or a number for testing
SEMAPHORE_LIMIT = 50  # Max concurrent API requests

ANALYSIS_PROMPT = 'Analyze the facial expression. Return JSON: {"emotion": "disgust|sadness|happiness|fear|anger|surprise|neutral", "confidence": "low|high", "description": "brief description"}'


def get_api_key():
    """Get API key from environment, .env file, or Colab userdata."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        return api_key

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


def load_cache(cache_path: Path) -> Dict[str, Any]:
    """Load cache from file, return empty dict if not exists."""
    if cache_path.exists():
        try:
            with open(cache_path) as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {}
    return {}


def save_cache(cache_path: Path, cache: Dict[str, Any]):
    """Save cache to file."""
    with open(cache_path, "w") as f:
        json.dump(cache, f, indent=2)


async def analyze_image_async(
    filepath: Path,
    client: genai.Client,
    model: str,
    semaphore: asyncio.Semaphore,
    cache: Dict[str, Any],
    cache_path: Path
) -> Dict[str, Any]:
    """Analyze single image for emotion with semaphore rate limiting."""
    filepath_str = str(filepath)

    # Check cache first
    if filepath_str in cache:
        return cache[filepath_str]

    async with semaphore:
        try:
            with open(filepath, 'rb') as f:
                image_bytes = f.read()

            # Run sync API call in executor to not block event loop
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: client.models.generate_content(
                    model=model,
                    contents=[
                        types.Part.from_bytes(data=image_bytes, mime_type='image/jpeg'),
                        ANALYSIS_PROMPT
                    ]
                )
            )

            if not response.text:
                result = {"error": "Empty response"}
            else:
                # Parse JSON from response
                text = response.text
                start = text.find('{')
                end = text.rfind('}')
                if start == -1 or end == -1:
                    result = {"error": "No JSON found", "raw": text}
                else:
                    result = json.loads(text[start:end + 1])

        except json.JSONDecodeError:
            result = {"error": "JSON parse failed", "raw": response.text}
        except Exception as e:
            result = {"error": str(e)}

    # Cache successful results (results without errors, or with parse errors that have raw data)
    if "error" not in result or "raw" in result:
        cache[filepath_str] = result
        save_cache(cache_path, cache)

    return result


async def analyze_frames_async(
    extraction_dir: Path,
    api_key: str,
    model: str,
    max_calls: Optional[int]
) -> List[Dict[str, Any]]:
    """Async implementation of frame analysis."""
    import pandas as pd

    metadata_path = extraction_dir / "extraction_metadata.json"
    cache_path = extraction_dir / "analysis_cache.json"

    with open(metadata_path) as f:
        metadata = json.load(f)

    # Load existing cache
    cache = load_cache(cache_path)
    print(f"Loaded {len(cache)} cached results from {cache_path.name}")

    client = genai.Client(api_key=api_key)
    semaphore = asyncio.Semaphore(SEMAPHORE_LIMIT)

    # Collect all image paths to analyze
    image_tasks = []  # List of (filepath, stimulus_name, frame_type, frame_info)

    for stim in metadata["stimuli"]:
        stimulus_name = stim["stimulus_name"]
        stimulus_dir = extraction_dir / stimulus_name

        # Collect baseline frames
        baseline_dir = stimulus_dir / "baseline"
        if baseline_dir.exists():
            for frame_info in stim.get("baseline_frames", []):
                filepath = baseline_dir / frame_info["filename"]
                if filepath.exists():
                    image_tasks.append((filepath, stimulus_name, "baseline", frame_info))

        # Collect FOI frames
        foi_dir = stimulus_dir / "foi"
        if foi_dir.exists():
            for frame_info in stim.get("foi_frames", []):
                filepath = foi_dir / frame_info["filename"]
                if filepath.exists():
                    image_tasks.append((filepath, stimulus_name, "foi", frame_info))

    # Filter out already cached
    uncached_tasks = [(fp, sn, ft, fi) for fp, sn, ft, fi in image_tasks if str(fp) not in cache]
    print(f"Found {len(image_tasks)} total frames, {len(uncached_tasks)} need analysis")

    # Apply MAX_API_CALLS limit
    if max_calls is not None and len(uncached_tasks) > max_calls:
        print(f"Limiting to {max_calls} API calls (MAX_API_CALLS)")
        uncached_tasks = uncached_tasks[:max_calls]

    # Process uncached images concurrently
    if uncached_tasks:
        print(f"Analyzing {len(uncached_tasks)} frames with {SEMAPHORE_LIMIT} concurrent requests...")

        async def process_task(filepath, stimulus_name, frame_type, frame_info):
            result = await analyze_image_async(
                filepath, client, model, semaphore, cache, cache_path
            )
            return filepath, stimulus_name, frame_type, frame_info, result

        tasks = [
            process_task(fp, sn, ft, fi)
            for fp, sn, ft, fi in uncached_tasks
        ]

        completed = 0
        for coro in asyncio.as_completed(tasks):
            filepath, stimulus_name, frame_type, frame_info, result = await coro
            completed += 1
            emotion = result.get("emotion", result.get("error", "unknown"))
            print(f"  [{completed}/{len(tasks)}] {stimulus_name}/{frame_type}: {emotion}")

    # Build results from cache (now includes newly analyzed)
    cache = load_cache(cache_path)  # Reload to get all updates

    results = []
    for filepath, stimulus_name, frame_type, frame_info in image_tasks:
        filepath_str = str(filepath)
        analysis = cache.get(filepath_str, {"error": "not analyzed"})

        results.append({
            "stimulus": stimulus_name,
            "frame_type": frame_type,
            "filename": frame_info["filename"],
            "frame_number": frame_info.get("frame_number"),
            "absolute_ms": frame_info.get("absolute_ms"),
            "relative_ms": frame_info.get("relative_ms"),
            "emotion": analysis.get("emotion"),
            "confidence": analysis.get("confidence"),
            "description": analysis.get("description"),
            "error": analysis.get("error"),
        })

    return results, metadata


def analyze_frames(
    extraction_dir,
    api_key=None,
    model=DEFAULT_MODEL,
    max_calls=MAX_API_CALLS
):
    """
    Analyze extracted frames using Gemini API.

    Args:
        extraction_dir: Directory containing frames and extraction_metadata.json
        api_key: Gemini API key (auto-detected if None)
        model: Model to use
        max_calls: Maximum API calls (None for unlimited)

    Returns:
        DataFrame with analysis results
    """
    import pandas as pd

    extraction_dir = Path(extraction_dir)

    if api_key is None:
        api_key = get_api_key()

    # Run async analysis
    results, metadata = asyncio.run(
        analyze_frames_async(extraction_dir, api_key, model, max_calls)
    )

    df = pd.DataFrame(results)

    if df.empty:
        print("No frames analyzed")
        return df

    # Save detailed results
    output_path = extraction_dir / "analysis_results.csv"
    df.to_csv(output_path, index=False)

    # Save as JSON
    json_output = {
        "analysis_timestamp": datetime.now().isoformat(),
        "model": model,
        "participant_id": metadata.get("participant_id"),
        "total_frames": len(df),
        "results": df.to_dict(orient="records")
    }
    with open(extraction_dir / "analysis_results.json", "w") as f:
        json.dump(json_output, f, indent=2)

    # Print summary
    print(f"\n=== Summary ===")
    print(f"Total frames analyzed: {len(df)}")

    # Emotion distribution
    if "emotion" in df.columns:
        emotion_counts = df["emotion"].value_counts()
        print(f"\nEmotion distribution:")
        for emotion, count in emotion_counts.items():
            print(f"  {emotion}: {count}")

    # Error count
    error_count = df["error"].notna().sum()
    if error_count > 0:
        print(f"\nErrors: {error_count}")

    print(f"\nModel: {model}")
    print(f"Saved to {output_path}")

    return df


def main():
    parser = argparse.ArgumentParser(description="Analyze extracted frames with Gemini")
    parser.add_argument("extraction_dir", type=Path, help="Directory with extracted frames")
    parser.add_argument("--model", type=str, default=DEFAULT_MODEL, help="Gemini model to use")
    parser.add_argument("--api-key", type=str, help="Gemini API key (or set GEMINI_API_KEY env var)")
    parser.add_argument("--max-calls", type=int, default=MAX_API_CALLS,
                        help=f"Max API calls (default: {MAX_API_CALLS}, use -1 for unlimited)")

    args = parser.parse_args()

    max_calls = None if args.max_calls == -1 else args.max_calls

    analyze_frames(
        extraction_dir=args.extraction_dir,
        api_key=args.api_key,
        model=args.model,
        max_calls=max_calls
    )


if __name__ == "__main__":
    main()
