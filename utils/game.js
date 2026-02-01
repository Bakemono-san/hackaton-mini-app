/**
 * Jeu de 12 Pions (Dame Sénégalaise) - Logique du jeu
 * 
 * Plateau: 5x5 (25 cases)
 * Codes:
 * - 0: Case vide
 * - 1: Pion du joueur 1 (en haut)
 * - 2: Pion du joueur 2 (en bas)
 * - 3: Croix/Bloqué (case centre)
 * - 4: Dame du joueur 1
 * - 5: Dame du joueur 2
 */

// ============================================================================
// CONSTANTES
// ============================================================================

const EMPTY = 0;      // Case vide
const PLAYER1 = 1;    // Joueur 1
const PLAYER2 = 2;    // Joueur 2
const CROSS = 3;      // Croix/Case centrale (cage de départ, navigable)
const DAME1 = 4;      // Dame du joueur 1
const DAME2 = 5;      // Dame du joueur 2

// La case centrale est navigable (comme une case vide)
const NAVIGABLE_CELLS = [EMPTY, CROSS];

// Cases qui bloquent le mouvement (ni vide ni pion adverse)
function isBlockingCell(cellValue) {
  return !isEmpty(cellValue) && !isOpponentPieceForCapture(cellValue);
}

// Fonction utilitaire pour vérifier si c'est un pion adverse (sans distinguer les dames)
function isOpponentPieceForCapture(cellValue) {
  return cellValue === PLAYER2 || cellValue === DAME2 || cellValue === PLAYER1 || cellValue === DAME1;
}

// Directions du plateau (haut, bas, gauche, droite)
const DIRECTIONS = {
  UP: -5,    // Vers le haut (ligne précédente)
  DOWN: 5,   // Vers le bas (ligne suivante)
  LEFT: -1,  // Vers la gauche (colonne précédente)
  RIGHT: 1   // Vers la droite (colonne suivante)
};

// Taille du plateau
const BOARD_SIZE = 5;
const TOTAL_CELLS = 25;
const CROSS_INDEX = 12; // Centre du plateau 5x5

// ============================================================================
// FONCTIONS UTILITAIRES DE BASE
// ============================================================================

/**
 * Vérifie si une position est valide sur le plateau
 * @param {number} index - Index de la case (0-24)
 * @returns {boolean} - True si la position est valide
 */
function isValidPosition(index) {
  return index >= 0 && index < TOTAL_CELLS;
}

/**
 * Convertit un index en coordonnées (ligne, colonne)
 * @param {number} index - Index de la case
 * @returns {object} - {row, col}
 */
function indexToCoords(index) {
  return {
    row: Math.floor(index / BOARD_SIZE),
    col: index % BOARD_SIZE
  };
}

/**
 * Convertit des coordonnées en index
 * @param {number} row - Ligne (0-4)
 * @param {number} col - Colonne (0-4)
 * @returns {number} - Index de la case
 */
function coordsToIndex(row, col) {
  return row * BOARD_SIZE + col;
}

/**
 * Calcule la distance entre deux positions
 * @param {number} fromIndex - Position de départ
 * @param {number} toIndex - Position d'arrivée
 * @returns {object} - {rowDiff, colDiff}
 */
function getDistance(fromIndex, toIndex) {
  const from = indexToCoords(fromIndex);
  const to = indexToCoords(toIndex);
  return {
    rowDiff: to.row - from.row,
    colDiff: to.col - from.col
  };
}

/**
 * Vérifie si deux positions sont sur la même ligne
 * @param {number} fromIndex - Position de départ
 * @param {number} toIndex - Position d'arrivée
 * @returns {boolean}
 */
function isSameRow(fromIndex, toIndex) {
  const from = indexToCoords(fromIndex);
  const to = indexToCoords(toIndex);
  return from.row === to.row;
}

/**
 * Vérifie si deux positions sont sur la même colonne
 * @param {number} fromIndex - Position de départ
 * @param {number} toIndex - Position d'arrivée
 * @returns {boolean}
 */
function isSameCol(fromIndex, toIndex) {
  const from = indexToCoords(fromIndex);
  const to = indexToCoords(toIndex);
  return from.col === to.col;
}

