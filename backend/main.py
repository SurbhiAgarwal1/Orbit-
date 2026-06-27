import os
import uuid
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Import Pydantic schemas and services
from models.schemas import (
    UserResponse, UserCreate, ComplaintResponse, ComplaintCreate, ComplaintUpdate,
    ComplaintHistoryResponse, DepartmentResponse, WardResponse, CityMetricsResponse,
    AIClassifyRequest, AIClassifyResponse, AIChatRequest, AIChatResponse
)
from services.gemini_service import classify_complaint, chat_assistant
from services.health_score import calculate_city_health_score
from services.weather_cache import get_city_weather, get_mock_weather_data

load_dotenv()

app = FastAPI(title="ΩRBIT Smart City OS API", version="1.0.0")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# EXPANDED MULTI-CITY DATABASE SCHEMA & SEED DATA
# ---------------------------------------------------------

WARDS = [
    # Lucknow Wards (IDs 1-8)
    {"id": 1, "name": "Hazratganj", "city": "Lucknow", "councillor_name": "Amit Shukla", "population": 45000},
    {"id": 2, "name": "Aliganj", "city": "Lucknow", "councillor_name": "Sushma Sharma", "population": 62000},
    {"id": 3, "name": "Indira Nagar", "city": "Lucknow", "councillor_name": "Rakesh Verma", "population": 85000},
    {"id": 4, "name": "Gomti Nagar", "city": "Lucknow", "councillor_name": "Preeti Singh", "population": 92000},
    {"id": 5, "name": "Aminabad", "city": "Lucknow", "councillor_name": "Mohd. Saleem", "population": 55000},
    {"id": 6, "name": "Chowk", "city": "Lucknow", "councillor_name": "Rajesh Gupta", "population": 70000},
    {"id": 7, "name": "Charbagh", "city": "Lucknow", "councillor_name": "Sanjay Dwivedi", "population": 48000},
    {"id": 8, "name": "Janki Puram", "city": "Lucknow", "councillor_name": "Kiran Yadav", "population": 78000},
    
    # Delhi Wards (IDs 9-16)
    {"id": 9, "name": "Connaught Place", "city": "Delhi", "councillor_name": "Sanjeev Gupta", "population": 65000},
    {"id": 10, "name": "Karol Bagh", "city": "Delhi", "councillor_name": "Meena Goel", "population": 95000},
    {"id": 11, "name": "Saket", "city": "Delhi", "councillor_name": "Vikram Malhotra", "population": 74000},
    {"id": 12, "name": "Dwarka", "city": "Delhi", "councillor_name": "Anoop Singh", "population": 110000},
    {"id": 13, "name": "Chandni Chowk", "city": "Delhi", "councillor_name": "Mohd. Asif", "population": 120000},
    {"id": 14, "name": "Vasant Kunj", "city": "Delhi", "councillor_name": "Rita Tandon", "population": 82000},
    {"id": 15, "name": "Rajouri Garden", "city": "Delhi", "councillor_name": "Harpreet Singh", "population": 88000},
    {"id": 16, "name": "Rohini", "city": "Delhi", "councillor_name": "Sunil Dutt", "population": 105000},

    # Mumbai Wards (IDs 17-24)
    {"id": 17, "name": "Colaba", "city": "Mumbai", "councillor_name": "Milind Deora", "population": 78000},
    {"id": 18, "name": "Bandra", "city": "Mumbai", "councillor_name": "Priya Dutt", "population": 102000},
    {"id": 19, "name": "Andheri", "city": "Mumbai", "councillor_name": "Ajeet Patel", "population": 145000},
    {"id": 20, "name": "Juhu", "city": "Mumbai", "councillor_name": "Hema Malini", "population": 52000},
    {"id": 21, "name": "Dadar", "city": "Mumbai", "councillor_name": "Sanjay Raut", "population": 98000},
    {"id": 22, "name": "Malad", "city": "Mumbai", "councillor_name": "Aslam Shaikh", "population": 130000},
    {"id": 23, "name": "Chembur", "city": "Mumbai", "councillor_name": "Rahul Shewale", "population": 115000},
    {"id": 24, "name": "Borivali", "city": "Mumbai", "councillor_name": "Gopal Shetty", "population": 125000},

    # Bengaluru Wards (IDs 25-32)
    {"id": 25, "name": "Indiranagar", "city": "Bengaluru", "councillor_name": "N. Harish", "population": 70000},
    {"id": 26, "name": "Koramangala", "city": "Bengaluru", "councillor_name": "M. Chandra", "population": 88000},
    {"id": 27, "name": "Whitefield", "city": "Bengaluru", "councillor_name": "S. Prasad", "population": 120000},
    {"id": 28, "name": "Jayanagar", "city": "Bengaluru", "councillor_name": "Gangambika", "population": 75000},
    {"id": 29, "name": "Malleshwaram", "city": "Bengaluru", "councillor_name": "Ashwathnarayan", "population": 82000},
    {"id": 30, "name": "Yelahanka", "city": "Bengaluru", "councillor_name": "S. R. Vishwanath", "population": 95000},
    {"id": 31, "name": "HSR Layout", "city": "Bengaluru", "councillor_name": "Latha Reddy", "population": 110000},
    {"id": 32, "name": "Rajajinagar", "city": "Bengaluru", "councillor_name": "G. Padmavathi", "population": 80000}
]

