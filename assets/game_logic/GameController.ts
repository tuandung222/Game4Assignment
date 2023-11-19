
// ONLY 1 Game Controller for the whole game, must be singleton
export class GameController {
    cur_board: number[][] = [
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, -1],
        [-1, 0, 0, 0, -1],
        [-1, -1, -1, -1, -1],
    ];
    pre_board: number[][] = this.cur_board;
    // 1 is O, -1 is X
    player: number = 1;
    // choose bot: random, minimax
    opponent_move : Function = random_move;

    constructor(player: number = 1) {
        this.player = player;
    }

    check_win(): boolean {
        // check if the current player has won
        return hasWon(flattenBoard(this.cur_board), this.player);
    }

    check_lose(): boolean {
        // check if the current player has lost
        return hasWon(flattenBoard(this.cur_board), this.player * -1);
    }

    receive_opponent_move(): { cur_board: number[][], pre_board: number[][], player: number, player_move: [number, number][], position_changes: [number, number][] } {
        // get the next move of the opponent
        // return [[from_row1, from_col1], [to_row2, to_col2]] (only 1 move!)
        let move = this.opponent_move(this.pre_board, this.cur_board, this.player * -1, 0, 0);
        let res_obj = this.make_move(move);
        res_obj['player'] = this.player * -1;
        return res_obj;

    }

    get_legal_moves(): [number, number][][] {
        // get all legal moves of the current player
        // return list of moves

        // [[[from_row1, from_col1], [to_row1, to_col1]],
        //  [[from_row2, from_col2], [to_row2, to_col2]],
        //  ...
        //  [[from_rowN, from_colN], [to_rowN, to_colN]]]

        let pre_board: number[] | null = null;
        if (this.pre_board !== null) {
            pre_board = flattenBoard(this.pre_board);
        }
        return legalMove(pre_board, flattenBoard(this.cur_board), this.player).map((move) => {
            return [[Math.floor(move[0] / 5), move[0] % 5], [Math.floor(move[1] / 5), move[1] % 5]];
        });
    }

    make_move(move: [number, number][]):  {cur_board: number[][], pre_board: number[][], player: number, player_move: [number, number][], position_changes: [number, number][]} {
        // make a move for the current player
        // input: [[from_row1, from_col1], [to_row2, to_col2]]
        // move: [[from_row1, from_col1], [to_row2, to_col2]]
        // return a dictionary of the following format:
        // {
        //     'cur_board': current board (2D array),
        //     'pre_board': previous board (2D array),
        //     'player': current player (1 or -1),
        //     'player_move': move (input),
        //     'position_changes': [[x1, y1], [x2, y2], ...] (list of coordinates)
        // }

        const changeBoard = changeState(flattenBoard(this.cur_board), [move[0][0] * 5 + move[0][1], move[1][0] * 5 + move[1][1]], this.player);
        this.pre_board = [...this.cur_board];
        this.cur_board = convertFlatten(changeBoard);

        // compare the difference between the two boards
        // position_changes: [[x1, y1], [x2, y2], ...] (list of coordinates)
        let position_changes: [number, number][] = [];
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++){
                if (this.pre_board[i][j] !== this.cur_board[i][j]) {
                    position_changes.push([i, j]);
                }
            }
        }

        let res_obj = {
            cur_board : this.cur_board,
            pre_board : this.pre_board,
            player : this.player,
            player_move: move,
            position_changes: position_changes
        }
        return res_obj
    }




    // stimulation between two agents: random & minimax,
    // is runnable (has tested!)
    play(move_1: Function, move_2: Function): void {
        let preBoard: number[][] | null = null;
        let playBoard = [...this.cur_board];
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
    }
};



