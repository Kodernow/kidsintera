# Database Setup Instructions

## Current Project Status
Your project is designed to work with **Supabase** for data storage. It uses:
- **Supabase** for todos, flashcards, admin data, and user preferences
- **localStorage** as fallback when offline
- **Supabase Auth** for user authentication (optional)

## Option 1: Run With Supabase (Recommended)
The project works best with Supabase for data storage:

1. **Create a Supabase Project:**
   - Go to [supabase.com](https://supabase.com) and sign up or log in
   - Create a new project
   - Wait for the project to be created

2. **Create Admin User in Supabase Auth (REQUIRED):**
   - Go to Authentication > Users in your Supabase dashboard
   - Click "Add user"
   - Email: `admin@admin.com`
   - Password: `admin123` (or your preferred password)
   - Click "Add user"
   - ⚠️ This step must be done BEFORE running the SQL migration

3. **🚨 CRITICAL: Run the SQL Migration (REQUIRED STEP):**
   - Go to the SQL Editor in your Supabase project
   - Click "New Query"
   - Copy the ENTIRE contents of `supabase/migrations/create_required_tables.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute the SQL
   - ⚠️ This step is MANDATORY - the app will show errors without these tables
   - You should see "Success. No rows returned" or similar confirmation

6. **🚨 CRITICAL: Run the Flashcard Tables SQL Migration (REQUIRED STEP):**
   - Copy the ENTIRE contents of `supabase/migrations/add_flashcard_tables.sql`
   - Paste it into the SQL editor and click "Run".

4. **Set Admin User as Admin (REQUIRED):**
   - After running the SQL migration, go to Table Editor > user_profiles
   - Find the row for your admin user (admin@admin.com)
   - Set `is_admin` column to `true`
   - Click Save

5. **Update your `.env` file:**
   ```env
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_ENABLE_LOCALSTORAGE_FALLBACK=true
   ```

6. **Features that work with Supabase:**
   - ✅ Todo management with cloud sync
   - ✅ Flashcard learning with AI detection
   - ✅ Admin panel with data persistence
   - ✅ Theme settings synced across devices
   - ✅ User authentication and profiles

## Option 2: Run Without Database (Fallback)

The project can still work without Supabase by using localStorage:

1. **Update your `.env` file:**
   ```env
   VITE_SUPABASE_URL=https://placeholder.supabase.co
   VITE_SUPABASE_ANON_KEY=placeholder-key
   VITE_ENABLE_LOCALSTORAGE_FALLBACK=true
   ```

2. **Authentication fallback:**
   - Hardcoded admin login: `admin@demo.com` / `admin`
   - No user registration, but full app functionality

## Self-Hosting Supabase

This project is compatible with self-hosted Supabase instances. To set up:

1. **Set up a self-hosted Supabase instance** following the [official documentation](https://supabase.com/docs/guides/self-hosting)

2. **Run the SQL migration** in your self-hosted instance:
   - Use the SQL in `supabase/migrations/create_required_tables.sql`

3. **Update your environment variables** to point to your self-hosted instance:
   ```env
   VITE_SUPABASE_URL=your-self-hosted-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

## Troubleshooting

### If you get authentication errors:
1. Check that email confirmation is disabled
2. Verify your Supabase URL and keys
3. Make sure RLS policies are set correctly

### If you get database errors:
1. Check that you've run the SQL migration
   - This is the most common issue! Make sure you've copied and run the SQL from `supabase/migrations/create_required_tables.sql`
2. Verify your Supabase URL and keys
3. Try setting `VITE_ENABLE_LOCALSTORAGE_FALLBACK=true` to use localStorage as fallback

## Troubleshooting "relation does not exist" errors

If you see errors like `relation "public.user_preferences" does not exist` or `relation "public.admin_data" does not exist`, it means you haven't run the SQL migration script yet. 

**THIS IS THE MOST COMMON ISSUE!** Follow these steps:

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Create a new query
4. Copy the ENTIRE contents of `supabase/migrations/create_required_tables.sql`
5. Paste it into the SQL editor
6. Click "Run" to execute the SQL
7. Wait for confirmation that the SQL executed successfully
8. Refresh your application

**Expected Result:** You should see "Success. No rows returned" or similar confirmation message after running the SQL.

The application will automatically use localStorage as a fallback until the database tables are created.

## Verifying Tables Were Created

After running the SQL migration, you can verify the tables were created by:

1. Go to "Table Editor" in your Supabase dashboard
2. You should see these tables:
   - `user_preferences`
   - `admin_data` 
   - `flashcard_categories`
   - `flashcards`
   - `user_subscriptions`
   - `todos`
   - `flashcard_progress`
   - `user_profiles`
   - `admin_users`

If you don't see these tables, the SQL migration didn't run successfully. Try running it again.


Logic of Object Detection : 

sequenceDiagram
    participant User
    participant FlashcardSettings
    participant FlashcardContext
    participant BrowserAPI
    participant TensorFlowJS
    participant TesseractJS
    participant QRScanner

    User->>FlashcardSettings: Clicks "Objects" toggle button
    FlashcardSettings->>FlashcardContext: calls toggleCameraDetection()
    FlashcardContext-->>FlashcardContext: updates cameraDetectionEnabled state
    FlashcardContext->>FlashcardContext: (if cameraDetectionEnabled is true and not already detecting) calls startCameraDetection()
    FlashcardContext->>FlashcardContext: startCameraDetection() checks if camera features are enabled
    FlashcardContext->>FlashcardContext: startCameraDetection() calls loadModel()
    FlashcardContext->>TensorFlowJS: loadModel() loads COCO-SSD model
    TensorFlowJS-->>FlashcardContext: Model loaded
    FlashcardContext->>BrowserAPI: startCameraDetection() requests navigator.mediaDevices.getUserMedia()
    BrowserAPI-->>FlashcardContext: Provides MediaStream (camera feed)
    FlashcardContext->>FlashcardContext: startCameraDetection() sets up video element and starts detection interval
    loop Detection Loop (e.g., every 3 seconds)
        FlashcardContext->>FlashcardContext: Calls detectObjects(videoFrame)
        FlashcardContext->>TensorFlowJS: detectObjects() sends videoFrame to loaded model
        TensorFlowJS-->>FlashcardContext: Returns detected objects (e.g., "cat", "square")
        FlashcardContext->>FlashcardContext: detectObjects() calls mapObjectToFlashcard() for each detected object
        FlashcardContext-->>FlashcardContext: Updates detectedObjects state
        alt If OCR enabled
            FlashcardContext->>FlashcardContext: Calls detectText(videoFrame)
            FlashcardContext->>TesseractJS: detectText() sends videoFrame for OCR
            TesseractJS-->>FlashcardContext: Returns detected text
            FlashcardContext-->>FlashcardContext: Updates detectedText state
        end
        alt If QR Code enabled
            FlashcardContext->>FlashcardContext: Calls detectQRCodes(videoFrame)
            FlashcardContext->>QRScanner: detectQRCodes() sends videoFrame for QR scan
            QRScanner-->>FlashcardContext: Returns detected QR codes
            FlashcardContext-->>FlashcardContext: Updates detectedQRCodes state
        end
        FlashcardContext->>FlashcardContext: (if sound enabled) Plays sound/spells for detected flashcards
    end

The image detection on the /flashcards page, particularly in "Camera Mode," is implemented using a combination of client-side machine learning libraries to perform object detection, optical character recognition (OCR), and QR code scanning.

Here's a breakdown of how it works and the libraries used:

Object Detection (TensorFlow.js and COCO-SSD):

TensorFlow.js (@tensorflow/tfjs): This is a JavaScript library for training and deploying machine learning models in the browser. It provides the core capabilities for running the object detection model.
COCO-SSD (@tensorflow-models/coco-ssd): This is a pre-trained object detection model, part of the TensorFlow.js models collection. It's capable of detecting a wide variety of common objects (like "cat," "dog," "cow," "bird," "apple," "square," "circle," etc.) in images and video streams.
How it works: When "Camera Mode" is active and "Objects" detection is enabled, the application accesses the user's camera feed. This video stream is continuously fed into the COCO-SSD model. The model then analyzes each frame to identify objects it has been trained to recognize. If an object is detected with a high enough confidence score, its class (e.g., "cat") is captured. The application then attempts to match this detected object class to the titles of your flashcards.
Optical Character Recognition (OCR) (Tesseract.js):

Tesseract.js (tesseract.js): This is a JavaScript library that uses the Tesseract OCR engine (originally developed by Google) to recognize text in images.
How it works: When "Camera Mode" is active and "Text" recognition is enabled, the application captures frames from the camera feed. These frames are then processed by Tesseract.js to extract any readable text. The extracted text is then compared against the titles of your flashcards to find a match.
QR Code Scanning (QR-Scanner):

QR-Scanner (qr-scanner): This is a fast and simple JavaScript library for scanning QR codes from images or video streams.
How it works: When "Camera Mode" is active and "QR Code" scanning is enabled, the library continuously scans the camera feed for QR codes. If a QR code is detected, its decoded data (which could be a URL, a flashcard ID, or a word) is extracted. The application then checks if this data matches any flashcard titles or links.
Integration in FlashcardContext.tsx:

All of these detection mechanisms are orchestrated within the src/context/FlashcardContext.tsx file. This context manages:

Camera Access: Initiating and stopping the camera stream.
Model Loading: Loading the TensorFlow.js and COCO-SSD models.
Detection Loop: Running a continuous loop that captures video frames and passes them to the respective detection libraries (TensorFlow.js for objects, Tesseract.js for OCR, QR-Scanner for QR codes).
Result Processing: Collecting the detected objects, text, and QR codes, and then attempting to match them with your predefined flashcards.
Settings: Managing user preferences for sound, spelling, and enabling/disabling each detection type.
This setup allows the application to provide an interactive learning experience where physical objects, text, or QR codes can trigger the display and pronunciation of corresponding flashcards.
