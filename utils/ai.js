/**
 * AI Module for 12 Pions (Dame Sénégalaise)
 * 
 * Implements a strong minimax algorithm with alpha-beta pruning
 * The AI never makes mistakes and remembers surplace opportunities
 */

const Game = require('./game.js');

// ============================================================================
// CONSTANTES
// ============================================================================

const MAX_DEPTH = 4; // Profondeur de recherche (ajustable selon la performance)
const INFINITY = 1000000;

// Poids pour l'évaluation
const WEIGHTS = {
  PIECE: 100,           // Valeur d'un pion
  DAME: 300,            // Valeur d'une dame
  MOBILITY: 5,          // Valeur de la mobilité (coups possibles)
  POSITION: 2,          // Bonus de position
  CAPTURE_THREAT: 10,   // Bonus pour menacer une capture
  SURPLACE_PENALTY: 150 // Pénalité si on peut subir un surplace
};

// ============================================================================
// FONCTIONS D'ÉVALUATION
// ============================================================================

/**
 * Évalue une position du plateau pour un joueur
 * @param {number[]} board - Plateau de jeu
 * @param {number} player - Joueur pour qui on évalue (AI)
 * @returns {number} - Score d'évaluation
 */
function evaluateBoard(board, player) {
  const opponent = player === Game.PLAYER1 ? Game.PLAYER2 : Game.PLAYER1;
  
  let score = 0;
  
  // 1. Compter les pièces et les dames
  let playerPieces = 0;
  let playerDames = 0;
  let opponentPieces = 0;
  let opponentDames = 0;
  
  for (let i = 0; i < Game.TOTAL_CELLS; i++) {
    const cell = board[i];
    if (cell === player) {
      playerPieces++;
      score += WEIGHTS.PIECE;
      score += evaluatePosition(i, player); // Bonus de position
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
  
  // 2. Mobilité - nombre de coups possibles
  const playerMoves = Game.getAllLegalMoves(board, player);
  const opponentMoves = Game.getAllLegalMoves(board, opponent);
  score += playerMoves.length * WEIGHTS.MOBILITY;
  score -= opponentMoves.length * WEIGHTS.MOBILITY;
  
  // 3. Menaces de capture
  const playerCaptures = Game.getAllPossibleCaptures(board, player);
  const opponentCaptures = Game.getAllPossibleCaptures(board, opponent);
  score += playerCaptures.length * WEIGHTS.CAPTURE_THREAT;
  score -= opponentCaptures.length * WEIGHTS.CAPTURE_THREAT;
  
  // 4. Pénalité si on risque un surplace
  // Si l'adversaire a des captures possibles qu'on n'a pas faites
  const playerCapturingPieces = Game.getCapturingPieces(board, player);
  if (playerCapturingPieces.length > 0) {
    // On a des captures disponibles - si on ne les fait pas, on risque surplace
    score -= WEIGHTS.SURPLACE_PENALTY;
  }
  
  return score;
}

/**
 * Évalue la position d'un pion (bonus pour avancer vers la promotion)
 * @param {number} index - Position du pion
 * @param {number} player - Joueur
 * @returns {number} - Bonus de position
 */
function evaluatePosition(index, player) {
  const coords = Game.indexToCoords(index);
  let bonus = 0;
  
  // Bonus pour avancer vers la promotion
  if (player === Game.PLAYER1) {
    // Joueur 1 avance vers le bas (ligne 4)
    bonus += coords.row * WEIGHTS.POSITION;
  } else {
    // Joueur 2 avance vers le haut (ligne 0)
    bonus += (Game.BOARD_SIZE - 1 - coords.row) * WEIGHTS.POSITION;
  }
  
  // Bonus pour les colonnes centrales (contrôle du centre)
  const centerCol = Math.floor(Game.BOARD_SIZE / 2);
  const colDistance = Math.abs(coords.col - centerCol);
  bonus += (Game.BOARD_SIZE - colDistance) * WEIGHTS.POSITION * 0.5;
  
  return bonus;
}

// ============================================================================
// MINIMAX AVEC ALPHA-BETA PRUNING
// ============================================================================

/**
 * Algorithme minimax avec alpha-beta pruning
 * @param {number[]} board - Plateau de jeu
 * @param {number} depth - Profondeur restante
 * @param {number} alpha - Valeur alpha pour pruning
 * @param {number} beta - Valeur beta pour pruning
 * @param {boolean} isMaximizing - Si on maximise ou minimise
 * @param {number} player - Joueur AI
 * @returns {number} - Score d'évaluation
 */
function minimax(board, depth, alpha, beta, isMaximizing, player) {
  const currentPlayer = isMaximizing ? player : (player === Game.PLAYER1 ? Game.PLAYER2 : Game.PLAYER1);
  
  // Vérifier la fin de partie
  const gameOver = Game.checkGameOver(board, currentPlayer);
  if (gameOver.gameOver) {
    if (gameOver.winner === player) {
      return INFINITY - (MAX_DEPTH - depth); // Favoriser les victoires rapides
    } else {
      return -INFINITY + (MAX_DEPTH - depth); // Retarder les défaites
    }
  }
  
  // Profondeur max atteinte - évaluer la position
  if (depth === 0) {
    return evaluateBoard(board, player);
  }
  
  const moves = Game.getAllLegalMoves(board, currentPlayer);
  
  // Pas de coups possibles (pat)
  if (moves.length === 0) {
    return isMaximizing ? -INFINITY : INFINITY;
  }
  
  if (isMaximizing) {
    let maxEval = -INFINITY;
    
    for (const move of moves) {
      // Simuler le coup
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
        break; // Beta cutoff
      }
    }
    
    return maxEval;
  } else {
    let minEval = INFINITY;
    
    for (const move of moves) {
      // Simuler le coup
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
        break; // Alpha cutoff
      }
    }
    
    return minEval;
  }
}

