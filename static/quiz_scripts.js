let spinner
let name
let waiting
let quiz
let student_name
let teacher_name
let gameId
let time_elapsed

const question_id = '{{question_id}}'
const student_answer = '{{student_answer}}'
const score_sent = '{{score_sent}}'
const last_question = '{{last_question}}'
const quiz_div = `
<label for="question{{question_id}}"><strong>Question {{question_id}}: </strong>
        <span id="question{{question_id}}">{{last_question}}</span></label><br>
    <label for="answer{{question_id}}"><strong>Answer: </strong></label>
    <input id="answer{{question_id}}" type="text">
    <input id="save_name{{question_id}}" class="btn btn-primary" value="Submit" onclick="saveAnswer({{question_id}}, '#answer{{question_id}}')" name="name" type="button"><br>
    <label for="last_answer{{question_id}}"><strong>Last saved Answer: </strong><span id="last_answer{{question_id}}">{{student_answer}}</span></label><br>
    <label for="last_score{{question_id}}"><strong>Score from Teacher: </strong><span id="last_score{{question_id}}">{{score_sent}}</span></label><br><br><br>
`

function createQuestionsBlock(questionAnswers) {
    quiz.empty()
    for (const questionAnswersKey in questionAnswers) {
        quiz.append(quiz_div.replaceAll(question_id, questionAnswers[questionAnswersKey]['id'])
            .replaceAll(student_answer, questionAnswers[questionAnswersKey]['answer'])
            .replaceAll(score_sent, questionAnswers[questionAnswersKey]['score'])
            .replaceAll(last_question, questionAnswers[questionAnswersKey]['question']))
    }

}

function saveAnswer(id, answer_div) {
    spinner.show()
    let payLoad = {
        'answer': $(answer_div).val(),
        'id': id
    }
    $.ajax({
        type: 'POST',
        url: "/answer",
        contentType: "application/json",
        dataType: 'json',
        data: JSON.stringify(payLoad)
    }).done(function (data) {
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
    time_elapsed = $('#time_elapsed')
    waiting.show()
    spinner.hide()
    quiz.hide()
    spinner.hide()


    function sse() {
        let source = new EventSource('/stream');
        source.onmessage = function (e) {
            let data = JSON.parse(e.data)
            gameId = data.id
            if (data['student'] && data['teacher'] && data['questions']) {
                student_name.html(data['student']['name'])
                teacher_name.html(data['teacher']['name'])
                let questions = data['questions']
                createQuestionsBlock(questions)
                let countDownDate = new Date(data['created_on']).getTime()
                let x = setInterval(function () {

                    // Get today's date and time
                    let now = new Date().getTime();

                    // Find the distance between now and the count down date
                    let distance = now - countDownDate;

                    // Time calculations for days, hours, minutes and seconds
                    let days = Math.floor(distance / (1000 * 60 * 60 * 24));
                    let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    let seconds = Math.floor((distance % (1000 * 60)) / 1000);

                    // Display the result in the element with id="demo"
                    time_elapsed.html(days + "d " + hours + "h "
                        + minutes + "m " + seconds + "s ")
                }, 1000);
                quiz.show()
                spinner.hide()
                waiting.hide()
            }

            if (!data['student']) {
                source.close()
                window.location.replace('/')
            }

        };
    }

    sse();
})