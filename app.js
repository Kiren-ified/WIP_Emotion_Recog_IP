// Global state
let participantData = {
    info: {},
    phq9: {},
    gad7: {},
    stimuli: [],
    startTime: null
};

let currentStimulusIndex = 0;
let stimuliConfig = [];
let mediaRecorder = null;
let recordedChunks = [];
let stream = null;
let cameraPermissionGranted = false;

// PHQ-9 Questions
const PHQ9_QUESTIONS = [
    "Little interest or pleasure in doing things",
    "Feeling down, depressed, or hopeless",
    "Trouble falling or staying asleep, or sleeping too much",
    "Feeling tired or having little energy",
    "Poor appetite or overeating",
    "Feeling bad about yourself or that you are a failure or have let yourself or your family down",
    "Trouble concentrating on things, such as reading the newspaper or watching television",
    "Moving or speaking so slowly that other people could have noticed, or being so fidgety or restless that you have been moving around a lot more than usual",
    "Thoughts that you would be better off dead or thoughts of hurting yourself in some way"
];

// GAD-7 Questions
const GAD7_QUESTIONS = [
    "Feeling nervous, anxious, or on edge",
    "Not being able to stop or control worrying",
    "Worrying too much about different things",
    "Trouble relaxing",
    "Being so restless that it is hard to sit still",
    "Becoming easily annoyed or irritable",
    "Feeling afraid as if something awful might happen"
];

const RATING_SCALE = [
    { value: 0, label: "Not at all" },
    { value: 1, label: "Several days" },
    { value: 2, label: "More than half the days" },
    { value: 3, label: "Nearly every day" }
];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadStimuliConfig();
    renderPHQ9();
    renderGAD7();
    
    // Check URL hash for direct page access
    checkUrlHash();
    
    // Listen for hash changes
    window.addEventListener('hashchange', checkUrlHash);
});

// Handle URL hash for direct page navigation
function checkUrlHash() {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
        // Map hash to page ID
        const pageMap = {
            'consent': 'consent-page',
            'info': 'info-page',
            'phq9': 'assessment-phq9-page',
            'gad7': 'assessment-gad7-page',
            'instructions': 'instructions-page',
            'stimuli': 'stimuli-page',
            'thankyou': 'thankyou-page'
        };
        
        const pageId = pageMap[hash];
        if (pageId) {
            // Hide all pages
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            // Show requested page
            const targetPage = document.getElementById(pageId);
            if (targetPage) {
                targetPage.classList.add('active');
            }
        }
    }
}

// Page navigation
function nextPage(currentPageId, nextPageId) {
    document.getElementById(currentPageId).classList.remove('active');
    document.getElementById(nextPageId).classList.add('active');
    // Update URL hash for direct page access
    window.location.hash = nextPageId.replace('-page', '');
}

// Info page submission
function submitInfo() {
    const form = document.getElementById('info-form');
    if (form.checkValidity()) {
        const formData = new FormData(form);
        participantData.info = {
            participantId: formData.get('participantId'),
            performer: formData.get('performer'),
            age: formData.get('age'),
            gender: formData.get('gender'),
            timestamp: new Date().toISOString()
        };
        nextPage('info-page', 'assessment-phq9-page');
    } else {
        form.reportValidity();
    }
}

// Assessment rendering and submission
function renderPHQ9() {
    const container = document.getElementById('phq9-questions');
    PHQ9_QUESTIONS.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        questionDiv.innerHTML = `
            <label>${index + 1}. ${question}</label>
            <div class="rating-scale">
                ${RATING_SCALE.map((option, optIndex) => `
                    <label class="rating-option">
                        <input type="radio" name="phq9_q${index}" value="${option.value}" required>
                        <span>${option.value}</span>
                        <span>${option.label}</span>
                    </label>
                `).join('')}
            </div>
        `;
        container.appendChild(questionDiv);
    });

    // Add click handlers for radio buttons
    container.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const parent = this.closest('.rating-option');
            parent.parentElement.querySelectorAll('.rating-option').forEach(opt => opt.classList.remove('selected'));
            parent.classList.add('selected');
        });
    });
}

