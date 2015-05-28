/// <reference path="/Scripts/jquery-2.1.0-vsdoc.js">
function SubmittedGuess(answers, results, possibleAnswerCount) {
    this.answers = answers;
    this.results = results;
    this.possibleAnswerCount = possibleAnswerCount;
}


$(document).ready(function () {
    var lastpicked;
    var guessCount = 0;
    var colorlist = ['red', 'blue', 'yellow', 'green', 'orange', 'purple'];
    var actualAnswer = [];

    var guessHistory = [];

    var showAnswer = false;

    function initializeGame() {
        $('.guessArea').hide();
        $('#submitGuess').hide();
        $('#submitCode').hide();
        
        
        $('#resultsLabel').hide();
        $('#guesshistory').html("");

        actualAnswer = [];
        guessHistory = [];
        guessCount = 0;
        resetGuess();

        if ($('#codeBreaker')[0].checked) {
            initializeCodebreakerGame();
        } else if ($('#codeMaker')[0].checked) {
            initializeCodemakerGame();
        }
    }
    function initializeCodebreakerGame() {

        // randomly initialize answer key    

        while (actualAnswer.length < 4) {
            var color = colorlist[Math.floor(Math.random() * colorlist.length)];
            if (actualAnswer.indexOf(color) == -1) {
                actualAnswer.push(color);
            }
        }        
        
        $('.duplicateSetting').hide();
        $('.guessArea').show();
        $('#submitGuess').show();

        if (showAnswer) {
            $('#answers').html(getActualAnswerMarkup());
        }
    }
    function initializeCodemakerGame() {
        $('.duplicateSetting').show();
        $('.guessArea').show();        
        $('#submitCode').show();
    }

    function getButtonColor(button) {
        var colorclassname = "";
        for (var i = 0; i < colorlist.length; i++) {
            if (button.hasClass(colorlist[i] + 'button')) {
                colorclassname = colorlist[i];
                break;
            }
        }
        return colorclassname;
    }
    function getActualAnswerMarkup() {
        var answerMarkup = "<tr>";

        for (var i = 0; i < actualAnswer.length; i++) {
            answerMarkup += "<td>";
            answerMarkup += "<button class='guess colorpicker " + actualAnswer[i] + "button'></button>";
            answerMarkup += "</td>";
        }

        answerMarkup += "</tr>"

        return answerMarkup;
    }
    function getResultsButton(resultCode) {
        if (resultCode == 2)
            return " blackresultbutton";
        else if (resultCode == 1)
            return " whiteresultbutton";
        else
            return "";
    };
	
	function resetGuess() {
		for (var i = 0; i < 4; i++) {
            var findGuess = '#submittedGuess tr:nth-child(1) td:nth-child(' + (i + 1) + ') button';
        	// reset guess buttons back to grey to allow user to submit new guess.
            $(findGuess).attr('class', 'guess activeguess');
			}
	};

    $(document).on("click", '.colorpicker', function () {
        lastpicked = getButtonColor($(this)) + 'button';
    });

    $('.activeguess').click(function () {
        $(this).attr('class', 'guess activeguess ' + lastpicked);
    });

    $('#submitGuess').click(function () {

        // add the active guess to the guess list.
        var guessItem = "";
        var buttonClassName = "";
        var submittedAnswerSet = [];
        
        $('#resultsLabel').show();

        // accept guess input and built HTML to add to guess list table.        
        for (var i = 0; i < 4; i++) {
            var findGuess = '#submittedGuess tr:nth-child(1) td:nth-child(' + (i + 1) + ') button';
            submittedAnswerSet[i] = getButtonColor($(findGuess));
        }

        var results = submitGuess(submittedAnswerSet, actualAnswer);
        
        var correct = areResultsCorrect(results);

        if (correct) {
            if (guessCount <= 1) {
                alert("Lucky guess!");
            }
            else {
                alert("You got it! " + guessCount + " guesses.");
            }
        }
        else {
            
            guessHistory.push(new SubmittedGuess(submittedAnswerSet, results, -1));

            drawGuessHistory();
            
			resetGuess();            
        }

    });

    $('#submitCode').click(function () {
        for (var i = 0; i < 4; i++) {
            var findGuess = '#submittedGuess tr:nth-child(1) td:nth-child(' + (i + 1) + ') button';
            actualAnswer[i] = getButtonColor($(findGuess));
        }

        var allowDuplicates = !($('#duplicatesOff')[0].checked);

        if (!answerIsValid(actualAnswer, allowDuplicates)) {
            if (allowDuplicates) {
                alert("Invalid code. Code must have all slots populated with colors.");
            }
            else {
                alert("Invalid code. Code must have all slots populated with colors, and all colors must be unique.");
            }
            return;
        }

        // initialize list of possible answers- any unique combination of colors. 
        var possibleGuesses = [];
        var workingAnswer = [];
        getCombinations(possibleGuesses, workingAnswer, allowDuplicates);

        var correct = false;

        // pick a possible guess
        workingAnswer = possibleGuesses[Math.floor(Math.random() * possibleGuesses.length)];

        // submit answer and get results. 
        var workingAnswerResults = submitGuess(workingAnswer, actualAnswer);

        correct = areResultsCorrect(workingAnswerResults);
        guessHistory.push(new SubmittedGuess(workingAnswer, workingAnswerResults, possibleGuesses.length));

        drawGuessHistory();

        while (!correct) {
        
            // for each possible guess
            //     check each guess history.
            //         if historical guess would not expected result against that answer, then eliminate it as a possibility.

            for (var possibleGuessIndex = possibleGuesses.length - 1; possibleGuessIndex >= 0; possibleGuessIndex--) {
                workingAnswer = possibleGuesses[possibleGuessIndex];
                for (var guessHistoryIndex = 0; guessHistoryIndex < guessHistory.length; guessHistoryIndex++) {
                    workingAnswerResults = submitGuess(guessHistory[guessHistoryIndex].answers, workingAnswer);
                    if (resultsMatch(workingAnswerResults, guessHistory[guessHistoryIndex].results) === false) {
                        possibleGuesses.splice(possibleGuessIndex, 1);
                    }
                }
            }

            // submit new valid guess.
            workingAnswer = possibleGuesses[Math.floor(Math.random() * possibleGuesses.length)];
            workingAnswerResults = submitGuess(workingAnswer, actualAnswer);
            guessHistory.push(new SubmittedGuess(workingAnswer, workingAnswerResults, possibleGuesses.length));
            drawGuessHistory();

            correct = areResultsCorrect(workingAnswerResults);

        }

        alert("Puzzle solved in " + guessHistory.length + " guesses");
    });

    function answerIsValid(answer, allowDuplicates) {
        for (var i = 0; i < answer.length; i++) {
            if (!!answer[i] === false) {
                return false;
            }
            if (!allowDuplicates) {
                for (var j = 0; j < i; j++) {
                    if (answer[i] === answer[j]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    function resultsMatch(results1, results2) {
        if (results1.length === results2.length) {
            for (var i = 0; i < results1.length; i++) {
                if (results1[i] !== results2[i]) {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }
    }

    function areResultsCorrect(results) {
        var isCorrect = true;
        for (var i = 0; i < results.length; i++) {
            if (results[i] != 2) {
                isCorrect = false;
                break;
            }
        }
        if (results.length < actualAnswer.length) {
            isCorrect = false;
        }

        return isCorrect;
    }

    function getCombinations(possibleGuesses, answer, allowDuplicates) {
        var workingAnswer = [];
        for (var colorIndex = 0; colorIndex < colorlist.length; colorIndex++) {
            selectedColor = colorlist[colorIndex];
            
            if (answer.indexOf(selectedColor) === -1 || allowDuplicates) { 
                answer.push(selectedColor);
                if (answer.length === 4) {
                    workingAnswer = [];
                    for (answerPart in answer) {
                        workingAnswer.push(answer[answerPart]);
                    }
                    possibleGuesses.push(workingAnswer);
                    answer.pop();
                } else {
                    getCombinations(possibleGuesses, answer, allowDuplicates);
                }
            }
        }
        answer.pop();
    }

    function submitGuess(guess, answer) {
        var results = [];
        guessCount++;

        // analyze submitted answer and determine results.
        //for (var i = 0; i < answer.length; i++) {
        //    var resultcode = 0;
        //    for (var j = 0; j < guess.length; j++) {
        //        if (answer[i] == guess[j]) {
        //            if (i == j) {
        //                // position and color match found. 						
        //                resultcode = Math.max(2, resultcode);
        //            }
        //            else {
        //                // color correct, but position is not
        //                resultcode = Math.max(1, resultcode);
        //            }
        //        }
        //    }
        //    results.push(resultcode);
        //}

        var answersUsed = [];

        for (var i = 0; i < guess.length; i++) {
            var resultcode = 0;
            var answerUsed = -1;
            for (var j = 0; j < answer.length; j++) {
                if (answersUsed.indexOf(j) === -1) {
                    if (answer[i] == guess[j]) {
                        if (i == j) {
                            // position and color match found. 	
                            if (resultcode < 2) {
                                resultcode = 2;
                                answerUsed = j;
                                break;
                            }
                        }
                        else {
                            if (resultcode < 1) {
                                // color correct, but position is not
                                resultcode = 1;
                                answerUsed = j;
                            }
                        }
                    }
                }
            }
            results.push(resultcode);
            if (resultcode > 0) {
                answersUsed.push(answerUsed);
            }
        }        

        // organize the position/color matches first, then the color matches
        results.sort();
        results.reverse(); // 2 = position/color match, 1 = color match only

        return results;
    }

    function drawGuessHistory() {
        
        var guessItem = "";
        // draw from most recent to least recent
        for (var guess = guessHistory.length-1; guess >= 0; guess--) {
            guessItem += "<tr>";

            for (var iAnswerIndex = 0; iAnswerIndex < guessHistory[guess].answers.length; iAnswerIndex++) {
                buttonClassName = 'colorpicker guess ' + guessHistory[guess].answers[iAnswerIndex] + 'button';

                guessItem += '<td><button class="' +
                    buttonClassName +
                    '"></button></td>';
            }

            // display the results of the guess.
            guessItem += '<td><table><tr>' +
                    '<td><button class="resultsbutton' + getResultsButton(guessHistory[guess].results[0]) + '"></button></td>' +
                    '<td><button class="resultsbutton' + getResultsButton(guessHistory[guess].results[1]) + '"></button></td>' +
                    '</tr><tr>' +
                    '<td><button class="resultsbutton' + getResultsButton(guessHistory[guess].results[2]) + '"></button></td>' +
                    '<td><button class="resultsbutton' + getResultsButton(guessHistory[guess].results[3]) + '"></button></td>' +
                    '</tr>' +
                    '</table></td>';

            if (guessHistory[guess].possibleAnswerCount >= 0) {
                guessItem += '<td>Possible guesses: ' + guessHistory[guess].possibleAnswerCount + '</td>';
            }

            guessItem += "</tr>";
        }

        $('#guesshistory').html(guessItem);
    }
    
    $('#resetGame').click(function () {
        initializeGame();
    });

    $('#showAnswer').click(function () {
        if ($(this).text() == "Show Answer") {
            $('#answers').html(getActualAnswerMarkup());
            $(this).text("Hide Answer");
        }
        else {
            $(this).text("Show Answer");
            $('#answers').empty();
        }
    });

    $('#submitGuess').hide();
    
    $('.guessArea').hide();
    
    $('input[name=gameMode]:radio').change(function () {
        initializeGame();
    });

    $('.duplicateSetting').hide();

});