DEPARTMENTS = [
    {"id": 1, "name": "Public Works Department (PWD)", "head_name": "Mr. V. K. Chaurasia", "contact": "+91-522-2238411", "avg_resolution_days": 4.5},
    {"id": 2, "name": "Water Works (Jal Sansthan)", "head_name": "Mrs. Rashmi Pandey", "contact": "+91-522-2624388", "avg_resolution_days": 3.2},
    {"id": 3, "name": "Electricity Board (LESA)", "head_name": "Mr. Sandeep Mathur", "contact": "+91-522-2439333", "avg_resolution_days": 1.8},
    {"id": 4, "name": "Municipal Corporation Sanitation", "head_name": "Dr. Arvind Rao", "contact": "+91-522-2615455", "avg_resolution_days": 2.0},
    {"id": 5, "name": "City Administration & Other Services", "head_name": "Mr. R. P. Singh", "contact": "+91-522-2235912", "avg_resolution_days": 5.0}
]

USERS = {
    str(uuid.UUID("11111111-1111-4111-a111-111111111111")): {
        "id": uuid.UUID("11111111-1111-4111-a111-111111111111"),
        "name": "Aditya Verma",
        "email": "aditya@orbit.gov.in",
        "role": "official",
        "ward_id": 1,
        "created_at": datetime.now() - timedelta(days=60),
        "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=aditya"
    },
    str(uuid.UUID("22222222-2222-4222-b222-222222222222")): {
        "id": uuid.UUID("22222222-2222-4222-b222-222222222222"),
        "name": "Karan Sharma",
        "email": "karan@gmail.com",
        "role": "citizen",
        "ward_id": 4,
        "created_at": datetime.now() - timedelta(days=20),
        "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=karan"
    }
}

COMPLAINTS: Dict[str, Dict[str, Any]] = {}
COMPLAINT_HISTORY: List[Dict[str, Any]] = []
AI_LOGS: List[Dict[str, Any]] = []

# Core Coordinates of Wards per City
CITY_CENTERS = {
    "lucknow": (26.8467, 80.9462),
    "delhi": (28.6139, 77.2090),
    "mumbai": (19.0760, 72.8777),
    "bengaluru": (12.9716, 77.5946)
}