function renderGAD7() {
    const container = document.getElementById('gad7-questions');
    GAD7_QUESTIONS.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        questionDiv.innerHTML = `
            <label>${index + 1}. ${question}</label>
            <div class="rating-scale">
                ${RATING_SCALE.map((option, optIndex) => `
                    <label class="rating-option">
                        <input type="radio" name="gad7_q${index}" value="${option.value}" required>
                        <span>${option.value}</span>
                        <span>${option.label}</span>
                    </label>
                `).join('')}
            </div>
        `;
        container.appendChild(questionDiv);
    });

    // Add click handlers for radio buttons
    container.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const parent = this.closest('.rating-option');
            parent.parentElement.querySelectorAll('.rating-option').forEach(opt => opt.classList.remove('selected'));
            parent.classList.add('selected');
        });
    });
}

function submitAssessment(type, nextPageId) {
    const form = document.getElementById(`${type}-form`);
    if (form.checkValidity()) {
        const formData = new FormData(form);
        const answers = {};
        
        // Collect all radio button values
        formData.forEach((value, key) => {
            const numValue = parseInt(value, 10);
            if (!isNaN(numValue)) {
                answers[key] = numValue;
            }
        });
        
        // Double-check: Also collect directly from radio buttons as fallback
        const allRadios = form.querySelectorAll('input[type="radio"]:checked');
        allRadios.forEach(radio => {
            const numValue = parseInt(radio.value, 10);
            if (!isNaN(numValue) && !answers[radio.name]) {
                answers[radio.name] = numValue;
            }
        });
        
        participantData[type] = answers;
        console.log(`${type} assessment data:`, answers); // Debug log
        console.log(`Total questions answered: ${Object.keys(answers).length}`);
        nextPage(`assessment-${type}-page`, nextPageId);
    } else {
        form.reportValidity();
    }
}

// Camera permission
async function requestCameraPermission() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' }, 
            audio: false 
        });
        const video = document.getElementById('participant-video');
        video.srcObject = stream;
        
        // Video must play (even if hidden) to capture frames properly
        try {
            await video.play();
            console.log('Video play() successful');
        } catch (err) {
            console.error('Video play error:', err);
        }
        
        // Wait for video to be ready and ensure it's rendering
        await new Promise((resolve) => {
            if (video.readyState >= 2) {
                console.log('Video already ready, dimensions:', video.videoWidth, 'x', video.videoHeight);
                resolve();
            } else {
                video.onloadedmetadata = () => {
                    console.log('Video stream ready, dimensions:', video.videoWidth, 'x', video.videoHeight);
                    // Force a frame render
                    video.currentTime = 0;
                    resolve();
                };
            }
        });
        
        // Wait a bit more to ensure video is actually rendering
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Keep video hidden - but it's playing in background for recording
        // video.style.display = 'block'; // Hidden for participant experience
        cameraPermissionGranted = true;
        
        document.getElementById('camera-permission-btn').style.display = 'none';
        document.getElementById('start-experiment-btn').style.display = 'block';
    } catch (error) {
        alert('Camera permission was denied. Please grant camera access to continue.');
        console.error('Error accessing camera:', error);
    }
}