/**
 * Vérifie si une case est la case crois (bloquée)
 * @param {number} index - Index de la case
 * @returns {boolean}
 */
function isCrossCell(index) {
  return index === CROSS_INDEX;
}

/**
 * Vérifie si une case est vide ou est la cage centrale (navigable)
 * @param {number} cellValue - Valeur de la case
 * @returns {boolean}
 */
function isEmpty(cellValue) {
  return cellValue === EMPTY || cellValue === CROSS;
}

/**
 * Vérifie si une case contient un pion du joueur spécifié
 * @param {number} cellValue - Valeur de la case
 * @param {number} player - Numéro du joueur (1 ou 2)
 * @returns {boolean}
 */
function isPlayerPiece(cellValue, player) {
  if (player === PLAYER1) {
    return cellValue === PLAYER1 || cellValue === DAME1;
  }
  return cellValue === PLAYER2 || cellValue === DAME2;
}

/**
 * Vérifie si une case contient une dame du joueur spécifié
 * @param {number} cellValue - Valeur de la case
 * @param {number} player - Numéro du joueur (1 ou 2)
 * @returns {boolean}
 */
function isDame(cellValue, player) {
  if (player === PLAYER1) {
    return cellValue === DAME1;
  }
  return cellValue === DAME2;
}

/**
 * Vérifie si une case contient un pion adverse
 * @param {number} cellValue - Valeur de la case
 * @param {number} player - Numéro du joueur (1 ou 2)
 * @returns {boolean}
 */
function isOpponentPiece(cellValue, player) {
  const opponent = player === PLAYER1 ? PLAYER2 : PLAYER1;
  return cellValue === opponent || cellValue === (player === PLAYER1 ? DAME2 : DAME1);
}

/**
 * Vérifie si un déplacement est horizontal ou vertical (pas diagonal)
 * @param {number} fromIndex - Position de départ
 * @param {number} toIndex - Position d'arrivée
 * @returns {boolean}
 */
function isLinearMove(fromIndex, toIndex) {
  const dist = getDistance(fromIndex, toIndex);
  return (dist.rowDiff === 0 || dist.colDiff === 0) && !(dist.rowDiff === 0 && dist.colDiff === 0);
}

/**
 * Vérifie si le déplacement est diagonal
 * @param {number} fromIndex - Position de départ
 * @param {number} toIndex - Position d'arrivée
 * @returns {boolean}
 */
function isDiagonalMove(fromIndex, toIndex) {
  const dist = getDistance(fromIndex, toIndex);
  return Math.abs(dist.rowDiff) === Math.abs(dist.colDiff) && dist.rowDiff !== 0;
}

// ============================================================================
// FONCTIONS DE DÉPLACEMENT
// ============================================================================

/**
 * Vérifie si le mouvement est un mouvement simple (sans capture)
 * @param {number} fromIndex - Position de départ
 * @param {number} toIndex - Position d'arrivée
 * @param {number} board - Plateau de jeu
 * @param {number} player - Joueur actuel
 * @returns {boolean}
 */
function isSimpleMove(fromIndex, toIndex, board, player) {
  // La case d'arrivée doit être vide
  if (!isEmpty(board[toIndex])) {
    return false;
  }

  const cellValue = board[fromIndex];
  const isPlayerDame = isDame(cellValue, player);

  // Vérifier que le mouvement n'est pas diagonal
  if (isDiagonalMove(fromIndex, toIndex)) {
    return false;
  }

  // Vérifier que le mouvement est horizontal ou vertical
  if (!isLinearMove(fromIndex, toIndex)) {
    return false;
  }

  const dist = getDistance(fromIndex, toIndex);

  if (isPlayerDame) {
    // Pour la Dame: déplacement libre sur plusieurs cases
    // Vérifier que le chemin est libre
    return isPathClear(fromIndex, toIndex, board);
  } else {
    // Pour le pion normal: exactement 1 case
    const rowDiff = Math.abs(dist.rowDiff);
    const colDiff = Math.abs(dist.colDiff);
    const totalDiff = rowDiff + colDiff;

    if (totalDiff !== 1) {
      return false; // Le pion ne peut bouger que d'une case
    }

    // Vérifier les directions autorisées pour le pion normal
    // Le joueur 1 (en haut) peut seulement aller vers le bas (avancer)
    // Le joueur 2 (en bas) peut seulement aller vers le haut (avancer)
    if (player === PLAYER1) {
      // Joueur 1: peut aller en bas, gauche, droite (pas en haut = recul)
      if (dist.rowDiff < 0) {
        return false; // Mouvement en arrière interdit pour le joueur 1
      }
    } else {
      // Joueur 2: peut aller en haut, gauche, droite (pas en bas = recul)
      if (dist.rowDiff > 0) {
        return false; // Mouvement en arrière interdit pour le joueur 2
      }
    }

    return true;
  }
}

