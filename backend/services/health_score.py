def calculate_city_health_score(
    open_critical: int,
    open_high: int,
    open_medium: int,
    open_low: int,
    resolved_today: int
) -> int:
    """
    Computes composite city health score:
    score = 100 - (open_critical * 15) - (open_high * 8) - (open_medium * 3) - (open_low * 1) + (resolved_today * 5)
    Clamped to range [0, 100].
    """
    penalty = (open_critical * 15) + (open_high * 8) + (open_medium * 3) + (open_low * 1)
    bonus = resolved_today * 5
    score = 100 - penalty + bonus
    
    # Clamp to [0, 100]
    return max(0, min(100, score))
