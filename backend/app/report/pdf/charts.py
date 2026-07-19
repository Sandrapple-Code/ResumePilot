from reportlab.graphics.shapes import Drawing, Rect, Circle, Ellipse, Line, Wedge, String, Group
from reportlab.lib import colors

# Colors matching ResumePilot styling
COLOR_PURPLE = colors.HexColor("#5B5FEF")
COLOR_BG_GRAY = colors.HexColor("#EEF2FF")
COLOR_TEXT = colors.HexColor("#0F172A")
COLOR_MUTED = colors.HexColor("#64748B")
COLOR_EMERALD = colors.HexColor("#10B981")
COLOR_ROSE = colors.HexColor("#EF4444")
COLOR_AMBER = colors.HexColor("#F59E0B")

def draw_pilo_mascot(size=80) -> Drawing:
    """Generates a sharp vector mascot drawing matching the Next.js Pilo design."""
    d = Drawing(size, size)
    
    # Scale factor
    scale = size / 100.0
    
    # Group to handle scaling
    g = Group()
    g.scale(scale, scale)
    
    # 1. Bear Body
    g.add(Wedge(50, -10, 32, 0, 180, fillColor=colors.HexColor("#B47B52"), strokeColor=colors.HexColor("#9A6139"), strokeWidth=1.5))
    
    # 2. Ears
    # Left Ear
    g.add(Circle(28, 62, 10, fillColor=colors.HexColor("#B47B52"), strokeColor=colors.HexColor("#9A6139"), strokeWidth=1.5))
    g.add(Circle(28, 62, 6, fillColor=colors.HexColor("#FCA5A5"), strokeColor=None))
    # Right Ear
    g.add(Circle(72, 62, 10, fillColor=colors.HexColor("#B47B52"), strokeColor=colors.HexColor("#9A6139"), strokeWidth=1.5))
    g.add(Circle(72, 62, 6, fillColor=colors.HexColor("#FCA5A5"), strokeColor=None))
    
    # 3. Head
    g.add(Circle(50, 42, 26, fillColor=colors.HexColor("#D39E75"), strokeColor=colors.HexColor("#9A6139"), strokeWidth=1.5))
    
    # 4. Rosy Cheeks
    g.add(Circle(32, 36, 3.5, fillColor=colors.HexColor("#FFD5D5"), strokeColor=None))
    g.add(Circle(68, 36, 3.5, fillColor=colors.HexColor("#FFD5D5"), strokeColor=None))
    
    # 5. Snout
    g.add(Ellipse(50, 32, 10, 8, fillColor=colors.HexColor("#FFF2E7"), strokeColor=colors.HexColor("#D39E75"), strokeWidth=1.0))
    
    # 6. Nose
    # Standard circle/ellipse nose
    g.add(Circle(50, 35, 2.5, fillColor=colors.HexColor("#1E293B"), strokeColor=None))
    
    # 7. Happy Eyes
    # We draw simple curved lines or small circles
    g.add(Circle(39, 41, 2, fillColor=colors.HexColor("#1E293B"), strokeColor=None))
    g.add(Circle(61, 41, 2, fillColor=colors.HexColor("#1E293B"), strokeColor=None))
    
    # 8. Smile
    # Draw simple lines for smile
    g.add(Line(46, 31, 50, 29, strokeColor=colors.HexColor("#1E293B"), strokeWidth=1.5))
    g.add(Line(50, 29, 54, 31, strokeColor=colors.HexColor("#1E293B"), strokeWidth=1.5))
    
    # 9. Goggles Goggles
    # Strap
    g.add(Line(20, 50, 80, 50, strokeColor=colors.HexColor("#312E81"), strokeWidth=4))
    g.add(Line(20, 50, 80, 50, strokeColor=colors.HexColor("#4F46E5"), strokeWidth=1.5))
    # Left Goggle Rim & Glass
    g.add(Circle(38, 50, 9, fillColor=colors.HexColor("#FBBF24"), strokeColor=colors.HexColor("#D97706"), strokeWidth=1.5))
    g.add(Circle(38, 50, 6, fillColor=colors.HexColor("#93C5FD"), strokeColor=None))
    g.add(Line(35, 47, 41, 53, strokeColor=colors.white, strokeWidth=1.0))
    # Right Goggle Rim & Glass
    g.add(Circle(62, 50, 9, fillColor=colors.HexColor("#FBBF24"), strokeColor=colors.HexColor("#D97706"), strokeWidth=1.5))
    g.add(Circle(62, 50, 6, fillColor=colors.HexColor("#93C5FD"), strokeColor=None))
    g.add(Line(59, 47, 65, 53, strokeColor=colors.white, strokeWidth=1.0))
    # Bridge
    g.add(Rect(47, 49, 6, 2, rx=1, ry=1, fillColor=colors.HexColor("#FBBF24"), strokeColor=colors.HexColor("#D97706"), strokeWidth=1.0))
    
    d.add(g)
    return d

