"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameController = void 0;
// ONLY 1 Game Controller for the whole game, must be singleton
var GameController = /** @class */ (function () {
    function GameController(player) {
        if (player === void 0) { player = 1; }
        this.cur_board = [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, -1],
            [-1, 0, 0, 0, -1],
            [-1, -1, -1, -1, -1],
        ];
        this.pre_board = this.cur_board;
        // 1 is O, -1 is X
        this.player = 1;
        // choose bot: random, minimax
        this.opponent_move = random_move;
        this.player = player;
    }
    GameController.prototype.check_win = function () {
        // check if the current player has won
        return hasWon(flattenBoard(this.cur_board), this.player);
    };
    GameController.prototype.check_lose = function () {
        // check if the current player has lost
        return hasWon(flattenBoard(this.cur_board), this.player * -1);
    };
    GameController.prototype.receive_opponent_move = function () {
        // get the next move of the opponent
        // return [[from_row1, from_col1], [to_row2, to_col2]] (only 1 move!)
        var move = this.opponent_move(this.pre_board, this.cur_board, this.player * -1, 0, 0);
        var res_obj = this.make_move(move);
        res_obj['player'] = this.player * -1;
        return res_obj;
    };
    GameController.prototype.get_legal_moves = function () {
        // get all legal moves of the current player
        // return list of moves
        // [[[from_row1, from_col1], [to_row1, to_col1]],
        //  [[from_row2, from_col2], [to_row2, to_col2]],
        //  ...
        //  [[from_rowN, from_colN], [to_rowN, to_colN]]]
        var pre_board = null;
        if (this.pre_board !== null) {
            pre_board = flattenBoard(this.pre_board);
        }
        return legalMove(pre_board, flattenBoard(this.cur_board), this.player).map(function (move) {
            return [[Math.floor(move[0] / 5), move[0] % 5], [Math.floor(move[1] / 5), move[1] % 5]];
        });
    };
    GameController.prototype.make_move = function (move) {
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
        var changeBoard = changeState(flattenBoard(this.cur_board), [move[0][0] * 5 + move[0][1], move[1][0] * 5 + move[1][1]], this.player);
        this.pre_board = __spreadArray([], this.cur_board, true);
        this.cur_board = convertFlatten(changeBoard);
        // compare the difference between the two boards
        // position_changes: [[x1, y1], [x2, y2], ...] (list of coordinates)
        var position_changes = [];
        for (var i = 0; i < 5; i++) {
            for (var j = 0; j < 5; j++) {
                if (this.pre_board[i][j] !== this.cur_board[i][j]) {
                    position_changes.push([i, j]);
                }
            }
        }
        var res_obj = {
            cur_board: this.cur_board,
            pre_board: this.pre_board,
            player: this.player,
            player_move: move,
            position_changes: position_changes
        };
        return res_obj;
    };
    // stimulation between two agents: random & minimax,
    // is runnable (has tested!)
    GameController.prototype.play = function (move_1, move_2) {
        var preBoard = null;
        var playBoard = __spreadArray([], this.cur_board, true);
        printBoard(playBoard);
        console.log('---------------------------------------------');
        while (!hasWon(flattenBoard(playBoard), 1) && !hasWon(flattenBoard(playBoard), -1)) {
            var result = move_1(preBoard, playBoard, 1, 0, 0);
            var changeBoard = changeState(flattenBoard(playBoard), [result[0][0] * 5 + result[0][1], result[1][0] * 5 + result[1][1]], 1);
            preBoard = __spreadArray([], playBoard, true);
            playBoard = convertFlatten(changeBoard);
            console.log('-- O turn --');
            console.log(result);
            printBoard(playBoard);
            if (!hasWon(flattenBoard(playBoard), 1) && !hasWon(flattenBoard(playBoard), -1)) {
                console.log('---------------------------------------------');
                var result_1 = move_2(preBoard, playBoard, -1, 0, 0);
                var changeBoard_1 = changeState(flattenBoard(playBoard), [result_1[0][0] * 5 + result_1[0][1], result_1[1][0] * 5 + result_1[1][1]], -1);
                preBoard = __spreadArray([], playBoard, true);
                playBoard = convertFlatten(changeBoard_1);
                console.log('-- X turn --');
                console.log(result_1);
                printBoard(playBoard);
            }
        }
    };
    return GameController;
}());
exports.GameController = GameController;
;
function legalMove(preBoard, board, player) {
    var legalMove = [];
    var legalTrap = [];
    for (var i = 0; i < 25; i++) {
        if (board[i] === player) {
            var legalIndex = [];
            if (i % 2 === 0) {
                legalIndex = [i - 1, i + 1, i - 4, i + 4, i - 5, i + 5, i - 6, i + 6];
            }
            else {
                legalIndex = [i - 1, i + 1, i - 5, i + 5];
            }
            for (var _i = 0, legalIndex_1 = legalIndex; _i < legalIndex_1.length; _i++) {
                var index = legalIndex_1[_i];
                if (checkValid(board, i, index)) {
                    if (preBoard !== null) {
                        var listCheckTrap = [];
                        if (index % 2 === 0) {
                            listCheckTrap = [1, 4, 5, 6];
                        }
                        else {
                            listCheckTrap = [1, 5];
                        }
                        for (var _a = 0, listCheckTrap_1 = listCheckTrap; _a < listCheckTrap_1.length; _a++) {
                            var check = listCheckTrap_1[_a];
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
    }
    else {
        return legalMove;
    }
}
function checkAllSimilar(board, index, player, array) {
    if (checkLegalMoveIndex(board, index) === false) {
        if (checkBlock(board, index, player)[1] === 0) {
            return 1;
        }
        else {
            var neighbors = [];
            if (index % 2 === 0) {
                neighbors.push(index - 1, index + 1, index - 4, index + 4, index - 5, index + 5, index - 6, index + 6);
            }
            else {
                neighbors.push(index - 1, index + 1, index - 5, index + 5);
            }
            var min = 1;
            array.push(index);
            for (var _i = 0, neighbors_1 = neighbors; _i < neighbors_1.length; _i++) {
                var i = neighbors_1[_i];
                if (checkIndex(board, index, i) && !(i in array)) {
                    if (board[i] === player) {
                        var checkMin = checkAllSimilar(board, i, player, array);
                        if (checkMin < min) {
                            min = checkMin;
                        }
                    }
                }
            }
            return min;
        }
    }
    else {
        return -1;
    }
}
function checkIndex(board, i, j) {
    if (j > 24 || j < 0 || board[j] === 0) {
        return false;
    }
    else {
        var distance = Math.abs(i % 5 - j % 5);
        if (distance > 1) {
            return false;
        }
        return true;
    }
}
function checkLegalMoveIndex(board, index) {
    var neighbors = [];
    if (index % 2 === 0) {
        neighbors.push(index - 1, index + 1, index - 4, index + 4, index - 5, index + 5, index - 6, index + 6);
    }
    else {
        neighbors.push(index - 1, index + 1, index - 5, index + 5);
    }
    for (var _i = 0, neighbors_2 = neighbors; _i < neighbors_2.length; _i++) {
        var i = neighbors_2[_i];
        if (checkValid(board, index, i)) {
            return true;
        }
    }
    return false;
}
function changeState(board, move, player) {
    var newBoard = __spreadArray([], board, true);
    newBoard[move[1]] = newBoard[move[0]];
    newBoard[move[0]] = 0;
    var listCheckGanh = [];
    if (move[1] % 2 === 0) {
        listCheckGanh = [1, 4, 5, 6];
    }
    else {
        listCheckGanh = [1, 5];
    }
    for (var _i = 0, listCheckGanh_1 = listCheckGanh; _i < listCheckGanh_1.length; _i++) {
        var index = listCheckGanh_1[_i];
        if (checkIndex(newBoard, move[1], move[1] - index) && checkIndex(newBoard, move[1], move[1] + index)) {
            if (board[move[1] - index] !== player && board[move[1] - index] !== 0 && board[move[1] + index] !== player && board[move[1] + index] !== 0) {
                newBoard[move[1] - index] = player;
                newBoard[move[1] + index] = player;
            }
        }
    }
    for (var i = 0; i < 25; i++) {
        if (i >= 0 && i <= 24 && newBoard[i] === player * -1) {
            if (checkAllSimilar(newBoard, i, player * -1, [i]) === 1) {
                newBoard[i] = player;
            }
        }
    }
    return newBoard;
}
function printBoard(board) {
    var output = '';
    for (var i = 0; i < 5; i++) {
        for (var j = 0; j < 5; j++) {
            var end = '___';
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
function flattenBoard(board) {
    var newBoard = [];
    for (var _i = 0, board_1 = board; _i < board_1.length; _i++) {
        var row = board_1[_i];
        for (var _a = 0, row_1 = row; _a < row_1.length; _a++) {
            var i = row_1[_a];
            newBoard.push(i);
        }
    }
    return newBoard;
}
function checkValid(board, i, j) {
    if (j > 24 || j < 0 || board[j] !== 0) {
        return false;
    }
    else {
        var distance = Math.abs(i % 5 - j % 5);
        if (distance > 1) {
            return false;
        }
        return true;
    }
}
function checkBlock(board, index, player) {
    var neighbors = [];
    if (index % 2 === 0) {
        neighbors = [index - 1, index + 1, index - 4, index + 4, index - 5, index + 5, index - 6, index + 6];
    }
    else {
        neighbors = [index - 1, index + 1, index - 5, index + 5];
    }
    var numEmpty = 0;
    var numSimilar = 0;
    for (var _i = 0, neighbors_3 = neighbors; _i < neighbors_3.length; _i++) {
        var i = neighbors_3[_i];
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
function checkValidIndex(i, j) {
    if (j > 24 || j < 0) {
        return false;
    }
    else {
        var distance = Math.abs(i % 5 - j % 5);
        if (distance > 1) {
            return false;
        }
        return true;
    }
}
function convertFlatten(board) {
    var newBoard = [];
    for (var i = 0; i < 5; i++) {
        var row = [];
        for (var j = 0; j < 5; j++) {
            row.push(board[i * 5 + j]);
        }
        newBoard.push(row);
    }
    return newBoard;
}
function hasWon(board, player) {
    var numPlayer_ = numPlayer(board);
    var result = 0;
    if (player === 1) {
        result = numPlayer_[0];
    }
    else {
        result = numPlayer_[1];
    }
    if (result === 16) {
        return true;
    }
    else {
        return false;
    }
}
function numPlayer(board) {
    var num_first = 0;
    var num_second = 0;
    for (var _i = 0, board_2 = board; _i < board_2.length; _i++) {
        var i = board_2[_i];
        if (i === 1) {
            num_first += 1;
        }
        if (i === -1) {
            num_second += 1;
        }
    }
    return [num_first, num_second];
}
function evaluateBoard(board, player) {
    if (hasWon(board, player)) {
        return Infinity;
    }
    else if (hasWon(board, player * -1)) {
        return -Infinity;
    }
    else {
        var numPlayer_ = numPlayer(board);
        var left = 0;
        var right = 0;
        if (player === 1) {
            left = numPlayer_[0];
            right = numPlayer_[1];
        }
        else {
            left = numPlayer_[1];
            right = numPlayer_[0];
        }
        return left - right;
    }
}
function minimax(preBoard, board, player, depth, alpha, beta, prePlayer) {
    if (hasWon(board, player) || hasWon(board, player * -1) || depth === 0) {
        return [evaluateBoard(board, prePlayer), [0, 0]];
    }
    var best_value = 0;
    var moves = legalMove(preBoard, board, player);
    moves.sort(function () { return Math.random() - 0.5; });
    var best_move = moves[0];
    if (player === prePlayer) {
        best_value = -Infinity;
        for (var _i = 0, moves_1 = moves; _i < moves_1.length; _i++) {
            var move = moves_1[_i];
            var new_board = changeState(board, move, player);
            var hypothetical_value = minimax(board, new_board, player * -1, depth - 1, alpha, beta, prePlayer)[0];
            if (hypothetical_value > best_value) {
                best_value = hypothetical_value;
                best_move = move;
            }
            alpha = Math.max(alpha, best_value);
            if (alpha >= beta) {
                break;
            }
        }
    }
    else if (player === prePlayer * -1) {
        best_value = Infinity;
        for (var _a = 0, moves_2 = moves; _a < moves_2.length; _a++) {
            var move = moves_2[_a];
            var new_board = changeState(board, move, player);
            var hypothetical_value = minimax(board, new_board, player * -1, depth - 1, alpha, beta, prePlayer)[0];
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
function random_move(prev_board, board, player, remain_time_x, remain_time_o) {
    if (prev_board !== null) {
        prev_board = flattenBoard(prev_board);
    }
    var moves = legalMove(prev_board, flattenBoard(board), player);
    moves.sort(function () { return Math.random() - 0.5; });
    var move = moves[0];
    return [[Math.floor(move[0] / 5), move[0] % 5], [Math.floor(move[1] / 5), move[1] % 5]];
}
function minimax_move(prev_board, board, player, remain_time_x, remain_time_o) {
    if (prev_board !== null) {
        prev_board = flattenBoard(prev_board);
    }
    board = flattenBoard(board);
    var move = minimax(prev_board, board, player, 2, -Infinity, Infinity, player)[1];
    return [[Math.floor(move[0] / 5), move[0] % 5], [Math.floor(move[1] / 5), move[1] % 5]];
}
function play(board, move_1, move_2) {
    var preBoard = null;
    var playBoard = __spreadArray([], board, true);
    printBoard(playBoard);
    console.log('---------------------------------------------');
    while (!hasWon(flattenBoard(playBoard), 1) && !hasWon(flattenBoard(playBoard), -1)) {
        var result = move_1(preBoard, playBoard, 1, 0, 0);
        var changeBoard = changeState(flattenBoard(playBoard), [result[0][0] * 5 + result[0][1], result[1][0] * 5 + result[1][1]], 1);
        preBoard = __spreadArray([], playBoard, true);
        playBoard = convertFlatten(changeBoard);
        console.log('-- O turn --');
        console.log(result);
        printBoard(playBoard);
        if (!hasWon(flattenBoard(playBoard), 1) && !hasWon(flattenBoard(playBoard), -1)) {
            console.log('---------------------------------------------');
            var result_2 = move_2(preBoard, playBoard, -1, 0, 0);
            var changeBoard_2 = changeState(flattenBoard(playBoard), [result_2[0][0] * 5 + result_2[0][1], result_2[1][0] * 5 + result_2[1][1]], -1);
            preBoard = __spreadArray([], playBoard, true);
            playBoard = convertFlatten(changeBoard_2);
            console.log('-- X turn --');
            console.log(result_2);
            printBoard(playBoard);
        }
    }
    if (hasWon(flattenBoard(playBoard), 1)) {
        console.log('first/O/func1 win');
    }
    else {
        console.log('second/X/func2 win');
    }
}
var test_obj = new GameController();
console.log(test_obj.check_win());
console.log(test_obj.check_lose());
console.log(test_obj.receive_opponent_move());
console.log(test_obj.get_legal_moves());
console.log(test_obj.make_move([[0, 2], [1, 2]]));
