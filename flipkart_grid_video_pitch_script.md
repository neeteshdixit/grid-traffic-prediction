# FLIPKART GRID – COMPLETE VIDEO PITCH SCRIPT (ROUND 1 & 2)
**Total Video Target Duration:** 3 Minutes (180 Seconds)  
**Strategy:** Highlight the complete unified TrafficAI system (Round 1 + 2) while focusing 80% of speaking time and visuals on the **Round 2 Parking Congestion Upgrades**.

---

## 🎙️ SPEAKER 1: THE UNIFIED VISION & ROUND 2 CHALLENGE (0:00 - 1:00)
**Role:** Team Lead / Product Presenter  
**Focus:** Introducing TrafficAI, connecting Round 1 (Demand Prediction) to Round 2 (Parking Congestion), and presenting the Overview Dashboard.

| Time | Screen Action (क्या दिखाना है) | Speaking Script (क्या बोलना है) |
| :--- | :--- | :--- |
| **0:00 - 0:15** | Face camera (Team Intro) or display Slide 1 (Cover Page). | *"Hello judges, we are Team [Team Name]. Today, we are pitching **TrafficAI**—a unified mobility intelligence ecosystem. While our Round 1 foundation forecast macro traffic demand, our Round 2 upgrade directly tackles the critical challenge of **Poor Visibility on Parking-Induced Congestion**."* |
| **0:15 - 0:40** | Share screen showing the **Overview Dashboard** (`http://localhost:3000`). Point out the metric cards for total hotspots, active violations, and average capacity blockage. | *"Chaotic, illegal street parking chokes lane capacity and causes massive gridlocks, but police have had zero visibility. TrafficAI integrates our Round 1 **LightGBM Champion Model** (validation score of 0.7588) with new Round 2 density clustering to give city managers an active, unified console."* |
| **0:40 - 1:00** | Navigate to the sidebar and highlight the transition from Round 1 tabs (Predictions) to Round 2 tabs (Parking Intel, Congestion, Enforcement). | *"By connecting macro demand forecasting with micro-level parking violations, we allow traffic units to transition from reactive patrols to target-directed, proactive enforcement. I will now pass to our ML lead to explain our core analytics models."* |

---

## 🎙️ SPEAKER 2: ML ENGINES & CONGESTION MATH (1:00 - 2:00)
**Role:** ML Engineer / Data Scientist  
**Focus:** Briefly mention Round 1 LightGBM, then focus heavily on DBSCAN Clustering, ExtraTrees Forecasting, and PCU Congestion formulas.

| Time | Screen Action (क्या दिखाना है) | Speaking Script (क्या बोलना है) |
| :--- | :--- | :--- |
| **1:00 - 1:20** | Click on **Parking Intelligence** tab. Show the coordinate hotspot map. | *"Our predictive engine runs on a dual-model pipeline. While Round 1 used LightGBM for demand spikes, for Round 2, we implement **DBSCAN Density Clustering** ($eps=110\text{m}$, $min\_samples=3$). This groups 298,450 raw coordinates into localized parking hotspots, filtering out background noise."* |
| **1:20 - 1:40** | Scroll down to the **Growth Forecast** charts. Point to the forecasted violation counts. | *"To make this proactive, we deploy an **ExtraTrees Regressor**. It uses rolling lag sequences to forecast violation growth rates per hotspot over a 7-day horizon, showing dispatchers exactly which zones are expanding. We also run **SHAP value explainability** to show drivers of congestion."* |
| **1:40 - 2:00** | Click on **Congestion Impact** tab. Hover over the vehicle distribution breakdown (Bikes vs. Cars vs. Trucks) and blockage percentages. | *"To quantify the impact, we developed a Passenger Car Unit (PCU) blockage formula. A bike counts as 0.5 PCU, a car as 1.0, and a truck as 3.0. Combined with road width ratios, it calculates the percentage of capacity blocked, outputting a dynamic **Congestion Score (0-100)** to rank hotspots."* |

---

## 🎙️ SPEAKER 3: SIMULATION, SECURE AI COPILOT & DEPLOYMENT (2:00 - 3:00)
**Role:** Full-Stack / Systems Engineer  
**Focus:** Smart Enforcement Simulator, Offline Ollama RAG Copilot, and Docker Deployment.

| Time | Screen Action (क्या दिखाना है) | Speaking Script (क्या बोलना है) |
| :--- | :--- | :--- |
| **2:00 - 2:20** | Click on **Enforcement Strategy** tab. Drag the **Additional Officers Slider** back and forth, showing the violation reduction percentage updating live. Click **Export Recommendations (CSV)**. | *"In the **Smart Enforcement Studio**, dispatchers can simulate officer dispatches. A logarithmic model estimates expected capacity clearance as officers are allocated. Operators can download these optimized schedules instantly with our new CSV strategic exporter."* |
| **2:20 - 2:40** | Click the floating **AI Parking Copilot** chat bubble in the bottom right corner. Type: `Which area needs action right now?` and show the local Ollama LLM rendering the formatted markdown response. | *"For offline decision support, we integrated a local **Ollama RAG Copilot** running Llama 3.2 1B. Because traffic operations require strict data privacy, the Copilot runs 100% offline, automatically compiling database summaries to answer dispatcher queries in natural language."* |
| **2:40 - 3:00** | Open the code editor showing `docker-compose.yml` or the terminal. Conclude with Slide 10 or team face. | *"The entire TrafficAI platform (Next.js, FastAPI, and indexed MongoDB) is fully containerized and deploys with a single `docker-compose up --build` command. TrafficAI is secure, portable, and ready to optimize city roads. Thank you!"* |