// Load stimuli configuration from CSV
async function loadStimuliConfig() {
    try {
        const response = await fetch('stimuli.csv');
        if (!response.ok) {
            throw new Error(`Failed to load CSV: ${response.status} ${response.statusText}`);
        }
        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            throw new Error('CSV file appears to be empty or invalid');
        }
        
        // Parse CSV (simple parser, assumes no commas in values)
        const headers = lines[0].split(',').map(h => h.trim());
        stimuliConfig = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length >= headers.length && values[0]) { // Ensure Image exists
                const config = {};
                headers.forEach((header, index) => {
                    config[header] = values[index];
                });
                
                // Map CSV structure to expected format
                const correctEmotion = config.Corr_emotion ? config.Corr_emotion.trim().toLowerCase() : '';
                
                // Find which option matches the correct emotion
                // The correct option MUST be in one of the 4 options (data validation)
                let correctOption = null;
                if (correctEmotion) {
                    const options = [
                        config.option1 ? config.option1.trim().toLowerCase() : '',
                        config.option2 ? config.option2.trim().toLowerCase() : '',
                        config.option3 ? config.option3.trim().toLowerCase() : '',
                        config.option4 ? config.option4.trim().toLowerCase() : ''
                    ];
                    
                    const matchIndex = options.findIndex(opt => opt === correctEmotion);
                    if (matchIndex !== -1) {
                        correctOption = `option${matchIndex + 1}`;
                    } else {
                        // This should never happen if CSV data is correct
                        console.error(`ERROR: Could not find correct emotion "${correctEmotion}" in options for ${config.Image}`);
                        console.error(`Options were:`, options);
                        throw new Error(`Data validation failed: Correct emotion "${config.Corr_emotion}" not found in options for image ${config.Image}`);
                    }
                } else {
                    throw new Error(`Missing Corr_emotion for image ${config.Image}`);
                }
                
                // Store in expected format
                stimuliConfig.push({
                    imageName: config.Image,
                    option1: config.option1 || '',
                    option2: config.option2 || '',
                    option3: config.option3 || '',
                    option4: config.option4 || '',
                    correctOption: correctOption, // Must be set (validated above)
                    // Store metadata for reference
                    metadata: {
                        gender: config.Gender,
                        model: config.Model,
                        race: config.Race,
                        mouth: config.Mouth,
                        correctEmotion: config.Corr_emotion
                    }
                });
            }
        }
        
        if (stimuliConfig.length === 0) {
            throw new Error('No valid stimuli found in CSV file');
        }
        
        console.log('Loaded', stimuliConfig.length, 'stimuli configurations');
        
        // Validate required fields
        for (let i = 0; i < stimuliConfig.length; i++) {
            const config = stimuliConfig[i];
            if (!config.imageName || !config.option1 || !config.option2 || !config.option3 || !config.option4) {
                console.warn(`Stimulus ${i + 1} is missing required fields:`, config);
            }
        }
        
        // Preload images to verify they exist
        await preloadImages();
        
    } catch (error) {
        console.error('Error loading stimuli config:', error);
        alert(`Error loading experiment configuration: ${error.message}\n\nPlease ensure:\n1. stimuli.csv exists in the same folder\n2. The app is running via a web server (not file://)\n3. The CSV file has valid data`);
        // Create sample config for testing (but warn user)
        stimuliConfig = [
            {
                imageName: 'sample1.jpg',
                option1: 'Happy',
                option2: 'Sad',
                option3: 'Angry',
                option4: 'Surprised',
                correctOption: 'option1'
            }
        ];
        console.warn('Using fallback sample configuration');
    }
}

// Preload images to verify they exist
async function preloadImages() {
    const imagePromises = stimuliConfig.map((config, index) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log(`✓ Image ${index + 1}: ${config.imageName} loaded successfully`);
                resolve({ success: true, config, index });
            };
            img.onerror = () => {
                console.error(`✗ Image ${index + 1}: ${config.imageName} failed to load`);
                reject({ success: false, config, index, error: new Error(`Image not found: ${config.imageName}`) });
            };
            img.src = `images/${config.imageName}`;
        }).catch(error => error); // Catch rejections to continue checking all images
    });
    
    const results = await Promise.all(imagePromises);
    const failed = results.filter(r => r && !r.success);
    
    if (failed.length > 0) {
        console.warn(`${failed.length} image(s) failed to load:`, failed.map(f => f.config.imageName));
        // Don't block experiment, but warn user
        const failedNames = failed.map(f => f.config.imageName).join(', ');
        alert(`Warning: ${failed.length} image(s) failed to load:\n${failedNames}\n\nPlease check the images folder. The experiment will continue but these images may not display correctly.`);
    } else {
        console.log('All images preloaded successfully');
    }
}