/**
 * Vérifie si le chemin entre deux positions est libre (pour la Dame)
 * La case centrale (CROSS) est traversable
 * @param {number} fromIndex - Position de départ
 * @param {number} toIndex - Position d'arrivée
 * @param {number} board - Plateau de jeu
 * @returns {boolean}
 */
function isPathClear(fromIndex, toIndex, board) {
  const from = indexToCoords(fromIndex);
  const to = indexToCoords(toIndex);
  
  const rowStep = from.row < to.row ? 1 : (from.row > to.row ? -1 : 0);
  const colStep = from.col < to.col ? 1 : (from.col > to.col ? -1 : 0);
  
  let currentRow = from.row + rowStep;
  let currentCol = from.col + colStep;
  
  while (currentRow !== to.row || currentCol !== to.col) {
    const currentIndex = coordsToIndex(currentRow, currentCol);
    
    // La case doit être vide ou être la case centrale (navigable)
    if (!isEmpty(board[currentIndex])) {
      return false;
    }
    
    currentRow += rowStep;
    currentCol += colStep;
  }
  
  return true;
}

// ============================================================================
// FONCTIONS DE CAPTURE
// ============================================================================

/**
 * Vérifie si une capture est possible à partir d'une position
 * @param {number} fromIndex - Position de départ
 * @param {number} board - Plateau de jeu
 * @param {number} player - Joueur actuel
 * @returns {array} - Liste des captures possibles [{toIndex, capturedIndex}]
 */
function getPossibleCaptures(fromIndex, board, player) {
  const captures = [];
  const cellValue = board[fromIndex];
  const isPlayerDame = isDame(cellValue, player);
  
  // Vérifier les 4 directions (haut, bas, gauche, droite)
  const directions = [
    { dir: DIRECTIONS.UP, rowDiff: -1, name: 'UP' },
    { dir: DIRECTIONS.DOWN, rowDiff: 1, name: 'DOWN' },
    { dir: DIRECTIONS.LEFT, colDiff: -1, name: 'LEFT' },
    { dir: DIRECTIONS.RIGHT, colDiff: 1, name: 'RIGHT' }
  ];

  for (const direction of directions) {
    if (isPlayerDame) {
      // La Dame peut capturer sur plusieurs cases
      const dameCaptures = getDameCapturesInDirection(fromIndex, board, player, direction.dir);
      captures.push(...dameCaptures);
    } else {
      // Le pion normal capture sur une case adverse adjacente
      const pawnCapture = getPawnCaptureInDirection(fromIndex, board, player, direction.dir);
      if (pawnCapture) {
        captures.push(pawnCapture);
      }
    }
  }

  return captures;
}

/**
 * Vérifie la capture d'un pion normal dans une direction
 * @param {number} fromIndex - Position de départ
 * @param {number} board - Plateau de jeu
 * @param {number} player - Joueur actuel
 * @param {number} direction - Direction du mouvement
 * @returns {object|null} - {toIndex, capturedIndex} ou null
 */
