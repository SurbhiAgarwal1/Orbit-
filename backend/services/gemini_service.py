import os
import json
import time
from typing import Dict, Any, List
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Initialize Gemini if key is available
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
model = None
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        # Using gemini-1.5-flash as it is fast and supports JSON output
        model = genai.GenerativeModel("gemini-1.5-flash")
    except Exception as e:
        print(f"Error configuring Gemini: {e}")

def classify_complaint_offline(text: str) -> Dict[str, Any]:
    """Fallback classifier using heuristic keywords to simulate Gemini for demo stability."""
    text_lower = text.lower()
    
    # Heuristics for category detection
    category = "other"
    suggested_dept = "City Administration & Other Services"
    priority_score = 40
    urgency_label = "Medium"
    ai_tags = ["civic_issue"]
    
    if any(k in text_lower for k in ["road", "pothole", "gaddha", "accident", "street", "highway", "path", "tar"]):
        category = "road"
        suggested_dept = "Public Works Department (PWD)"
        if "accident" in text_lower or "major" in text_lower or "severe" in text_lower or "bada" in text_lower:
            priority_score = 85
            urgency_label = "Critical"
            ai_tags = ["pothole_surge", "safety_hazard", "pwd_urgent"]
        else:
            priority_score = 55
            urgency_label = "Medium"
            ai_tags = ["road_maintenance", "pothole"]
            
    elif any(k in text_lower for k in ["water", "paani", "drain", "leak", "sewer", "gutter", "overflow", "drinking"]):
        category = "water"
        suggested_dept = "Water Works (Jal Sansthan)"
        if "flood" in text_lower or "sewage leak" in text_lower or "ganda paani" in text_lower:
            priority_score = 80
            urgency_label = "High"
            ai_tags = ["water_contamination", "public_health"]
        else:
            priority_score = 45
            urgency_label = "Medium"
            ai_tags = ["water_leakage", "pipeline"]
            
    elif any(k in text_lower for k in ["electricity", "power", "bijli", "voltage", "blackout", "wire", "current", "pole", "transformer"]):
        category = "electricity"
        suggested_dept = "Electricity Board (LESA)"
        if "live wire" in text_lower or "spark" in text_lower or "current" in text_lower or "transformer blast" in text_lower:
            priority_score = 92
            urgency_label = "Critical"
            ai_tags = ["electrical_hazard", "fire_risk", "lesa_urgent"]
        else:
            priority_score = 60
            urgency_label = "High"
            ai_tags = ["power_outage", "voltage_fluctuation"]
            
    elif any(k in text_lower for k in ["garbage", "kachra", "garbage dump", "waste", "smell", "sanitation", "clean", "sweeper"]):
        category = "sanitation"
        suggested_dept = "Municipal Corporation Sanitation"
        if "epidemic" in text_lower or "medical waste" in text_lower or "rotten" in text_lower:
            priority_score = 75
            urgency_label = "High"
            ai_tags = ["waste_accumulation", "hygiene_issue"]
        else:
            priority_score = 35
            urgency_label = "Low"
            ai_tags = ["garbage_cleanup", "sanitation"]

    # Add general fallback priority checks
    if priority_score < 80 and any(k in text_lower for k in ["urgent", "jaldi", "accident", "danger", "khatra"]):
        priority_score += 15
        urgency_label = "High" if priority_score < 85 else "Critical"

    return {
        "category": category,
        "priority_score": int(priority_score),
        "urgency_label": urgency_label,
        "suggested_dept": suggested_dept,
        "ai_tags": ai_tags,
        "confidence": 0.95
    }

async def classify_complaint(text: str) -> Dict[str, Any]:
    """Classifies a civic complaint using Gemini or falls back to heuristic matching."""
    if not model:
        # Simulate slight network latency to match "AI is analyzing..." experience
        time.sleep(1.0)
        return classify_complaint_offline(text)
        
    prompt = f"""You are a civic complaint classifier for an Indian smart city.
Given this complaint: '{text}'
Return JSON with the following schema:
{{
  "category": "road" | "water" | "electricity" | "sanitation" | "other",
  "priority_score": int,      // 0-100 based on safety risk + number of people affected + urgency
  "urgency_label": "Critical" | "High" | "Medium" | "Low",
  "suggested_dept": "Public Works Department (PWD)" | "Water Works (Jal Sansthan)" | "Electricity Board (LESA)" | "Municipal Corporation Sanitation" | "City Administration & Other Services",
  "ai_tags": list of string (max 3),
  "confidence": float // 0.0 to 1.0
}}

Respond ONLY with valid JSON. Do not write anything outside the JSON structure."""

    try:
        response = await model.generate_content_async(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text.strip())
    except Exception as e:
        print(f"Gemini API Exception, falling back: {e}")
        return classify_complaint_offline(text)

async def chat_assistant(complaint_id: str, user_message: str) -> Dict[str, Any]:
    """Converses with a citizen or admin using mixed Hindi + English (Hinglish) friendly tone."""
    if not model:
        # Preloaded responses for standard query topics in Hinglish
        msg_lower = user_message.lower()
        reply = "Namaste! Main ΩRBIT city assistant hoon. Main aapki kaise madad kar sakta hoon?"
        
        if any(k in msg_lower for k in ["worst ward", "poor ward", "kharab", "worst"]):
            reply = "Is hafte Ward 3 (Indira Nagar) aur Ward 7 (Charbagh) me sabse zyada complaints reporting hui hai. Road maintenance aur garbage piles yahan major issues hain. We recommend sending inspection teams there immediately."
        elif any(k in msg_lower for k in ["aqi", "hawa", "pollution", "air"]):
            reply = "Lucknow ka average AQI abhi 156 hai, jo ki 'Unhealthy for Sensitive Groups' category me aata hai. Aliganj aur Gomti Nagar areas me AQI readings higher side pe hain."
        elif any(k in msg_lower for k in ["score", "health", "health score"]):
            reply = "Abhi hamara city health score 73/100 hai. Kuch critical road problems resolve hone ke baad isme improvement aane ki umeed hai. Aasha hai ki hum jald hi 80 cross karenge!"
        elif any(k in msg_lower for k in ["road", "gaddha", "pothole"]):
            reply = "Road complaints sabse high priority pe hain. PWD team ko direct alert bhej diya gaya hai aur major junctions pe repair works schedule ho chuke hain."
        elif complaint_id:
            reply = f"Complaint #{complaint_id} ki detail check ki hai maine. Yeh concern direct assigned department ke supervision me hai aur iska status update hote hi aapko realtime notification mil jayega. Kuch aur janna chahte hain?"
        else:
            reply = "Aapka message mil gaya hai. Gomti Nagar aur Indira Nagar wards me cleaning teams deployed hain aur current complaints ko quickly resolve kiya ja raha hai. Koi aur question?"
            
        return {"reply": reply}
        
    prompt = f"""You are ΩRBIT, a friendly, intelligent Smart City AI Assistant.
The user is asking: '{user_message}'
Current context: complaint ID context is {complaint_id or 'none'}.
Respond in a mix of Hindi and English (Hinglish), keeping a professional, supportive, and friendly tone. Max 3-4 sentences.
Do not use emojis."""

    try:
        response = await model.generate_content_async(prompt)
        return {"reply": response.text.strip()}
    except Exception as e:
        print(f"Gemini Chat Exception: {e}")
        return {"reply": "Sorry, system connectivity issues ki wajah se main abhi respond nahi kar pa raha hoon. Kripya thodi der baad try karein."}