// Start experiment
function startExperiment() {
    if (!cameraPermissionGranted) {
        alert('Please grant camera permission first.');
        return;
    }
    
    // Validate that stimuli are loaded
    if (!stimuliConfig || stimuliConfig.length === 0) {
        alert('Error: No stimuli configuration loaded. Please check stimuli.csv file.');
        console.error('No stimuli config available');
        return;
    }
    
    participantData.startTime = Date.now();
    currentStimulusIndex = 0;
    participantData.stimuli = [];
    
    // Show first stimulus (recording will start when image is displayed)
    showStimulus();
}

// Show stimulus
function showStimulus() {
    if (currentStimulusIndex >= stimuliConfig.length) {
        endExperiment();
        return;
    }
    
    const config = stimuliConfig[currentStimulusIndex];
    const imageContainer = document.getElementById('stimulus-image-container');
    const image = document.getElementById('stimulus-image');
    const optionsContainer = document.getElementById('emotion-options');
    const waitingMessage = document.getElementById('waiting-message');
    
    waitingMessage.style.display = 'none';
    
    // Start video recording only when first stimulus is displayed
    if (currentStimulusIndex === 0) {
        startRecording().catch(err => console.error('Error starting recording:', err));
    }
    
    // Load and show image with error handling
    image.onerror = function() {
        console.error(`Failed to load image: ${config.imageName}`);
        alert(`Error: Could not load image "${config.imageName}". Please ensure it exists in the images folder.`);
        // Continue to next stimulus or end experiment
        currentStimulusIndex++;
        if (currentStimulusIndex >= stimuliConfig.length) {
            endExperiment();
        } else {
            setTimeout(() => showStimulus(), 1000);
        }
    };
    
    image.onload = function() {
        console.log(`Image loaded: ${config.imageName}`);
    };
    
    image.src = `images/${config.imageName}`;
    image.style.display = 'block';
    imageContainer.style.display = 'block';
    optionsContainer.style.display = 'none';
    
    // Record start time
    const stimulusStartTime = Date.now();
    
    // After 1 second, show options
    setTimeout(() => {
        image.style.display = 'none';
        optionsContainer.style.display = 'block';
        showOptions(config, stimulusStartTime);
    }, 1000);
}

function showOptions(config, stimulusStartTime) {
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    // Capitalize first letter of emotion labels for better display
    const capitalize = (str) => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    };
    
    // Arrow key to option mapping (one-to-one):
    // ArrowLeft  → option1 (first option)
    // ArrowDown  → option2 (second option)
    // ArrowUp    → option3 (third option)
    // ArrowRight → option4 (fourth option)
    // Each arrow key maps to exactly one option - users can only select one of the 4 displayed options
    const options = [
        { key: 'ArrowLeft', label: capitalize(config.option1) || 'Option 1', value: 'option1' },
        { key: 'ArrowDown', label: capitalize(config.option2) || 'Option 2', value: 'option2' },
        { key: 'ArrowUp', label: capitalize(config.option3) || 'Option 3', value: 'option3' },
        { key: 'ArrowRight', label: capitalize(config.option4) || 'Option 4', value: 'option4' }
    ];
    
    options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option-item';
        optionDiv.innerHTML = `
            <div class="key-hint">${getKeyHint(option.key)}</div>
            <div>${option.label}</div>
        `;
        optionDiv.dataset.key = option.key;
        optionDiv.dataset.value = option.value;
        optionsContainer.appendChild(optionDiv);
    });
    
    // All options start in neutral state - no highlighting until user presses a key
    
    // Set up keyboard handler - only accepts the 4 arrow keys
    // User can only select one of the 4 displayed options using arrow keys
    const keyHandler = (e) => {
        if (['ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            selectOption(e.key, config, stimulusStartTime);
            // Remove handler after selection to prevent multiple selections
            document.removeEventListener('keydown', keyHandler);
        }
    };
    
    document.addEventListener('keydown', keyHandler);
}

