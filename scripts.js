let order = ["", "", ""];
let holdings = [["", "", "", "", "", ""], ["", "", "", "", "", ""], ["", "", "", "", "", ""]];
const allShapes = ["T", "C", "S"];

function shapeElement(shape) {
    switch (shape) {
        case 'T':
            return '<div class="shape triangle"></div>';
        case 'C':
            return '<div class="shape circle"></div>';
        case 'S':
            return '<div class="shape square"></div>';
        default:
            return '';
    }
}

function selectOrder(element, value) {
    const index = element.getAttribute('data-index');

    // If the shape is already selected in another section, do nothing
    if (order.includes(value) && order[index] !== value) {
        return;
    }

    if (order[index] === value) {
        order[index] = ""; // Untoggle if already selected
    } else {
        order[index] = value; // Toggle the shape
    }
    updateToggleButtons();
    updateLabels();
    displayInformation();
    if (order.filter(val => val !== "").length === 2) {
        autoFill();
    }
}

function selectHolding(element, value) {
    const holdingIndex = element.getAttribute('holding-index');
    const index = element.getAttribute('data-index');

    if (holdings[holdingIndex][index] === value) {
        holdings[holdingIndex][index] = "";
    } else {
        holdings[holdingIndex][index] = value;
    }

    updateHoldingButtons();
    displayInformation();
}

function updateHoldingButtons() {
    const buttons = document.querySelectorAll('.toggle-holding-button');

    buttons.forEach(button => {
        const holdingIndex = button.getAttribute('holding-index');
        const index = button.getAttribute('data-index');
        const value = button.getAttribute('data-value');

        if (holdings[holdingIndex][index] === value) {
            button.classList.add('active');
            button.classList.remove('disabled');
        } else if (holdings[holdingIndex][index] === "") {
            button.classList.remove('active');
        }
    });
}

function updateToggleButtons() {
    const buttons = document.querySelectorAll('.toggle-button');
    const selectedShapes = order.filter(val => val !== "");

    buttons.forEach(button => {
        const index = button.getAttribute('data-index');
        const value = button.getAttribute('data-value');

        if (order[index] === value) {
            button.classList.add('active');
            button.classList.remove('disabled');
        } else if (selectedShapes.includes(value)) {
            button.classList.add('disabled');
            button.classList.remove('active');
        } else {
            button.classList.remove('active');
            button.classList.remove('disabled');
        }
    });
}

function updateLabels() {
    if (order.length === 3) {
        document.getElementById('shape1').innerHTML = shapeElement(order[0]);
        document.getElementById('shape2').innerHTML = shapeElement(order[1]);
        document.getElementById('shape3').innerHTML = shapeElement(order[2]);
    }
}

function autoFill() {
    const remainingShapes = allShapes.filter(shape => !order.includes(shape));
    order.forEach((value, index) => {
        if (value === "") {
            order[index] = remainingShapes.shift();
        }
    });
    updateToggleButtons();
    updateLabels();
    displayInformation();
}

function displayInformation() {
    if (order.some(value => value === "")) {
        document.getElementById('result').innerHTML = "Please select all order values.";
        return;
    }

    const holding1 = holdings[0].join('').toUpperCase();
    const holding2 = holdings[1].join('').toUpperCase();
    const holding3 = holdings[2].join('').toUpperCase();

/*
    if (holding1.length !== 2 || holding2.length !== 2 || holding3.length !== 2) {
        document.getElementById('result').innerHTML = "Please enter valid inputs.";
        return;
    }
    */

    const players = [
        { name: 'Player ' + order[0], has: order[0], needs: [order[1], order[2]], holding: holding1.split(''), finalSet: [], messageBank: [] },
        { name: 'Player ' + order[1], has: order[1], needs: [order[0], order[2]], holding: holding2.split(''), finalSet: [], messageBank: [] },
        { name: 'Player ' + order[2], has: order[2], needs: [order[0], order[1]], holding: holding3.split(''), finalSet: [], messageBank: [] },
    ];

    resolveExchanges(players);

    let exchangeResultHtml = '<h2>Exchange Steps:</h2><div class="steps-container">';
    const steps = [];
    players.forEach(player => {
        steps.push(...player.messageBank);
    });


    const combinedStepsStep1 = combineSteps(steps);
    const combinedSteps = removeGiveToSelf(combinedStepsStep1)


    //const combinedSteps = combineSteps(steps);

    const playerSteps = { T: [], C: [], S: [] };
    combinedSteps.forEach(step => {
        const giver = step.charAt(7);
        playerSteps[giver].push(step);
    });

    Object.keys(playerSteps).forEach(player => {
        if (playerSteps[player].length > 0) {
            exchangeResultHtml += `
                <div class="player-steps">
                    <h3>Player ${player}'s Steps:</h3>
                    <p id="steps-${player}">${playerSteps[player].join('<br>')}</p>
                    <button class="copyButton" onclick="copySteps('${player}')">Copy ${player}'s Steps to Clipboard</button>
                    <div id="feedback-${player}" class="feedback"></div>
                </div>`;
        }
    });
    exchangeResultHtml += '</div>'; // Close the flex container
    document.getElementById('result').innerHTML = exchangeResultHtml;
}