function getPawnCaptureInDirection(fromIndex, board, player, direction) {
  const targetIndex = fromIndex + direction;
  
  // Vérifier si la case cible est valide
  if (!isValidPosition(targetIndex)) {
    return null;
  }

  // Vérifier les contraintes de mouvement pour le joueur
  const dist = getDistance(fromIndex, targetIndex);
  
  // Joueur 1: ne peut pas capturer en arrière (vers le haut)
  if (player === PLAYER1 && dist.rowDiff < 0) {
    return null;
  }
  
  // Joueur 2: ne peut pas capturer en arrière (vers le bas)
  if (player === PLAYER2 && dist.rowDiff > 0) {
    return null;
  }

  // La case cible doit contenir un pion adverse
  if (!isOpponentPiece(board[targetIndex], player)) {
    return null;
  }

  // La case après le pion adverse doit être vide et valide
  const afterCaptureIndex = targetIndex + direction;
  
  // Vérifier si on reste sur la même ligne/colonne
  const afterCoords = indexToCoords(afterCaptureIndex);
  const fromCoords = indexToCoords(fromIndex);
  
  // Pour les mouvements latéraux (gauche/droite), vérifier qu'on reste sur la même ligne
  if (direction === DIRECTIONS.LEFT || direction === DIRECTIONS.RIGHT) {
    if (afterCoords.row !== fromCoords.row) {
      return null;
    }
  }
  
  // Pour les mouvements verticaux, vérifier qu'on reste sur la même colonne
  if (direction === DIRECTIONS.UP || direction === DIRECTIONS.DOWN) {
    if (afterCoords.col !== fromCoords.col) {
      return null;
    }
  }

  if (!isValidPosition(afterCaptureIndex)) {
    return null;
  }

  // La case après doit être vide
  if (!isEmpty(board[afterCaptureIndex])) {
    return null;
  }

  return {
    toIndex: afterCaptureIndex,
    capturedIndex: targetIndex
  };
}

/**
 * Vérifie les captures d'une Dame dans une direction
 * @param {number} fromIndex - Position de départ
 * @param {number} board - Plateau de jeu
 * @param {number} player - Joueur actuel
 * @param {number} direction - Direction du mouvement
 * @returns {array} - Liste des captures possibles [{toIndex, capturedIndex}]
 */
function getDameCapturesInDirection(fromIndex, board, player, direction) {
  const captures = [];
  const fromCoords = indexToCoords(fromIndex);
  
  let currentIndex = fromIndex + direction;
  let opponentFound = false;
  let pathClear = true;

  // Parcourir dans la direction jusqu'à atteindre le bord du plateau
  while (isValidPosition(currentIndex)) {
    const currentCoords = indexToCoords(currentIndex);
    
    // Vérifier qu'on reste sur la bonne ligne/colonne
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

    // Si on a trouvé un adversaire et que le chemin était clair jusqu'ici
    if (opponentFound) {
      // Si la case est vide, c'est une capture valide
      if (isEmpty(cellValue)) {
        captures.push({
          toIndex: currentIndex,
          capturedIndex: currentIndex - direction
        });
      } else {
        // On a rencontré un autre pion, pas de capture possible après
        break;
      }
    } else {
      // Pas encore trouvé d'adversaire
      if (isOpponentPiece(cellValue, player)) {
        // Trouvé un adversaire potentiel
        opponentFound = true;
      } else if (!isEmpty(cellValue) && !isCrossCell(currentIndex)) {
        // Chemin bloqué par un autre pion (ni vide, ni adversaire)
        pathClear = false;
        break;
      }
      // Les cases vides et la croix sont acceptées
    }

    currentIndex += direction;
  }

  return captures;
}

/**
 * Récupère toutes les captures possibles pour un joueur
 * @param {number} board - Plateau de jeu
 * @param {number} player - Joueur actuel
 * @returns {array} - Liste de toutes les captures possibles
 */
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

// ============================================================================
// FONCTIONS DE VALIDATION DE COUP
// ============================================================================

/**
 * Vérifie si un coup est valide (capture ou mouvement simple)
 * @param {number} fromIndex - Position de départ
 * @param {number} toIndex - Position d'arrivée
 * @param {number} board - Plateau de jeu
 * @param {number} player - Joueur actuel
 * @returns {object} - {valid: boolean, isCapture: boolean, captureData: object}
 */
