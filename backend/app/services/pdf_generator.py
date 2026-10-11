import io
import re
from typing import Dict, Any, List, Optional
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
)
from reportlab.pdfgen import canvas


class NumberedCanvas(canvas.Canvas):
    """
    Custom Canvas that injects PDF document metadata for ATS parsing.
    """
    def __init__(self, *args, **kwargs):
        self.doc_metadata = kwargs.pop("doc_metadata", {})
        super().__init__(*args, **kwargs)

    def save(self):
        # Inject standard PDF metadata tags for ATS bots
        if self.doc_metadata:
            if "title" in self.doc_metadata:
                self.setTitle(self.doc_metadata["title"])
            if "author" in self.doc_metadata:
                self.setAuthor(self.doc_metadata["author"])
            if "subject" in self.doc_metadata:
                self.setSubject(self.doc_metadata["subject"])
            if "keywords" in self.doc_metadata:
                self.setKeywords(self.doc_metadata["keywords"])
            self.setCreator("Student Career Platform ATS Engine")
        super().save()


def escape_xml(text: str) -> str:
    """Escapes special characters for ReportLab XML/HTML-like text."""
    if not text:
        return ""
    text = str(text)
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


def generate_resume_pdf(resume_data: Dict[str, Any]) -> bytes:
    """
    Generates a high-fidelity, ATS-compliant PDF resume from resume data dictionary.
    Supports templates: 'classic-tech', 'modern-minimal', 'research-academic', 'compact-dense'.
    """
    template_id = resume_data.get("template_id", "classic-tech")
    personal_info = resume_data.get("personal_info") or {}
    summary = resume_data.get("summary") or ""
    education = resume_data.get("education") or []
    experience = resume_data.get("experience") or []
    projects = resume_data.get("projects") or []
    skills = resume_data.get("skills") or []
    certifications = resume_data.get("certifications") or []

    full_name = personal_info.get("full_name") or "Candidate Name"
    headline = personal_info.get("headline") or ""
    email = personal_info.get("email") or ""
    phone = personal_info.get("phone") or ""
    location = personal_info.get("location") or ""
    github = personal_info.get("github") or ""
    linkedin = personal_info.get("linkedin") or ""
    portfolio = personal_info.get("portfolio") or ""

    # Setup margins and page geometry based on template
    is_compact = template_id == "compact-dense"
    margin_pts = 28 if is_compact else 36  # ~0.4in vs ~0.5in
    page_size = letter

    buffer = io.BytesIO()

    # Metadata for ATS parsers
    keywords_list = []
    if isinstance(skills, list):
        keywords_list = [str(s) for s in skills]
    doc_metadata = {
        "title": f"{full_name} - Resume",
        "author": full_name,
        "subject": headline or "Software Engineering Resume",
        "keywords": ", ".join(keywords_list[:20]),
    }

    doc = SimpleDocTemplate(
        buffer,
        pagesize=page_size,
        leftMargin=margin_pts,
        rightMargin=margin_pts,
        topMargin=margin_pts,
        bottomMargin=margin_pts,
    )

    # Typography & Styles
    font_main = "Times-Roman" if template_id == "research-academic" else "Helvetica"
    font_bold = "Times-Bold" if template_id == "research-academic" else "Helvetica-Bold"
    font_italic = "Times-Italic" if template_id == "research-academic" else "Helvetica-Oblique"

    primary_color = colors.HexColor("#0f172a")  # Slate 900
    if template_id == "modern-minimal":
        accent_color = colors.HexColor("#0284c7")  # Sky 600
        divider_color = colors.HexColor("#38bdf8")
    elif template_id == "research-academic":
        accent_color = colors.HexColor("#0f766e")  # Teal 700
        divider_color = colors.HexColor("#14b8a6")
    elif template_id == "compact-dense":
        accent_color = colors.HexColor("#1e293b")  # Dark slate
        divider_color = colors.HexColor("#64748b")
    else:  # classic-tech
        accent_color = colors.HexColor("#0f172a")
        divider_color = colors.HexColor("#334155")

    styles = getSampleStyleSheet()

    # Name Title Style
    name_size = 18 if not is_compact else 16
    name_style = ParagraphStyle(
        "ResumeName",
        fontName=font_bold,
        fontSize=name_size,
        leading=name_size + 4,
        textColor=primary_color,
        alignment=0 if template_id == "modern-minimal" else 1,  # Left for modern, center for classic/others
    )

    # Sub-headline
    headline_style = ParagraphStyle(
        "ResumeHeadline",
        fontName=font_italic,
        fontSize=10 if not is_compact else 9,
        leading=13 if not is_compact else 11,
        textColor=accent_color,
        alignment=0 if template_id == "modern-minimal" else 1,
    )

    # Contact Info Line
    contact_style = ParagraphStyle(
        "ResumeContact",
        fontName=font_main,
        fontSize=9 if not is_compact else 8.5,
        leading=12 if not is_compact else 10.5,
        textColor=colors.HexColor("#334155"),
        alignment=0 if template_id == "modern-minimal" else 1,
    )

    # Section Header Style
    section_size = 11 if not is_compact else 10
    section_style = ParagraphStyle(
        "ResumeSectionHeader",
        fontName=font_bold,
        fontSize=section_size,
        leading=section_size + 3,
        textColor=primary_color,
        spaceBefore=8 if not is_compact else 5,
        spaceAfter=2,
    )

    # Body text styles
    body_size = 9.5 if not is_compact else 8.5
    body_leading = 12.5 if not is_compact else 10.5

    body_style = ParagraphStyle(
        "ResumeBody",
        fontName=font_main,
        fontSize=body_size,
        leading=body_leading,
        textColor=colors.HexColor("#1e293b"),
    )

    item_title_style = ParagraphStyle(
        "ResumeItemTitle",
        fontName=font_bold,
        fontSize=body_size,
        leading=body_leading,
        textColor=primary_color,
    )

    item_subtitle_style = ParagraphStyle(
        "ResumeItemSubtitle",
        fontName=font_italic,
        fontSize=body_size,
        leading=body_leading,
        textColor=colors.HexColor("#475569"),
    )

    date_style = ParagraphStyle(
        "ResumeDate",
        fontName=font_bold,
        fontSize=body_size - 0.5,
        leading=body_leading,
        textColor=colors.HexColor("#475569"),
        alignment=2,  # Right aligned
    )

    bullet_style = ParagraphStyle(
        "ResumeBullet",
        fontName=font_main,
        fontSize=body_size,
        leading=body_leading,
        textColor=colors.HexColor("#1e293b"),
        leftIndent=12,
        firstLineIndent=-8,
        spaceBefore=1,
    )

    story = []

    # 1. Header & Contact Details
    story.append(Paragraph(escape_xml(full_name).upper(), name_style))
    if headline:
        story.append(Paragraph(escape_xml(headline), headline_style))

    contact_parts = []
    if email:
        contact_parts.append(escape_xml(email))
    if phone:
        contact_parts.append(escape_xml(phone))
    if location:
        contact_parts.append(escape_xml(location))
    if contact_parts:
        story.append(Spacer(1, 2))
        story.append(Paragraph(" &bull; ".join(contact_parts), contact_style))

    links_parts = []
    if github:
        links_parts.append(f"<b>GitHub:</b> {escape_xml(github)}")
    if linkedin:
        links_parts.append(f"<b>LinkedIn:</b> {escape_xml(linkedin)}")
    if portfolio:
        links_parts.append(f"<b>Portfolio:</b> {escape_xml(portfolio)}")
    if links_parts:
        story.append(Paragraph(" &bull; ".join(links_parts), contact_style))

    story.append(Spacer(1, 6 if not is_compact else 3))

    def add_section_header(title_text: str):
        story.append(Paragraph(title_text.upper(), section_style))
        story.append(
            HRFlowable(
                width="100%",
                thickness=1,
                color=divider_color,
                spaceBefore=1,
                spaceAfter=4 if not is_compact else 2,
            )
        )

    # 2. Professional Summary
    if summary and summary.strip():
        add_section_header("Professional Summary")
        story.append(Paragraph(escape_xml(summary.strip()), body_style))
        story.append(Spacer(1, 4 if not is_compact else 2))

    # 3. Technical Skills
    if skills:
        add_section_header("Technical Skills")
        if isinstance(skills, list):
            skills_str = ", ".join(escape_xml(str(s)) for s in skills)
            story.append(Paragraph(f"<b>Languages, Frameworks &amp; Tools:</b> {skills_str}", body_style))
        elif isinstance(skills, dict):
            for cat, items in skills.items():
                items_str = ", ".join(escape_xml(str(i)) for i in items) if isinstance(items, list) else escape_xml(str(items))
                story.append(Paragraph(f"<b>{escape_xml(cat)}:</b> {items_str}", body_style))
        story.append(Spacer(1, 4 if not is_compact else 2))

    # 4. Work Experience
    if experience:
        add_section_header("Experience")
        for exp in experience:
            role = exp.get("role") or ""
            company = exp.get("company") or ""
            exp_loc = exp.get("location") or ""
            start_date = exp.get("start_date") or ""
            end_date = exp.get("end_date") or ""
            date_range = f"{start_date} – {end_date}" if start_date and end_date else start_date or end_date

            title_left = f"<b>{escape_xml(role)}</b>"
            if company:
                title_left += f" — {escape_xml(company)}"
            if exp_loc:
                title_left += f" <font color='#64748b'>({escape_xml(exp_loc)})</font>"

            # Two-column row for Role/Company and Date Range
            row_data = [
                [Paragraph(title_left, item_title_style), Paragraph(escape_xml(date_range), date_style)]
            ]
            exp_table = Table(row_data, colWidths=[doc.width * 0.75, doc.width * 0.25])
            exp_table.setStyle(
                TableStyle([
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                    ("TOPPADDING", (0, 0), (-1, -1), 1),
                ])
            )
            story.append(exp_table)

            bullets = exp.get("bullets") or []
            for b in bullets:
                if b and str(b).strip():
                    story.append(Paragraph(f"&bull; {escape_xml(str(b).strip())}", bullet_style))

            story.append(Spacer(1, 4 if not is_compact else 2))

    # 5. Flagship Projects
    if projects:
        add_section_header("Key Projects")
        for proj in projects:
            p_name = proj.get("name") or "Project"
            tech_stack = proj.get("tech_stack") or ""
            link = proj.get("link") or ""

            left_str = f"<b>{escape_xml(p_name)}</b>"
            if tech_stack:
                left_str += f" | <i>{escape_xml(tech_stack)}</i>"

            row_data = [
                [Paragraph(left_str, item_title_style), Paragraph(escape_xml(link), date_style)]
            ]
            proj_table = Table(row_data, colWidths=[doc.width * 0.70, doc.width * 0.30])
            proj_table.setStyle(
                TableStyle([
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                    ("TOPPADDING", (0, 0), (-1, -1), 1),
                ])
            )
            story.append(proj_table)

            p_bullets = proj.get("bullets") or []
            for b in p_bullets:
                if b and str(b).strip():
                    story.append(Paragraph(f"&bull; {escape_xml(str(b).strip())}", bullet_style))

            story.append(Spacer(1, 4 if not is_compact else 2))

    # 6. Education
    if education:
        add_section_header("Education")
        for edu in education:
            institution = edu.get("institution") or ""
            degree = edu.get("degree") or ""
            gpa = edu.get("gpa") or ""
            end_date = edu.get("end_date") or ""
            highlights = edu.get("highlights") or ""

            deg_str = f"<b>{escape_xml(institution)}</b>"
            row_data = [
                [Paragraph(deg_str, item_title_style), Paragraph(escape_xml(end_date), date_style)]
            ]
            edu_table = Table(row_data, colWidths=[doc.width * 0.75, doc.width * 0.25])
            edu_table.setStyle(
                TableStyle([
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                    ("TOPPADDING", (0, 0), (-1, -1), 1),
                ])
            )
            story.append(edu_table)

            degree_line = escape_xml(degree)
            if gpa:
                degree_line += f" (GPA: {escape_xml(gpa)})"
            story.append(Paragraph(degree_line, item_subtitle_style))

            if highlights:
                story.append(
                    Paragraph(f"<b>Relevant Coursework / Honors:</b> {escape_xml(highlights)}", body_style)
                )

            story.append(Spacer(1, 4 if not is_compact else 2))

    # 7. Certifications
    if certifications:
        add_section_header("Certifications & Honors")
        for cert in certifications:
            c_name = cert.get("name") or ""
            issuer = cert.get("issuer") or ""
            c_date = cert.get("date") or ""
            c_text = f"<b>{escape_xml(c_name)}</b>"
            if issuer:
                c_text += f" — {escape_xml(issuer)}"

            row_data = [
                [Paragraph(c_text, body_style), Paragraph(escape_xml(c_date), date_style)]
            ]
            cert_table = Table(row_data, colWidths=[doc.width * 0.80, doc.width * 0.20])
            cert_table.setStyle(
                TableStyle([
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 0.5),
                    ("TOPPADDING", (0, 0), (-1, -1), 0.5),
                ])
            )
            story.append(cert_table)

    # Build document with custom metadata canvas
    def canvas_maker(*args, **kwargs):
        kwargs["doc_metadata"] = doc_metadata
        return NumberedCanvas(*args, **kwargs)

    doc.build(story, canvasmaker=canvas_maker)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
