#!/usr/bin/env python3
"""Analyze extracted frames for emotion recognition using Gemini API."""

import json
import os
from pathlib import Path
from typing import Dict, Any
from datetime import datetime
import argparse
import re

from google import genai
from google.genai import types
from dotenv import load_dotenv

DEFAULT_MODEL = "gemini-3-flash-preview"

DEBUG_MAX_API_CALLS = 2
EXPERIMENTAL_ONLY_TWO_FRAMES = True

load_dotenv()

def get_api_key() -> str:
    """Get Gemini API key from GEMINI_API_KEY environment variable."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY environment variable not set.\n"
            "Please set it with: export GEMINI_API_KEY='your-api-key'\n"
            "Get your API key from: https://aistudio.google.com/apikey"
        )
    return api_key


def parse_json(text: str) -> Dict[str, Any]:
    """Parse JSON from text, extracting the first JSON object found."""
    start = text.find('{')
    end = text.rfind('}')
    
    if start == -1 or end == -1 or start > end:
        print(f"Warning: No JSON object found in response")
        print(f"Response text: {text}")
        return {}
    
    json_str = text[start:end + 1]
    
    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"Warning: Failed to parse JSON: {e}")
        print(f"Response text: {text}")
        return {}


def analyze_image(filepath: Path, settings: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze image for emotion using Gemini API."""
    if not filepath.exists():
        return {"error": f"Image file not found: {filepath}", "method": "gemini"}

    model = settings.get("model", DEFAULT_MODEL)

    try:
        with open(filepath, 'rb') as f:
            image_bytes = f.read()

        client = genai.Client(api_key=get_api_key())
        response = client.models.generate_content(
            model=model,
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type='image/jpeg'),
                'Describe the facial expression in the image. Then return JSON with the emotion (disgust|sadness|happiness|fear|anger|surprise), description, and confidence level (low|high).'
            ],
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_level="minimal")
            ),
        )

        if not response.text:
            return {"error": "Empty response from API", "method": "gemini", "model": model}

        result = parse_json(response.text)
        if not result:
            # JSON parsing failed, return error with raw response
            return {
                "error": "Failed to parse JSON from response",
                "method": "gemini",
                "model": model,
                "raw_response": response.text
            }
        result["method"] = "gemini"
        result["model"] = model
        result["raw_response"] = response.text
        return result

    except ValueError:
        raise
    except Exception as e:
        return {"error": str(e), "method": "gemini", "model": model}


def analyze_extracted_frames(
    extraction_folder: Path,
    analysis_settings: Dict[str, Any],
    output_name: str = "analysis_results.json"
) -> Dict[str, Any]:
    """Analyze all frames from a previous extraction."""
    metadata_file = extraction_folder / "metadata.json"
    if not metadata_file.exists():
        raise FileNotFoundError(f"No metadata.json found in {extraction_folder}")

    with open(metadata_file, "r") as f:
        extraction_metadata = json.load(f)

    results = {
        "analysis_timestamp": datetime.now().isoformat(),
        "extraction_folder": str(extraction_folder),
        "analysis_settings": analysis_settings,
        "extraction_metadata": extraction_metadata,
        "stimuli_analysis": []
    }

    frames_dir = extraction_folder / "frames"

    for stimulus_info in extraction_metadata["stimuli"]:
        stimulus_name = stimulus_info["name"]

        if "error" in stimulus_info:
            results["stimuli_analysis"].append({
                "stimulus_name": stimulus_name,
                "error": "Extraction failed",
                "original_error": stimulus_info["error"]
            })
            continue

        print(f"\nAnalyzing {stimulus_name}...")

        stimulus_results = {
            "stimulus_name": stimulus_name,
            "start_timestamp_ms": stimulus_info["start_timestamp_ms"],
            "frames_analyzed": 0,
            "frame_results": []
        }
        if EXPERIMENTAL_ONLY_TWO_FRAMES:
            chosen_frames = stimulus_info.get("frames", [])
            chosen_frames = [chosen_frames[0], chosen_frames[-1]] if len(chosen_frames) >= 2 else chosen_frames
        else:
            chosen_frames = stimulus_info.get("frames", [])

        for frame_info in chosen_frames:
            frame_path = frames_dir / stimulus_name / frame_info["filename"]

            if not frame_path.exists():
                print(f"  Warning: Frame not found: {frame_path}")
                continue

            analysis = analyze_image(frame_path, analysis_settings)

            frame_result = {
                "filename": frame_info["filename"],
                "frame_number": frame_info["frame_number"],
                "absolute_ms": frame_info["absolute_ms"],
                "relative_ms": frame_info["relative_ms"],
                "analysis": analysis
            }

            stimulus_results["frame_results"].append(frame_result)
            stimulus_results["frames_analyzed"] += 1

            emotion = analysis.get('emotion', analysis.get('error', 'unknown'))
            confidence = analysis.get('confidence', 'N/A')
            print(f"  Frame {frame_info['frame_number']}: {emotion} (confidence: {confidence})")
            
            if stimulus_results["frames_analyzed"] >= DEBUG_MAX_API_CALLS:
                print(f"Testing: reached max API calls: {DEBUG_MAX_API_CALLS}")
                break

        results["stimuli_analysis"].append(stimulus_results)

    output_file = extraction_folder / output_name
    with open(output_file, "w") as f:
        json.dump(results, f, indent=2)

    print(f"\n{'='*60}")
    print(f"Analysis complete!")
    print(f"Results saved to: {output_file}")
    print(f"{'='*60}")

    return results


def main():
    parser = argparse.ArgumentParser(description="Analyze extracted video frames for emotion recognition")
    parser.add_argument("extraction_folder", type=Path, help="Folder containing extracted frames and metadata")
    parser.add_argument("--settings", type=json.loads, default={}, help="Analysis settings as JSON string")
    parser.add_argument("--output", type=str, default="analysis_results.json", help="Output filename")

    args = parser.parse_args()

    settings = {"model": DEFAULT_MODEL, "description": "Gemini multimodal emotion analysis"}
    settings.update(args.settings)

    analyze_extracted_frames(
        extraction_folder=args.extraction_folder,
        analysis_settings=settings,
        output_name=args.output
    )


if __name__ == "__main__":
    main()
