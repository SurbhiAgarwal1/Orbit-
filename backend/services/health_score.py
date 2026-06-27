def calculate_city_health_score(
    open_critical: int,
    open_high: int,
    open_medium: int,
    open_low: int,
    resolved_today: int
) -> int:
    """
    Computes realistic composite city health score based on critical ratio and resolution momentum.
    Clamped to range [50, 98] for realistic municipal metrics.
    """
    total_open = open_critical + open_high + open_medium + open_low
    if total_open == 0:
        return 92

    # Weight critical hazards heavily vs general issues
    critical_impact = (open_critical * 2.5) + (open_high * 1.2) + (open_medium * 0.4) + (open_low * 0.1)
    base_score = 88 - (critical_impact / max(1, total_open / 10))
    momentum_bonus = min(12, resolved_today * 0.8)
    
    final_score = int(base_score + momentum_bonus)
    return max(58, min(96, final_score))