function getKeyHint(key) {
    const hints = {
        'ArrowLeft': '← Left Arrow',
        'ArrowDown': '↓ Down Arrow',
        'ArrowUp': '↑ Up Arrow',
        'ArrowRight': '→ Right Arrow'
    };
    return hints[key] || key;
}

function highlightOption(index) {
    const options = document.querySelectorAll('.option-item');
    options.forEach((opt, i) => {
        opt.classList.remove('selected');
        if (i === index) {
            opt.classList.add('selected');
        }
    });
}

function selectOption(key, config, stimulusStartTime) {
    const reactionTime = Date.now() - stimulusStartTime;
    const optionDiv = document.querySelector(`[data-key="${key}"]`);
    const selectedValue = optionDiv.dataset.value;
    const isCorrect = selectedValue === config.correctOption;
    
    // Get the selected emotion label (the actual text, not the option number)
    // The label is in the second div child (first is key hint, second is label)
    const labelDiv = optionDiv.querySelectorAll('div')[1];
    const selectedLabel = labelDiv ? labelDiv.textContent.trim() : 
                         (selectedValue === 'option1' ? config.option1 :
                          selectedValue === 'option2' ? config.option2 :
                          selectedValue === 'option3' ? config.option3 :
                          selectedValue === 'option4' ? config.option4 : '');
    
    // Store response
    participantData.stimuli.push({
        imageName: config.imageName,
        stimulusIndex: currentStimulusIndex,
        selectedOption: selectedValue,
        selectedLabel: selectedLabel.trim(), // Store the emotion label
        correctOption: config.correctOption,
        isCorrect: isCorrect,
        reactionTime: reactionTime,
        timestamp: new Date().toISOString(),
        config: config // Store full config for later use
    });
    
    // Visual feedback
    optionDiv.classList.add('selected');
    
    // Move to next stimulus after brief delay
    setTimeout(() => {
        currentStimulusIndex++;
        showStimulus();
    }, 500);
}

function endExperiment() {
    // Stop recording
    stopRecording();
    
    // Save all data
    saveParticipantData();
    
    // Show thank you page
    nextPage('stimuli-page', 'thankyou-page');
}

