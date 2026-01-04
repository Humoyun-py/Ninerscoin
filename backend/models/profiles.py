from datetime import datetime
from ..app import db

class Student(db.Model):
    __tablename__ = 'students'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'), nullable=True)
    coin_balance = db.Column(db.Integer, default=0)
    total_earned = db.Column(db.Integer, default=0)
    rank = db.Column(db.String(50), default="Newbie")
    
    # Relationships
    coins = db.relationship('CoinTransaction', backref='student', lazy=True)
    badges = db.relationship('StudentBadge', backref='student', lazy=True)

class Teacher(db.Model):
    __tablename__ = 'teachers'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    subject = db.Column(db.String(100), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    rating = db.Column(db.Float, default=5.0)
    
    # Relationships
    classes = db.relationship('Class', backref='teacher', lazy=True)

class Parent(db.Model):
    __tablename__ = 'parents'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Relationship with pupils (students)
    students = db.relationship('Student', secondary='parent_student_link', backref='parents')

# Helper table for Parent-Student many-to-many relationship
parent_student_link = db.Table('parent_student_link',
    db.Column('parent_id', db.Column(db.Integer, db.ForeignKey('parents.id'), primary_key=True)),
    db.Column('student_id', db.Column(db.Integer, db.ForeignKey('students.id'), primary_key=True))
)
