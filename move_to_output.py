#!/usr/bin/env python3
"""
Script to move downloaded experiment files to the output folder.
Run this script in the background while conducting experiments.

Usage:
    python3 move_to_output.py [download_folder]
    
Default download folder: ~/Downloads
"""

import os
import shutil
import time
import sys
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Get download folder (default: ~/Downloads on macOS)
DOWNLOAD_FOLDER = Path.home() / "Downloads"
if len(sys.argv) > 1:
    DOWNLOAD_FOLDER = Path(sys.argv[1])

# Output folder in the thesis directory
SCRIPT_DIR = Path(__file__).parent
OUTPUT_FOLDER = SCRIPT_DIR / "output"

class ExperimentFileHandler(FileSystemEventHandler):
    """Handle new experiment files in the downloads folder."""
    
    def __init__(self):
        self.processed_files = set()
    
    def on_created(self, event):
        if event.is_directory:
            return
        
        file_path = Path(event.src_path)
        
        # Check if it's an experiment file (assessments, metadata, or recording)
        if any(keyword in file_path.name for keyword in ['_assessments.xlsx', '_metadata.xlsx', '_recording.webm']):
            # Wait a bit for file to finish downloading
            time.sleep(1)
            
            if file_path.exists() and file_path.name not in self.processed_files:
                self.move_to_output(file_path)
    
    def move_to_output(self, file_path):
        """Move file to output folder, organized by participant ID."""
        try:
            # Extract participant ID from filename
            # Format: {participantId}_assessments.xlsx, {participantId}_metadata.xlsx, etc.
            filename = file_path.name
            parts = filename.split('_')
            
            if len(parts) >= 2:
                participant_id = parts[0]
                
                # Create participant folder in output
                participant_folder = OUTPUT_FOLDER / participant_id
                participant_folder.mkdir(parents=True, exist_ok=True)
                
                # Move file to participant folder
                dest_path = participant_folder / filename
                
                # If file is still being written, wait a bit more
                max_retries = 10
                for _ in range(max_retries):
                    try:
                        shutil.move(str(file_path), str(dest_path))
                        print(f"✓ Moved {filename} to output/{participant_id}/")
                        self.processed_files.add(filename)
                        break
                    except (PermissionError, OSError):
                        time.sleep(0.5)
                else:
                    print(f"✗ Could not move {filename} - file may still be downloading")
            else:
                print(f"✗ Could not extract participant ID from {filename}")
                
        except Exception as e:
            print(f"✗ Error processing {file_path.name}: {e}")

def main():
    """Start monitoring the downloads folder."""
    print(f"Monitoring {DOWNLOAD_FOLDER} for experiment files...")
    print(f"Files will be moved to {OUTPUT_FOLDER}")
    print("Press Ctrl+C to stop\n")
    
    # Ensure output folder exists
    OUTPUT_FOLDER.mkdir(parents=True, exist_ok=True)
    
    # Set up file watcher
    event_handler = ExperimentFileHandler()
    observer = Observer()
    observer.schedule(event_handler, str(DOWNLOAD_FOLDER), recursive=False)
    observer.start()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        print("\n\nStopped monitoring.")
    
    observer.join()

if __name__ == "__main__":
    main()

