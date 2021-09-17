if (location.protocol == "https:") {
    var ws = new WebSocket('wss://' + location.host + '/ws/', 'tiktaktoe');
} else {
    var ws = new WebSocket('ws://' + location.host + '/ws/', 'tiktaktoe');
}

var gameState = {
    whosTurn: undefined,
    playerID: undefined,
    board: [0, 0, 0, 0, 0, 0, 0, 0, 0]
};

const winCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [6, 4, 2],
]


// This fills in the DOM with the initial game state
var initializeBoard = () => {
    document.querySelector('.game-info__players-name').innerText = `${gameState.playerID} Player`;
    updateBoard();
}

// This function updates the board and whos turn it is.
var updateBoard = () => {
    let myTurn = gameState.whosTurn === gameState.playerID ? "My Turn" : "Opponents Turn"
    document.querySelector('.game-info__players-turn').innerText = myTurn;

    let board = gameState.board;
    for (let i = 0; i < board.length; i++) {
        let element = document.querySelector(`.game-board__cell[data-id='${i}']`)
        element.classList.remove('game-board__cell--blue')
        element.classList.remove('game-board__cell--red')
        if (board[i] < 0) {
            element.classList.add('game-board__cell--blue')
        }
        if (board[i] > 0) {
            element.classList.add('game-board__cell--red')
        }
    }
    
    checkWin(gameState.board, gameState.playerID)
    
}

// This responds to the server push messages
ws.addEventListener('message', (message) => {
    let action = JSON.parse(message.data);
    let loadingEl = document.querySelector('.game-loading');

    switch (action.type) {
        case 'setup':
            gameState = action.playerData;
            initializeBoard();
            loadingEl.style.display = 'none';
            break
        case 'update':
            loadingEl.style.display = 'block';
            gameState.whosTurn = action.whosTurn;
            gameState.board = action.board;
            updateBoard();
            loadingEl.style.display = 'none';
            break;
        default:
            console.error("Invalid action");
    }
});


ws.addEventListener('open', () => {
    document
        .querySelector('.game-board')
        .addEventListener('click', onCellClicked)
})


function onCellClicked(event) {
    let element = event.target;

            if (gameState.playerID === "red") {
                gameState.board[element.dataset.id] = 1 // For when red plays
            } else {
                gameState.board[element.dataset.id] = -1 // For blue plays
            }


            let message = {
                type: 'move',
                playerID: gameState.playerID,
                cellID: parseInt(element.dataset.id, 10),
                whosTurn: gameState.playerID === "red" ? "blue" : "red",
                board: gameState.board
            }

            ws.send(JSON.stringify(message));
}

function checkWin(board = [], playerID) {
    let playerSymbol = playerID === "red" ? 1 : -1;
    
    let redConsecPlays = board.reduce((previousValue, currentValue, currentIndex) => (currentValue === 1) ? previousValue.concat(currentIndex) : previousValue, [])
    
    let blueConsecPlays = board.reduce((previousValue, currentValue, currentIndex) => (currentValue === -1) ? previousValue.concat(currentIndex) : previousValue, [])
    
    let gameWon = null
    for (let [index, win] of winCombinations.entries()) {
        
        if (win.every(value => redConsecPlays.indexOf(value) > -1)) { // checking if red wins
            gameWon = {index: index, player: 'red'}
            declareWinner(gameWon.player)
            break
        } else if (win.every(value => blueConsecPlays.indexOf(value) > -1)) { // checking if blue wins
            gameWon = {index: index, player: 'blue'}
            declareWinner(gameWon.player)
            break
        } else {
            checkTie()
        }
        
    }
    return gameWon
}

function gameOver() {
    document.querySelector('.game-board').removeEventListener('click', onCellClicked, false)
        
    document.querySelector('.endgame').style.display = 'block'
}

function declareWinner(winnerID) {
   
    var winnerText = ''
    if (winnerID === gameState.playerID){
        winnerText = 'You Won'
    } else if (winnerID == 'tie') {
        winnerText = 'It a draw'
    } else {
        winnerText = 'You Loose'
    }
    document.querySelector('.game-info__players-turn').innerText = winnerText;
    
    
    console.log("Game Over & Finished..")
    gameOver()
}

function checkTie() {
    if (gameState.board.filter(play => play === 0).length === 0 ) {
        declareWinner('tie')
        return true
    }
    return false;
}

function reset() {
    let message = {
        type: 'update',
        playerID: gameState.playerID,
        cellID: 0,
        whosTurn: "red",
        board: gameState.board.map(value => value = 0)
    }
    
    gameState.board = gameState.board.map(value => value = 0)
    gameState.whosTurn = 'red'
    
    ws.send(JSON.stringify(message));
    
    document
    .querySelector('.game-board')
    .addEventListener('click', onCellClicked)
    
    updateBoard()
}