function validateMove(fromIndex, toIndex, board, player) {
  // Vérifier que la case de départ contient un pion du joueur
  if (!isPlayerPiece(board[fromIndex], player)) {
    return { valid: false, isCapture: false, captureData: null };
  }

  // Vérifier si c'est une capture
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

  // Vérifier si c'est un mouvement simple
  if (isSimpleMove(fromIndex, toIndex, board, player)) {
    return { valid: true, isCapture: false, captureData: null };
  }

  return { valid: false, isCapture: false, captureData: null };
}

/**
 * Génère tous les coups légaux pour un joueur
 * @param {number} board - Plateau de jeu
 * @param {number} player - Joueur actuel
 * @returns {array} - Liste des coups légaux [{fromIndex, toIndex, isCapture, captureData}]
 */
function getAllLegalMoves(board, player) {
  const moves = [];
  const allCaptures = getAllPossibleCaptures(board, player);
  
  // Les captures sont prioritaires (mais pas obligatoires selon les règles)
  // On retourne tous les mouvements possibles
  
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (isPlayerPiece(board[i], player)) {
      // Ajouter les captures
      const captures = getPossibleCaptures(i, board, player);
      for (const capture of captures) {
        moves.push({
          fromIndex: i,
          toIndex: capture.toIndex,
          isCapture: true,
          captureData: capture
        });
      }
      
      // Ajouter les mouvements simples (si pas de capture pour ce pion)
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

/**
 * Récupère tous les mouvements simples possibles pour un pion
 * @param {number} fromIndex - Position de départ
 * @param {number} board - Plateau de jeu
 * @param {number} player - Joueur actuel
 * @returns {array} - Liste des positions de destination possibles
 */
function getSimpleMoves(fromIndex, board, player) {
  const moves = [];
  const cellValue = board[fromIndex];
  const isPlayerDame = isDame(cellValue, player);
  const fromCoords = indexToCoords(fromIndex);

  if (isPlayerDame) {
    // La Dame peut se déplacer dans toutes les directions
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
        
        // Vérifier la cohérence de la direction
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
          break; // Chemin bloqué
        }
      }
    }
  } else {
    // Pion normal: mouvement d'une case
    const directions = [];
    
    // Joueur 1: peut aller en bas (avancer), gauche, droite
    if (player === PLAYER1) {
      directions.push(DIRECTIONS.DOWN);
      directions.push(DIRECTIONS.LEFT);
      directions.push(DIRECTIONS.RIGHT);
    } else {
      // Joueur 2: peut aller en haut (avancer), gauche, droite
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
      
      // Vérifier la cohérence de la direction
      if (direction === DIRECTIONS.LEFT || direction === DIRECTIONS.RIGHT) {
        if (targetCoords.row !== fromCoords.row) continue;
      }
      if (direction === DIRECTIONS.UP || direction === DIRECTIONS.DOWN) {
        if (targetCoords.col !== fromCoords.col) continue;
      }

      // La case doit être vide
      if (isEmpty(board[targetIndex])) {
        moves.push(targetIndex);
      }
    }
  }

  return moves;
}

/**
 * Vérifie si un joueur a des coups possibles
 * @param {number} board - Plateau de jeu
 * @param {number} player - Joueur actuel
 * @returns {boolean}
 */
function hasLegalMoves(board, player) {
  const moves = getAllLegalMoves(board, player);
  return moves.length > 0;
}

/**
 * Vérifie si un joueur peut capturer
 * @param {number} board - Plateau de jeu
 * @param {number} player - Joueur actuel
 * @returns {boolean}
 */
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

/**
 * Récupère les positions des pions qui peuvent capturer
 * @param {number} board - Plateau de jeu
 * @param {number} player - Joueur actuel
 * @returns {array} - Liste des indices des pions qui peuvent capturer
 */
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

/**
 * Crée l'état de capture avant un coup (pour la règle SUR PLACE)
 * @param {number} board - Plateau de jeu
 * @param {number} player - Joueur qui va jouer
 * @returns {object} - État de capture à mémoriser
 */
function createCaptureState(board, player) {
  return {
    player: player,
    board: [...board],
    capturingPieces: getCapturingPieces(board, player),
    hasCapture: false
  };
}

// ============================================================================
// FONCTIONS DE PROMOTION
// ============================================================================

/**
 * Vérifie si un pion doit être promu en dame
 * @param {number} index - Index de la case
 * @param {number} player - Joueur du pion
 * @param {number} board - Plateau de jeu
 * @returns {boolean}
 */
