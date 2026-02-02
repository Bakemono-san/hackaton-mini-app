const Game = require('../../utils/game.js');
const AI = require('../../utils/ai.js');
const app = getApp()

const CAPTURE_WINDOW_MS = 3000;

const AI_DELAY_MS = 500;

Page({
  data: {
    players: [],
    isSoloMode: false,    
    aiPlayer: Game.PLAYER2, 
    board: [],
    currentPlayer: Game.PLAYER1, 
    player1Score: 12,
    player2Score: 12,
    player1Points: 0, 
    player2Points: 0,
    selectedCell: null,
    isSurPlaceAvailable: false, 
    
    surPlaceInfo: null,
    
    pendingCaptureIndex: null,
    captureWindowActive: false, 
    captureTimeRemaining: 0, 
  },

  onLoad(options) {
    let players = app.globalData.players;
    
    const isSoloMode = options.mode === 'solo';
    
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
    if (this.captureTimer) {
      clearInterval(this.captureTimer);
      this.captureTimer = null;
    }
    
    const board = Game.initBoard();
    const scores = Game.getScores(board);
    
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
    
    this.captureStateBeforeMove = captureState;
  },

  onCellTap(e) {
    const { isSoloMode, aiPlayer, currentPlayer } = this.data;
    
    if (isSoloMode && currentPlayer === aiPlayer) {
      return; 
    }
    
    const index = e.currentTarget.dataset.index;
    const { board, selectedCell, pendingCaptureIndex, captureWindowActive } = this.data;
    
    if (index === selectedCell) {
      if (pendingCaptureIndex !== null) {
        this.stopCaptureWindow();
        this.endTurnAfterCapture();
      } else {
        this.deselectToken();
      }
      return;
    }
    
    if (captureWindowActive && pendingCaptureIndex !== null) {
      if (board[index] === Game.EMPTY) {
        const validation = Game.validateMove(pendingCaptureIndex, index, board, currentPlayer);
        
        if (validation.valid && validation.isCapture) {
          this.moveToken(pendingCaptureIndex, index, validation);
          return;
        } else {
          this.stopCaptureWindow();
          this.endTurnAfterCapture();
          return;
        }
      } else {
        this.stopCaptureWindow();
        this.endTurnAfterCapture();
        return;
      }
    }
    
    const isOwnPiece = Game.isPlayerPiece(board[index], currentPlayer);
    
    if (isOwnPiece) {
      this.selectToken(index);
      return;
    }
    
    if (selectedCell === null) {
      return;
    }
    
    if (board[index] === Game.EMPTY) {
      const validation = Game.validateMove(selectedCell, index, board, currentPlayer);
      
      if (validation.valid) {
        this.setData({
          selectedCell: null
        });
        
        this.moveToken(selectedCell, index, validation);
      } else {
        this.deselectToken();
        return;
      }
    } else {
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
    
    const promotion1 = Game.checkAllPromotions(board, Game.PLAYER1);
    const promotion2 = Game.checkAllPromotions(promotion1.board, Game.PLAYER2);
    let finalBoard = promotion2.board;
    
    const finalScores = Game.getScores(finalBoard);
    
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
    
    const nextCaptureState = Game.createCaptureState(finalBoard, opponent);
    this.captureStateBeforeMove = nextCaptureState;
    
    const gameOver = Game.checkGameOver(finalBoard, opponent);
    
    if (gameOver.gameOver) {
      this.announceWinner(gameOver.winner, gameOver.reason);
      return;
    }
    
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
    this.stopCaptureWindow();
    
    let timeLeft = CAPTURE_WINDOW_MS / 1000;
    
    this.setData({
      captureWindowActive: true,
      captureTimeRemaining: timeLeft
    });
    
    this.captureTimer = setInterval(() => {
      timeLeft--;
      
      if (timeLeft <= 0) {
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
    this.endTurnAfterCapture();
  },

  /**
   * Termine le tour après une chaîne de capture (temps expiré ou clic invalide)
   */
  endTurnAfterCapture() {
    const { board, currentPlayer, player1Points, player2Points } = this.data;
    const scores = Game.getScores(board);
    
    const opponent = currentPlayer === Game.PLAYER1 ? Game.PLAYER2 : Game.PLAYER1;
    
    const promotion1 = Game.checkAllPromotions(board, Game.PLAYER1);
    const promotion2 = Game.checkAllPromotions(promotion1.board, Game.PLAYER2);
    let finalBoard = promotion2.board;
    
    const finalScores = Game.getScores(finalBoard);
    
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
    
    const nextCaptureState = Game.createCaptureState(finalBoard, opponent);
    this.captureStateBeforeMove = nextCaptureState;
    
    const gameOver = Game.checkGameOver(finalBoard, opponent);
    
    if (gameOver.gameOver) {
      this.announceWinner(gameOver.winner, gameOver.reason);
      return;
    }
    
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
    
    this.checkAndPlayAI();
  },

  moveToken(fromIndex, toIndex, validation) {
    const { board, currentPlayer, player1Points, player2Points } = this.data;
    
    const previousCaptureState = this.captureStateBeforeMove;
    
    const moveResult = Game.makeMove(
      board,
      fromIndex,
      toIndex,
      currentPlayer,
      validation.isCapture,
      validation.captureData ? validation.captureData.capturedIndex : undefined
    );

    let newPlayer1Points = player1Points;
    let newPlayer2Points = player2Points;
    
    if (validation.isCapture) {
      if (currentPlayer === Game.PLAYER1) {
        newPlayer1Points++;
      } else {
        newPlayer2Points++;
      }
    }
    
    const promotion1 = Game.checkAllPromotions(moveResult.newBoard, Game.PLAYER1);
    const promotion2 = Game.checkAllPromotions(promotion1.board, Game.PLAYER2);
    moveResult.newBoard = promotion2.board;
    
    const scores = Game.getScores(moveResult.newBoard);
    
    let newPendingCaptureIndex = null;
    let newSelectedCell = null;
    let newIsSurPlaceAvailable = false;
    let newSurPlaceInfo = null;
    
    if (validation.isCapture) {
      newPendingCaptureIndex = toIndex;
      newSelectedCell = toIndex;
      
      this.startCaptureWindow();
    } else {
      const opponent = currentPlayer === Game.PLAYER1 ? Game.PLAYER2 : Game.PLAYER1;
      
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
      
      const opponentToPlay = currentPlayer === Game.PLAYER1 ? Game.PLAYER2 : Game.PLAYER1;
      
      const nextCaptureState = Game.createCaptureState(moveResult.newBoard, opponentToPlay);
      this.captureStateBeforeMove = nextCaptureState;
      
      const gameOver = Game.checkGameOver(moveResult.newBoard, opponentToPlay);
      
      if (gameOver.gameOver) {
        this.announceWinner(gameOver.winner, gameOver.reason);
      }
      
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
      
      this.checkAndPlayAI();
      
      return;
    }
    
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
    
    const nextCaptureState = Game.createCaptureState(moveResult.newBoard, currentPlayer);
    this.captureStateBeforeMove = nextCaptureState;
  },

  /**
   * Active la règle SUR PLACE
   * Si le bouton est cliqué alors qu'il n'est pas disponible, le joueur perd un point
   */
  onPlace() {
    const { isSoloMode, aiPlayer, currentPlayer } = this.data;
    
    if (isSoloMode && currentPlayer === aiPlayer) {
      return;
    }
    
    const { surPlaceInfo, board, player1Points, player2Points } = this.data;
    
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
      
      wx.showToast({
        title: '-1 point (SUR PLACE)',
        icon: 'none',
        duration: 1500
      });
      
      return;
    }
    
    
    let newBoard = [...board];
    
    const faultPieceIndex = surPlaceInfo.capturingPieces[0];
    if (faultPieceIndex !== undefined) {
      if (faultPieceIndex !== surPlaceInfo.lastToIndex) {
        newBoard[faultPieceIndex] = Game.EMPTY;
      }
    }
    
    const movedPieceValue = newBoard[surPlaceInfo.lastToIndex];
    newBoard[surPlaceInfo.lastToIndex] = Game.EMPTY;
    newBoard[surPlaceInfo.lastFromIndex] = movedPieceValue;
    
    let newPlayer1Points = player1Points;
    let newPlayer2Points = player2Points;
    
    if (currentPlayer === Game.PLAYER1) {
      newPlayer1Points++;
    } else {
      newPlayer2Points++;
    }
    
    wx.showToast({
      title: 'SUR PLACE ! +1 point',
      icon: 'success',
      duration: 1500
    });
    
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
  },

  switchPlayer(newPlayer) {
    const hasMoves = Game.hasLegalMoves(this.data.board, newPlayer);
    
    this.setData({
      currentPlayer: newPlayer
    });
    
    if (!hasMoves) {
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
    if (this.captureTimer) {
      clearInterval(this.captureTimer);
      this.captureTimer = null;
    }
    
    const { player1Points, player2Points } = this.data;
    
    let sessionScores;
    if (player === null) {
      sessionScores = {
        victories1: Game.getPlayer1Victories(),
        victories2: Game.getPlayer2Victories()
      };
    } else {
      sessionScores = Game.incrementVictory(player);
    }
    
    wx.navigateTo({
      url: `/pages/victoire/victoire?winner=${player !== null ? player : 'null'}&reason=${encodeURIComponent(reason)}&player1Points=${player1Points}&player2Points=${player2Points}&sessionVictories1=${sessionScores.victories1}&sessionVictories2=${sessionScores.victories2}`
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
      return;
    }
    
    this.setData({
      selectedCell: null,
      pendingCaptureIndex: null
    });
    
    setTimeout(() => {
      this.playAIMove();
    }, AI_DELAY_MS);
  },

  /**
   * L'IA joue son tour
   */
  playAIMove() {
    const { board, aiPlayer, surPlaceInfo, isSurPlaceAvailable } = this.data;
    
    if (isSurPlaceAvailable && AI.shouldClickSurPlace(surPlaceInfo, board, aiPlayer)) {
      this.aiClickSurPlace();
      return;
    }
    
    const bestMove = AI.getBestMove(board, aiPlayer);
    
    if (!bestMove) {
      return;
    }
    
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
    
    let newBoard = [...board];
    
    const faultPieceIndex = surPlaceInfo.capturingPieces[0];
    if (faultPieceIndex !== undefined) {
      if (faultPieceIndex !== surPlaceInfo.lastToIndex) {
        newBoard[faultPieceIndex] = Game.EMPTY;
      }
    }
    
    const movedPieceValue = newBoard[surPlaceInfo.lastToIndex];
    newBoard[surPlaceInfo.lastToIndex] = Game.EMPTY;
    newBoard[surPlaceInfo.lastFromIndex] = movedPieceValue;
    
    let newPlayer1Points = player1Points;
    let newPlayer2Points = player2Points;
    
    if (aiPlayer === Game.PLAYER1) {
      newPlayer1Points++;
    } else {
      newPlayer2Points++;
    }
    
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
    
    setTimeout(() => {
      this.checkAndPlayAI();
    }, AI_DELAY_MS);
  },

  /**
   * Exécute un coup de l'IA
   */
  executeAIMove(move) {
    const { board, aiPlayer, player1Points, player2Points } = this.data;
    
    const previousCaptureState = this.captureStateBeforeMove;
    
    const moveResult = Game.makeMove(
      board,
      move.fromIndex,
      move.toIndex,
      aiPlayer,
      move.isCapture,
      move.captureData ? move.captureData.capturedIndex : undefined
    );

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
    
    if (move.isCapture) {
      const continueCapture = AI.getContinueCapture(moveResult.newBoard, move.toIndex, aiPlayer);
      
      if (continueCapture) {
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
    
    const nextCaptureState = Game.createCaptureState(moveResult.newBoard, opponent);
    this.captureStateBeforeMove = nextCaptureState;
    
    const gameOver = Game.checkGameOver(moveResult.newBoard, opponent);
    
    if (gameOver.gameOver) {
      this.announceWinner(gameOver.winner, gameOver.reason);
      return;
    }
    
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