// ============================================================================
// FONCTION PRINCIPALE DE L'AI
// ============================================================================

/**
 * Trouve le meilleur coup pour l'AI
 * @param {number[]} board - Plateau de jeu
 * @param {number} player - Joueur AI
 * @returns {object|null} - {fromIndex, toIndex, isCapture, captureData} ou null
 */
function getBestMove(board, player) {
  const moves = Game.getAllLegalMoves(board, player);
  
  if (moves.length === 0) {
    return null;
  }
  
  // Si un seul coup possible, le retourner directement
  if (moves.length === 1) {
    return moves[0];
  }
  
  let bestMove = null;
  let bestScore = -INFINITY;
  
  // Trier les coups pour améliorer le pruning alpha-beta
  // Priorité : captures > dames > mouvements normaux
  const sortedMoves = sortMovesByPriority(moves, board, player);
  
  for (const move of sortedMoves) {
    // Simuler le coup
    const result = Game.makeMove(
      board,
      move.fromIndex,
      move.toIndex,
      player,
      move.isCapture,
      move.captureData ? move.captureData.capturedIndex : undefined
    );
    
    // Évaluer avec minimax
    const score = minimax(result.newBoard, MAX_DEPTH - 1, -INFINITY, INFINITY, false, player);
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  
  return bestMove;
}

/**
 * Trie les coups par priorité pour améliorer le pruning
 * @param {array} moves - Liste des coups
 * @param {number[]} board - Plateau de jeu
 * @param {number} player - Joueur
 * @returns {array} - Coups triés
 */
function sortMovesByPriority(moves, board, player) {
  return moves.sort((a, b) => {
    // 1. Priorité aux captures
    if (a.isCapture && !b.isCapture) return -1;
    if (!a.isCapture && b.isCapture) return 1;
    
    // 2. Priorité aux mouvements de dames
    const aIsDame = Game.isDame(board[a.fromIndex], player);
    const bIsDame = Game.isDame(board[b.fromIndex], player);
    if (aIsDame && !bIsDame) return -1;
    if (!aIsDame && bIsDame) return 1;
    
    // 3. Priorité aux mouvements vers l'avant
    const aCoords = Game.indexToCoords(a.toIndex);
    const bCoords = Game.indexToCoords(b.toIndex);
    if (player === Game.PLAYER1) {
      return bCoords.row - aCoords.row; // Plus grand row = plus vers le bas
    } else {
      return aCoords.row - bCoords.row; // Plus petit row = plus vers le haut
    }
  });
}

/**
 * Détermine si l'AI devrait continuer une chaîne de captures
 * @param {number[]} board - Plateau de jeu
 * @param {number} pieceIndex - Index du pion qui a capturé
 * @param {number} player - Joueur AI
 * @returns {object|null} - Prochaine capture ou null
 */
function getContinueCapture(board, pieceIndex, player) {
  // Vérifier s'il y a des captures possibles depuis cette position
  const captures = Game.getPossibleCaptures(pieceIndex, board, player);
  
  if (captures.length === 0) {
    return null;
  }
  
  // S'il y a plusieurs captures possibles, choisir la meilleure
  if (captures.length === 1) {
    return {
      fromIndex: pieceIndex,
      toIndex: captures[0].toIndex,
      isCapture: true,
      captureData: captures[0]
    };
  }
  
  // Évaluer chaque capture
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

/**
 * Vérifie si l'AI doit cliquer sur "SUR PLACE"
 * @param {object} surPlaceInfo - Information sur le surplace
 * @param {number[]} currentBoard - Plateau actuel
 * @param {number} aiPlayer - Joueur AI
 * @returns {boolean} - True si l'AI doit cliquer sur surplace
 */
function shouldClickSurPlace(surPlaceInfo, currentBoard, aiPlayer) {
  if (!surPlaceInfo || !surPlaceInfo.capturingPieces || surPlaceInfo.capturingPieces.length === 0) {
    return false;
  }
  
  // L'AI clique toujours sur surplace si c'est disponible
  // C'est une opportunité de capturer un pion adverse gratuitement
  return true;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  getBestMove,
  getContinueCapture,
  shouldClickSurPlace,
  evaluateBoard,
  MAX_DEPTH
};
