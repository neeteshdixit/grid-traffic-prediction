# Flipkart GRID 6.0: TrafficAI Presentation Walkthrough & Narration Script

**Project Title:** TrafficAI (Enterprise Traffic Demand Forecasting & Parking Intelligence System)  
**Presenter:** Ayushi Vyas & Team  
**Key Champion Model:** Ensemble Voting Regressor (Validation R² = 0.7527)  
**Deployment Infrastructure:** Frontend (Vercel), Backend (Render), Database (MongoDB Atlas)  

---

## SCENE 1: INTRODUCTION & LANDING PAGE [0:00 - 0:40]

### Screen State:
* Web browser open on the Landing Page (`grid-traffic-prediction.vercel.app` or `localhost:3000`).
* Hero Section is visible: *"Predict traffic demand before the gridlock starts."*
* Aggregate stats cards are visible: Train Rows (77,299), Mapped Geohashes (1,249), and Model Stages.

### Hindi Action Guide (कहाँ क्लिक करना है और क्या करना है):
1. स्क्रीन रिकॉर्डिंग शुरू करें।
2. माउस कर्सर को मुख्य हेडिंग "Predict traffic demand before the gridlock starts" पर घुमाएं।
3. नीचे दिए गए सांख्यिकी कार्ड्स (Train Rows: 77,299) पर माउस ले जाकर दिखाएं।
4. टॉप-राइट कॉर्नर में बने **"Launch Dashboard"** या **"Open Console"** बटन पर क्लिक करें। यह आपको सीधे Overview Dashboard पर ले जाएगा।

### English Narration (क्या बोलना है):
> "Hello esteemed judges and technical reviewers. My name is Ayushi Vyas, and today I am excited to present our Flipkart GRID Round 2 submission: **TrafficAI**, an Enterprise AI Traffic Demand and Parking Intelligence System.
> 
> Our system is fully deployed in production. The Next.js frontend is live on Vercel, our high-performance FastAPI backend is hosted on Render, and our database is hosted in the cloud on MongoDB Atlas.
> 
> Urban gridlocks are a multi-billion dollar problem. Furthermore, illegal street parking reduces effective road width, causing severe bottleneck delays. Our platform solves this by combining high-performance ensemble machine learning regressions with spatial clustering to forecast traffic demand and recommend real-time, explainable enforcement deployments."

---

## SCENE 2: OVERVIEW DASHBOARD [0:40 - 1:20]

### Screen State:
* Overview Console is active.
* KPI cards show: Active Model (Ensemble_Voting), Validation R2 (0.7527), MAE (0.0212), and RMSE (0.0309).
* Recharts graphs render: Daily Demand Trend (Area), Weather Impact (Bar), and Road Type (Pie).
* Right sidebar displays the High-Risk Geohash Checklist.

### Hindi Action Guide (कहाँ क्लिक करना है और क्या करना है):
1. ऊपर बने KPI कार्ड्स, विशेष रूप से **"Validation R2: 0.7527"** और **"Active Model: Ensemble_Voting"** पर माउस कर्सर टिकाएं।
2. "Daily Demand Trend" एरिया चार्ट के सुबह 9:00 बजे और शाम 6:00 बजे वाले पीक पॉइंट्स पर होवर करें।
3. "Weather Impact" बार चार्ट के 'Rainy' बार पर माउस ले जाकर दिखाएं कि कैसे बारिश में ट्रैफिक लोड बढ़ जाता है।
4. दाईं तरफ की "High-Risk Geohash Checklist" में से पहले दो कोऑर्डिनेट्स पर माउस स्क्रॉल करें।

### English Narration (क्या बोलना है):
> "We are now inside the main Overview Dashboard. Here, city administrators monitor core machine learning KPIs in real-time. Our champion model is the Ensemble Voting Regressor, achieving an outstanding Validation R-squared score of 0.7527.
> 
> Below this, the Daily Demand Trend identifies morning and evening peak intervals. The Weather Impact chart shows how adverse weather like rain increases traffic demand score, while the High-Risk Checklist on the right automatically flags coordinate grid segments experiencing critical traffic buildup, allowing proactive planning."

---

## SCENE 3: DATASET STUDIO & DELETION [1:20 - 2:00]

### Screen State:
* Sidebar menu "Datasets" is active.
* Upload section is visible. The list contains uploaded datasets.
* **"Delete" (Garbage Can icon) button is visible** next to each dataset row.

### Hindi Action Guide (कहाँ क्लिक करना है और क्या करना है):
1. लेफ्ट साइडबार में **"Datasets"** टैब पर क्लिक करें।
2. "Upload Dataset" पर क्लिक करें और `dataset` फोल्डर से **`train_sample.csv`** (10,000 rows, ~913KB) को सेलेक्ट करके अपलोड करें। दिखाएं कि छोटा सैंपल होने के कारण यह मात्र 1 सेकंड में अपलोड हो जाता. है।
3. अपलोड होने के बाद, लिस्ट में नया डेटासेट दिखाई देगा।
4. इसके बाद, लिस्ट में बने **"Delete" (कूड़ेदान/garbage bin icon)** बटन पर क्लिक करें। 
5. दिखाएं कि कैसे कन्फर्मेशन पॉपअप पर क्लिक करते ही डेटासेट डेटाबेस और सर्वर से तुरंत सुरक्षित तरीके से डिलीट हो जाता है।