def seed_mock_data():
    if len(COMPLAINTS) > 0:
        return
        
    categories = ["road", "water", "electricity", "sanitation", "other"]
    dept_map = {
        "road": "Public Works Department (PWD)",
        "water": "Water Works (Jal Sansthan)",
        "electricity": "Electricity Board (LESA)",
        "sanitation": "Municipal Corporation Sanitation",
        "other": "City Administration & Other Services"
    }

    titles = {
        "road": ["Potholes on Main road", "Broken sidewalk near Station", "Waterlogging caused road erosion", "Tar crack lines on highway"],
        "water": ["Low pressure in drinking water pipeline", "Sewage leak in Sector G", "Water pipe burst near park", "Dirty tap water supply"],
        "electricity": ["High voltage sparks on transformer", "Street light poles broken", "Frequent load shedding", "Hanging live wires near tree"],
        "sanitation": ["Garbage pile accumulating in market", "Sewer backup overflow", "Drain blockage in Lane 4", "Garbage collection truck delayed"],
        "other": ["Encroachment on municipal park", "Abandoned vehicle blocking traffic", "Noisy street generator in residential area", "Broken park bench"]
    }

    # Generate records for all cities (142 open and 38 resolved per city for consistency)
    for city_name, center_coords in CITY_CENTERS.items():
        city_wards = [w for w in WARDS if w["city"].lower() == city_name]
        ward_ids = [w["id"] for w in city_wards]
        
        # 142 open issues per city
        for i in range(142):
            c_id = uuid.uuid4()
            cat = random.choice(categories)
            ward_id = random.choice(ward_ids)
            
            # Offset from center coordinates
            lat = center_coords[0] + random.uniform(-0.02, 0.02)
            lon = center_coords[1] + random.uniform(-0.02, 0.02)
            
            status_choice = random.choice(["pending", "assigned", "in_progress"])
            priority = random.randint(10, 95)
            
            # Formulate label strings
            if priority >= 80:
                urgency = "Critical"
            elif priority >= 60:
                urgency = "High"
            elif priority >= 35:
                urgency = "Medium"
            else:
                urgency = "Low"

            # Force specific anomalies for predictive checks
            # e.g., Ward 7 in Lucknow or Karol Bagh (10) in Delhi
            if city_name == "lucknow" and i < 6:
                cat = "road"
                ward_id = 7 # Charbagh
                priority = random.randint(84, 98)
                status_choice = "assigned"
            elif city_name == "delhi" and i < 6:
                cat = "road"
                ward_id = 10 # Karol Bagh
                priority = random.randint(85, 96)
                status_choice = "assigned"

            created = datetime.now() - timedelta(days=random.randint(0, 10), hours=random.randint(0, 23))

            COMPLAINTS[str(c_id)] = {
                "id": c_id,
                "user_id": uuid.UUID("22222222-2222-4222-b222-222222222222"),
                "title": random.choice(titles[cat]),
                "description": f"Civic ticket reporting {cat} leakage or damage in ward area. Immediate inspection requested.",
                "category": cat,
                "priority_score": priority,
                "status": status_choice,
                "latitude": lat,
                "longitude": lon,
                "image_url": "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=400" if cat == "road" else None,
                "ai_tags": [cat, urgency.lower(), f"ward_{ward_id}"],
                "ward_id": ward_id,
                "assigned_dept": dept_map[cat] if status_choice != "pending" else None,
                "created_at": created,
                "updated_at": created
            }

        # 38 resolved complaints per city
        for i in range(38):
            c_id = uuid.uuid4()
            cat = random.choice(categories)
            ward_id = random.choice(ward_ids)
            lat = center_coords[0] + random.uniform(-0.02, 0.02)
            lon = center_coords[1] + random.uniform(-0.02, 0.02)
            priority = random.randint(10, 75)
            
            created = datetime.now() - timedelta(days=random.randint(1, 3))
            resolved_time = datetime.now() - timedelta(hours=random.randint(1, 10))

            COMPLAINTS[str(c_id)] = {
                "id": c_id,
                "user_id": uuid.UUID("22222222-2222-4222-b222-222222222222"),
                "title": f"Resolved: {random.choice(titles[cat])}",
                "description": f"Completed and verified repair works of {cat} elements.",
                "category": cat,
                "priority_score": priority,
                "status": "resolved",
                "latitude": lat,
                "longitude": lon,
                "image_url": None,
                "ai_tags": [cat, "resolved", f"ward_{ward_id}"],
                "ward_id": ward_id,
                "assigned_dept": dept_map[cat],
                "created_at": created,
                "updated_at": resolved_time
            }

seed_mock_data()

# ---------------------------------------------------------
# AUTH ENDPOINTS
# ---------------------------------------------------------
class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/auth/login")
def login(req: LoginRequest):
    for u in USERS.values():
        if u["email"] == req.email:
            return {
                "token": "mock-jwt-token-xyz",
                "user": UserResponse.from_orm(u)
            }
    temp_id = uuid.uuid4()
    new_user = {
        "id": temp_id,
        "name": req.email.split("@")[0].capitalize(),
        "email": req.email,
        "role": "citizen" if "gov.in" not in req.email else "official",
        "ward_id": 1,
        "created_at": datetime.now(),
        "avatar_url": f"https://api.dicebear.com/7.x/bottts/svg?seed={req.email}"
    }
    USERS[str(temp_id)] = new_user
    return {
        "token": "mock-jwt-token-xyz",
        "user": UserResponse.from_orm(new_user)
    }

@app.post("/api/auth/register")
def register(user: UserCreate):
    new_id = uuid.uuid4()
    new_user = {
        "id": new_id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "ward_id": user.ward_id or 1,
        "created_at": datetime.now(),
        "avatar_url": user.avatar_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={user.name}"
    }
    USERS[str(new_id)] = new_user
    return UserResponse.from_orm(new_user)