function getDirection(shape) {
    var index = order.indexOf(shape);

    if (index == "0") {
        return "Left"
    }

    if (index == "1") {
        return "Middle"
    }

    if (index == "2") {
        return "Right"
    }
}

function resolveExchanges(players) {
    for (let i = 0; i < players.length; i++) {
        const giver = players[i];
        for (let j = 0; j < players.length; j++) {
            if (i !== j) {
                const receiver = players[j];
                let giverHavesIterator = giver.holding.slice();

                for (let k = 0; k < giverHavesIterator.length; k++) {
                    const have = giverHavesIterator[k];
                    if (receiver.needs.includes(have)) {
                        giver.holding.splice(giver.holding.indexOf(have), 1);
                        receiver.needs.splice(receiver.needs.indexOf(have), 1);

                        const sendingMessage = `${giver.name} gives ${have} to ${receiver.name}`;
                        receiver.finalSet.push(have);
                        giver.messageBank.push(sendingMessage);

                        let receiverHavesIterator = receiver.holding.slice();
                        for (let l = 0; l < receiverHavesIterator.length; l++) {
                            const backHave = receiverHavesIterator[l];
                            if (giver.needs.includes(backHave)) {
                                receiver.holding.splice(receiver.holding.indexOf(backHave), 1);
                                giver.needs.splice(giver.needs.indexOf(backHave), 1);

                                const sendingMessageTwo = `${receiver.name} gives ${backHave} to ${giver.name}`;
                                receiver.messageBank.push(sendingMessageTwo);
                                giver.finalSet.push(backHave);
                            }
                        }
                    }
                }
            }
        }
    }
}

function removeGiveToSelf(steps) {
    const finalSteps = [];
    for (step of steps) {
        const giver = step.substring(7, 8)
        const receiver = step.substring(27, 28);

        if (!(giver === receiver)) {
            finalSteps.push(step);
        }
    }

    return finalSteps;
}
function combineSteps(steps) {
    const finalSteps = [];
    const usedSteps = [];

    for (const player1 of steps) {
        if (usedSteps.includes(player1)) {
            continue;
        }

        const giver1 = player1.substring(7, 8);
        const item1 = player1.substring(15, 16);
        const receiver1 = player1.substring(27, 28);

        for (const player2 of steps) {
            const giver2 = player2.substring(7, 8);
            const item2 = player2.substring(15, 16);
            const receiver2 = player2.substring(27, 28);

            if ((giver2 === giver1 && item1 === item2 && receiver1 === receiver2) || usedSteps.includes(player2)) {
                continue;
            }

            if (receiver1 === giver2 && item1 === item2) {
                usedSteps.push(player1);
                usedSteps.push(player2);
                finalSteps.push(`Player ${giver1} gives ${item1} to Player ${receiver2}`);
            }
        }
    }

    steps = steps.filter(step => !usedSteps.includes(step));
    finalSteps.push(...steps);
    return finalSteps;
}

function copySteps(player) {
    const stepsText = document.getElementById(`steps-${player}`).innerText;

    const textarea = document.createElement('textarea');
    textarea.value = stepsText;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    const feedback = document.getElementById(`feedback-${player}`);
    feedback.innerText = `Player ${player}'s steps copied to clipboard!`;
    setTimeout(() => {
        feedback.innerText = '';
    }, 3000);
}

function resetSelections() {
    order = ["", "", ""];
    holdings = [["", "", "", "", "", ""], ["", "", "", "", "", ""], ["", "", "", "", "", ""]];
    updateToggleButtons();
    updateHoldingButtons();
    updateLabels();
    document.getElementById('result').innerHTML = "";
    document.getElementById('holding1').value = "";
    document.getElementById('holding2').value = "";
    document.getElementById('holding3').value = "";
}