### English Narration (क्या बोलना है):
> "Let's visit the Dataset Studio. Here, planners manage raw data files. We can upload our new sampled files—like `train_sample.csv`—which upload instantly. 
> 
> In this round, we added full management capabilities. Planners can now audit raw files, check row counts, and clean up workspace files by clicking the Delete button next to any dataset. This triggers a secure cascade deletion, removing metadata from MongoDB and physical files from storage, keeping our workspace clean."

---

## SCENE 4: MODEL TRAINING LEADERBOARD & DELETION [2:00 - 2:40]

### Screen State:
* Sidebar menu "Training" is active.
* Table lists trained models (Ensemble_Voting, XGBoost, LightGBM, Random Forest, Linear Regression).
* **"Delete Model" button is visible** next to each trained model row.

### Hindi Action Guide (कहाँ क्लिक करना है और क्या करना है):
1. लेफ्ट साइडबार में **"Training"** टैब पर क्लिक करें।
2. "Model Leaderboard" टेबल की विभिन्न रोज़ पर कर्सर ले जाएं और अलग-अलग मॉडल्स के R2 स्कोर्स दिखाएं।
3. मॉडल को डिलीट करने की क्षमता दिखाने के लिए, लिस्ट में से किसी पुराने/कमजोर मॉडल (जैसे `LinearRegression`) के सामने बने **"Delete"** बटन पर क्लिक करें।
4. दिखाएं कि वह मॉडल तुरंत डिलेट होकर टेबल से हट जाता है।

### English Narration (क्या बोलना है):
> "Next, we look at the Model Leaderboard under the Training tab. Our AutoML pipeline automatically trains and compares multiple models including XGBoost, LightGBM, and Random Forest.
> 
> We have added complete lifecycle control for trained models. Planners can now remove redundant or outdated trial models directly from the UI using the Delete Model button. This immediately frees up server storage by deleting saved model weights, allowing only the best performing models to remain active."

---

## SCENE 5: PARKING INTELLIGENCE & GEOMAP [2:40 - 3:20]

### Screen State:
* Sidebar menu "Parking Hotspots" is active.
* Leaflet Map renders dark theme tiles with geo-markers plotted across Bengaluru.
* Right side details drawer is active.

### Hindi Action Guide (कहाँ क्लिक करना है और क्या करना है):
1. लेफ्ट साइडबार में **"Parking Hotspots"** टैब पर क्लिक करें।
2. मैप लोड होने पर, बेंगलुरु शहर के किसी भी **Red (Critical)** या **Orange (High)** पल्सिंग मार्कर पर क्लिक करें।
3. दाईं तरफ खुलने वाले "Details Drawer" में हॉटस्पॉट स्कोर (84) और रोड कैपेसिटी रिडक्शन (22%) को दिखाएं।
4. ड्रावर में ऊपर बने **"AI Forecasts"** टैब पर क्लिक करें और कल के अनुमानित आंकड़े (Tomorrow Violations: 64, Hotspot Probability: 74%) को कर्सर से हाईलाइट करें।

### English Narration (क्या बोलना है):
> "Now, let's explore our Parking Intelligence module, which is a core innovation for our Round 2 upgrade. We have integrated a live, interactive OpenStreetMap layer using Leaflet and CARTO Dark Matter tiles.
> 
> When I click on this pulsing red marker on Richmond Road, the details panel updates instantly. This wrong-parking hotspot reduces the effective road capacity by 22% at this junction. 
> 
> Switching to the AI Forecasts tab, our model predicts 64 violations tomorrow with a 74% likelihood of remaining a critical hotspot, enabling traffic police to proactively dispatch towing vehicles before gridlocks build up."

---

## SCENE 6: EXPLAINABLE ENFORCEMENT & SIMULATION [3:20 - 3:50]

### Screen State:
* Sidebar menu "Enforcement Strategy" is active.
* Ranked list of hotspots is shown.
* "Recommendation Basis" card displays plain-English explainable text.
* "Deploy Officers" button and "Simulate Enforcement" sliders are visible.