function shouldPromote(index, player, board) {
  const coords = indexToCoords(index);
  
  // Vérification 1: Le pion a atteint la dernière rangée adverse
  if (player === PLAYER1) {
    // Joueur 1: dernière rangée = ligne 4 (bas du plateau)
    if (coords.row === BOARD_SIZE - 1) {
      return true;
    }
  } else {
    // Joueur 2: dernière rangée = ligne 0 (haut du plateau)
    if (coords.row === 0) {
      return true;
    }
  }

  // Vérification 2: Le joueur n'a plus qu'un seul pion sur le plateau
  const playerPieceCount = countPlayerPieces(board, player);
  if (playerPieceCount === 1) {
    return true;
  }

  return false;
}

/**
 * Compte le nombre de pions d'un joueur (sans les dames)
 * @param {number} board - Plateau de jeu
 * @param {number} player - Joueur
 * @returns {number}
 */
function countPlayerPieces(board, player) {
  let count = 0;
  for (const cell of board) {
    if (cell === player || cell === (player === PLAYER1 ? DAME1 : DAME2)) {
      count++;
    }
  }
  return count;
}

/**
 * Transforme un pion en dame
 * 
 * ⚠️ CRITIQUE - RÈGLES DE PROMOTION :
 * - NE SUPPRIME JAMAIS le pion du plateau
 * - NE MODIFIE PAS sa position
 * - NE MODIFIE PAS le score
 * 
 * La promotion consiste UNIQUEMENT à :
 * - Changer le type du pion : PLAYER → DAME
 * - Conserver le même index (position inchangée)
 * 
 * @param {number[]} board - Plateau de jeu (copie)
 * @param {number} index - Index du pion à promouvoir
 * @param {number} player - Joueur du pion
 * @returns {number[]} - Nouveau plateau avec la promotion appliquée
 */
function promotePiece(board, index, player) {
  // CRITICAL: Always create a copy to avoid mutating the original board
  const newBoard = [...board];
  
  // CRITICAL: Only change the piece type, keep the same position
  if (player === PLAYER1) {
    newBoard[index] = DAME1; // PLAYER1 → DAME1
  } else {
    newBoard[index] = DAME2; // PLAYER2 → DAME2
  }
  
  // CRITICAL: Do NOT set newBoard[index] to EMPTY - that would remove the piece!
  // CRITICAL: Do NOT call any function that modifies position
  // CRITICAL: Do NOT modify score - it's calculated separately
  
  return newBoard;
}

/**
 * Vérifie et applique les promotions nécessaires pour tous les pions d'un joueur
 * Utile quand un joueur n'a plus qu'un seul pion - il devient dame immédiatement
 * 
 * @param {number[]} board - Plateau de jeu
 * @param {number} player - Joueur à vérifier
 * @returns {object} - {board, promoted}
 */
function checkAllPromotions(board, player) {
  const playerPieceCount = countPlayerPieces(board, player);
  
  // Si le joueur a plus d'un pion, pas de promotion automatique
  if (playerPieceCount > 1) {
    return { board, promoted: false };
  }
  
  // Le joueur n'a qu'un seul pion - le promouvoir en dame
  const newBoard = [...board];
  let promoted = false;
  
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (isPlayerPiece(newBoard[i], player) && !isDame(newBoard[i], player)) {
      // C'est un pion normal du joueur, le promouvoir en dame
      if (player === PLAYER1) {
        newBoard[i] = DAME1;
      } else {
        newBoard[i] = DAME2;
      }
      promoted = true;
      break; // Un seul pion, donc on arrête après l'avoir promu
    }
  }
  
  return { board: newBoard, promoted };
}

/**
 * Vérifie et applique les promotions nécessaires après un mouvement
 * 
 * @param {number[]} board - Plateau de jeu
 * @param {number} lastMoveIndex - Index de la case où le pion a atterri
 * @param {number} player - Joueur qui a joué
 * @returns {object} - {board, promoted}
 */
