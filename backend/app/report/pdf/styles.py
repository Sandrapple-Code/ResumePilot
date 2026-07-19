from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

# Core Palette matching ResumePilot UI
ACCENT_COLOR = colors.HexColor("#5B5FEF")      # Theme Purple
PRIMARY_COLOR = colors.HexColor("#0F172A")     # Dark Slate
SECONDARY_COLOR = colors.HexColor("#64748B")   # Muted Slate
MUTED_COLOR = colors.HexColor("#94A3B8")       # Light Muted Gray
BORDER_COLOR = colors.HexColor("#E2E8F0")      # Border Gray
BG_LIGHT = colors.HexColor("#FAFAF8")          # Light Background
WHITE = colors.HexColor("#FFFFFF")

# Status Colors
GREEN_BG = colors.HexColor("#E6F4EA")
GREEN_TEXT = colors.HexColor("#137333")
AMBER_BG = colors.HexColor("#FEF7E0")
AMBER_TEXT = colors.HexColor("#B06000")
RED_BG = colors.HexColor("#FCE8E6")
RED_TEXT = colors.HexColor("#C5221F")

def get_report_styles():
    styles = getSampleStyleSheet()
    
    # Custom stylesheet extensions
    styles.add(ParagraphStyle(
        name="CoverTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=30,
        leading=36,
        textColor=PRIMARY_COLOR,
        alignment=TA_LEFT,
        spaceAfter=10
    ))
    
    styles.add(ParagraphStyle(
        name="CoverSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=ACCENT_COLOR,
        alignment=TA_LEFT,
        spaceAfter=25
    ))

    styles.add(ParagraphStyle(
        name="CoverMeta",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=SECONDARY_COLOR,
        alignment=TA_LEFT
    ))

    styles.add(ParagraphStyle(
        name="ReportH1",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=PRIMARY_COLOR,
        spaceBefore=15,
        spaceAfter=10,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        name="ReportH2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=ACCENT_COLOR,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        name="ReportH3",
        parent=styles["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        textColor=PRIMARY_COLOR,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        name="ReportBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13.5,
        textColor=PRIMARY_COLOR,
        spaceAfter=8
    ))

    styles.add(ParagraphStyle(
        name="ReportBodyMuted",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12.5,
        textColor=SECONDARY_COLOR,
        spaceAfter=6
    ))

    styles.add(ParagraphStyle(
        name="BulletPoint",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=PRIMARY_COLOR,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    ))

    styles.add(ParagraphStyle(
        name="CardTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        textColor=PRIMARY_COLOR,
        spaceAfter=4
    ))

    styles.add(ParagraphStyle(
        name="BadgeText",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=ACCENT_COLOR,
        alignment=TA_CENTER
    ))

    styles.add(ParagraphStyle(
        name="TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=WHITE,
        alignment=TA_LEFT
    ))

    styles.add(ParagraphStyle(
        name="TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=PRIMARY_COLOR
    ))

    styles.add(ParagraphStyle(
        name="TableCellBold",
        parent=styles["TableCell"],
        fontName="Helvetica-Bold"
    ))

    styles.add(ParagraphStyle(
        name="ScoreText",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=PRIMARY_COLOR,
        alignment=TA_CENTER
    ))

    styles.add(ParagraphStyle(
        name="ScoreLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=SECONDARY_COLOR,
        alignment=TA_CENTER
    ))

    return styles