### Hindi Action Guide (कहाँ क्लिक करना है और क्या करना है):
1. साइडबार में **"Enforcement Strategy"** पर क्लिक करें।
2. पहले कार्ड (Rank #1 - Richmond Road) पर होवर करें और सुझाए गए पुलिसकर्मियों की संख्या (4 Officers) दिखाएं।
3. कार्ड के निचले हिस्से में लिखे **"Recommendation Basis"** (Explainable Reason) पर माउस ले जाएं।
4. **"Deploy Officers"** बटन पर क्लिक करें। स्क्रीन पर सक्सेस मैसेज दिखाई देगा कि पुलिस अधिकारियों की तैनाती रजिस्टर कर ली गई है।

### English Narration (क्या बोलना है):
> "Under the Enforcement Strategy dashboard, we translate machine learning forecasts into actionable municipal plans. Instead of giving black-box suggestions, the platform lists ranked priority hotspots.
> 
> Each recommendation is explainable, showing the exact congestion index, recommended officers, and expected improvement. We also provide a written 'Recommendation Basis' describing the capacity loss and junction risk. Clicking 'Deploy Officers' logs the dispatch task instantly in MongoDB to update shift rosters."

---

## SCENE 7: BATCH PREDICTION CENTER [3:50 - 4:20]

### Screen State:
* Sidebar menu "Prediction Center" is active.
* Contains a single scenario forecast form and a batch CSV upload section.

### Hindi Action Guide (कहाँ क्लिक करना है और क्या करना है):
1. साइडबार में **"Prediction Center"** पर क्लिक करें।
2. "Batch File Forecast" सेक्शन में जाएं और **`test_sample.csv`** (5,000 rows, ~359KB) को अपलोड करें।
3. दिखाएं कि अपलोड होते ही बैकएंड कुछ ही मिलीसेकंड्स में 5,000 पंक्तियों के लिए ट्रैफिक डिमांड प्रेडिक्ट कर देता है और टेबल अपडेट हो जाती है।
4. टेबल के ऊपर बने **"Download Predictions CSV"** बटन पर क्लिक करें। दिखाएं कि प्रेडिक्टेड वैल्यूज वाली CSV तुरंत डाउनलोड हो जाती है।

### English Narration (क्या बोलना है):
> "Our Prediction Center supports both single-scenario forecasting and high-throughput batch forecasting. 
> 
> By uploading our `test_sample.csv` file, the backend regressor scores thousands of records in milliseconds. Planners can download the completed prediction file by clicking 'Download Predictions CSV', which returns a structured dataset containing forecast demand values for further analytical reporting."

---

## SCENE 8: INTERACTIVE AI COPILOT CHAT [4:20 - 4:50]

### Screen State:
* Floating chat widget is open in the bottom-right corner.
* Conversation showing messages and replies.

### Hindi Action Guide (कहाँ क्लिक करना है और क्या करना है):
1. स्क्रीन के बॉटम-राइट कॉर्नर में बने **चैट बबल (chatbot icon)** पर क्लिक करें।
2. चैट इनपुट में लिखें: **`hlo dear`** और सेंड करें। दिखाएं कि यह वेलकम मैसेज दोहराने के बजाय एक अनुकूल रिस्पॉन्स देता है।
3. चैट में अगला सवाल लिखें: **`why red is red`** और सेंड करें। दिखाएं कि यह मैप के लाल, पीले और नीले मार्कर का सही अर्थ समझाता है।
4. अब एक ऑफ-टॉपिक सवाल लिखें: **`mujhe padhne ka mn nhi hai`** और सेंड करें। दिखाएं कि यह एक बहुत ही मज़ेदार और दोस्ताना हिंदी/हिंग्लिश रिस्पॉन्स देता है।
5. (Optional): यदि आपने **`GEMINI_API_KEY`** सेट की है, तो दिखाएं कि चैटबॉट बिल्कुल इंसानों की तरह किसी भी विषय पर लाइव बातचीत कर सकता है।

### English Narration (क्या बोलना है):
> "Finally, we demonstrate our upgraded AI Copilot. It operates via local fallback rules or integrates seamlessly with the Google Gemini API using environment variables.
> 
> When I greet it, it welcomes me warmly. If I ask: 'Why red is red', it instantly explains the map coding—identifying red as critical congestion and blue as emerging hotspots.
> 
> Even if I type an off-topic conversational query in Hindi like 'mujhe padhne ka mn nhi hai', the system dynamically handles the user's mood, offering a friendly, encouraging reply in Hinglish and smoothly nudging them back to traffic coordination, proving its conversational robustness."

---

## SCENE 9: PDF REPORTS & CONCLUSION [4:50 - 5:10]

### Screen State:
* "Reports & Exports" tab is active.
* Table lists reports with "Download PDF" buttons.

### Hindi Action Guide (कहाँ क्लिक करना है और क्या करना है):
1. साइडबार में **"Reports"** टैब पर क्लिक करें।
2. पहले रिपोर्ट (REP-001) के सामने बने **"Download PDF"** बटन पर क्लिक करें और पीडीएफ रिपोर्ट लोड होते हुए दिखाएं।
3. कैमरा या स्क्रीन की तरफ देखकर वीडियो समाप्त करें।

### English Narration (क्या बोलना है):
> "On the Reports tab, the system compiles formal documentation. Clicking 'Download PDF' on our AutoML summary triggers the backend Reportlab engine to dynamically compile and download a structured PDF report.
> 
> In conclusion, TrafficAI is a production-ready, data-driven framework. By forecasting congestion peaks and pinpointing parking bottlenecks with 0.7527 R2 accuracy, we enable municipal authorities to reclaim effective road lanes and build smarter cities. Thank you for your time."

---