function checkPromotion(board, lastMoveIndex, player) {
  const cellValue = board[lastMoveIndex];
  
  // Ne promouvoir que les pions normaux (pas les dames ni les cases vides)
  if (cellValue !== PLAYER1 && cellValue !== PLAYER2) {
    return { board, promoted: false };
  }

  if (shouldPromote(lastMoveIndex, player, board)) {
    // CRITICAL: Verify that the piece exists before promotion
    if (board[lastMoveIndex] !== cellValue) {
      // Safety check: piece was modified, don't promote
      console.error('Promotion error: piece value changed unexpectedly');
      return { board, promoted: false };
    }
    
    // CRITICAL: Call promotePiece which preserves position and doesn't remove the piece
    const newBoard = promotePiece(board, lastMoveIndex, player);
    
    // CRITICAL: Verify the piece is still on the board after promotion
    if (newBoard[lastMoveIndex] === EMPTY) {
      console.error('Promotion error: piece was removed from the board!');
      // Restore the piece
      newBoard[lastMoveIndex] = cellValue;
      return { board: newBoard, promoted: false };
    }
    
    return { board: newBoard, promoted: true };
  }

  return { board, promoted: false };
}

// ============================================================================
// FONCTIONS DE FIN DE PARTIE
// ============================================================================

/**
 * Vérifie si un joueur a encore des pions
 * @param {number} board - Plateau de jeu
 * @param {number} player - Joueur à vérifier
 * @returns {boolean}
 */
function hasPieces(board, player) {
  for (const cell of board) {
    if (isPlayerPiece(cell, player)) {
      return true;
    }
  }
  return false;
}

/**
 * Vérifie si la partie est terminée
 * @param {number} board - Plateau de jeu
 * @param {number} currentPlayer - Joueur actuel
 * @returns {object} - {gameOver: boolean, winner: number|null, reason: string}
 */
function checkGameOver(board, currentPlayer) {
  const opponent = currentPlayer === PLAYER1 ? PLAYER2 : PLAYER1;

  // Vérification 1: Un joueur n'a plus de pions
  if (!hasPieces(board, PLAYER1)) {
    return { gameOver: true, winner: PLAYER2, reason: 'Le joueur 1 n\'a plus de pions' };
  }
  if (!hasPieces(board, PLAYER2)) {
    return { gameOver: true, winner: PLAYER1, reason: 'Le joueur 2 n\'a plus de pions' };
  }

  // Vérification 2: Le joueur actuel n'a plus de coups légaux
  if (!hasLegalMoves(board, currentPlayer)) {
    return { gameOver: true, winner: opponent, reason: 'Le joueur actuel n\'a plus de coups possibles' };
  }

  return { gameOver: false, winner: null, reason: '' };
}

/**
 * Vérifie si un joueur peut effectuer un mouvement depuis une position donnée
 * @param {number} index - Index de la position
 * @param {number} board - Plateau de jeu
 * @param {number} player - Joueur
 * @returns {boolean}
 */
function canMoveFrom(index, board, player) {
  if (!isPlayerPiece(board[index], player)) {
    return false;
  }

  // Vérifier s'il y a des captures possibles
  const captures = getPossibleCaptures(index, board, player);
  if (captures.length > 0) {
    return true;
  }

  // Vérifier s'il y a des mouvements simples possibles
  const simpleMoves = getSimpleMoves(index, board, player);
  return simpleMoves.length > 0;
}

// ============================================================================
// FONCTIONS DE MISE À JOUR DU PLATEAU
// ============================================================================

/**
 * Effectue un mouvement sur le plateau
 * 
 * @param {number[]} board - Plateau de jeu actuel
 * @param {number} fromIndex - Position de départ
 * @param {number} toIndex - Position d'arrivée
 * @param {number} player - Joueur qui joue
 * @param {boolean} isCapture - Si c'est une capture
 * @param {number} capturedIndex - Index du pion capturé (si capture)
 * @returns {object} - {newBoard, promoted, isCapture, capturedIndex}
 */
