-- Database schema for ΩRBIT Smart City OS

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Wards table
CREATE TABLE IF NOT EXISTS wards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Lucknow',
    councillor_name VARCHAR(150),
    population INTEGER DEFAULT 0
);

-- Create Departments table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    head_name VARCHAR(150),
    contact VARCHAR(50),
    avg_resolution_days NUMERIC(4, 2) DEFAULT 0.00
);

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role VARCHAR(50) CHECK (role IN ('citizen', 'official', 'admin')) DEFAULT 'citizen',
    ward_id INTEGER REFERENCES wards(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    avatar_url VARCHAR(255)
);

-- Create Complaints table
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) CHECK (category IN ('road', 'water', 'electricity', 'sanitation', 'other')) NOT NULL,
    priority_score INTEGER CHECK (priority_score >= 0 AND priority_score <= 100) DEFAULT 0,
    status VARCHAR(50) CHECK (status IN ('pending', 'assigned', 'in_progress', 'resolved')) DEFAULT 'pending',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    image_url VARCHAR(500),
    ai_tags VARCHAR(100)[],
    ward_id INTEGER REFERENCES wards(id) ON DELETE SET NULL,
    assigned_dept VARCHAR(100) REFERENCES departments(name) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Complaint History table
CREATE TABLE IF NOT EXISTS complaint_history (
    id BIGSERIAL PRIMARY KEY,
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE NOT NULL,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    note TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create City Metrics table
CREATE TABLE IF NOT EXISTS city_metrics (
    id BIGSERIAL PRIMARY KEY,
    ward_id INTEGER REFERENCES wards(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100) DEFAULT 100,
    open_complaints INTEGER DEFAULT 0,
    resolved_today INTEGER DEFAULT 0,
    avg_priority NUMERIC(5, 2) DEFAULT 0.0,
    aqi INTEGER DEFAULT 0,
    temperature NUMERIC(4, 1) DEFAULT 0.0,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create AI Logs table
CREATE TABLE IF NOT EXISTS ai_logs (
    id BIGSERIAL PRIMARY KEY,
    complaint_id UUID REFERENCES complaints(id) ON DELETE SET NULL,
    raw_input TEXT NOT NULL,
    classified_category VARCHAR(50),
    priority_score INTEGER,
    confidence NUMERIC(4, 3),
    model_used VARCHAR(100),
    latency_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert Seed Data for Wards (Lucknow wards for demo context)
INSERT INTO wards (name, city, councillor_name, population) VALUES
('Hazratganj', 'Lucknow', 'Amit Shukla', 45000),
('Aliganj', 'Lucknow', 'Sushma Sharma', 62000),
('Indira Nagar', 'Lucknow', 'Rakesh Verma', 85000),
('Gomti Nagar', 'Lucknow', 'Preeti Singh', 92000),
('Aminabad', 'Lucknow', 'Mohd. Saleem', 55000),
('Chowk', 'Lucknow', 'Rajesh Gupta', 70000),
('Charbagh', 'Lucknow', 'Sanjay Dwivedi', 48000),
('Janki Puram', 'Lucknow', 'Kiran Yadav', 78000)
ON CONFLICT DO NOTHING;

-- Insert Seed Data for Departments
INSERT INTO departments (name, head_name, contact, avg_resolution_days) VALUES
('Public Works Department (PWD)', 'Mr. V. K. Chaurasia', '+91-522-2238411', 4.5),
('Water Works (Jal Sansthan)', 'Mrs. Rashmi Pandey', '+91-522-2624388', 3.2),
('Electricity Board (LESA)', 'Mr. Sandeep Mathur', '+91-522-2439333', 1.8),
('Municipal Corporation Sanitation', 'Dr. Arvind Rao', '+91-522-2615455', 2.0),
('City Administration & Other Services', 'Mr. R. P. Singh', '+91-522-2235912', 5.0)
ON CONFLICT DO NOTHING;
