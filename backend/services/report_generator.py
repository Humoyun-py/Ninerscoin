import csv
import io
from flask import send_file
from models.all_models import Student, User

def generate_student_report():
    """
    Generates a CSV report of all students and their coin balances.
    """
    students = Student.query.all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(['ID', 'Full Name', 'Username', 'Role', 'Balance', 'Total Earned', 'Rank'])
    
    for s in students:
        writer.writerow([
            s.id,
            s.user.full_name,
            s.user.username,
            s.user.role,
            s.coin_balance,
            s.total_earned,
            s.rank
        ])
    
    output.seek(0)
    return output.getvalue()

def generate_student_pdf_report():
    """
    Generates a simple PDF report using ReportLab.
    """
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    
    students = Student.query.all()
    
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    c.setFont("Helvetica-Bold", 16)
    c.drawString(100, height - 50, "Niners.uz - Student Progress Report")
    
    c.setFont("Helvetica", 10)
    y = height - 80
    
    # Headers
    c.drawString(50, y, "ID")
    c.drawString(100, y, "Full Name")
    c.drawString(250, y, "Username")
    c.drawString(350, y, "Balance")
    c.drawString(450, y, "Rank")
    
    y -= 20
    c.line(50, y+15, 550, y+15)
    
    for s in students:
        if y < 50:
            c.showPage()
            y = height - 50
            c.setFont("Helvetica", 10)
            
        c.drawString(50, y, str(s.id))
        c.drawString(100, y, s.user.full_name[:30])
        c.drawString(250, y, s.user.username)
        c.drawString(350, y, f"{s.coin_balance} coins")
        c.drawString(450, y, f"#{s.rank}")
        y -= 20
        
    c.save()
    buffer.seek(0)
    return buffer

def generate_classroom_indicators():
    """
    Calculates performance metrics for each class.
    """
    from models.all_models import Class, Attendance, Student
    classes = Class.query.all()
    results = []
    
    for c in classes:
        # Calculate Average Coins
        sum_coins = sum([s.coin_balance for s in c.students])
        avg_coins = round(sum_coins / len(c.students), 1) if c.students else 0
        
        # Calculate Attendance Rate
        # Filter records for this class
        att_records = Attendance.query.filter_by(class_id=c.id).all()
        total = len(att_records)
        present = len([r for r in att_records if r.status in ['present', 'late']])
        rate = round((present / total) * 100, 1) if total > 0 else 0
        
        results.append({
            "class_name": c.name,
            "student_count": len(c.students),
            "avg_coins": avg_coins,
            "attendance_rate": rate
        })
        
    return results