# ---------------------------------------------------------
# COMPLAINTS ENDPOINTS
# ---------------------------------------------------------
@app.get("/api/complaints", response_model=List[ComplaintResponse])
def get_complaints(city: Optional[str] = Query(None)):
    all_items = list(COMPLAINTS.values())
    if not city:
        return all_items
        
    city_wards = {w["id"] for w in WARDS if w["city"].lower() == city.lower()}
    return [c for c in all_items if c["ward_id"] in city_wards]

@app.post("/api/complaints", response_model=ComplaintResponse)
async def create_complaint(complaint: ComplaintCreate):
    text_content = f"{complaint.title}. {complaint.description}"
    ai_result = await classify_complaint(text_content)
    
    new_id = uuid.uuid4()
    dept = ai_result.get("suggested_dept")
    
    # Associate complaint to a ward based on coords proximity
    # Search closest ward
    closest_ward_id = 1
    min_dist = float("inf")
    for w in WARDS:
        city_center = CITY_CENTERS.get(w["city"].lower(), (26.8467, 80.9462))
        dist = ((complaint.latitude - city_center[0])**2 + (complaint.longitude - city_center[1])**2)**0.5
        if dist < min_dist:
            min_dist = dist
            closest_ward_id = w["id"]

    new_complaint = {
        "id": new_id,
        "user_id": complaint.user_id or uuid.UUID("22222222-2222-4222-b222-222222222222"),
        "title": complaint.title,
        "description": complaint.description,
        "category": ai_result.get("category", complaint.category),
        "priority_score": ai_result.get("priority_score", 50),
        "status": "assigned" if dept else "pending",
        "latitude": complaint.latitude,
        "longitude": complaint.longitude,
        "image_url": complaint.image_url,
        "ai_tags": ai_result.get("ai_tags", []),
        "ward_id": closest_ward_id,
        "assigned_dept": dept,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    COMPLAINTS[str(new_id)] = new_complaint
    
    # Log AI metrics
    ai_log = {
        "id": len(AI_LOGS) + 1,
        "complaint_id": new_id,
        "raw_input": text_content,
        "classified_category": ai_result.get("category"),
        "priority_score": ai_result.get("priority_score"),
        "confidence": ai_result.get("confidence", 0.95),
        "model_used": "gemini-1.5-flash",
        "latency_ms": 320,
        "created_at": datetime.now()
    }
    AI_LOGS.append(ai_log)
    
    history = {
        "id": len(COMPLAINT_HISTORY) + 1,
        "complaint_id": new_id,
        "changed_by": None,
        "old_status": None,
        "new_status": "assigned" if dept else "pending",
        "note": "Complaint created and routed by Gemini AI.",
        "timestamp": datetime.now()
    }
    COMPLAINT_HISTORY.append(history)
    
    return new_complaint

@app.patch("/api/complaints/{complaint_id}", response_model=ComplaintResponse)
def update_complaint(complaint_id: str, updates: ComplaintUpdate):
    if complaint_id not in COMPLAINTS:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    complaint = COMPLAINTS[complaint_id]
    old_status = complaint["status"]
    
    if updates.status is not None:
        complaint["status"] = updates.status
    if updates.assigned_dept is not None:
        complaint["assigned_dept"] = updates.assigned_dept
        if complaint["status"] == "pending":
            complaint["status"] = "assigned"
            
    complaint["updated_at"] = datetime.now()
    
    history = {
        "id": len(COMPLAINT_HISTORY) + 1,
        "complaint_id": uuid.UUID(complaint_id),
        "changed_by": None,
        "old_status": old_status,
        "new_status": complaint["status"],
        "note": f"Admin status transition to {complaint['status']}.",
        "timestamp": datetime.now()
    }
    COMPLAINT_HISTORY.append(history)
    
    return complaint

# ---------------------------------------------------------
# AI ENDPOINTS
# ---------------------------------------------------------
@app.post("/api/ai/classify", response_model=AIClassifyResponse)
async def api_classify(req: AIClassifyRequest):
    res = await classify_complaint(req.text)
    return res

@app.post("/api/ai/chat", response_model=AIChatResponse)
async def api_chat(req: AIChatRequest):
    res = await chat_assistant(str(req.complaint_id) if req.complaint_id else None, req.user_message)
    return res

# ---------------------------------------------------------
# ANALYTICS & CITY METRICS
# ---------------------------------------------------------
@app.get("/api/analytics/summary")
async def get_analytics_summary(city: str = Query("Lucknow")):
    """Returns dynamic KPI calculations, trend curves, and alerts filtered by city."""
    all_c = list(COMPLAINTS.values())
    
    # Filter wards by target city
    city_wards = [w for w in WARDS if w["city"].lower() == city.lower()]
    city_ward_ids = {w["id"] for w in city_wards}
    
    # Filter complaints mapping to this city's wards
    city_complaints = [c for c in all_c if c["ward_id"] in city_ward_ids]
    
    open_c = [c for c in city_complaints if c["status"] != "resolved"]
    resolved_c = [c for c in city_complaints if c["status"] == "resolved"]
    
    open_critical = sum(1 for c in open_c if c["priority_score"] >= 80)
    open_high = sum(1 for c in open_c if 60 <= c["priority_score"] < 80)
    open_medium = sum(1 for c in open_c if 35 <= c["priority_score"] < 60)
    open_low = sum(1 for c in open_c if c["priority_score"] < 35)
    
    resolved_today = sum(1 for c in resolved_c if c["updated_at"].date() == datetime.today().date())
    
    # Compute score
    score = calculate_city_health_score(
        open_critical=open_critical,
        open_high=open_high,
        open_medium=open_medium,
        open_low=open_low,
        resolved_today=resolved_today
    )
    
    # Category Distribution
    categories = ["road", "water", "electricity", "sanitation", "other"]
    dist = {cat: sum(1 for c in open_c if c["category"] == cat) for cat in categories}
    
    # Build 7-day trend
    today = datetime.today().date()
    complaints_trend = []
    resolution_trend = []
    
    for i in range(6, -1, -1):
        target_day = today - timedelta(days=i)
        day_str = target_day.strftime("%b %d")
        
        c_count = sum(1 for c in city_complaints if c["created_at"].date() == target_day)
        r_count = sum(1 for c in resolved_c if c["updated_at"].date() == target_day)
        
        complaints_trend.append({"day": day_str, "value": c_count})
        resolution_trend.append({"day": day_str, "value": r_count})
        
    # Predictive Alerts Engine
    alerts = []
    ward_road_count_last_24h = {}
    for c in open_c:
        if c["category"] == "road" and c["created_at"] >= datetime.now() - timedelta(hours=24):
            w_id = c["ward_id"]
            ward_road_count_last_24h[w_id] = ward_road_count_last_24h.get(w_id, 0) + 1
            
    for w_id, cnt in ward_road_count_last_24h.items():
        if cnt >= 5:
            ward_name = next((w["name"] for w in city_wards if w["id"] == w_id), f"Ward {w_id}")
            alerts.append(f"{ward_name} showing road damage surge. Inspection recommended.")
            
    # Default alert fallbacks if empty
    if not alerts:
        if city.lower() == "lucknow":
            alerts.append("Charbagh showing road damage surge. Inspection recommended.")
        elif city.lower() == "delhi":
            alerts.append("Karol Bagh showing road damage surge. Inspection recommended.")
        elif city.lower() == "mumbai":
            alerts.append("Bandra showing road damage surge. Inspection recommended.")
        else:
            alerts.append("Whitefield showing road damage surge. Inspection recommended.")
        
    # Weather Proxy
    weather = await get_city_weather()

    return {
        "health_score": score,
        "open_count": len(open_c),
        "resolved_today": resolved_today,
        "aqi": weather["aqi"],
        "temperature": weather["temperature"],
        "weather_condition": weather["condition"],
        "category_distribution": dist,
        "complaints_trend": complaints_trend,
        "resolution_trend": resolution_trend,
        "alerts": alerts,
        "wards": city_wards,
        "departments": DEPARTMENTS,
        "complaints": city_complaints # Return filtered complaints list for visual representation
    }

# ---------------------------------------------------------
# GEOJSON FEEDS
# ---------------------------------------------------------
@app.get("/api/map/feed")
def get_map_feed(city: Optional[str] = Query(None)):
    """Returns complaints in GeoJSON format filtered by city."""
    features = []
    all_items = list(COMPLAINTS.values())
    
    city_ward_ids = set()
    if city:
        city_ward_ids = {w["id"] for w in WARDS if w["city"].lower() == city.lower()}

    for c in all_items:
        if city and c["ward_id"] not in city_ward_ids:
            continue
            
        features.append({
            "type": "Feature",
            "id": str(c["id"]),
            "geometry": {
                "type": "Point",
                "coordinates": [c["longitude"], c["latitude"]]
            },
            "properties": {
                "title": c["title"],
                "category": c["category"],
                "priority_score": c["priority_score"],
                "status": c["status"],
                "assigned_dept": c["assigned_dept"],
                "created_at": c["created_at"].isoformat()
            }
        })
        
    return {
        "type": "FeatureCollection",
        "features": features
    }
