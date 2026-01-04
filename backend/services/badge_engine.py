from models.all_models import db, Student, Badge, StudentBadge, TestResult, Test

def check_and_award_badges(student_id):
    """
    Checks if a student qualifies for new badges based on their activity.
    """
    student = Student.query.get(student_id)
    if not student:
        return []

    new_badges_awarded = []
    
    def award_if_not_exists(name, desc):
        badge = Badge.query.filter_by(name=name).first()
        if not badge:
            badge = Badge(name=name, description=desc)
            db.session.add(badge)
            db.session.flush()
        
        # Check if student already has it
        existing = StudentBadge.query.filter_by(student_id=student_id, badge_id=badge.id).first()
        if not existing:
            sb = StudentBadge(student_id=student_id, badge_id=badge.id)
            db.session.add(sb)
            new_badges_awarded.append(name)
            return True
        return False

    # 1. Centurion: 100+ coins total earned
    if student.total_earned >= 100:
        award_if_not_exists("Centurion", "Earned 100+ coins in total.")

    # 2. Vocab Pro: 3+ vocabulary tests with 90%+ score
    vocab_passes = TestResult.query.join(Test).filter(
        TestResult.student_id == student_id,
        Test.title.ilike('%vocab%'),
        TestResult.score >= 90
    ).count()
    if vocab_passes >= 3:
        award_if_not_exists("Vocab Pro", "Mastered 3+ Vocabulary quizzes with 90% score.")

    # 3. IELTS Hero: 1+ IELTS test with 80%+ score
    ielts_passes = TestResult.query.join(Test).filter(
        TestResult.student_id == student_id,
        Test.title.ilike('%ielts%'),
        TestResult.score >= 80
    ).count()
    if ielts_passes >= 1:
        award_if_not_exists("IELTS Hero", "Passed an IELTS Mock test with 80% score.")

    # 4. Grammar King: Score 95%+ on any Grammar test
    grammar_passes = TestResult.query.join(Test).filter(
        TestResult.student_id == student_id,
        Test.title.ilike('%grammar%'),
        TestResult.score >= 95
    ).count()
    if grammar_passes >= 1:
        award_if_not_exists("Grammar King", "Perfected a Grammar test with 95%+ score.")

    db.session.commit()
    return new_badges_awarded