// Video recording
async function startRecording() {
    if (!stream || !stream.active) {
        console.error('Stream not available or not active');
        return;
    }
    
    recordedChunks = [];
    const canvas = document.getElementById('video-canvas');
    const video = document.getElementById('participant-video');
    const ctx = canvas.getContext('2d');
    
    // Ensure video is playing and has dimensions
        if (video.readyState < 2) {
            console.warn('Video not ready, waiting...');
            video.onloadedmetadata = () => {
                startRecording().catch(err => console.error('Error starting recording:', err));
            };
            return;
        }
    
    // Set canvas dimensions based on actual video dimensions
    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    console.log('Starting recording with dimensions:', videoWidth, 'x', videoHeight);
    
    try {
        // Ensure video is playing and rendering frames
        if (video.paused) {
            video.play().catch(err => console.error('Video play error:', err));
        }
        
        // Force video to render by making it visible (very small) in viewport
        // Chrome requires video to be in viewport and actively rendering to capture frames
        // Keep video visible throughout recording
        video.style.position = 'fixed';
        video.style.top = '0';
        video.style.left = '0';
        video.style.width = '160px';
        video.style.height = '120px';
        video.style.opacity = '0.01'; // Almost invisible but still renders
        video.style.zIndex = '-1';
        video.style.pointerEvents = 'none';
        video.style.display = 'block'; // Ensure it's displayed (not hidden)
        
        // Ensure video is playing and stays playing
        if (video.paused) {
            await video.play();
        }
        
        // Keep video playing throughout recording - prevent it from pausing
        video.addEventListener('pause', () => {
            console.log('Video paused, restarting...');
            video.play();
        });
        
        // Wait for video to actually start rendering frames
        let frameCheckAttempts = 0;
        await new Promise(resolve => {
            const checkRendering = () => {
                frameCheckAttempts++;
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                // Check if we have non-black pixels (video is rendering)
                let hasContent = false;
                let pixelCount = 0;
                for (let i = 0; i < data.length && pixelCount < 1000; i += 4) {
                    if (data[i] > 20 || data[i + 1] > 20 || data[i + 2] > 20) {
                        hasContent = true;
                        pixelCount++;
                    }
                }
                if (hasContent && pixelCount > 50) {
                    console.log('Video is rendering frames (detected', pixelCount, 'non-black pixels)');
                    resolve();
                } else if (frameCheckAttempts > 20) {
                    console.warn('Video frame check timeout - proceeding anyway');
                    resolve();
                } else {
                    setTimeout(checkRendering, 100);
                }
            };
            setTimeout(checkRendering, 200);
        });
        
        // Use canvas stream for recording - more reliable than direct MediaStream
        // Continuously draw video frames to canvas and record from canvas stream
        const drawToCanvas = () => {
            if (video.readyState >= 2 && stream.active) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            }
        };
        
        // Start drawing frames to canvas immediately
        const canvasDrawInterval = setInterval(drawToCanvas, 33); // ~30 FPS
        window.canvasDrawInterval = canvasDrawInterval;
        
        // Now create a stream from the canvas and record that
        setTimeout(() => {
            // Use canvas stream - canvas is being updated with video frames
            const canvasStream = canvas.captureStream(30); // 30 FPS
            
            // Check for supported MIME types
            let mimeType = 'video/webm';
            if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
                mimeType = 'video/webm;codecs=vp9';
            } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
                mimeType = 'video/webm;codecs=vp8';
            } else if (MediaRecorder.isTypeSupported('video/webm')) {
                mimeType = 'video/webm';
            }
            
            console.log('Creating MediaRecorder with canvas stream');
            
            mediaRecorder = new MediaRecorder(canvasStream, {
                mimeType: mimeType,
                videoBitsPerSecond: 2500000
            });
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    console.log('MediaRecorder data available:', event.data.size, 'bytes');
                    recordedChunks.push(event.data);
                } else {
                    console.warn('MediaRecorder data event with no data or size 0');
                }
            };
            
            mediaRecorder.onstop = () => {
                console.log('MediaRecorder stopped. Total chunks:', recordedChunks.length);
                console.log('Total data size:', recordedChunks.reduce((sum, chunk) => sum + chunk.size, 0), 'bytes');
                saveVideo();
            };
            
            mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event);
                if (event.error) {
                    console.error('MediaRecorder error details:', event.error);
                }
            };
            
            mediaRecorder.onstart = () => {
                console.log('MediaRecorder started successfully');
            };
            
            // Start recording with timeslice to ensure regular data capture
            mediaRecorder.start(1000); // Capture data every second
            console.log('MediaRecorder.start() called, state:', mediaRecorder.state);
            
            // Canvas drawing is already happening (started above)
        }, 200); // Wait 200ms for video to start rendering
        
    } catch (error) {
        console.error('MediaRecorder setup error:', error);
        // Fallback to frame capture
        alert('Error setting up video recording. Please check console for details.');
    }
}

function stopRecording() {
    // Stop canvas drawing interval
    if (window.canvasDrawInterval) {
        clearInterval(window.canvasDrawInterval);
        window.canvasDrawInterval = null;
    }
    
    // Keep video playing until recording fully stops
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    } else if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        // If paused, resume then stop to ensure final data
        if (mediaRecorder.state === 'paused') {
            mediaRecorder.resume();
        }
        mediaRecorder.stop();
    }
    
    // Stop stream tracks after recording finishes (in saveVideo callback)
    // Don't stop immediately - wait for MediaRecorder.onstop to fire
    setTimeout(() => {
        if (stream) {
            console.log('Stopping stream tracks');
            stream.getTracks().forEach(track => {
                track.stop();
                console.log('Track stopped:', track.kind, track.readyState);
            });
        }
    }, 1000);
}

