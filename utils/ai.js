const Game = require('./game.js');
const MAX_DEPTH = 4; 
const INFINITY = 1000000;
const WEIGHTS = {
  PIECE: 100,           
  DAME: 300,            
  MOBILITY: 5,         
  POSITION: 2,          
  CAPTURE_THREAT: 10,   
  SURPLACE_PENALTY: 150 
};
function evaluateBoard(board, player) {
  const opponent = player === Game.PLAYER1 ? Game.PLAYER2 : Game.PLAYER1;
  let score = 0;
  let playerPieces = 0;
  let playerDames = 0;
  let opponentPieces = 0;
  let opponentDames = 0;
  for (let i = 0; i < Game.TOTAL_CELLS; i++) {
    const cell = board[i];
    if (cell === player) {
      playerPieces++;
      score += WEIGHTS.PIECE;
      score += evaluatePosition(i, player);
    } else if (cell === (player === Game.PLAYER1 ? Game.DAME1 : Game.DAME2)) {
      playerDames++;
      score += WEIGHTS.DAME;
    } else if (cell === opponent) {
      opponentPieces++;
      score -= WEIGHTS.PIECE;
      score -= evaluatePosition(i, opponent);
    } else if (cell === (opponent === Game.PLAYER1 ? Game.DAME1 : Game.DAME2)) {
      opponentDames++;
      score -= WEIGHTS.DAME;
    }
  }
  const playerMoves = Game.getAllLegalMoves(board, player);
  const opponentMoves = Game.getAllLegalMoves(board, opponent);
  score += playerMoves.length * WEIGHTS.MOBILITY;
  score -= opponentMoves.length * WEIGHTS.MOBILITY;
  const playerCaptures = Game.getAllPossibleCaptures(board, player);
  const opponentCaptures = Game.getAllPossibleCaptures(board, opponent);
  score += playerCaptures.length * WEIGHTS.CAPTURE_THREAT;
  score -= opponentCaptures.length * WEIGHTS.CAPTURE_THREAT;
  const playerCapturingPieces = Game.getCapturingPieces(board, player);
  if (playerCapturingPieces.length > 0) {
    score -= WEIGHTS.SURPLACE_PENALTY;
  }
  return score;
}
function evaluatePosition(index, player) {
  const coords = Game.indexToCoords(index);
  let bonus = 0;
  if (player === Game.PLAYER1) {
    bonus += coords.row * WEIGHTS.POSITION;
  } else {
    bonus += (Game.BOARD_SIZE - 1 - coords.row) * WEIGHTS.POSITION;
  }
  const centerCol = Math.floor(Game.BOARD_SIZE / 2);
  const colDistance = Math.abs(coords.col - centerCol);
  bonus += (Game.BOARD_SIZE - colDistance) * WEIGHTS.POSITION * 0.5;
  return bonus;
}
function minimax(board, depth, alpha, beta, isMaximizing, player) {
  const currentPlayer = isMaximizing ? player : (player === Game.PLAYER1 ? Game.PLAYER2 : Game.PLAYER1);
  const gameOver = Game.checkGameOver(board, currentPlayer);
  if (gameOver.gameOver) {
    if (gameOver.winner === player) {
      return INFINITY - (MAX_DEPTH - depth);
    } else {
      return -INFINITY + (MAX_DEPTH - depth);
    }
  }
  if (depth === 0) {
    return evaluateBoard(board, player);
  }
  const moves = Game.getAllLegalMoves(board, currentPlayer);
  if (moves.length === 0) {
    return isMaximizing ? -INFINITY : INFINITY;
  }
  if (isMaximizing) {
    let maxEval = -INFINITY;
    for (const move of moves) {
      const result = Game.makeMove(
        board,
        move.fromIndex,
        move.toIndex,
        currentPlayer,
        move.isCapture,
        move.captureData ? move.captureData.capturedIndex : undefined
      );
      const evalScore = minimax(result.newBoard, depth - 1, alpha, beta, false, player);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) {
        break;
      }
    }
    return maxEval;
  } else {
    let minEval = INFINITY;
    for (const move of moves) {
      const result = Game.makeMove(
        board,
        move.fromIndex,
        move.toIndex,
        currentPlayer,
        move.isCapture,
        move.captureData ? move.captureData.capturedIndex : undefined
      );
      const evalScore = minimax(result.newBoard, depth - 1, alpha, beta, true, player);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) {
        break; 
      }
    }
    return minEval;
  }
}
function getBestMove(board, player) {
  const moves = Game.getAllLegalMoves(board, player);
  if (moves.length === 0) {
    return null;
  }
  if (moves.length === 1) {
    return moves[0];
  }
  let bestMove = null;
  let bestScore = -INFINITY;
  const sortedMoves = sortMovesByPriority(moves, board, player);
  for (const move of sortedMoves) {
    const result = Game.makeMove(
      board,
      move.fromIndex,
      move.toIndex,
      player,
      move.isCapture,
      move.captureData ? move.captureData.capturedIndex : undefined
    );
    const score = minimax(result.newBoard, MAX_DEPTH - 1, -INFINITY, INFINITY, false, player);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}
function sortMovesByPriority(moves, board, player) {
  return moves.sort((a, b) => {
    if (a.isCapture && !b.isCapture) return -1;
    if (!a.isCapture && b.isCapture) return 1;
    const aIsDame = Game.isDame(board[a.fromIndex], player);
    const bIsDame = Game.isDame(board[b.fromIndex], player);
    if (aIsDame && !bIsDame) return -1;
    if (!aIsDame && bIsDame) return 1;
    const aCoords = Game.indexToCoords(a.toIndex);
    const bCoords = Game.indexToCoords(b.toIndex);
    if (player === Game.PLAYER1) {
      return bCoords.row - aCoords.row;  
    } else {
      return aCoords.row - bCoords.row; 
    }
  });
}
function getContinueCapture(board, pieceIndex, player) {
  const captures = Game.getPossibleCaptures(pieceIndex, board, player);
  if (captures.length === 0) {
    return null;
  }
  if (captures.length === 1) {
    return {
      fromIndex: pieceIndex,
      toIndex: captures[0].toIndex,
      isCapture: true,
      captureData: captures[0]
    };
  }
  let bestCapture = null;
  let bestScore = -INFINITY;
  for (const capture of captures) {
    const result = Game.makeMove(
      board,
      pieceIndex,
      capture.toIndex,
      player,
      true,
      capture.capturedIndex
    );
    const score = evaluateBoard(result.newBoard, player);
    if (score > bestScore) {
      bestScore = score;
      bestCapture = {
        fromIndex: pieceIndex,
        toIndex: capture.toIndex,
        isCapture: true,
        captureData: capture
      };
    }
  }
  return bestCapture;
}
function shouldClickSurPlace(surPlaceInfo, currentBoard, aiPlayer) {
  if (!surPlaceInfo || !surPlaceInfo.capturingPieces || surPlaceInfo.capturingPieces.length === 0) {
    return false;
  }
  return true;
}
module.exports = {
  getBestMove,
  getContinueCapture,
  shouldClickSurPlace,
  evaluateBoard,
  MAX_DEPTH
};

