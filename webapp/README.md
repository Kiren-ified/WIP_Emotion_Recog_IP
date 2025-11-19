# Emotion Recognition Experiment WebApp

A local web application for conducting emotion recognition experiment with video recording and data collection. This experiment investigates the role of the body in the process of emotion recognition.

## Features

- **Info Page**: Collect basic participant information (ID, age, gender)
- **Introduction Page**: Welcome message and experiment overview
- **Assessment Pages**: Comprehensive mental health and psychological assessments
  - SREIS (Emotional Intelligence Scale)
  - SBC (Scale of Body Connection)
  - DSM-5-TR Level 1 Cross-Cutting Symptom Measure
  - BDI-II (Beck Depression Inventory)
  - BAI (Beck Anxiety Inventory)
  - DES-II (Dissociative Experiences Scale)
  - EDE-QS (Eating Disorder Examination Questionnaire - Short)
- **Instructions Page**: Experiment instructions with camera permission request
- **Stimuli Page**: Image presentation with emotion recognition task
  - Images shown for 1 second each
  - Click-based emotion selection
  - Reaction time tracking
  - Accuracy calculation
  - Video recording of facial expressions
- **Thank You Page**: Completion page with contact information

## Setup Instructions

1. **Place Images**: Add your stimulus images to the `images/` folder
2. **Configure Stimuli**: Edit `stimuli.csv` with your image names and emotion options
3. **Run Locally**: 
   - Start a local web server from the `webapp/` directory:
     ```bash
     cd webapp
     python3 -m http.server 8000
     ```
   - Open `http://localhost:8000` in a modern web browser (Chrome, Firefox, or Edge recommended)

## File Structure

```
Thesis/
├── webapp/
│   ├── index.html              # Main HTML file
│   ├── styles.css              # Styling
│   ├── app.js                  # Application logic
│   ├── stimuli.csv             # Image configuration
│   ├── images/                 # Folder for stimulus images
│   ├── README.md               # This file
│   ├── ENVIRONMENT_SETUP.md    # Python environment setup guide
│   └── setup_env.sh            # Virtual environment setup script
├── video_analysis/             # Analysis scripts and models (see project root)
└── output/                     # Participant data output folder
```

## CSV Configuration Format

The `stimuli.csv` file should have the following columns:
- `imageName`: Name of the image file (e.g., `emotion1.jpg`)
- `option1`: First emotion option
- `option2`: Second emotion option
- `option3`: Third emotion option
- `option4`: Fourth emotion option
- `correctOption`: Which option is correct (`option1`, `option2`, `option3`, or `option4`)

Example:
```csv
imageName,option1,option2,option3,option4,correctOption
happy1.jpg,Happy,Sad,Angry,Neutral,option1
sad1.jpg,Happy,Sad,Angry,Neutral,option2
```

## Controls

- **Click to Select**: Click on the emotion option you want to select
  - Four emotion options are displayed for each stimulus
  - Click directly on the option to make your selection

## Data Output

For each participant, the following files are automatically downloaded:

1. **`{participantId}_assessment.xlsx`**: Contains all assessment responses organized by sheet:
   - Participant Info
   - SREIS responses
   - SBC responses
   - DSM-5-TR responses
   - BDI-II responses
   - BAI responses
   - DES-II responses
   - EDE-QS responses (with scale type indicators)
2. **`{participantId}_metadata.xlsx`**: Contains participant info and experiment results (accuracy, reaction times)
3. **`{participantId}_video.webm`**: Video recording of participant during experiment (WebM format)

**Note**: Files are downloaded to your browser's default download folder. Manually move them to the `output/` folder in the project root for analysis.

## Browser Requirements

- Modern browser with support for:
  - ES6 JavaScript
  - MediaRecorder API (for video recording)
  - Camera API (getUserMedia)
  - File downloads

## Assessment Details

### Assessment Order
1. SREIS (Emotional Intelligence Scale)
2. SBC (Scale of Body Connection)
3. DSM-5-TR Level 1 Cross-Cutting Symptom Measure
4. BDI-II (Beck Depression Inventory)
5. BAI (Beck Anxiety Inventory)
6. DES-II (Dissociative Experiences Scale)
7. EDE-QS (Eating Disorder Examination Questionnaire - Short)

### EDE-QS Special Notes
- Questions 1-10 use a "days in past 7 days" scale (0-3: 0 days, 1-2 days, 3-5 days, 6-7 days)
- Questions 11-12 use a severity scale (0-3: Not at all, Slightly, Moderately, Markedly)
- An instruction line "Over the past 7 days..." appears between questions 10 and 11

## Troubleshooting

1. **Camera not working**: Make sure you click "Grant Camera Permission" button on the instructions page
2. **Images not loading**: Verify image files are in the `images/` folder and match names in `stimuli.csv`
3. **CSV not loading**: Ensure `stimuli.csv` is in the same directory as `index.html` and you're running the server from the `webapp/` directory
4. **Video recording issues**: Some browsers may have limitations. Chrome typically has the best support.
5. **Assessment navigation**: If you need to restart, refresh the page and start from the info page

## Important Notes

- This application requires a local web server for camera access (browser security requirements)
- Data is saved locally via browser downloads
- Video recording may vary by browser support
- For best results, use Chrome browser
- **Running the app**: Always run the server from the `webapp/` directory:
  ```bash
  cd webapp
  python3 -m http.server 8000
  
  # Then open: http://localhost:8000
  ```
- Browser security requires HTTPS or localhost for camera access
- The experiment is anonymous - video recordings are not linked to personal information

## Python Analysis Environment

The webapp includes Python environment setup files, but the actual analysis scripts are located in the `video_analysis/` folder at the project root.

### Setup

1. **Create virtual environment** (first time only):
   ```bash
   cd webapp
   ./setup_env.sh
   ```
   Or see `ENVIRONMENT_SETUP.md` for detailed instructions.

2. **Activate the virtual environment**:
   ```bash
   source venv/bin/activate
   ```

For analysis scripts and models, see the `video_analysis/` folder in the project root.