function saveVideo() {
    if (recordedChunks.length === 0) {
        // Fallback: create video from canvas frames
        createVideoFromFrames();
        return;
    }
    
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const participantId = participantData.info.participantId || 'participant';
    
    // Save video after Excel files have been initiated (with delay to avoid browser blocking)
    setTimeout(() => {
        // Note: Browser records in WebM format
        // To convert to MP4, use: ffmpeg -i {participantId}_video.webm {participantId}_video.mp4
        // Or use the convert_to_mp4.sh script: ./convert_to_mp4.sh {participantId}
        downloadFile(blob, `${participantId}_video.webm`, 'video/webm');
    }, 1000);
}

function createVideoFromFrames() {
    // This is a simplified approach - in production you'd want to use a library
    // For now, we'll save a representative frame
    const canvas = document.getElementById('video-canvas');
    canvas.toBlob((blob) => {
        if (blob) {
            // Note: This saves as image, not video. For true video, you'd need a library like RecordRTC
            downloadFile(blob, `${participantData.info.participantId}_recording.jpg`, 'image/jpeg');
        }
    });
}

// Data saving functions
function saveParticipantData() {
    const participantId = participantData.info.participantId || 'participant';
    
    // Calculate accuracy
    const totalStimuli = participantData.stimuli.length;
    const correctAnswers = participantData.stimuli.filter(s => s.isCorrect).length;
    const accuracy = totalStimuli > 0 ? (correctAnswers / totalStimuli * 100).toFixed(2) : 0;
    
    // Save files with delays to avoid browser blocking multiple downloads
    // Save assessments Excel first (with small delay to ensure browser is ready)
    setTimeout(() => {
        try {
            saveAssessmentsExcel(participantId);
        } catch (error) {
            console.error('Error saving assessment Excel:', error);
            alert('Error saving assessment data. Please check the console.');
        }
    }, 100);
    
    // Save metadata Excel after a delay
    setTimeout(() => {
        try {
            saveMetadataExcel(participantId, accuracy);
        } catch (error) {
            console.error('Error saving metadata Excel:', error);
            alert('Error saving metadata. Please check the console.');
        }
    }, 600);
    
    // Note: Video is saved asynchronously when recording stops (in saveVideo function)
}

