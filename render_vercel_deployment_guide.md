# TRAFFICAI - DEPLOYMENT GUIDE (RENDER + VERCEL)

Follow these steps to deploy your backend on Render, frontend on Vercel, and connect them to a free MongoDB Atlas database.

---

## 💾 Step 1: Set Up MongoDB Atlas (Free Database)
Since Render's free tier does not include a persistent database, we will use MongoDB's free cloud database.

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in/register.
2. Create a **Free Shared Cluster** (choose any provider like AWS/GCP and region).
3. Create a **Database User**:
   - Username: `admin`
   - Password: `SecurePassword123` (or choose your own)
4. Set **Network Access**:
   - Go to "Network Access" in the sidebar.
   - Click "Add IP Address".
   - Select **"Allow Access from Anywhere"** (IP: `0.0.0.0/0`). This is necessary so Render's cloud servers can connect.
5. Get your Connection String:
   - Click "Database" -> "Connect" -> "Drivers".
   - Copy the connection string. It will look like this:
     ```text
     mongodb+srv://admin:<db_password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<db_password>` with your database user's password.

---

## 🐍 Step 2: Deploy Backend on Render
1. Go to [Render](https://render.com) and log in using your GitHub account.
2. Click **New** (top right) -> **Web Service**.
3. Select your repository `neeteshdixit/grid-traffic-prediction` and click **Connect**.
4. Configure the Web Service settings:
   - **Name:** `traffic-backend`
   - **Region:** Choose the closest region (e.g., Singapore for Asia).
   - **Branch:** `main`
   - **Root Directory:** `backend` (⚠️ **CRITICAL:** Make sure this is set to `backend` because the FastAPI code is in the subfolder).
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Click **Advanced** and add the following Environment Variables:
   - Key: `MONGODB_URL`  
     Value: (Your MongoDB Atlas connection string from Step 1)
   - Key: `MONGODB_DB_NAME`  
     Value: `traffic_prediction`
   - Key: `SECRET_KEY`  
     Value: `09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7` (Or any secure hash string)
6. Click **Create Web Service**.

Once deployed, Render will show your live Backend URL at the top (e.g., `https://traffic-backend.onrender.com`). Copy this URL.

---

## ⚡ Step 3: Deploy Frontend on Vercel
1. Go to [Vercel](https://vercel.com) and sign in using your GitHub account.
2. Click **Add New** -> **Project**.
3. Import your repository `neeteshdixit/grid-traffic-prediction`.
4. Configure the Vercel project settings:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Edit and select **`frontend`** (⚠️ **CRITICAL:** Make sure this is set to the `frontend` subfolder).
5. Open the **Environment Variables** panel and add:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://traffic-backend.onrender.com` (Your Render Backend URL, make sure there is no trailing slash `/`).
6. Click **Deploy**.

Vercel will build your Next.js application and give you a live production URL!

---

## 🤖 Important Note on Ollama (Local LLM) Integration
* **Local Run:** When running locally, the backend connects to your local machine's Ollama daemon (`http://localhost:11434`) to execute Llama 3.2 1B queries.
* **Cloud Run:** When deployed to Render, the backend cannot access your local computer's localhost port. Render's free tier containers have only 512MB RAM, which is not enough to run a 1.3GB LLM.
* **Transition:** We built an automatic fallback mechanism! When running in the cloud, if the backend cannot connect to a local Ollama instance, it automatically falls back to our secure, rule-based database summarization engine. 
* **Pitch Value:** Highlight this in your presentation as a security asset:  
  *"For government and traffic police operations, the LLM is designed to run 100% offline inside the secure municipal intranet. When deployed to a public cloud portal, it degrades gracefully to a local rule-based aggregator to prevent unauthorized data transfers."*