function legalMove(preBoard: number[] | null, board: number[], player: number): [number, number][] {
    let legalMove: [number, number][] = [];
    let legalTrap: [number, number][] = [];

    for (let i = 0; i < 25; i++) {
        if (board[i] === player) {
            let legalIndex: number[] = [];

            if (i % 2 === 0) {
                legalIndex = [i - 1, i + 1, i - 4, i + 4, i - 5, i + 5, i - 6, i + 6];
            } else {
                legalIndex = [i - 1, i + 1, i - 5, i + 5];
            }

            for (let index of legalIndex) {
                if (checkValid(board, i, index)) {
                    if (preBoard !== null) {
                        let listCheckTrap: number[] = [];

                        if (index % 2 === 0) {
                            listCheckTrap = [1, 4, 5, 6];
                        } else {
                            listCheckTrap = [1, 5];
                        }

                        for (let check of listCheckTrap) {
                            if (checkIndex(board, index, index - check) && checkIndex(board, index, index + check)) {
                                if (board[index - check] !== player && board[index - check] !== 0 && board[index + check] !== player && board[index + check] !== 0) {
                                    if (preBoard[index - check] === player || preBoard[index - check] === 0) {
                                        legalTrap.push([i, index]);
                                        break;
                                    }
                                    if (preBoard[index + check] === player || preBoard[index + check] === 0) {
                                        legalTrap.push([i, index]);
                                        break;
                                    }
                                    if (preBoard[index] !== 0) {
                                        legalTrap.push([i, index]);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    legalMove.push([i, index]);
                }
            }
        }
    }

    if (legalTrap.length !== 0) {
        return legalTrap;
    } else {
        return legalMove;
    }
}

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
                if (checkIndex(board, index, i) && !(i in array)) {
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
    let output = '';
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            let end = '___';
            if (j === 4) {
                end = ' ';
            }
            if (board[i][j] === 1) {
                output += 'O' + end;
            }
            if (board[i][j] === -1) {
                output += 'X' + end;
            }
            if (board[i][j] === 0) {
                output += '.' + end;
            }
        }
        output += '\n\n\n';
    }
    console.log(output);
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

function evaluateBoard(board: number[], player: number): number {
    if (hasWon(board, player)) {
        return Infinity;
    } else if (hasWon(board, player * -1)) {
        return -Infinity;
    } else {
        let numPlayer_ = numPlayer(board);
        let left = 0;
        let right = 0;
        if (player === 1) {
            left = numPlayer_[0];
            right = numPlayer_[1];
        } else {
            left = numPlayer_[1];
            right = numPlayer_[0];
        }

        return left - right;
    }
}
function minimax(preBoard: any, board: any, player: number, depth: number, alpha: number, beta: number, prePlayer: number): [number, [number, number]] {
    if (hasWon(board, player) || hasWon(board, player * -1) || depth === 0) {
        return [evaluateBoard(board, prePlayer), [0, 0]];
    }

    let best_value: number = 0;
    let moves = legalMove(preBoard, board, player);
    moves.sort(() => Math.random() - 0.5);
    let best_move = moves[0];

    if (player === prePlayer) {
        best_value = -Infinity;
        for (let move of moves) {
            let new_board = changeState(board, move, player);
            let hypothetical_value = minimax(board, new_board, player * -1, depth - 1, alpha, beta, prePlayer)[0];
            if (hypothetical_value > best_value) {
                best_value = hypothetical_value;
                best_move = move;
            }
            alpha = Math.max(alpha, best_value);
            if (alpha >= beta) {
                break;
            }
        }
    } else if (player === prePlayer * -1) {
        best_value = Infinity;
        for (let move of moves) {
            let new_board = changeState(board, move, player);
            let hypothetical_value = minimax(board, new_board, player * -1, depth - 1, alpha, beta, prePlayer)[0];
            if (hypothetical_value < best_value) {
                best_value = hypothetical_value;
                best_move = move;
            }
            beta = Math.min(beta, best_value);
            if (alpha >= beta) {
                break;
            }
        }
    }
    return [best_value, best_move];
}

function random_move(prev_board: any, board: any, player: any, remain_time_x: any, remain_time_o: any): [number, number][] {
    if (prev_board !== null) {
        prev_board = flattenBoard(prev_board);
    }

    let moves = legalMove(prev_board, flattenBoard(board), player);
    moves.sort(() => Math.random() - 0.5);
    let move = moves[0];
    return [[Math.floor(move[0] / 5), move[0] % 5], [Math.floor(move[1] / 5), move[1] % 5]];
}

function minimax_move(prev_board: any, board: any, player: any, remain_time_x: any, remain_time_o: any): [number, number][] {
    if (prev_board !== null) {
        prev_board = flattenBoard(prev_board);
    }
    board = flattenBoard(board);
    let move = minimax(prev_board, board, player, 2, -Infinity, Infinity, player)[1];
    return [[Math.floor(move[0] / 5), move[0] % 5], [Math.floor(move[1] / 5), move[1] % 5]];
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



// let test_obj = new GameController();
// console.log(test_obj.check_win());
// console.log(test_obj.check_lose());
// console.log(test_obj.receive_opponent_move());
// console.log(test_obj.get_legal_moves());
// console.log(test_obj.make_move([[ 0, 2 ], [ 1, 2 ]]));