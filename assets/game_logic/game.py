
import random, copy


import main2 as file1 
import main3 as file2  




initBoard = [[1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, -1],
            [-1, 0, 0, 0, -1],
            [-1, -1, -1, -1, -1]
        ]

def checkAllSimilar(board, index, player, array):
    if checkLegalMoveIndex(board, index) == False:
        if checkBlock(board, index, player)[1] == 0:
            return 1
        else:
            neighbors = []
            if index % 2 == 0:
                neighbors = [index-1, index+1, index-4, index+4, index-5, index+5, index-6, index+6]
            else:
                neighbors = [index-1, index+1, index-5, index+5]
            
            min = 1
            array.append(index)
            for i in neighbors:
                if checkIndex(board, index, i) and ( i not in array):
                    if board[i] == player:
                        checkMin = checkAllSimilar(board, i, player, array)
                        if checkMin < min:
                            min = checkMin
            return min           
    else:
        return -1


def checkIndex(board, i, j): #check valid index not null
    if j > 24 or j < 0 or board[j] == 0:
        return False
    else:
        distance = abs(i % 5 - j % 5)
        if distance > 1:
            return False
        return True

def checkLegalMoveIndex(board, index):
    neighbors = []

    if index % 2 == 0:
        neighbors = [index-1, index+1, index-4, index+4, index-5, index+5, index-6, index+6]
    else:
        neighbors = [index-1, index+1, index-5, index+5]

    for i in neighbors:
        if checkValid(board, index, i):
            return True
    return False



def changeState(board, move, player):
    newBoard = copy.deepcopy(board)
    newBoard[move[1]] = newBoard[move[0]]
    newBoard[move[0]] = 0

    listCheckGanh = []
    if move[1] % 2 == 0:
        listCheckGanh = [1, 4, 5 ,6]
    else:
        listCheckGanh = [1,5]
    for index in listCheckGanh:
        if checkIndex(newBoard, move[1], move[1] - index) and checkIndex(newBoard, move[1], move[1] + index):
            if board[move[1] - index] != player and board[move[1] - index] != 0 and board[move[1] + index] != player and board[move[1] + index] != 0:
                newBoard[move[1] - index] = player
                newBoard[move[1] + index] = player
    
    for i in range(25):
        if i >= 0 and i <= 24 and newBoard[i] == player * -1:
            if checkAllSimilar(newBoard, i, player * -1, [i]) == 1:
                newBoard[i] = player
    
    return newBoard

def printBoard(board):
    for i in range(5):
        for j in range(5):
            end = '___'
            if j == 4:
                end = ' '
            if board[i][j] == 1:
                print('O', end = end)
            if board[i][j] == -1:
                print('X', end = end)
            if board[i][j] == 0:
                print('.', end = end)
        print()
        print()

def printBoardFlatten(board):
    for i in range(5):
        for j in range(5):
            end = '___'
            if j == 4:
                end = ' '
            if board[5 * i + j] == 1:
                print('O', end = end)
            if board[5 * i + j] == -1:
                print('X', end = end)
            if board[5 * i + j] == 0:
                print('.', end = end)
        print()
        print()
        
def flattenBoard(board):
    newBoard = []
    for row in board:
        for i in row:
            newBoard.append(i)
    return newBoard

def checkValid(board, i, j): #check valid index to move
    if j > 24 or j < 0 or board[j] != 0:
        return False
    else:
        distance = abs(i % 5 - j % 5)
        if distance > 1:
            return False
        return True

def checkBlock(board, index, player):
    neighbors = []
    if index % 2 == 0:
        neighbors = [index-1, index+1, index-4, index+4, index-5, index+5, index-6, index+6]
    else:
        neighbors = [index-1, index+1, index-5, index+5]
    
    numEmpty = 0
    numSimilar = 0
    
    for i in neighbors:
        if checkValidIndex(index, i):
            if board[i] == player:
                numSimilar += 1
            if board[i] == 0:
                numEmpty += 1
    return (numEmpty, numSimilar)

def checkValidIndex(i, j): #check valid index
    if j > 24 or j < 0:
        return False
    else:
        distance = abs(i % 5 - j % 5)
        if distance > 1:
            return False
        return True

def convertFlatten(board):
    newBoard = []
    for i in range(5):
        row = []
        for j in range(5):
            row.append(board[i * 5 + j])
        newBoard.append(row)
    return newBoard


def hasWon(board, player):
    numPlayer_ = numPlayer(board)
    result = 0
    if player == 1:
        result = numPlayer_[0]
    else:
        result = numPlayer_[1]
    if result == 16:
        return True
    else:
        return False



