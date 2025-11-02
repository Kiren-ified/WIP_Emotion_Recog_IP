#!/usr/bin/env python3
"""
Extract frames at 300ms after each stimulus presentation for analysis.

This script:
1. Reads participant metadata Excel file
2. Opens the video recording
3. Extracts frames at 300ms after each stimulus presentation
4. Saves frames as images
5. Calls analyze_image function (user-defined) on each frame
6. Generates output JSON with all data

Usage:
    python3 analyze_stimulus_frames.py <participant_id>

Example:
    python3 analyze_stimulus_frames.py P001
"""

import sys
import json
from pathlib import Path
import pandas as pd
import cv2
from typing import Dict, List, Any


def analyze_image(image_path: str, stimulus_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    Placeholder function for image analysis.

    USER: Implement your image analysis logic here.

    Args:
        image_path: Path to the extracted frame image
        stimulus_info: Dictionary containing stimulus metadata:
            - imageName: Name of the stimulus image
            - stimulusIndex: Index of the stimulus in the sequence
            - timestamp_ms: Milliseconds from video start when frame was captured
            - gender, model, race, mouth, correct_emotion: Stimulus metadata
            - user_response: User's selected emotion
            - reaction_time_ms: User's reaction time

    Returns:
        Dictionary with analysis results. This will be merged into the output JSON.
        Example: {"detected_emotion": "happy", "confidence": 0.95}
    """
    # TODO: Implement your analysis logic here
    # For now, return a placeholder
    return {
        "analysis_status": "pending",
        "note": "Implement analyze_image function"
    }


def extract_frame_at_timestamp(video_path: Path, timestamp_ms: float, output_path: Path) -> bool:
    """
    Extract a frame from video at specified timestamp and save as image.

    Args:
        video_path: Path to video file
        timestamp_ms: Timestamp in milliseconds
        output_path: Path where frame image should be saved

    Returns:
        True if successful, False otherwise
    """
    try:
        cap = cv2.VideoCapture(str(video_path))

        if not cap.isOpened():
            print(f"Error: Could not open video {video_path}")
            return False

        # Set position to timestamp (in milliseconds)
        cap.set(cv2.CAP_PROP_POS_MSEC, timestamp_ms)

        # Read frame
        ret, frame = cap.read()

        if ret:
            # Save frame as image
            cv2.imwrite(str(output_path), frame)
            cap.release()
            return True
        else:
            print(f"Warning: Could not read frame at {timestamp_ms}ms")
            cap.release()
            return False

    except Exception as e:
        print(f"Error extracting frame: {e}")
        return False


def process_participant(participant_id: str, base_dir: Path) -> Dict[str, Any]:
    """
    Process all stimuli for a participant.

    Args:
        participant_id: Participant ID (e.g., "P001")
        base_dir: Base directory containing output folder

    Returns:
        Dictionary with all analysis results
    """
    participant_folder = base_dir / "output" / participant_id

    if not participant_folder.exists():
        raise FileNotFoundError(f"Participant folder not found: {participant_folder}")

    # Read metadata Excel
    metadata_file = participant_folder / f"{participant_id}_metadata.xlsx"
    if not metadata_file.exists():
        raise FileNotFoundError(f"Metadata file not found: {metadata_file}")

    print(f"Reading metadata from {metadata_file}")
    df = pd.read_excel(metadata_file)

    # Find video file (could be .webm or .mp4)
    video_file = None
    for ext in ['.webm', '.mp4']:
        potential_file = participant_folder / f"{participant_id}_video{ext}"
        if potential_file.exists():
            video_file = potential_file
            break

    if not video_file:
        raise FileNotFoundError(f"Video file not found for {participant_id}")

    print(f"Processing video: {video_file}")

    # Create frames directory
    frames_dir = participant_folder / "frames_300ms"
    frames_dir.mkdir(exist_ok=True)

    # Process each stimulus
    results = {
        "participant_id": participant_id,
        "video_file": str(video_file),
        "analysis_timestamp": pd.Timestamp.now().isoformat(),
        "stimuli": []
    }

    for idx, row in df.iterrows():
        # Skip metadata rows at the end
        if pd.isna(row['Image']) or row['Image'] == '--- METADATA ---':
            break

        stimulus_name = row['Image']

        # Get timestamp for frame extraction (300ms after stimulus start)
        if 'Frame at 300ms (ms)' in df.columns:
            timestamp_ms = row['Frame at 300ms (ms)']
        elif 'Stimulus Start Time (ms)' in df.columns:
            timestamp_ms = row['Stimulus Start Time (ms)'] + 300
        else:
            print(f"Warning: No timestamp information for {stimulus_name}, skipping")
            continue

        # Skip if timestamp is invalid
        if pd.isna(timestamp_ms):
            print(f"Warning: Invalid timestamp for {stimulus_name}, skipping")
            continue

        # Generate frame filename
        frame_filename = f"{participant_id}_{stimulus_name.replace('.jpg', '')}_300ms.jpg"
        frame_path = frames_dir / frame_filename

        # Extract frame
        print(f"Extracting frame for {stimulus_name} at {timestamp_ms}ms...")
        success = extract_frame_at_timestamp(video_file, timestamp_ms, frame_path)

        if not success:
            print(f"Failed to extract frame for {stimulus_name}")
            continue

        # Prepare stimulus info for analysis
        stimulus_info = {
            "imageName": stimulus_name,
            "stimulusIndex": idx,
            "timestamp_ms": timestamp_ms,
            "gender": row.get('Gender', ''),
            "model": row.get('Model', ''),
            "race": row.get('Race', ''),
            "mouth": row.get('Mouth', ''),
            "correct_emotion": row.get('Corr_emotion', ''),
            "user_response": row.get('User response', ''),
            "reaction_time_ms": row.get('Reaction Time (ms)', '')
        }

        # Call user's analysis function
        print(f"Analyzing frame: {frame_path}")
        analysis_result = analyze_image(str(frame_path), stimulus_info)

        # Store results
        stimulus_result = {
            "stimulus_filename": stimulus_name,
            "timestamp_ms": timestamp_ms,
            "frame_image_path": str(frame_path.relative_to(base_dir)),
            "stimulus_metadata": stimulus_info,
            "analysis_results": analysis_result
        }

        results["stimuli"].append(stimulus_result)

    return results


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python3 analyze_stimulus_frames.py <participant_id>")
        print("Example: python3 analyze_stimulus_frames.py P001")
        sys.exit(1)

    participant_id = sys.argv[1]
    base_dir = Path(__file__).parent

    print(f"\n{'='*60}")
    print(f"Analyzing stimulus frames for participant: {participant_id}")
    print(f"{'='*60}\n")

    try:
        # Process participant
        results = process_participant(participant_id, base_dir)

        # Save results to JSON
        output_file = base_dir / "output" / participant_id / f"{participant_id}_frame_analysis.json"
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)

        print(f"\n{'='*60}")
        print(f"Analysis complete!")
        print(f"Processed {len(results['stimuli'])} stimuli")
        print(f"Results saved to: {output_file}")
        print(f"{'='*60}\n")

    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
