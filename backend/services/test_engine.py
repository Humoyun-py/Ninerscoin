from models.all_models import db, Test, Student, CoinTransaction, TestResult
from services.security_service import AntiCheat, log_event, send_notification
from services.badge_engine import check_and_award_badges

def submit_test_result(student_id, test_id, score):
    """
    Evaluates test results, checks anti-cheat, and awards coins.
    """
    test = Test.query.get(test_id)
    student = Student.query.get(student_id)
    
    if not test or not student:
        return False, "Test or Student not found"

    # Anti-Cheat check
    allowed, msg = AntiCheat.check_test_submission(student_id, score)
    if not allowed:
        return False, msg
        
    try:
        # Score mapping (Assuming 1-5 scale)
        # If score > 5, we treat it as percentage (e.g. 80/20 = 4)
        effective_score = score
        if score > 5:
            effective_score = (score / 100) * 5
        
        reward_multiplier = 0
        if effective_score >= 4.5: reward_multiplier = 1.0
        elif effective_score >= 3.5: reward_multiplier = 0.75
        elif effective_score >= 2.5: reward_multiplier = 0.50
        elif effective_score >= 1.5: reward_multiplier = 0.25
        
        reward = reward_multiplier * test.coin_reward
            
        # Record result
        result = TestResult(student_id=student_id, test_id=test_id, score=score)
        db.session.add(result)
        
        if reward > 0:
            student.coin_balance += reward
            student.total_earned += reward
            
            transaction = CoinTransaction(
                student_id=student_id,
                amount=reward,
                type='earn',
                source=f"Test: {test.title}"
            )
            db.session.add(transaction)
            
            send_notification(student.user_id, "Coins Received! 🟡", f"You scored {score} on '{test.title}' and earned {reward} coins!")
            log_event(student.user_id, f"Passed test '{test.title}' with {score} score. Earned {reward} coins.")
        else:
            log_event(student.user_id, f"Failed test '{test.title}' with {score} score")
            
        # Check for new badges
        new_badges = check_and_award_badges(student_id)
        for b_name in new_badges:
            send_notification(student.user_id, "New Badge! 🏆", f"Congratulations! You've earned the '{b_name}' badge!")

        db.session.commit()
        return True, f"Submitted! Earned {reward} coins."
    except Exception as e:
        db.session.rollback()
        return False, str(e)