def numPlayer(board):
    num_first = 0
    num_second = 0
    for i in board:
        if i == 1:
            num_first += 1
        if i == -1:
            num_second += 1
    return (num_first, num_second)

def play(board, move_1, move_2):
    preBoard = None
    playBoard = copy.deepcopy(board)
    printBoard(playBoard)
    print("---------------------------------------------")
    while not hasWon(flattenBoard(playBoard), 1) and not hasWon(flattenBoard(playBoard), -1):
        result = move_1(preBoard, playBoard, 1, 0, 0)
        changeBoard = changeState(flattenBoard(playBoard), (result[0][0]* 5 + result[0][1], result[1][0]* 5 + result[1][1]), 1)
        preBoard = copy.deepcopy(playBoard)
        playBoard = convertFlatten(changeBoard)
        print("-- O turn --")
        print(result)
        printBoard(playBoard)

        if not hasWon(flattenBoard(playBoard), 1) and not hasWon(flattenBoard(playBoard), -1):
            print("---------------------------------------------")
            result = move_2(preBoard, playBoard, -1, 0, 0)
            changeBoard = changeState(flattenBoard(playBoard), (result[0][0]* 5 + result[0][1], result[1][0]* 5 + result[1][1]), -1)
            preBoard = copy.deepcopy(playBoard)
            playBoard = convertFlatten(changeBoard)
            print("-- X turn --")
            print(result)
            printBoard(playBoard)


    if hasWon(flattenBoard(playBoard), 1):
        print('first/O/func1 win')
    else :
        print('second/X/func2 win')

        


play(initBoard, file1.move, file2.move)// FILEPATH: /d:/Github-clone/game-pro-ass4/assets/game_logic/game.ts

import * as file1 from './main2';
import * as file2 from './main3';

const initBoard = [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, -1],
    [-1, 0, 0, 0, -1],
    [-1, -1, -1, -1, -1],
];

function checkAllSimilar(board: number[], index: number, player: number, array: number[]): number {
    if (checkLegalMoveIndex(board, index) === false) {
        if (checkBlock(board, index, player)[1] === 0) {
            return 1;
        } else {
            const neighbors: number[] = [];
            if (index % 2 === 0) {
                neighbors.push(index - 1, index + 1, index - 4, index + 4, index - 5, index + 5, index - 6, index + 6);
            } else {
                neighbors.push(index - 1, index + 1, index - 5, index + 5);
            }

            let min = 1;
            array.push(index);
            for (const i of neighbors) {
                if (checkIndex(board, index, i) && i not in array) {
                    if (board[i] === player) {
                        const checkMin = checkAllSimilar(board, i, player, array);
                        if (checkMin < min) {
                            min = checkMin;
                        }
                    }
                }
            }
            return min;
        }
    } else {
        return -1;
    }
}

function checkIndex(board: number[], i: number, j: number): boolean {
    if (j > 24 || j < 0 || board[j] === 0) {
        return false;
    } else {
        const distance = Math.abs(i % 5 - j % 5);
        if (distance > 1) {
            return false;
        }
        return true;
    }
}

function checkLegalMoveIndex(board: number[], index: number): boolean {
    const neighbors: number[] = [];

    if (index % 2 === 0) {
        neighbors.push(index - 1, index + 1, index - 4, index + 4, index - 5, index + 5, index - 6, index + 6);
    } else {
        neighbors.push(index - 1, index + 1, index - 5, index + 5);
    }

    for (const i of neighbors) {
        if (checkValid(board, index, i)) {
            return true;
        }
    }
    return false;
}

function changeState(board: number[], move: number[], player: number): number[] {
    const newBoard = [...board];
    newBoard[move[1]] = newBoard[move[0]];
    newBoard[move[0]] = 0;

    let listCheckGanh: number[] = [];
    if (move[1] % 2 === 0) {
        listCheckGanh = [1, 4, 5, 6];
    } else {
        listCheckGanh = [1, 5];
    }
    for (const index of listCheckGanh) {
        if (checkIndex(newBoard, move[1], move[1] - index) && checkIndex(newBoard, move[1], move[1] + index)) {
            if (board[move[1] - index] !== player && board[move[1] - index] !== 0 && board[move[1] + index] !== player && board[move[1] + index] !== 0) {
                newBoard[move[1] - index] = player;
                newBoard[move[1] + index] = player;
            }
        }
    }

    for (let i = 0; i < 25; i++) {
        if (i >= 0 && i <= 24 && newBoard[i] === player * -1) {
            if (checkAllSimilar(newBoard, i, player * -1, [i]) === 1) {
                newBoard[i] = player;
            }
        }
    }

    return newBoard;
}

