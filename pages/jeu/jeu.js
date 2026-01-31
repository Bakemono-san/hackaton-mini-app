// jeu.js - Page du jeu de 12 pions (Dame Sénégalaise)
// La case centrale (index 12) est la cage de départ - navigable comme une case vide
const Game = require('../../utils/game.js');

Page({
  data: {
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
  },

  onLoad(options) {
    // Initialisation du jeu
    this.initGame();
  },

  initGame() {
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
      surPlaceInfo: null
    });
    
    // Stocker l'état de capture en mémoire interne
    this.captureStateBeforeMove = captureState;
  },

  onCellTap(e) {
    const index = e.currentTarget.dataset.index;
    const { board, currentPlayer, selectedCell } = this.data;
    
    // Mode mouvement
    if (selectedCell === null) {
      // Sélectionner un jeton à déplacer
      if (Game.isPlayerPiece(board[index], currentPlayer)) {
        this.selectToken(index);
      }
    } else {
      // Déplacer le jeton sélectionné
      if (index === selectedCell) {
        // Désélectionner si on clique sur le même jeton
        this.deselectToken();
      } else if (board[index] === Game.EMPTY) {
        // Essayer de déplacer vers une case vide
        const validation = Game.validateMove(selectedCell, index, board, currentPlayer);
        if (validation.valid) {
          this.moveToken(selectedCell, index, validation);
        }
      } else if (Game.isPlayerPiece(board[index], currentPlayer)) {
        // Sélectionner un autre jeton
        this.selectToken(index);
      }
    }
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

    const scores = Game.getScores(moveResult.newBoard);
    
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
    
    // Préparer l'état SUR PLACE pour le prochain joueur
    const opponent = currentPlayer === Game.PLAYER1 ? Game.PLAYER2 : Game.PLAYER1;
    let surPlaceInfo = null;
    let isSurPlaceAvailable = false;
    
    // Vérifier si le bouton SUR PLACE doit apparaître
    // Condition: l'adversaire (joueur actuel) avait des captures possibles et n'a pas capturé
    if (!validation.isCapture && previousCaptureState.capturingPieces.length > 0) {
      surPlaceInfo = {
        previousBoard: previousCaptureState.board,
        capturingPieces: previousCaptureState.capturingPieces,
        lastMovePlayer: currentPlayer,
        lastFromIndex: fromIndex,
        lastToIndex: toIndex
      };
      isSurPlaceAvailable = true;
    }
    
    this.setData({
      board: moveResult.newBoard,
      selectedCell: null,
      player1Score: scores.player1,
      player2Score: scores.player2,
      player1Points: newPlayer1Points,
      player2Points: newPlayer2Points,
      isSurPlaceAvailable: isSurPlaceAvailable,
      surPlaceInfo: surPlaceInfo
    });
    
    // Préparer l'état de capture pour le prochain joueur
    const nextCaptureState = Game.createCaptureState(moveResult.newBoard, opponent);
    this.captureStateBeforeMove = nextCaptureState;
    
    // Vérifier l'état du jeu
    this.checkGameState();
    
    // Passer au joueur suivant
    this.switchPlayer(opponent);
  },

  /**
   * Active la règle SUR PLACE
   * Si le bouton est cliqué alors qu'il n'est pas disponible, le joueur perd un point
   */
  onPlace() {
    const { surPlaceInfo, board, currentPlayer, player1Points, player2Points } = this.data;
    
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
      newBoard[faultPieceIndex] = Game.EMPTY;
    }
    
    // ÉTAPE 2 : Annuler le déplacement du pion déplacé
    // Le remettre exactement à sa position initiale
    const movedPieceValue = newBoard[surPlaceInfo.lastToIndex];
    newBoard[surPlaceInfo.lastToIndex] = Game.EMPTY;
    newBoard[surPlaceInfo.lastFromIndex] = movedPieceValue;
    
    const scores = Game.getScores(newBoard);
    
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
    const message = reason ? `Joueur ${player} a gagné! (${reason})` : `Joueur ${player} a gagné!`;
    
    wx.showModal({
      title: 'Victoire!',
      content: message,
      showCancel: false,
      success: () => {
        this.initGame();
      }
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
  }
});
