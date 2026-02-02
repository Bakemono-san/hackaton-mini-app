const EMPTY = 0;      
const PLAYER1 = 1;    
const PLAYER2 = 2;    
const CROSS = 3;      
const DAME1 = 4;      
const DAME2 = 5;      
const NAVIGABLE_CELLS = [EMPTY, CROSS];
function isBlockingCell(cellValue) {
  return !isEmpty(cellValue) && !isOpponentPieceForCapture(cellValue);
}
function isOpponentPieceForCapture(cellValue) {
  return cellValue === PLAYER2 || cellValue === DAME2 || cellValue === PLAYER1 || cellValue === DAME1;
}
const DIRECTIONS = {
  UP: -5,    
  DOWN: 5,   
  LEFT: -1,  
  RIGHT: 1   
};
const BOARD_SIZE = 5;
const TOTAL_CELLS = 25;
const CROSS_INDEX = 12; 
function isValidPosition(index) {
  return index >= 0 && index < TOTAL_CELLS;
}
function indexToCoords(index) {
  return {
    row: Math.floor(index / BOARD_SIZE),
    col: index % BOARD_SIZE
  };
}
function coordsToIndex(row, col) {
  return row * BOARD_SIZE + col;
}
function getDistance(fromIndex, toIndex) {
  const from = indexToCoords(fromIndex);
  const to = indexToCoords(toIndex);
  return {
    rowDiff: to.row - from.row,
    colDiff: to.col - from.col
  };
}
function isSameRow(fromIndex, toIndex) {
  const from = indexToCoords(fromIndex);
  const to = indexToCoords(toIndex);
  return from.row === to.row;
}
function isSameCol(fromIndex, toIndex) {
  const from = indexToCoords(fromIndex);
  const to = indexToCoords(toIndex);
  return from.col === to.col;
}
function isCrossCell(index) {
  return index === CROSS_INDEX;
}
function isEmpty(cellValue) {
  return cellValue === EMPTY || cellValue === CROSS;
}
function isPlayerPiece(cellValue, player) {
  if (player === PLAYER1) {
    return cellValue === PLAYER1 || cellValue === DAME1;
  }
  return cellValue === PLAYER2 || cellValue === DAME2;
}
function isDame(cellValue, player) {
  if (player === PLAYER1) {
    return cellValue === DAME1;
  }
  return cellValue === DAME2;
}
function isOpponentPiece(cellValue, player) {
  const opponent = player === PLAYER1 ? PLAYER2 : PLAYER1;
  return cellValue === opponent || cellValue === (player === PLAYER1 ? DAME2 : DAME1);
}
function isLinearMove(fromIndex, toIndex) {
  const dist = getDistance(fromIndex, toIndex);
  return (dist.rowDiff === 0 || dist.colDiff === 0) && !(dist.rowDiff === 0 && dist.colDiff === 0);
}
function isDiagonalMove(fromIndex, toIndex) {
  const dist = getDistance(fromIndex, toIndex);
  return Math.abs(dist.rowDiff) === Math.abs(dist.colDiff) && dist.rowDiff !== 0;
}
function isSimpleMove(fromIndex, toIndex, board, player) {
  if (!isEmpty(board[toIndex])) {
    return false;
  }
  const cellValue = board[fromIndex];
  const isPlayerDame = isDame(cellValue, player);
  if (isDiagonalMove(fromIndex, toIndex)) {
    return false;
  }
  if (!isLinearMove(fromIndex, toIndex)) {
    return false;
  }
  const dist = getDistance(fromIndex, toIndex);
  if (isPlayerDame) {
    return isPathClear(fromIndex, toIndex, board);
  } else {
    const rowDiff = Math.abs(dist.rowDiff);
    const colDiff = Math.abs(dist.colDiff);
    const totalDiff = rowDiff + colDiff;
    if (totalDiff !== 1) {
      return false; 
    }
    if (player === PLAYER1) {
      if (dist.rowDiff < 0) {
        return false; 
      }
    } else {
      if (dist.rowDiff > 0) {
        return false; 
      }
    }
    return true;
  }
}
function isPathClear(fromIndex, toIndex, board) {
  const from = indexToCoords(fromIndex);
  const to = indexToCoords(toIndex);
  const rowStep = from.row < to.row ? 1 : (from.row > to.row ? -1 : 0);
  const colStep = from.col < to.col ? 1 : (from.col > to.col ? -1 : 0);
  let currentRow = from.row + rowStep;
  let currentCol = from.col + colStep;
  while (currentRow !== to.row || currentCol !== to.col) {
    const currentIndex = coordsToIndex(currentRow, currentCol);
    if (!isEmpty(board[currentIndex])) {
      return false;
    }
    currentRow += rowStep;
    currentCol += colStep;
  }
  return true;
}
function getPossibleCaptures(fromIndex, board, player) {
  const captures = [];
  const cellValue = board[fromIndex];
  const isPlayerDame = isDame(cellValue, player);
  const directions = [
    { dir: DIRECTIONS.UP, rowDiff: -1, name: 'UP' },
    { dir: DIRECTIONS.DOWN, rowDiff: 1, name: 'DOWN' },
    { dir: DIRECTIONS.LEFT, colDiff: -1, name: 'LEFT' },
    { dir: DIRECTIONS.RIGHT, colDiff: 1, name: 'RIGHT' }
  ];
  for (const direction of directions) {
    if (isPlayerDame) {
      const dameCaptures = getDameCapturesInDirection(fromIndex, board, player, direction.dir);
      captures.push(...dameCaptures);
    } else {
      const pawnCapture = getPawnCaptureInDirection(fromIndex, board, player, direction.dir);
      if (pawnCapture) {
        captures.push(pawnCapture);
      }
    }
  }
  return captures;
}
function getPawnCaptureInDirection(fromIndex, board, player, direction) {
  const targetIndex = fromIndex + direction;
  if (!isValidPosition(targetIndex)) {
    return null;
  }
  const dist = getDistance(fromIndex, targetIndex);
  if (player === PLAYER1 && dist.rowDiff < 0) {
    return null;
  }
  if (player === PLAYER2 && dist.rowDiff > 0) {
    return null;
  }
  if (!isOpponentPiece(board[targetIndex], player)) {
    return null;
  }
  const afterCaptureIndex = targetIndex + direction;
  const afterCoords = indexToCoords(afterCaptureIndex);
  const fromCoords = indexToCoords(fromIndex);
  if (direction === DIRECTIONS.LEFT || direction === DIRECTIONS.RIGHT) {
    if (afterCoords.row !== fromCoords.row) {
      return null;
    }
  }
  if (direction === DIRECTIONS.UP || direction === DIRECTIONS.DOWN) {
    if (afterCoords.col !== fromCoords.col) {
      return null;
    }
  }
  if (!isValidPosition(afterCaptureIndex)) {
    return null;
  }
  if (!isEmpty(board[afterCaptureIndex])) {
    return null;
  }
  return {
    toIndex: afterCaptureIndex,
    capturedIndex: targetIndex
  };
}
function getDameCapturesInDirection(fromIndex, board, player, direction) {
  const captures = [];
  const fromCoords = indexToCoords(fromIndex);
  let currentIndex = fromIndex + direction;
  let opponentIndex = null;
  let opponentFound = false;
  while (isValidPosition(currentIndex)) {
    const currentCoords = indexToCoords(currentIndex);
    if (direction === DIRECTIONS.LEFT || direction === DIRECTIONS.RIGHT) {
      if (currentCoords.row !== fromCoords.row) {
        break;
      }
    }
    if (direction === DIRECTIONS.UP || direction === DIRECTIONS.DOWN) {
      if (currentCoords.col !== fromCoords.col) {
        break;
      }
    }
    const cellValue = board[currentIndex];
    if (opponentFound) {
      if (isEmpty(cellValue)) {
        captures.push({
          toIndex: currentIndex,
          capturedIndex: opponentIndex
        });
      } else {
        break;
      }
    } else {
      if (isOpponentPiece(cellValue, player)) {
        opponentFound = true;
        opponentIndex = currentIndex;
      } else if (!isEmpty(cellValue)) {
        break;
      }
    }
    currentIndex += direction;
  }
  return captures;
}
function getAllPossibleCaptures(board, player) {
  const allCaptures = [];
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (isPlayerPiece(board[i], player)) {
      const captures = getPossibleCaptures(i, board, player);
      for (const capture of captures) {
        allCaptures.push({
          fromIndex: i,
          toIndex: capture.toIndex,
          capturedIndex: capture.capturedIndex
        });
      }
    }
  }
  return allCaptures;
}
function validateMove(fromIndex, toIndex, board, player) {
  if (!isPlayerPiece(board[fromIndex], player)) {
    return { valid: false, isCapture: false, captureData: null };
  }
  const captures = getPossibleCaptures(fromIndex, board, player);
  const captureMove = captures.find(c => c.toIndex === toIndex);
  if (captureMove) {
    return {
      valid: true,
      isCapture: true,
      captureData: {
        toIndex: captureMove.toIndex,
        capturedIndex: captureMove.capturedIndex
      }
    };
  }
  if (isSimpleMove(fromIndex, toIndex, board, player)) {
    return { valid: true, isCapture: false, captureData: null };
  }
  return { valid: false, isCapture: false, captureData: null };
}
function getAllLegalMoves(board, player) {
  const moves = [];
  const allCaptures = getAllPossibleCaptures(board, player);
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (isPlayerPiece(board[i], player)) {
      const captures = getPossibleCaptures(i, board, player);
      for (const capture of captures) {
        moves.push({
          fromIndex: i,
          toIndex: capture.toIndex,
          isCapture: true,
          captureData: capture
        });
      }
      if (captures.length === 0) {
        const possibleMoves = getSimpleMoves(i, board, player);
        for (const move of possibleMoves) {
          moves.push({
            fromIndex: i,
            toIndex: move,
            isCapture: false,
            captureData: null
          });
        }
      }
    }
  }
  return moves;
}
function getSimpleMoves(fromIndex, board, player) {
  const moves = [];
  const cellValue = board[fromIndex];
  const isPlayerDame = isDame(cellValue, player);
  const fromCoords = indexToCoords(fromIndex);
  if (isPlayerDame) {
    const directions = [
      { dir: DIRECTIONS.UP, rowDiff: -1 },
      { dir: DIRECTIONS.DOWN, rowDiff: 1 },
      { dir: DIRECTIONS.LEFT, colDiff: -1 },
      { dir: DIRECTIONS.RIGHT, colDiff: 1 }
    ];
    for (const direction of directions) {
      let currentIndex = fromIndex + direction.dir;
      let step = 0;
      while (isValidPosition(currentIndex)) {
        const currentCoords = indexToCoords(currentIndex);
        if (direction.dir === DIRECTIONS.LEFT || direction.dir === DIRECTIONS.RIGHT) {
          if (currentCoords.row !== fromCoords.row) break;
        }
        if (direction.dir === DIRECTIONS.UP || direction.dir === DIRECTIONS.DOWN) {
          if (currentCoords.col !== fromCoords.col) break;
        }
        const cellValue = board[currentIndex];
        if (isEmpty(cellValue) || isCrossCell(currentIndex)) {
          moves.push(currentIndex);
          step++;
          currentIndex += direction.dir;
        } else {
          break; 
        }
      }
    }
  } else {
    const directions = [];
    if (player === PLAYER1) {
      directions.push(DIRECTIONS.DOWN);
      directions.push(DIRECTIONS.LEFT);
      directions.push(DIRECTIONS.RIGHT);
    } else {
      directions.push(DIRECTIONS.UP);
      directions.push(DIRECTIONS.LEFT);
      directions.push(DIRECTIONS.RIGHT);
    }
    for (const direction of directions) {
      const targetIndex = fromIndex + direction;
      if (!isValidPosition(targetIndex)) {
        continue;
      }
      const targetCoords = indexToCoords(targetIndex);
      if (direction === DIRECTIONS.LEFT || direction === DIRECTIONS.RIGHT) {
        if (targetCoords.row !== fromCoords.row) continue;
      }
      if (direction === DIRECTIONS.UP || direction === DIRECTIONS.DOWN) {
        if (targetCoords.col !== fromCoords.col) continue;
      }
      if (isEmpty(board[targetIndex])) {
        moves.push(targetIndex);
      }
    }
  }
  return moves;
}
function hasLegalMoves(board, player) {
  const moves = getAllLegalMoves(board, player);
  return moves.length > 0;
}
function canCapture(board, player) {
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (isPlayerPiece(board[i], player)) {
      const captures = getPossibleCaptures(i, board, player);
      if (captures.length > 0) {
        return true;
      }
    }
  }
  return false;
}
function getCapturingPieces(board, player) {
  const capturingPieces = [];
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (isPlayerPiece(board[i], player)) {
      const captures = getPossibleCaptures(i, board, player);
      if (captures.length > 0) {
        capturingPieces.push(i);
      }
    }
  }
  return capturingPieces;
}
function createCaptureState(board, player) {
  return {
    player: player,
    board: [...board],
    capturingPieces: getCapturingPieces(board, player),
    hasCapture: false
  };
}
function shouldPromote(index, player, board) {
  const coords = indexToCoords(index);
  if (player === PLAYER1) {
    if (coords.row === BOARD_SIZE - 1) {
      return true;
    }
  } else {
    if (coords.row === 0) {
      return true;
    }
  }
  const playerPieceCount = countPlayerPieces(board, player);
  if (playerPieceCount === 1) {
    return true;
  }
  return false;
}
function countPlayerPieces(board, player) {
  let count = 0;
  for (const cell of board) {
    if (cell === player || cell === (player === PLAYER1 ? DAME1 : DAME2)) {
      count++;
    }
  }
  return count;
}
function promotePiece(board, index, player) {
  const newBoard = [...board];
  if (player === PLAYER1) {
    newBoard[index] = DAME1; 
  } else {
    newBoard[index] = DAME2;
  }
  return newBoard;
}
function checkAllPromotions(board, player) {
  const playerPieceCount = countPlayerPieces(board, player);
  if (playerPieceCount > 1) {
    return { board, promoted: false };
  }
  const newBoard = [...board];
  let promoted = false;
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (isPlayerPiece(newBoard[i], player) && !isDame(newBoard[i], player)) {
      if (player === PLAYER1) {
        newBoard[i] = DAME1;
      } else {
        newBoard[i] = DAME2;
      }
      promoted = true;
      break; 
    }
  }
  return { board: newBoard, promoted };
}
function checkPromotion(board, lastMoveIndex, player) {
  const cellValue = board[lastMoveIndex];
  if (cellValue !== PLAYER1 && cellValue !== PLAYER2) {
    return { board, promoted: false };
  }
  if (shouldPromote(lastMoveIndex, player, board)) {
    if (board[lastMoveIndex] !== cellValue) {
      console.error('Promotion error: piece value changed unexpectedly');
      return { board, promoted: false };
    }
    const newBoard = promotePiece(board, lastMoveIndex, player);
    if (newBoard[lastMoveIndex] === EMPTY) {
      console.error('Promotion error: piece was removed from the board!');
      newBoard[lastMoveIndex] = cellValue;
      return { board: newBoard, promoted: false };
    }
    return { board: newBoard, promoted: true };
  }
  return { board, promoted: false };
}
function hasPieces(board, player) {
  for (const cell of board) {
    if (isPlayerPiece(cell, player)) {
      return true;
    }
  }
  return false;
}
function checkGameOver(board, currentPlayer) {
  const opponent = currentPlayer === PLAYER1 ? PLAYER2 : PLAYER1;
  if (!hasPieces(board, PLAYER1)) {
    return { gameOver: true, winner: PLAYER2, reason: 'Le joueur 1 n\'a plus de pions' };
  }
  if (!hasPieces(board, PLAYER2)) {
    return { gameOver: true, winner: PLAYER1, reason: 'Le joueur 2 n\'a plus de pions' };
  }
  const player1Count = countPlayerPieces(board, PLAYER1);
  const player2Count = countPlayerPieces(board, PLAYER2);
  if (player1Count === 1 && player2Count === 1) {
    return { gameOver: true, winner: null, reason: 'Match nul - chaque joueur n\'a qu\'un seul pion' };
  }
  if (!hasLegalMoves(board, currentPlayer)) {
    return { gameOver: true, winner: opponent, reason: 'Le joueur actuel n\'a plus de coups possibles' };
  }
  return { gameOver: false, winner: null, reason: '' };
}
function canMoveFrom(index, board, player) {
  if (!isPlayerPiece(board[index], player)) {
    return false;
  }
  const captures = getPossibleCaptures(index, board, player);
  if (captures.length > 0) {
    return true;
  }
  const simpleMoves = getSimpleMoves(index, board, player);
  return simpleMoves.length > 0;
}
function makeMove(board, fromIndex, toIndex, player, isCapture, capturedIndex) {
  const newBoard = [...board];
  newBoard[fromIndex] = EMPTY;
  newBoard[toIndex] = board[fromIndex];
  if (isCapture && capturedIndex !== undefined) {
    newBoard[capturedIndex] = EMPTY;
  }
  const promotionResult = checkPromotion(newBoard, toIndex, player);
  return {
    newBoard: promotionResult.board,
    promoted: promotionResult.promoted,
    isCapture: isCapture,
    capturedIndex: capturedIndex
  };
}
function surPlace(previousBoard, fromIndex, player) {
  const newBoard = [...previousBoard];
  if (isPlayerPiece(newBoard[fromIndex], player)) {
    newBoard[fromIndex] = EMPTY;
  }
  return newBoard;
}
function initBoard() {
  const board = new Array(TOTAL_CELLS).fill(EMPTY);
  for (let i = 0; i < 12; i++) {
    if (i !== CROSS_INDEX) {
      board[i] = PLAYER1;
    }
  }
  for (let i = 13; i < TOTAL_CELLS; i++) {
    board[i] = PLAYER2;
  }
  return board;
}
function getScores(board) {
  let player1 = 0;
  let player2 = 0;
  for (const cell of board) {
    if (cell === PLAYER1 || cell === DAME1) {
      player1++;
    } else if (cell === PLAYER2 || cell === DAME2) {
      player2++;
    }
  }
  return { player1, player2 };
}
function getPlayer1Victories() {
  try {
    return wx.getStorageSync('player1Victories') || 0;
  } catch (e) {
    return 0;
  }
}
function getPlayer2Victories() {
  try {
    return wx.getStorageSync('player2Victories') || 0;
  } catch (e) {
    return 0;
  }
}
function saveVictories(victories1, victories2) {
  try {
    wx.setStorageSync('player1Victories', victories1);
    wx.setStorageSync('player2Victories', victories2);
  } catch (e) {
    console.error('Erreur lors de la sauvegarde des victoires:', e);
  }
}
function incrementVictory(player) {
  let victories1 = getPlayer1Victories();
  let victories2 = getPlayer2Victories();
  if (player === PLAYER1) {
    victories1++;
  } else if (player === PLAYER2) {
    victories2++;
  }
  saveVictories(victories1, victories2);
  return { victories1, victories2 };
}
function resetVictories() {
  try {
    wx.removeStorageSync('player1Victories');
    wx.removeStorageSync('player2Victories');
  } catch (e) {
    console.error('Erreur lors de la réinitialisation des victoires:', e);
  }
}
function printBoard(board) {
  let output = '\n';
  for (let row = 0; row < BOARD_SIZE; row++) {
    let rowStr = '  ';
    for (let col = 0; col < BOARD_SIZE; col++) {
      const index = coordsToIndex(row, col);
      const cell = board[index];
      let char = '.';
      if (cell === PLAYER1) char = '1';
      else if (cell === PLAYER2) char = '2';
      else if (cell === CROSS) char = 'X';
      else if (cell === DAME1) char = 'D1';
      else if (cell === DAME2) char = 'D2';
      rowStr += char + ' ';
    }
    output += rowStr + '\n';
  }
  console.log(output);
}
module.exports = {
  EMPTY,
  PLAYER1,
  PLAYER2,
  CROSS,
  DAME1,
  DAME2,
  DIRECTIONS,
  BOARD_SIZE,
  TOTAL_CELLS,
  CROSS_INDEX,
  isValidPosition,
  indexToCoords,
  coordsToIndex,
  getDistance,
  isSameRow,
  isSameCol,
  isCrossCell,
  isEmpty,
  isPlayerPiece,
  isDame,
  isOpponentPiece,
  isLinearMove,
  isDiagonalMove,
  isSimpleMove,
  isPathClear,
  getSimpleMoves,
  getPossibleCaptures,
  getPawnCaptureInDirection,
  getDameCapturesInDirection,
  getAllPossibleCaptures,
  validateMove,
  getAllLegalMoves,
  hasLegalMoves,
  canCapture,
  getCapturingPieces,
  createCaptureState,
  shouldPromote,
  countPlayerPieces,
  promotePiece,
  checkPromotion,
  checkAllPromotions,
  hasPieces,
  checkGameOver,
  canMoveFrom,
  makeMove,
  surPlace,
  initBoard,
  getScores,
  getPlayer1Victories,
  getPlayer2Victories,
  saveVictories,
  incrementVictory,
  resetVictories,
  printBoard
};

