let spinner
let name
let waiting
let quiz
let student_name
let teacher_name
let answer
let last_answer
let last_score
let question

function saveAnswer() {
    spinner.show()
    let payLoad = {
        'answer': answer.val()
    }
    $.ajax({
        type: 'POST',
        url: "/answer",
        contentType: "application/json",
        dataType: 'json',
        data: JSON.stringify(payLoad)
    }).done(function (data) {
        console.log(data);
        spinner.hide()
    });
}

function endQuiz() {
    spinner.show()
    $.ajax({
        type: 'POST',
        url: "/end",
        contentType: "application/json",
        dataType: 'json'
    }).done(function (data) {
        console.log(data);
        spinner.hide()
        window.location.replace('/')
    });
}

$(function () {
    spinner = $('#spinner')
    waiting = $('#waiting')
    quiz = $('#quiz')
    student_name = $('#student_name')
    teacher_name = $('#teacher_name')
    answer = $('#answer')
    last_answer = $('#last_answer')
    last_score = $('#last_score')
    question = $('#question')
    waiting.show()
    spinner.hide()
    quiz.hide()
    spinner.hide()
    let dataInterval = setInterval(function () {
        $.ajax({
            type: 'GET',
            url: "/stream",
            contentType: "application/json",
            dataType: 'json'
        }).done(function (data) {
            console.log(data);
            if (data['student'] && data['teacher'] && data['question']) {
                student_name.html(data['student']['name'])
                teacher_name.html(data['teacher']['name'])
                question.html(data['question'])
                last_answer.html(data['answer'])
                last_score.html(data['score'])
                quiz.show()
                waiting.hide()
            }
            if (!data['student']) {
                clearInterval(dataInterval)
                window.location.replace('/')
            }
        });
    }, 10000);
})