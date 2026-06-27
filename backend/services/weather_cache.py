import os
import time
import httpx
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
LUCKNOW_LAT = 26.8467
LUCKNOW_LON = 80.9462

# Memory cache structure
_cache: Dict[str, Any] = {
    "weather": None,
    "last_fetched": 0
}

CACHE_DURATION = 600  # 10 minutes (in seconds)

def get_mock_weather_data() -> Dict[str, Any]:
    """Generates realistic weather and AQI data for Lucknow."""
    # Let's add slight variance based on current system time
    curr_hour = time.localtime().tm_hour
    base_temp = 32.0 if (12 <= curr_hour <= 16) else 27.0
    
    return {
        "temperature": round(base_temp, 1),
        "aqi": 156,  # Standard moderate-poor AQI for demo references
        "condition": "Haze" if curr_hour > 18 or curr_hour < 7 else "Sunny",
        "humidity": 65,
        "wind_speed": 4.2
    }

async def get_city_weather() -> Dict[str, Any]:
    """Fetches weather and AQI for Lucknow from OpenWeatherMap or cache/mock."""
    now = time.time()
    
    # Return cached data if still fresh
    if _cache["weather"] and (now - _cache["last_fetched"] < CACHE_DURATION):
        return _cache["weather"]
        
    if not OPENWEATHER_API_KEY:
        mock_data = get_mock_weather_data()
        _cache["weather"] = mock_data
        _cache["last_fetched"] = now
        return mock_data
        
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Fetch Weather
            weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={LUCKNOW_LAT}&lon={LUCKNOW_LON}&units=metric&appid={OPENWEATHER_API_KEY}"
            weather_resp = await client.get(weather_url)
            
            # Fetch AQI
            aqi_url = f"https://api.openweathermap.org/data/2.5/air_pollution?lat={LUCKNOW_LAT}&lon={LUCKNOW_LON}&appid={OPENWEATHER_API_KEY}"
            aqi_resp = await client.get(aqi_url)
            
            if weather_resp.status_code == 200:
                w_data = weather_resp.json()
                temp = w_data.get("main", {}).get("temp", 28.0)
                humidity = w_data.get("main", {}).get("humidity", 60)
                wind = w_data.get("wind", {}).get("speed", 3.0)
                condition = w_data.get("weather", [{}])[0].get("main", "Clear")
                
                aqi = 156  # Fallback AQI
                if aqi_resp.status_code == 200:
                    a_data = aqi_resp.json()
                    # OpenWeather AQI is 1-5, let's map to EPA AQI range (1-50, 51-100, 101-150, 151-200, 201+)
                    aqi_level = a_data.get("list", [{}])[0].get("main", {}).get("aqi", 3)
                    mapping = {1: 45, 2: 85, 3: 135, 4: 175, 5: 250}
                    aqi = mapping.get(aqi_level, 156)
                
                result = {
                    "temperature": round(temp, 1),
                    "aqi": aqi,
                    "condition": condition,
                    "humidity": humidity,
                    "wind_speed": wind
                }
                
                _cache["weather"] = result
                _cache["last_fetched"] = now
                return result
    except Exception as e:
        print(f"Failed to fetch weather from API, using mock: {e}")
        
    # Fallback if request failed
    mock_data = get_mock_weather_data()
    _cache["weather"] = mock_data
    _cache["last_fetched"] = now
    return mock_data
