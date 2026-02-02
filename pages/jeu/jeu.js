// jeu.js - Page du jeu de 12 pions (Dame Sénégalaise)
// La case centrale (index 12) est la cage de départ - navigable comme une case vide
const Game = require('../../utils/game.js');
const AI = require('../../utils/ai.js');
const app = getApp()

// Constante pour la fenêtre de validation des captures multiples (en millisecondes)
const CAPTURE_WINDOW_MS = 3000;

// Délai avant que l'IA joue (pour que ce soit visible)
const AI_DELAY_MS = 500;

Page({
  data: {
    players: [],
    isSoloMode: false,     // Mode solo (vs IA)
    aiPlayer: Game.PLAYER2, // L'IA joue en tant que joueur 2 par défaut
    // État du plateau (0: vide, 1: joueur1, 2: joueur2, 3: croix/centre, 4: dame1, 5: dame2)
    board: [],
    currentPlayer: Game.PLAYER1, // Joueur actuel (1 ou 2)
    player1Score: 12, // Nombre de jetons restants
    player2Score: 12,
    player1Points: 0, // Points du joueur 1 (pions capturés)
    player2Points: 0, // Points du joueur 2 (pions capturés)
    selectedCell: null, // Cellule sélectionnée pour déplacement
    isSurPlaceAvailable: false, // Si le bouton SUR PLACE est visible
    
    // État interne pour la règle SUR PLACE
    surPlaceInfo: null, // { previousBoard, capturingPieces, lastMovePlayer }
    
    // État pour les captures multiples avec fenêtre temporelle
    pendingCaptureIndex: null, // Index du pion qui peut continuer à capturer
    captureWindowActive: false, // Si la fenêtre de validation de 3 secondes est active
    captureTimeRemaining: 0, // Temps restant dans la fenêtre (en secondes)
  },

  onLoad(options) {
    // Initialisation du jeu
    let players = app.globalData.players;
    
    // Vérifier si on est en mode solo
    const isSoloMode = options.mode === 'solo';
    
    // Si mode solo, modifier le nom du joueur 2
    if (isSoloMode) {
      players = [
        players[0],
        {name: "IA Expert", avatar: players[1].avatar}
      ];
    }
    
    this.setData({
      players: players,
      isSoloMode: isSoloMode
    });
    
    this.initGame();
  },

  initGame() {
    // Annuler tout timer de capture en cours
    if (this.captureTimer) {
      clearInterval(this.captureTimer);
      this.captureTimer = null;
    }
    
    // Initialiser le plateau avec la configuration de départ
    const board = Game.initBoard();
    const scores = Game.getScores(board);
    
    // Mémoriser l'état initial pour le joueur 1
    const captureState = Game.createCaptureState(board, Game.PLAYER1);
    
    this.setData({
      board: board,
      currentPlayer: Game.PLAYER1,
      player1Score: scores.player1,
      player2Score: scores.player2,
      player1Points: 0,
      player2Points: 0,
      selectedCell: null,
      isSurPlaceAvailable: false,
      surPlaceInfo: null,
      pendingCaptureIndex: null,
      captureWindowActive: false,
      captureTimeRemaining: 0
    });
    
    // Stocker l'état de capture en mémoire interne
    this.captureStateBeforeMove = captureState;
  },

  onCellTap(e) {
    const { isSoloMode, aiPlayer, currentPlayer } = this.data;
    
    // En mode solo, bloquer les clics si c'est le tour de l'IA
    if (isSoloMode && currentPlayer === aiPlayer) {
      return; // L'IA joue, pas d'interaction utilisateur
    }
    
    const index = e.currentTarget.dataset.index;
    const { board, selectedCell, pendingCaptureIndex, captureWindowActive } = this.data;
    
    // Vérifier si le joueur clique sur le même pion sélectionné (pour terminer le tour)
    if (index === selectedCell) {
      // Cliquer sur le même pion le désélectionne et termine le tour
      if (pendingCaptureIndex !== null) {
        this.stopCaptureWindow();
        this.endTurnAfterCapture();
      } else {
        this.deselectToken();
      }
      return;
    }
    
    // En mode fenêtre de capture active, vérifier si le clic est valide
    if (captureWindowActive && pendingCaptureIndex !== null) {
      // La fenêtre de capture est active - seul un clic sur une case de capture valide est accepté
      if (board[index] === Game.EMPTY) {
        // Vérifier si c'est une capture valide avec le pion en position pendingCaptureIndex
        const validation = Game.validateMove(pendingCaptureIndex, index, board, currentPlayer);
        
        if (validation.valid && validation.isCapture) {
          // Capture valide - exécuter et redémarrer la fenêtre
          this.moveToken(pendingCaptureIndex, index, validation);
          return;
        } else {
          // Clic invalide - terminer la chaîne de capture immédiatement
          // REFUS SILENCIEUX - pas de message d'erreur
          this.stopCaptureWindow();
          this.endTurnAfterCapture();
          return;
        }
      } else {
        // Clic sur une case non vide - terminer la chaîne de capture
        this.stopCaptureWindow();
        this.endTurnAfterCapture();
        return;
      }
    }
    
    // Vérifier si la case cliquée contient un pion du joueur actuel
    const isOwnPiece = Game.isPlayerPiece(board[index], currentPlayer);
    
    // Si on clique sur un de ses propres pions
    if (isOwnPiece) {
      // Sélectionner le nouveau pion
      this.selectToken(index);
      return;
    }
    
    // Si aucun pion n'est sélectionné et on clique sur une case vide
    if (selectedCell === null) {
      // Ne rien faire - pas de pion sélectionné
      return;
    }
    
    // Un pion est sélectionné, vérifier si le clic est sur une case vide
    if (board[index] === Game.EMPTY) {
      // Essayer de déplacer vers une case vide
      const validation = Game.validateMove(selectedCell, index, board, currentPlayer);
      
      if (validation.valid) {
        // Désélectionner immédiatement pour éviter la latence visuelle
        this.setData({
          selectedCell: null
        });
        
        // Le coup est valide, l'exécuter
        this.moveToken(selectedCell, index, validation);
      } else {
        // Coup non valide - désélectionner le pion
        this.deselectToken();
        return;
      }
    } else {
      // La case contient un pion adverse - désélectionner le pion
      this.deselectToken();
      return;
    }
  },

  /**
   * Termine le tour du joueur actuel et passe au joueur suivant
   * Utilisé après une capture multiple quand le joueur veut finir son tour
   */
  endTurn() {
    const { board, currentPlayer, player1Points, player2Points } = this.data;
    const scores = Game.getScores(board);
    
    const opponent = currentPlayer === Game.PLAYER1 ? Game.PLAYER2 : Game.PLAYER1;
    
    // Vérifier la promotion automatique pour les deux joueurs
    // Si un joueur n'a qu'un seul pion, il devient dame
    const promotion1 = Game.checkAllPromotions(board, Game.PLAYER1);
    const promotion2 = Game.checkAllPromotions(promotion1.board, Game.PLAYER2);
    let finalBoard = promotion2.board;
    
    // Recalculer les scores après promotion
    const finalScores = Game.getScores(finalBoard);
    
    // Vérifier si le bouton SUR PLACE doit apparaître pour l'adversaire
    const previousCaptureState = this.captureStateBeforeMove;
    let newSurPlaceInfo = null;
    let newIsSurPlaceAvailable = false;
    
    if (previousCaptureState.capturingPieces.length > 0) {
      newSurPlaceInfo = {
        previousBoard: previousCaptureState.board,
        capturingPieces: previousCaptureState.capturingPieces,
        lastMovePlayer: null,
        lastFromIndex: null,
        lastToIndex: null
      };
      newIsSurPlaceAvailable = true;
    }
    
    // Préparer l'état de capture pour le prochain joueur
    const nextCaptureState = Game.createCaptureState(finalBoard, opponent);
    this.captureStateBeforeMove = nextCaptureState;
    
    // Vérifier l'état du jeu pour le prochain joueur
    const gameOver = Game.checkGameOver(finalBoard, opponent);
    
    if (gameOver.gameOver) {
      this.announceWinner(gameOver.winner, gameOver.reason);
      return;
    }
    
    // Passer au joueur suivant
    this.setData({
      board: finalBoard,
      selectedCell: null,
      pendingCaptureIndex: null,
      currentPlayer: opponent,
      player1Score: finalScores.player1,
      player2Score: finalScores.player2,
      isSurPlaceAvailable: newIsSurPlaceAvailable,
      surPlaceInfo: newSurPlaceInfo
    });
    
    // Si c'est le mode solo et c'est le tour de l'IA, jouer automatiquement
    this.checkAndPlayAI();
  },

  selectToken(index) {
    this.setData({
      selectedCell: index
    });
  },

  deselectToken() {
    this.setData({
      selectedCell: null
    });
  },

  /**
   * Démarre la fenêtre de validation de 3 secondes pour les captures multiples
   * Chaque nouvelle capture réinitialise le timer
   */
  startCaptureWindow() {
    // Arrêter tout timer existant
    this.stopCaptureWindow();
    
    let timeLeft = CAPTURE_WINDOW_MS / 1000;
    
    this.setData({
      captureWindowActive: true,
      captureTimeRemaining: timeLeft
    });
    
    // Mettre à jour le timer chaque seconde
    this.captureTimer = setInterval(() => {
      timeLeft--;
      
      if (timeLeft <= 0) {
        // Le temps est écoulé - terminer la chaîne de capture
        this.stopCaptureWindow();
        this.onCaptureWindowExpired();
      } else {
        this.setData({
          captureTimeRemaining: timeLeft
        });
      }
    }, 1000);
  },

  /**
   * Arrête la fenêtre de validation des captures
   */
  stopCaptureWindow() {
    if (this.captureTimer) {
      clearInterval(this.captureTimer);
      this.captureTimer = null;
    }
    this.setData({
      captureWindowActive: false,
      captureTimeRemaining: 0
    });
  },

  /**
   * Appelé quand la fenêtre de capture expire
   * Termine le tour du joueur
   */
  onCaptureWindowExpired() {
    // La fenêtre de capture a expiré - terminer le tour
    // Le pion est désélectionné et on passe au joueur suivant
    this.endTurnAfterCapture();
  },

  /**
   * Termine le tour après une chaîne de capture (temps expiré ou clic invalide)
   */
  endTurnAfterCapture() {
    const { board, currentPlayer, player1Points, player2Points } = this.data;
    const scores = Game.getScores(board);
    
    const opponent = currentPlayer === Game.PLAYER1 ? Game.PLAYER2 : Game.PLAYER1;
    
    // Vérifier la promotion automatique pour les deux joueurs
    const promotion1 = Game.checkAllPromotions(board, Game.PLAYER1);
    const promotion2 = Game.checkAllPromotions(promotion1.board, Game.PLAYER2);
    let finalBoard = promotion2.board;
    
    // Recalculer les scores après promotion
    const finalScores = Game.getScores(finalBoard);
    
    // Vérifier si le bouton SUR PLACE doit apparaître pour l'adversaire
    const previousCaptureState = this.captureStateBeforeMove;
    let newSurPlaceInfo = null;
    let newIsSurPlaceAvailable = false;
    
    if (previousCaptureState.capturingPieces.length > 0) {
      newSurPlaceInfo = {
        previousBoard: previousCaptureState.board,
        capturingPieces: previousCaptureState.capturingPieces,
        lastMovePlayer: null,
        lastFromIndex: null,
        lastToIndex: null
      };
      newIsSurPlaceAvailable = true;
    }
    
    // Préparer l'état de capture pour le prochain joueur
    const nextCaptureState = Game.createCaptureState(finalBoard, opponent);
    this.captureStateBeforeMove = nextCaptureState;
    
    // Vérifier l'état du jeu pour le prochain joueur
    const gameOver = Game.checkGameOver(finalBoard, opponent);
    
    if (gameOver.gameOver) {
      this.announceWinner(gameOver.winner, gameOver.reason);
      return;
    }
    
    // Passer au joueur suivant
    this.setData({
      board: finalBoard,
      selectedCell: null,
      pendingCaptureIndex: null,
      captureWindowActive: false,
      captureTimeRemaining: 0,
      currentPlayer: opponent,
      player1Score: finalScores.player1,
      player2Score: finalScores.player2,
      player1Points: player1Points,
      player2Points: player2Points,
      isSurPlaceAvailable: newIsSurPlaceAvailable,
      surPlaceInfo: newSurPlaceInfo
    });
    
    // Si c'est le mode solo et c'est le tour de l'IA, jouer automatiquement
    this.checkAndPlayAI();
  },

  moveToken(fromIndex, toIndex, validation) {
    const { board, currentPlayer, player1Points, player2Points } = this.data;
    
    // Stocker l'état de capture AVANT le mouvement (pour SUR PLACE)
    const previousCaptureState = this.captureStateBeforeMove;
    
    // Effectuer le mouvement
    const moveResult = Game.makeMove(
      board,
      fromIndex,
      toIndex,
      currentPlayer,
      validation.isCapture,
      validation.captureData ? validation.captureData.capturedIndex : undefined
    );

    // Incrémenter les points si c'était une capture
    let newPlayer1Points = player1Points;
    let newPlayer2Points = player2Points;
    
    if (validation.isCapture) {
      if (currentPlayer === Game.PLAYER1) {
        newPlayer1Points++;
      } else {
        newPlayer2Points++;
      }
    }
    
    // Vérifier la promotion automatique pour les deux joueurs
    // Si un joueur n'a qu'un seul pion, il devient dame
    const promotion1 = Game.checkAllPromotions(moveResult.newBoard, Game.PLAYER1);
    const promotion2 = Game.checkAllPromotions(promotion1.board, Game.PLAYER2);
    moveResult.newBoard = promotion2.board;
    
    // Recalculer les scores après promotion
    const scores = Game.getScores(moveResult.newBoard);
    
    let newPendingCaptureIndex = null;
    let newSelectedCell = null;
    let newIsSurPlaceAvailable = false;
    let newSurPlaceInfo = null;
    
    if (validation.isCapture) {
      // C'était une capture - démarrer la fenêtre de validation de 3 secondes
      newPendingCaptureIndex = toIndex;
      newSelectedCell = toIndex;
      
      // Démarrer la fenêtre de capture (sera réinitialisée à chaque capture)
      this.startCaptureWindow();
    } else {
      // Pas une capture - préparer l'état SUR PLACE pour le prochain joueur
      const opponent = currentPlayer === Game.PLAYER1 ? Game.PLAYER2 : Game.PLAYER1;
      
      // Vérifier si le bouton SUR PLACE doit apparaître
      if (previousCaptureState.capturingPieces.length > 0) {
        newSurPlaceInfo = {
          previousBoard: previousCaptureState.board,
          capturingPieces: previousCaptureState.capturingPieces,
          lastMovePlayer: currentPlayer,
          lastFromIndex: fromIndex,
          lastToIndex: toIndex
        };
        newIsSurPlaceAvailable = true;
      }
      
      // Terminer le tour - passer au joueur suivant
      const opponentToPlay = currentPlayer === Game.PLAYER1 ? Game.PLAYER2 : Game.PLAYER1;
      
      // Préparer l'état de capture pour le prochain joueur
      const nextCaptureState = Game.createCaptureState(moveResult.newBoard, opponentToPlay);
      this.captureStateBeforeMove = nextCaptureState;
      
      // Vérifier l'état du jeu pour le prochain joueur
      const gameOver = Game.checkGameOver(moveResult.newBoard, opponentToPlay);
      
      if (gameOver.gameOver) {
        this.announceWinner(gameOver.winner, gameOver.reason);
      }
      
      // Passer au joueur suivant
      this.setData({
        board: moveResult.newBoard,
        selectedCell: null,
        pendingCaptureIndex: null,
        captureWindowActive: false,
        captureTimeRemaining: 0,
        player1Score: scores.player1,
        player2Score: scores.player2,
        player1Points: newPlayer1Points,
        player2Points: newPlayer2Points,
        currentPlayer: opponentToPlay,
        isSurPlaceAvailable: newIsSurPlaceAvailable,
        surPlaceInfo: newSurPlaceInfo
      });
      
      // Si c'est le mode solo et c'est le tour de l'IA, jouer automatiquement
      this.checkAndPlayAI();
      
      return;
    }
    
    // Si c'est une capture, mettre à jour l'état
    this.setData({
      board: moveResult.newBoard,
      selectedCell: newSelectedCell,
      pendingCaptureIndex: newPendingCaptureIndex,
      player1Score: scores.player1,
      player2Score: scores.player2,
      player1Points: newPlayer1Points,
      player2Points: newPlayer2Points,
      isSurPlaceAvailable: newIsSurPlaceAvailable,
      surPlaceInfo: newSurPlaceInfo
    });
    
    // Mettre à jour l'état de capture pour le prochain mouvement potentiel
    const nextCaptureState = Game.createCaptureState(moveResult.newBoard, currentPlayer);
    this.captureStateBeforeMove = nextCaptureState;
  },

  /**
   * Active la règle SUR PLACE
   * Si le bouton est cliqué alors qu'il n'est pas disponible, le joueur perd un point
   */
  onPlace() {
    const { isSoloMode, aiPlayer, currentPlayer } = this.data;
    
    // En mode solo, bloquer si c'est le tour de l'IA
    if (isSoloMode && currentPlayer === aiPlayer) {
      return;
    }
    
    const { surPlaceInfo, board, player1Points, player2Points } = this.data;
    
    // Si le bouton SUR PLACE n'est pas disponible, le joueur perd un point (faux SUR PLACE)
    if (!surPlaceInfo) {
      let newPlayer1Points = player1Points;
      let newPlayer2Points = player2Points;
      
      if (currentPlayer === Game.PLAYER1) {
        newPlayer1Points = Math.max(0, newPlayer1Points - 1);
      } else {
        newPlayer2Points = Math.max(0, newPlayer2Points - 1);
      }
      
      this.setData({
        player1Points: newPlayer1Points,
        player2Points: newPlayer2Points
      });
      
      // Notifier le retrait du point
      wx.showToast({
        title: '-1 point (SUR PLACE)',
        icon: 'none',
        duration: 1500
      });
      
      return;
    }
    
    // RÈGLE SUR PLACE :
    // Le pion fautif et le pion déplacé sont DEUX pions distincts
    // 
    // 1. Pion fautif : pion du joueur précédent qui avait une capture possible mais n'a pas capturé
    //    CE pion doit être retiré définitivement du jeu
    // 
    // 2. Pion déplacé : pion qui a été déplacé au tour précédent
    //    CE pion doit être remis à sa position initiale (pas retiré)
    
    // Créer une copie du plateau actuel
    let newBoard = [...board];
    
    // ÉTAPE 1 : Retirer UNIQUEMENT le pion fautif
    // Le pion fautif est le premier pion de la liste capturingPieces
    const faultPieceIndex = surPlaceInfo.capturingPieces[0];
    if (faultPieceIndex !== undefined) {
      // Vérifier que le pion fautif n'est pas le même que le pion déplacé
      if (faultPieceIndex !== surPlaceInfo.lastToIndex) {
        newBoard[faultPieceIndex] = Game.EMPTY;
      }
    }
    
    // ÉTAPE 2 : Annuler le déplacement du pion déplacé
    // Le remettre exactement à sa position initiale
    const movedPieceValue = newBoard[surPlaceInfo.lastToIndex];
    newBoard[surPlaceInfo.lastToIndex] = Game.EMPTY;
    newBoard[surPlaceInfo.lastFromIndex] = movedPieceValue;
    
    // ÉTAPE 3 : Ajouter +1 au score du joueur actuel
    let newPlayer1Points = player1Points;
    let newPlayer2Points = player2Points;
    
    if (currentPlayer === Game.PLAYER1) {
      newPlayer1Points++;
    } else {
      newPlayer2Points++;
    }
    
    // Notifier le succès du SUR PLACE
    wx.showToast({
      title: 'SUR PLACE ! +1 point',
      icon: 'success',
      duration: 1500
    });
    
    // Vérifier la promotion automatique pour les deux joueurs
    const promotion1 = Game.checkAllPromotions(newBoard, Game.PLAYER1);
    const promotion2 = Game.checkAllPromotions(promotion1.board, Game.PLAYER2);
    newBoard = promotion2.board;
    
    // Recalculer les scores après promotion
    const scores = Game.getScores(newBoard);
    
    // Cacher le bouton et réinitialiser l'état
    this.setData({
      board: newBoard,
      selectedCell: null,
      isSurPlaceAvailable: false,
      surPlaceInfo: null,
      player1Score: scores.player1,
      player2Score: scores.player2,
      player1Points: newPlayer1Points,
      player2Points: newPlayer2Points
    });
    
    // Vérifier l'état du jeu après le retrait du pion
    this.checkGameState();
    
    // Préparer l'état de capture pour le prochain joueur
    const nextPlayer = surPlaceInfo.lastMovePlayer;
    const nextCaptureState = Game.createCaptureState(newBoard, nextPlayer);
    this.captureStateBeforeMove = nextCaptureState;
  },

  switchPlayer(newPlayer) {
    // Vérifier si le nouveau joueur a des coups possibles
    const hasMoves = Game.hasLegalMoves(this.data.board, newPlayer);
    
    this.setData({
      currentPlayer: newPlayer
    });
    
    if (!hasMoves) {
      // Le joueur n'a pas de mouvements possibles
      const winner = newPlayer === Game.PLAYER1 ? Game.PLAYER2 : Game.PLAYER1;
      this.announceWinner(winner, 'Le joueur n\'a plus de coups possibles');
    }
  },

  checkGameState() {
    const { board, currentPlayer } = this.data;
    
    const gameOver = Game.checkGameOver(board, currentPlayer);
    
    if (gameOver.gameOver) {
      this.announceWinner(gameOver.winner, gameOver.reason);
    }
  },

  announceWinner(player, reason = '') {
    // Arrêter tout timer en cours
    if (this.captureTimer) {
      clearInterval(this.captureTimer);
      this.captureTimer = null;
    }
    
    const { player1Points, player2Points } = this.data;
    
    // Incrémenter la victoire du joueur et récupérer les scores de session
    const sessionScores = Game.incrementVictory(player);
    
    // Naviguer vers la page victoire avec les informations
    wx.navigateTo({
      url: `/pages/victoire/victoire?winner=${player}&reason=${encodeURIComponent(reason)}&player1Points=${player1Points}&player2Points=${player2Points}&sessionVictories1=${sessionScores.victories1}&sessionVictories2=${sessionScores.victories2}`
    });
  },

  onAbandon() {
    wx.showModal({
      title: 'Abandonner',
      content: 'Êtes-vous sûr de vouloir abandonner la partie?',
      confirmText: 'Oui',
      cancelText: 'Non',
      success: (res) => {
        if (res.confirm) {
          const winner = this.data.currentPlayer === Game.PLAYER1 ? Game.PLAYER2 : Game.PLAYER1;
          this.announceWinner(winner, 'Abandon');
        }
      }
    });
  },

  onBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  /**
   * Vérifie si c'est le tour de l'IA et joue automatiquement
   */
  checkAndPlayAI() {
    const { isSoloMode, aiPlayer, currentPlayer } = this.data;
    
    if (!isSoloMode || currentPlayer !== aiPlayer) {
      return; // Pas le tour de l'IA
    }
    
    // Forcer la désélection immédiate pour éviter la latence visuelle
    this.setData({
      selectedCell: null,
      pendingCaptureIndex: null
    });
    
    // Petite pause pour que le joueur voit le changement
    setTimeout(() => {
      this.playAIMove();
    }, AI_DELAY_MS);
  },

  /**
   * L'IA joue son tour
   */
  playAIMove() {
    const { board, aiPlayer, surPlaceInfo, isSurPlaceAvailable } = this.data;
    
    // 1. Vérifier si l'IA doit cliquer sur SUR PLACE
    if (isSurPlaceAvailable && AI.shouldClickSurPlace(surPlaceInfo, board, aiPlayer)) {
      this.aiClickSurPlace();
      return;
    }
    
    // 2. Trouver le meilleur coup
    const bestMove = AI.getBestMove(board, aiPlayer);
    
    if (!bestMove) {
      // Pas de coup possible - fin de partie
      return;
    }
    
    // 3. Exécuter le coup
    this.executeAIMove(bestMove);
  },

  /**
   * L'IA clique sur SUR PLACE
   */
  aiClickSurPlace() {
    const { surPlaceInfo, board, aiPlayer, player1Points, player2Points } = this.data;
    
    if (!surPlaceInfo) {
      return;
    }
    
    // Créer une copie du plateau actuel
    let newBoard = [...board];
    
    // ÉTAPE 1 : Retirer UNIQUEMENT le pion fautif
    const faultPieceIndex = surPlaceInfo.capturingPieces[0];
    if (faultPieceIndex !== undefined) {
      if (faultPieceIndex !== surPlaceInfo.lastToIndex) {
        newBoard[faultPieceIndex] = Game.EMPTY;
      }
    }
    
    // ÉTAPE 2 : Annuler le déplacement du pion déplacé
    const movedPieceValue = newBoard[surPlaceInfo.lastToIndex];
    newBoard[surPlaceInfo.lastToIndex] = Game.EMPTY;
    newBoard[surPlaceInfo.lastFromIndex] = movedPieceValue;
    
    // ÉTAPE 3 : Ajouter +1 au score de l'IA
    let newPlayer1Points = player1Points;
    let newPlayer2Points = player2Points;
    
    if (aiPlayer === Game.PLAYER1) {
      newPlayer1Points++;
    } else {
      newPlayer2Points++;
    }
    
    // Vérifier la promotion automatique
    const promotion1 = Game.checkAllPromotions(newBoard, Game.PLAYER1);
    const promotion2 = Game.checkAllPromotions(promotion1.board, Game.PLAYER2);
    newBoard = promotion2.board;
    
    const scores = Game.getScores(newBoard);
    
    this.setData({
      board: newBoard,
      selectedCell: null,
      isSurPlaceAvailable: false,
      surPlaceInfo: null,
      player1Score: scores.player1,
      player2Score: scores.player2,
      player1Points: newPlayer1Points,
      player2Points: newPlayer2Points
    });
    
    this.checkGameState();
    
    const nextPlayer = surPlaceInfo.lastMovePlayer;
    const nextCaptureState = Game.createCaptureState(newBoard, nextPlayer);
    this.captureStateBeforeMove = nextCaptureState;
    
    // Continuer à jouer si c'est toujours le tour de l'IA
    setTimeout(() => {
      this.checkAndPlayAI();
    }, AI_DELAY_MS);
  },

  /**
   * Exécute un coup de l'IA
   */
  executeAIMove(move) {
    const { board, aiPlayer, player1Points, player2Points } = this.data;
    
    // Stocker l'état de capture AVANT le mouvement
    const previousCaptureState = this.captureStateBeforeMove;
    
    // Effectuer le mouvement
    const moveResult = Game.makeMove(
      board,
      move.fromIndex,
      move.toIndex,
      aiPlayer,
      move.isCapture,
      move.captureData ? move.captureData.capturedIndex : undefined
    );

    // Incrémenter les points si c'était une capture
    let newPlayer1Points = player1Points;
    let newPlayer2Points = player2Points;
    
    if (move.isCapture) {
      if (aiPlayer === Game.PLAYER1) {
        newPlayer1Points++;
      } else {
        newPlayer2Points++;
      }
    }

    const scores = Game.getScores(moveResult.newBoard);
    
    // Vérifier s'il y a des captures multiples possibles
    if (move.isCapture) {
      const continueCapture = AI.getContinueCapture(moveResult.newBoard, move.toIndex, aiPlayer);
      
      if (continueCapture) {
        // Il y a une capture continue - l'exécuter après un délai
        this.setData({
          board: moveResult.newBoard,
          player1Score: scores.player1,
          player2Score: scores.player2,
          player1Points: newPlayer1Points,
          player2Points: newPlayer2Points
        });
        
        setTimeout(() => {
          this.executeAIMove(continueCapture);
        }, AI_DELAY_MS);
        
        return;
      }
    }
    
    // Pas de capture continue - terminer le tour de l'IA
    const opponent = aiPlayer === Game.PLAYER1 ? Game.PLAYER2 : Game.PLAYER1;
    
    let newIsSurPlaceAvailable = false;
    let newSurPlaceInfo = null;
    
    if (!move.isCapture && previousCaptureState.capturingPieces.length > 0) {
      newSurPlaceInfo = {
        previousBoard: previousCaptureState.board,
        capturingPieces: previousCaptureState.capturingPieces,
        lastMovePlayer: aiPlayer,
        lastFromIndex: move.fromIndex,
        lastToIndex: move.toIndex
      };
      newIsSurPlaceAvailable = true;
    }
    
    // Préparer l'état de capture pour le prochain joueur
    const nextCaptureState = Game.createCaptureState(moveResult.newBoard, opponent);
    this.captureStateBeforeMove = nextCaptureState;
    
    // Vérifier l'état du jeu
    const gameOver = Game.checkGameOver(moveResult.newBoard, opponent);
    
    if (gameOver.gameOver) {
      this.announceWinner(gameOver.winner, gameOver.reason);
      return;
    }
    
    // Passer au joueur suivant
    this.setData({
      board: moveResult.newBoard,
      selectedCell: null,
      pendingCaptureIndex: null,
      currentPlayer: opponent,
      player1Score: scores.player1,
      player2Score: scores.player2,
      player1Points: newPlayer1Points,
      player2Points: newPlayer2Points,
      isSurPlaceAvailable: newIsSurPlaceAvailable,
      surPlaceInfo: newSurPlaceInfo
    });
  }
});
