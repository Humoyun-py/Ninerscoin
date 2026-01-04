from models.all_models import db, AuditLog, Notification

def log_event(user_id, action, severity='info'):
    log = AuditLog(user_id=user_id, action=action, severity=severity)
    db.session.add(log)
    db.session.commit()

def send_notification(user_id, title, message):
    n = Notification(user_id=user_id, title=title, message=message)
    db.session.add(n)
    db.session.commit()

class AntiCheat:
    @staticmethod
    def check_test_submission(student_id, score, time_taken=None):
        """
        Simple anti-cheat check.
        """
        # Example: Score cannot be > 100
        if score > 100:
            log_event(student_id, f"Impossible score attempt: {score}", severity='danger')
            return False, "Natija xato (Score > 100)"
            
        # Example: Rapid submission (dummy logic)
        # Would normally check if test was opened < 10 seconds ago
        
        return True, "OK"