def create_gauge_chart(score, label="Score") -> Drawing:
    """Creates a beautiful half-donut gauge chart for display inside tables or cards."""
    width = 120
    height = 70
    d = Drawing(width, height)
    
    cx = width / 2.0
    cy = 10
    r = 50
    inner_r = 35
    
    # Background semi-circle
    d.add(Wedge(cx, cy, r, 0, 180, fillColor=COLOR_BG_GRAY, strokeColor=None))
    
    # Foreground colored wedge representing score
    angle = (score / 100.0) * 180.0
    d.add(Wedge(cx, cy, r, 180 - angle, 180, fillColor=COLOR_PURPLE, strokeColor=None))
    
    # White circle in center to make it a donut
    d.add(Circle(cx, cy, inner_r, fillColor=colors.white, strokeColor=None))
    
    # Score Text
    d.add(String(cx, cy + 18, f"{score}", fontName="Helvetica-Bold", fontSize=20, textAnchor="middle", fillColor=COLOR_TEXT))
    d.add(String(cx, cy + 4, "OF 100", fontName="Helvetica-Bold", fontSize=7, textAnchor="middle", fillColor=COLOR_MUTED))
    d.add(String(cx, cy + 48, label.upper(), fontName="Helvetica-Bold", fontSize=8, textAnchor="middle", fillColor=COLOR_TEXT))
    
    return d

def create_progress_bar(score, width=150, height=12, color="#5B5FEF") -> Drawing:
    """Generates a vector progress bar."""
    d = Drawing(width, height + 4)
    fill_color = colors.HexColor(color)
    
    # Background bar
    d.add(Rect(0, 2, width, height, rx=4, ry=4, fillColor=COLOR_BG_GRAY, strokeColor=None))
    
    # Filled bar
    filled_width = max(2, width * (score / 100.0))
    d.add(Rect(0, 2, filled_width, height, rx=4, ry=4, fillColor=fill_color, strokeColor=None))
    
    return d

def create_skills_distribution_chart(matching_count, missing_count) -> Drawing:
    """Draws a horizontal comparison bar chart for skills distribution."""
    width = 200
    height = 65
    d = Drawing(width, height)
    
    total = matching_count + missing_count
    match_pct = (matching_count / total * 100.0) if total > 0 else 50
    miss_pct = (missing_count / total * 100.0) if total > 0 else 50
    
    y_match = 38
    y_miss = 12
    bar_w = 110
    
    # Labels
    d.add(String(5, y_match + 2, "Matching", fontName="Helvetica-Bold", fontSize=9, fillColor=COLOR_TEXT))
    d.add(String(5, y_miss + 2, "Gaps", fontName="Helvetica-Bold", fontSize=9, fillColor=COLOR_TEXT))
    
    # Backgrounds
    d.add(Rect(65, y_match, bar_w, 10, rx=3, ry=3, fillColor=COLOR_BG_GRAY, strokeColor=None))
    d.add(Rect(65, y_miss, bar_w, 10, rx=3, ry=3, fillColor=COLOR_BG_GRAY, strokeColor=None))
    
    # Colored Fills
    d.add(Rect(65, y_match, max(2, bar_w * (match_pct / 100.0)), 10, rx=3, ry=3, fillColor=COLOR_EMERALD, strokeColor=None))
    d.add(Rect(65, y_miss, max(2, bar_w * (miss_pct / 100.0)), 10, rx=3, ry=3, fillColor=COLOR_ROSE, strokeColor=None))
    
    # Values text
    d.add(String(180, y_match + 2, f"{matching_count}", fontName="Helvetica-Bold", fontSize=9, fillColor=COLOR_EMERALD))
    d.add(String(180, y_miss + 2, f"{missing_count}", fontName="Helvetica-Bold", fontSize=9, fillColor=COLOR_ROSE))
    
    return d

def create_difficulty_chart(easy_count, medium_count, hard_count) -> Drawing:
    """Draws a horizontal stacked percentage bar breakdown of project difficulties."""
    width = 200
    height = 55
    d = Drawing(width, height)
    
    total = easy_count + medium_count + hard_count
    if total == 0:
        easy_count, medium_count, total = 1, 1, 2
        
    p_easy = (easy_count / total) * 100.0
    p_med = (medium_count / total) * 100.0
    p_hard = (hard_count / total) * 100.0
    
    bar_y = 20
    bar_h = 14
    bar_w = 190
    
    w_easy = bar_w * (p_easy / 100.0)
    w_med = bar_w * (p_med / 100.0)
    w_hard = bar_w * (p_hard / 100.0)
    
    # Stacked bar
    x = 5
    if w_easy > 0:
        d.add(Rect(x, bar_y, w_easy, bar_h, rx=2, ry=2, fillColor=COLOR_EMERALD, strokeColor=None))
        x += w_easy
    if w_med > 0:
        d.add(Rect(x, bar_y, w_med, bar_h, rx=2, ry=2, fillColor=COLOR_PURPLE, strokeColor=None))
        x += w_med
    if w_hard > 0:
        d.add(Rect(x, bar_y, w_hard, bar_h, rx=2, ry=2, fillColor=COLOR_ROSE, strokeColor=None))
        
    # Legend
    d.add(Circle(12, 6, 3, fillColor=COLOR_EMERALD, strokeColor=None))
    d.add(String(20, 3, f"Easy ({easy_count})", fontName="Helvetica", fontSize=7, fillColor=COLOR_MUTED))
    
    d.add(Circle(75, 6, 3, fillColor=COLOR_PURPLE, strokeColor=None))
    d.add(String(83, 3, f"Medium ({medium_count})", fontName="Helvetica", fontSize=7, fillColor=COLOR_MUTED))
    
    d.add(Circle(145, 6, 3, fillColor=COLOR_ROSE, strokeColor=None))
    d.add(String(153, 3, f"Hard ({hard_count})", fontName="Helvetica", fontSize=7, fillColor=COLOR_MUTED))
    
    # Chart label
    d.add(String(5, 42, "PROJECT RECOMMENDATIONS BREAKDOWN", fontName="Helvetica-Bold", fontSize=8, fillColor=COLOR_TEXT))
    
    return d
