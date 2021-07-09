import datetime
import os
from dataclasses import dataclass

import sqlalchemy
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine, ForeignKey, orm
from sqlalchemy.orm import relationship

server = os.environ['UD_HOST_NAME']
database = os.environ['UD_DB_NAME']
username = os.environ['UD_DB_USERNAME']
password = os.environ['UD_DB_PASSWORD']

secretKey = os.environ['SECRET_KEY']

app = Flask(__name__)
app.secret_key = secretKey

# enable debugging mode
app.config["DEBUG"] = True

connection_string = "mysql+pymysql://{0}:{1}@{2}/{3}?charset=utf8mb4".format(username, password, server, database)

engine = create_engine(connection_string)

app.config["SQLALCHEMY_DATABASE_URI"] = connection_string

db = SQLAlchemy(app)


@dataclass
class Teacher(db.Model):
    __tablename__ = 'teacher'
    id: int
    name: str

    id = db.Column(db.Integer(), primary_key=True, nullable=False)
    name = db.Column(sqlalchemy.VARCHAR(200))
    game = relationship("Game")

    @property
    def serializable(self):
        """Return object data in easily serializable format"""
        return {
            'id': self.id,
            'name': self.name
        }


@dataclass
class Student(db.Model):
    __tablename__ = 'student'
    id: int
    name: str

    id = db.Column(db.Integer(), primary_key=True, nullable=False)
    name = db.Column(sqlalchemy.VARCHAR(200))
    game = relationship("Game")

    @property
    def serializable(self):
        """Return object data in easily serializable format"""
        return {
            'id': self.id,
            'name': self.name
        }


@dataclass
class Game(db.Model):
    __tablename__ = 'games'
    id: int
    teacher_id: str
    student_id: str
    admin_name: str
    question: str
    answer: str
    created_on: datetime
    updated_on: datetime
    score: int

    id = db.Column(db.Integer(), primary_key=True, nullable=False)
    teacher_id = db.Column(sqlalchemy.Integer(), ForeignKey('teacher.id'))
    teacher = relationship("Teacher", back_populates="game", lazy='joined')
    student_id = db.Column(sqlalchemy.Integer(), ForeignKey('student.id'))
    student = relationship("Student", back_populates="game", lazy='joined')
    admin_name = db.Column(sqlalchemy.VARCHAR(200))
    question = db.Column(sqlalchemy.VARCHAR(200))
    answer = db.Column(sqlalchemy.VARCHAR(200))
    created_on = db.Column(sqlalchemy.TIMESTAMP)
    updated_on = db.Column(sqlalchemy.TIMESTAMP)
    score = db.Column(sqlalchemy.Integer())

    @property
    def serializable(self):
        """Return object data in easily serializable format"""
        return {
            'id': self.id,
            'teacher': self.teacher.serializable,
            'student': self.student.serializable,
            'question': self.question,
            'answer': self.answer,
            'score': self.score,
        }


@app.route('/', methods=['GET'])
def home():
    teachers = Teacher.query.all()
    print(teachers)
    if len(teachers) <= 0:
        return render_template('index.html')
    else:
        return render_template('quiz.html')


def create_name(data):
    student = Student(name=data['name'])
    db.session.add(student)
    db.session.commit()
    games = Game.query.options(orm.joinedload('*')).all()
    teacher = Teacher.query.all()
    print(teacher, student)
    if teacher and student and not games:
        game = Game(teacher=teacher[0], student=student)
        db.session.add(game)
        db.session.commit()
    return teacher


def update_answer(answer: str):
    game = Game.query.one()
    game.answer = answer
    db.session.commit()
    return game


def delete_all_data():
    Game.query.delete()
    Teacher.query.delete()
    Student.query.delete()
    db.session.commit()
    return {"status": "Delete success"}


@app.route('/name', methods=['POST'])
def save_name():
    print(request.get_json()['name'])
    return jsonify(create_name(request.get_json()))


@app.route('/answer', methods=['POST'])
def save_answer():
    print(request.get_json()['answer'])
    return jsonify(update_answer(request.get_json()['answer']))


@app.route('/end', methods=['POST'])
def end_quiz():
    return jsonify(delete_all_data())


@app.route('/status')
def hello_world():
    return "Hello World"


@app.route('/stream')
def game_stream():
    data = {}
    games = Game.query.options(orm.joinedload('*')).all()
    teacher = Teacher.query.all()
    student = Student.query.all()
    print(teacher, student, games)
    if games:
        data = [dict(g.serializable, student=g.student.serializable, teacher=g.teacher.serializable)
                for g in games][0]
    return jsonify(data)


if __name__ == '__main__':
    app.debug = True
    app.run(threaded=True)
