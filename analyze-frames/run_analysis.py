#!/usr/bin/env python3
"""
Simple wrapper to run the full analysis pipeline on experiment data.

Usage:
    python run_analysis.py /path/to/participant/folder

The folder should contain:
    - {participant}_timing.json
    - {participant}_video.webm
"""

import sys
import json
from pathlib import Path

from extract_frames import process_video, load_timing_file
from analyze_images import analyze_extracted_frames, DEFAULT_MODEL


def find_files(folder: Path):
    """Find timing JSON and video file in the folder."""
    timing_file = None
    video_file = None

    for f in folder.iterdir():
        if f.name.endswith('_timing.json'):
            timing_file = f
        elif f.name.endswith('_video.webm') or f.name.endswith('.webm'):
            video_file = f

    return timing_file, video_file


def run_pipeline(input_folder: Path, output_folder: Path = None):
    """Run the full extraction and analysis pipeline."""

    # Find files
    timing_file, video_file = find_files(input_folder)

    if not timing_file:
        # Check if timing file was passed directly
        if input_folder.name.endswith('_timing.json'):
            timing_file = input_folder
            input_folder = input_folder.parent
            _, video_file = find_files(input_folder)
        else:
            print(f"Error: No *_timing.json file found in {input_folder}")
            sys.exit(1)

    if not video_file:
        print(f"Error: No *_video.webm file found in {input_folder}")
        sys.exit(1)

    print(f"Found timing file: {timing_file.name}")
    print(f"Found video file: {video_file.name}")

    # Load timing data
    timing_data = load_timing_file(timing_file)
    participant_id = timing_data.get('participant_id', 'unknown')

    # Set output folder
    if output_folder is None:
        output_folder = Path(f"output/{participant_id}")

    print(f"\nParticipant: {participant_id}")
    print(f"Output folder: {output_folder}")

    # Extract timestamps and names from timing
    timestamps = [s["timestamp_ms"] for s in timing_data["stimuli"]]
    names = [s["image_name"].replace(".jpg", "").replace(".png", "")
             for s in timing_data["stimuli"]]

    print(f"\n{'='*60}")
    print("STEP 1: Extracting frames")
    print(f"{'='*60}")

    # Run frame extraction
    process_video(
        video_path=video_file,
        timestamps_ms=timestamps,
        stimulus_names=names,
        output_folder=output_folder,
        window_ms=500.0
    )

    print(f"\n{'='*60}")
    print("STEP 2: Analyzing frames with Gemini")
    print(f"{'='*60}")

    # Run analysis
    settings = {"model": DEFAULT_MODEL, "description": "Gemini multimodal emotion analysis"}

    try:
        analyze_extracted_frames(
            extraction_folder=output_folder,
            analysis_settings=settings,
            output_name="analysis_results.json"
        )
    except Exception as e:
        print(f"\nAnalysis error: {e}")
        print("Make sure GEMINI_API_KEY environment variable is set.")
        sys.exit(1)

    # Copy timing file to output for easy access in viewer
    import shutil
    shutil.copy(timing_file, output_folder / "timing.json")

    print(f"\n{'='*60}")
    print("COMPLETE!")
    print(f"{'='*60}")
    print(f"\nOutput files in {output_folder}/:")
    print(f"  - analysis_results.json  (upload to Analysis Results)")
    print(f"  - timing.json            (upload to Participant Metadata)")
    print(f"  - frames/                (extracted frame images)")
    print(f"\nOpen webapp/analysis.html to view results.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python run_analysis.py <folder_with_timing_and_video>")
        print("   or: python run_analysis.py <path_to_timing.json>")
        sys.exit(1)

    input_path = Path(sys.argv[1])

    if not input_path.exists():
        print(f"Error: Path not found: {input_path}")
        sys.exit(1)

    if input_path.is_file():
        # Timing file passed directly
        run_pipeline(input_path)
    else:
        # Folder passed
        run_pipeline(input_path)
