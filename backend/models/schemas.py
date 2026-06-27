from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from datetime import datetime
from uuid import UUID

# User schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "citizen"
    ward_id: Optional[int] = None
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Complaint schemas
class ComplaintBase(BaseModel):
    title: str
    description: str
    category: str
    latitude: float
    longitude: float
    image_url: Optional[str] = None
    ward_id: Optional[int] = None

class ComplaintCreate(ComplaintBase):
    user_id: Optional[UUID] = None

class ComplaintUpdate(BaseModel):
    status: Optional[str] = None
    assigned_dept: Optional[str] = None
    priority_score: Optional[int] = None

class ComplaintResponse(ComplaintBase):
    id: UUID
    user_id: Optional[UUID] = None
    priority_score: int
    status: str
    ai_tags: Optional[List[str]] = []
    assigned_dept: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Complaint History schema
class ComplaintHistoryResponse(BaseModel):
    id: int
    complaint_id: UUID
    changed_by: Optional[UUID] = None
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    note: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

# Department schemas
class DepartmentResponse(BaseModel):
    id: int
    name: str
    head_name: Optional[str] = None
    contact: Optional[str] = None
    avg_resolution_days: float

    class Config:
        from_attributes = True

# Ward schemas
class WardResponse(BaseModel):
    id: int
    name: str
    city: str
    councillor_name: Optional[str] = None
    population: int

    class Config:
        from_attributes = True

# City Metrics schemas
class CityMetricsResponse(BaseModel):
    id: int
    ward_id: Optional[int] = None
    date: Any
    health_score: int
    open_complaints: int
    resolved_today: int
    avg_priority: float
    aqi: int
    temperature: float
    recorded_at: datetime

    class Config:
        from_attributes = True

# AI Service schemas
class AIClassifyRequest(BaseModel):
    text: str

class AIClassifyResponse(BaseModel):
    category: str
    priority_score: int
    urgency_label: str
    suggested_dept: str
    ai_tags: List[str]
    confidence: float

class AIChatRequest(BaseModel):
    complaint_id: Optional[UUID] = None
    user_message: str

class AIChatResponse(BaseModel):
    reply: str