function makeMove(board, fromIndex, toIndex, player, isCapture, capturedIndex) {
  // CRITICAL: Always create a copy to avoid mutating the original board
  const newBoard = [...board];
  
  // Step 1: Move the piece (NOT remove it!)
  // CRITICAL: Set source to EMPTY, but keep the piece alive at destination
  newBoard[fromIndex] = EMPTY;
  newBoard[toIndex] = board[fromIndex]; // The piece arrives at destination
  
  // Step 2: Remove captured piece if this is a capture
  // CRITICAL: This is the ONLY time we set a piece to EMPTY (for captures)
  if (isCapture && capturedIndex !== undefined) {
    newBoard[capturedIndex] = EMPTY;
  }
  
  // Step 3: Check and apply promotion
  // CRITICAL: Promotion does NOT remove or move the piece
  // It only changes the piece type from PLAYER to DAME
  const promotionResult = checkPromotion(newBoard, toIndex, player);

  return {
    newBoard: promotionResult.board,
    promoted: promotionResult.promoted,
    isCapture: isCapture,
    capturedIndex: capturedIndex
  };
}

/**
 * Annule un coup et retire le pion fautif (pour la règle SUR PLACE)
 * 
 * RÈGLE SUR PLACE :
 * 1. Le déplacement du pion fautif est annulé (retour à l'état précédent)
 * 2. Le pion fautif est retiré définitivement du jeu
 * 3. Le score du joueur qui annonce SUR PLACE augmente de +1
 * 
 * @param {number[]} previousBoard - Plateau à l'état précédant le déplacement
 * @param {number} fromIndex - Position de départ du pion fautif
 * @param {number} player - Joueur du pion fautif
 * @returns {number[]} - Plateau avec le pion retiré
 */
function surPlace(previousBoard, fromIndex, player) {
  const newBoard = [...previousBoard];
  
  // Retirer le pion fautif de sa position de départ
  // Le pion est complètement retiré du jeu (case devient vide)
  if (isPlayerPiece(newBoard[fromIndex], player)) {
    newBoard[fromIndex] = EMPTY;
  }
  
  return newBoard;
}

// ============================================================================
// FONCTIONS D'INITIALISATION
// ============================================================================

/**
 * Initialise le plateau de jeu avec la configuration de départ
 * La case centrale (index 12) est une cage de départ vide et navigable
 * @returns {number[]} - Plateau de jeu initialisé
 */
function initBoard() {
  const board = new Array(TOTAL_CELLS).fill(EMPTY);
  
  // La case centrale (index 12) reste vide - c'est la cage de départ
  // board[CROSS_INDEX] reste EMPTY (navigable)
  
  // Placer les jetons du joueur 1 (en haut, sauf la case centrale)
  for (let i = 0; i < 12; i++) {
    if (i !== CROSS_INDEX) {
      board[i] = PLAYER1;
    }
  }
  
  // Placer les jetons du joueur 2 (en bas, sauf la case centrale)
  for (let i = 13; i < TOTAL_CELLS; i++) {
    board[i] = PLAYER2;
  }
  
  return board;
}

/**
 * Obtient le nombre de pions restants pour chaque joueur
 * @param {number} board - Plateau de jeu
 * @returns {object} - {player1: number, player2: number}
 */
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

// ============================================================================
// FONCTIONS DE DÉBOGAGE
// ============================================================================

/**
 * Affiche le plateau dans la console (pour le débogage)
 * @param {number} board - Plateau de jeu
 */
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

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Constantes
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

  // Fonctions utilitaires de base
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

  // Fonctions de déplacement
  isSimpleMove,
  isPathClear,
  getSimpleMoves,

  // Fonctions de capture
  getPossibleCaptures,
  getPawnCaptureInDirection,
  getDameCapturesInDirection,
  getAllPossibleCaptures,

  // Fonctions de validation
  validateMove,
  getAllLegalMoves,
  hasLegalMoves,
  canCapture,
  getCapturingPieces,
  createCaptureState,

  // Fonctions de promotion
  shouldPromote,
  countPlayerPieces,
  promotePiece,
  checkPromotion,
  checkAllPromotions,

  // Fonctions de fin de partie
  hasPieces,
  checkGameOver,
  canMoveFrom,

  // Fonctions de mise à jour du plateau
  makeMove,
  surPlace,

  // Fonctions d'initialisation
  initBoard,
  getScores,

  // Fonctions de débogage
  printBoard
};