function printBoard(board: number[][]): void {
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            let end = '___';
            if (j === 4) {
                end = ' ';
            }
            if (board[i][j] === 1) {
                console.log('O', end);
            }
            if (board[i][j] === -1) {
                console.log('X', end);
            }
            if (board[i][j] === 0) {
                console.log('.', end);
            }
        }
        console.log();
        console.log();
    }
}

function printBoardFlatten(board: number[]): void {
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            let end = '___';
            if (j === 4) {
                end = ' ';
            }
            if (board[5 * i + j] === 1) {
                console.log('O', end);
            }
            if (board[5 * i + j] === -1) {
                console.log('X', end);
            }
            if (board[5 * i + j] === 0) {
                console.log('.', end);
            }
        }
        console.log();
        console.log();
    }
}

function flattenBoard(board: number[][]): number[] {
    const newBoard: number[] = [];
    for (const row of board) {
        for (const i of row) {
            newBoard.push(i);
        }
    }
    return newBoard;
}

function checkValid(board: number[], i: number, j: number): boolean {
    if (j > 24 || j < 0 || board[j] !== 0) {
        return false;
    } else {
        const distance = Math.abs(i % 5 - j % 5);
        if (distance > 1) {
            return false;
        }
        return true;
    }
}

function checkBlock(board: number[], index: number, player: number): [number, number] {
    let neighbors: number[] = [];
    if (index % 2 === 0) {
        neighbors = [index - 1, index + 1, index - 4, index + 4, index - 5, index + 5, index - 6, index + 6];
    } else {
        neighbors = [index - 1, index + 1, index - 5, index + 5];
    }

    let numEmpty = 0;
    let numSimilar = 0;

    for (const i of neighbors) {
        if (checkValidIndex(index, i)) {
            if (board[i] === player) {
                numSimilar += 1;
            }
            if (board[i] === 0) {
                numEmpty += 1;
            }
        }
    }
    return [numEmpty, numSimilar];
}

function checkValidIndex(i: number, j: number): boolean {
    if (j > 24 || j < 0) {
        return false;
    } else {
        const distance = Math.abs(i % 5 - j % 5);
        if (distance > 1) {
            return false;
        }
        return true;
    }
}

function convertFlatten(board: number[]): number[][] {
    const newBoard: number[][] = [];
    for (let i = 0; i < 5; i++) {
        const row: number[] = [];
        for (let j = 0; j < 5; j++) {
            row.push(board[i * 5 + j]);
        }
        newBoard.push(row);
    }
    return newBoard;
}

function hasWon(board: number[], player: number): boolean {
    const numPlayer_ = numPlayer(board);
    let result = 0;
    if (player === 1) {
        result = numPlayer_[0];
    } else {
        result = numPlayer_[1];
    }
    if (result === 16) {
        return true;
    } else {
        return false;
    }
}

function numPlayer(board: number[]): [number, number] {
    let num_first = 0;
    let num_second = 0;
    for (const i of board) {
        if (i === 1) {
            num_first += 1;
        }
        if (i === -1) {
            num_second += 1;
        }
    }
    return [num_first, num_second];
}

function play(board: number[][], move_1: Function, move_2: Function): void {
    let preBoard: number[][] | null = null;
    let playBoard = [...board];
    printBoard(playBoard);
    console.log('---------------------------------------------');
    while (!hasWon(flattenBoard(playBoard), 1) && !hasWon(flattenBoard(playBoard), -1)) {
        const result = move_1(preBoard, playBoard, 1, 0, 0);
        const changeBoard = changeState(flattenBoard(playBoard), [result[0][0] * 5 + result[0][1], result[1][0] * 5 + result[1][1]], 1);
        preBoard = [...playBoard];
        playBoard = convertFlatten(changeBoard);
        console.log('-- O turn --');
        console.log(result);
        printBoard(playBoard);

        if (!hasWon(flattenBoard(playBoard), 1) && !hasWon(flattenBoard(playBoard), -1)) {
            console.log('---------------------------------------------');
            const result = move_2(preBoard, playBoard, -1, 0, 0);
            const changeBoard = changeState(flattenBoard(playBoard), [result[0][0] * 5 + result[0][1], result[1][0] * 5 + result[1][1]], -1);
            preBoard = [...playBoard];
            playBoard = convertFlatten(changeBoard);
            console.log('-- X turn --');
            console.log(result);
            printBoard(playBoard);
        }
    }

    if (hasWon(flattenBoard(playBoard), 1)) {
        console.log('first/O/func1 win');
    } else {
        console.log('second/X/func2 win');
    }
}

play(initBoard, file1.move, file2.move);
