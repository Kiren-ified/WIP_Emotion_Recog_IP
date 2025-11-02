# Emotion Recognition Experiment WebApp

A local web application for conducting emotion recognition experiments with video recording and data collection.

## Features

- **Consent Page**: Participant consent for emotion recognition study
- **Info Page**: Collect basic participant information (ID, performer status, age, gender)
- **Assessment Pages**: PHQ-9 and GAD-7 depression and anxiety assessments
- **Instructions Page**: Experiment instructions with camera permission request
- **Stimuli Page**: Image presentation with emotion recognition task
  - Images shown for 2 seconds each
  - Arrow key navigation for emotion selection
  - Reaction time tracking
  - Accuracy calculation
- **Thank You Page**: Completion page with contact information

## Setup Instructions

1. **Place Images**: Add your stimulus images to the `images/` folder
2. **Configure Stimuli**: Edit `stimuli_config.csv` with your image names and emotion options
3. **Run Locally**: Open `index.html` in a modern web browser (Chrome, Firefox, or Edge recommended)

## File Structure

```
Thesis/
├── index.html              # Main HTML file
├── styles.css              # Styling
├── app.js                  # Application logic
├── stimuli_config.csv      # Image configuration
├── images/                 # Folder for stimulus images
└── README.md              # This file
```

## CSV Configuration Format

The `stimuli_config.csv` file should have the following columns:
- `imageName`: Name of the image file (e.g., `emotion1.jpg`)
- `option1`: First emotion option (mapped to Left Arrow)
- `option2`: Second emotion option (mapped to Down Arrow)
- `option3`: Third emotion option (mapped to Up Arrow)
- `option4`: Fourth emotion option (mapped to Right Arrow)
- `correctOption`: Which option is correct (`option1`, `option2`, `option3`, or `option4`)

Example:
```csv
imageName,option1,option2,option3,option4,correctOption
happy1.jpg,Happy,Sad,Angry,Neutral,option1
sad1.jpg,Happy,Sad,Angry,Neutral,option2
```

## Controls

- **Arrow Keys**: Navigate and select emotion options
  - ← Left Arrow: First option
  - ↓ Down Arrow: Second option
  - ↑ Up Arrow: Third option
  - → Right Arrow: Fourth option

## Data Output

For each participant, the following files are automatically downloaded:

1. **`{participantId}_assessments.xlsx`**: Contains PHQ-9 and GAD-7 responses
2. **`{participantId}_metadata.xlsx`**: Contains participant info and experiment results (accuracy, reaction times)
3. **`{participantId}_recording.webm`**: Video recording of participant during experiment (WebM format)

**Note**: Files are downloaded to your browser's default download folder.

### Organizing Files

1. Create a folder for each participant using their Participant ID
2. Move all three files into that participant's folder
3. To convert WebM to MP4, use the provided script: `./convert_to_mp4.sh {participantId}`
   - Requires ffmpeg: `brew install ffmpeg` (macOS) or `sudo apt-get install ffmpeg` (Linux)
   - Or use an online converter: https://cloudconvert.com/webm-to-mp4

### File Organization Example

```
Downloads/
├── P001/
│   ├── P001_assessments.xlsx
│   ├── P001_metadata.xlsx
│   └── P001_recording.mp4
├── P002/
│   ├── P002_assessments.xlsx
│   ├── P002_metadata.xlsx
│   └── P002_recording.mp4
└── ...
```

## Browser Requirements

- Modern browser with support for:
  - ES6 JavaScript
  - MediaRecorder API (for video recording)
  - Camera API (getUserMedia)
  - File downloads

## Troubleshooting

1. **Camera not working**: Make sure you grant camera permissions when prompted
2. **Images not loading**: Verify image files are in the `images/` folder and match names in `stimuli_config.csv`
3. **CSV not loading**: Ensure `stimuli_config.csv` is in the same directory as `index.html`
4. **Video recording issues**: Some browsers may have limitations. Chrome typically has the best support.

## Important Notes

- This application runs entirely in the browser - no server required
- Data is saved locally via browser downloads
- Video recording may vary by browser support
- For best results, use Chrome browser
- **Running the app**: You can open `index.html` directly, but for camera access, it's recommended to use a local web server:
  ```bash
  # Python 3
  python3 -m http.server 8000
  
  # Then open: http://localhost:8000
  ```
- Browser security may require HTTPS or localhost for camera access in some browsers