function saveAssessmentsExcel(participantId) {
    try {
        const wb = XLSX.utils.book_new();
        
        // Debug: Check what data we have
        console.log('PHQ9 data:', participantData.phq9);
        console.log('GAD7 data:', participantData.gad7);
        
        // PHQ-9 Sheet
        const phq9Data = [
            ['Question', 'Score'],
            ...PHQ9_QUESTIONS.map((q, i) => {
                const key = `phq9_q${i}`;
                const value = participantData.phq9 && participantData.phq9[key] !== undefined 
                    ? participantData.phq9[key] 
                    : 0;
                console.log(`PHQ9 Q${i+1}: key="${key}", value=${value}`);
                return [`Q${i + 1}: ${q}`, value];
            })
        ];
        const phq9WS = XLSX.utils.aoa_to_sheet(phq9Data);
        XLSX.utils.book_append_sheet(wb, phq9WS, 'PHQ9');
        
        // GAD-7 Sheet
        const gad7Data = [
            ['Question', 'Score'],
            ...GAD7_QUESTIONS.map((q, i) => {
                const key = `gad7_q${i}`;
                const value = participantData.gad7 && participantData.gad7[key] !== undefined 
                    ? participantData.gad7[key] 
                    : 0;
                console.log(`GAD7 Q${i+1}: key="${key}", value=${value}`);
                return [`Q${i + 1}: ${q}`, value];
            })
        ];
        const gad7WS = XLSX.utils.aoa_to_sheet(gad7Data);
        XLSX.utils.book_append_sheet(wb, gad7WS, 'GAD7');
        
        const excelBlob = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        console.log(`Downloading assessment Excel for ${participantId}...`);
        downloadFile(new Blob([excelBlob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 
                     `${participantId}_assessment.xlsx`, 
                     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } catch (error) {
        console.error('Error in saveAssessmentsExcel:', error);
        throw error;
    }
}

function saveMetadataExcel(participantId, accuracy) {
    const wb = XLSX.utils.book_new();
    
    // Create a copy of stimuli.csv with user responses and reaction times
    // Include all original columns plus new columns
    const stimuliData = [
        ['Image', 'Gender', 'Model', 'Race', 'Mouth', 'Corr_emotion', 'option1', 'option2', 'option3', 'option4', 'User response', 'Reaction Time (ms)'],
        ...participantData.stimuli.map(s => {
            const config = s.config || stimuliConfig.find(c => c.imageName === s.imageName);
            if (!config) {
                return [s.imageName, '', '', '', '', '', '', '', '', '', s.selectedLabel || '', s.reactionTime];
            }
            
            return [
                config.imageName,
                config.metadata?.gender || '',
                config.metadata?.model || '',
                config.metadata?.race || '',
                config.metadata?.mouth || '',
                config.metadata?.correctEmotion || '',
                config.option1 || '',
                config.option2 || '',
                config.option3 || '',
                config.option4 || '',
                s.selectedLabel || '', // User's selected emotion label
                s.reactionTime // Reaction time in milliseconds
            ];
        })
    ];
    
    // Add metadata rows at the end
    const avgReactionTime = participantData.stimuli.length > 0 
        ? Math.round(participantData.stimuli.reduce((sum, s) => sum + s.reactionTime, 0) / participantData.stimuli.length)
        : 0;
    
    stimuliData.push([]); // Empty row separator
    stimuliData.push(['--- METADATA ---', '', '', '', '', '', '', '', '', '', '', '']);
    stimuliData.push(['Participant ID', participantData.info.participantId, '', '', '', '', '', '', '', '', '', '']);
    stimuliData.push(['Performer', participantData.info.performer, '', '', '', '', '', '', '', '', '', '']);
    stimuliData.push(['Age', participantData.info.age, '', '', '', '', '', '', '', '', '', '']);
    stimuliData.push(['Gender', participantData.info.gender, '', '', '', '', '', '', '', '', '', '']);
    stimuliData.push(['Timestamp', participantData.info.timestamp, '', '', '', '', '', '', '', '', '', '']);
    stimuliData.push(['Accuracy', `${accuracy}%`, '', '', '', '', '', '', '', '', '', '']);
    stimuliData.push(['Total Stimuli', participantData.stimuli.length, '', '', '', '', '', '', '', '', '', '']);
    stimuliData.push(['Correct Answers', participantData.stimuli.filter(s => s.isCorrect).length, '', '', '', '', '', '', '', '', '', '']);
    stimuliData.push(['Average Reaction Time (ms)', avgReactionTime, '', '', '', '', '', '', '', '', '', '']);
    
    const ws = XLSX.utils.aoa_to_sheet(stimuliData);
    XLSX.utils.book_append_sheet(wb, ws, 'Stimuli Data');
    
    const excelBlob = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    downloadFile(new Blob([excelBlob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 
                 `${participantId}_metadata.xlsx`, 
                 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

function downloadFile(blob, filename, mimeType) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Start experiment when stimuli page is shown
let experimentStarted = false;
document.addEventListener('DOMContentLoaded', function() {
    const stimuliPage = document.getElementById('stimuli-page');
    const observer = new MutationObserver(function(mutations) {
        if (stimuliPage.classList.contains('active') && !experimentStarted) {
            experimentStarted = true;
            setTimeout(() => {
                startExperiment();
            }, 500);
        }
    });
    observer.observe(stimuliPage, { attributes: true, attributeFilter: ['class'] });
});

// Reset experiment flag when leaving stimuli page
const stimuliPage = document.getElementById('stimuli-page');
if (stimuliPage) {
    const pageObserver = new MutationObserver(function(mutations) {
        if (!stimuliPage.classList.contains('active')) {
            experimentStarted = false;
        }
    });
    pageObserver.observe(stimuliPage, { attributes: true, attributeFilter: ['class'] });
}

