// game.js
Page({
  data: {
    // État du plateau (0: vide, 1: joueur1, 2: joueur2, 3: croix/bloqué)
    board: [
      1, 1, 1, 1, 1,
      1, 1, 1, 1, 1,
      1, 1, 3, 2, 2,
      2, 2, 2, 2, 2,
      2, 2, 2, 2, 2
    ],
    currentPlayer: 1, // Joueur actuel (1 ou 2)
    player1Score: 12, // Nombre de jetons restants
    player2Score: 12,
    selectedCell: null, // Cellule sélectionnée pour déplacement
    gameMode: 'placement', // 'placement' ou 'movement'
  },

  onLoad(options) {
    // Initialisation du jeu
    this.initGame();
  },

  initGame() {
    // Initialiser le plateau avec la configuration de départ
    const board = new Array(25).fill(0);
    
    // Placer les jetons du joueur 1 (en haut)
    for (let i = 0; i < 12; i++) {
      board[i] = 1;
    }
    
    // Placer la croix au centre
    board[12] = 3;
    
    // Placer les jetons du joueur 2 (en bas)
    for (let i = 13; i < 25; i++) {
      board[i] = 2;
    }
    
    this.setData({
      board: board,
      currentPlayer: 1,
      player1Score: 12,
      player2Score: 12
    });
  },

  onCellTap(e) {
    const index = e.currentTarget.dataset.index;
    const { board, currentPlayer, selectedCell, gameMode } = this.data;
    
    if (gameMode === 'placement') {
      // Mode placement initial
      if (board[index] === 0) {
        this.placeToken(index);
      }
    } else {
      // Mode mouvement
      if (selectedCell === null) {
        // Sélectionner un jeton à déplacer
        if (board[index] === currentPlayer) {
          this.selectToken(index);
        }
      } else {
        // Déplacer le jeton sélectionné
        if (board[index] === 0 && this.isValidMove(selectedCell, index)) {
          this.moveToken(selectedCell, index);
        } else if (board[index] === currentPlayer) {
          // Sélectionner un autre jeton
          this.selectToken(index);
        }
      }
    }
  },

  placeToken(index) {
    const { board, currentPlayer } = this.data;
    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    
    this.setData({
      board: newBoard
    });
    
    this.checkWin();
    this.switchPlayer();
  },

  selectToken(index) {
    this.setData({
      selectedCell: index
    });
    
    wx.showToast({
      title: 'Jeton sélectionné',
      icon: 'none',
      duration: 1000
    });
  },

  moveToken(fromIndex, toIndex) {
    const { board, currentPlayer } = this.data;
    const newBoard = [...board];
    
    newBoard[fromIndex] = 0;
    newBoard[toIndex] = currentPlayer;
    
    this.setData({
      board: newBoard,
      selectedCell: null
    });
    
    this.checkWin();
    this.switchPlayer();
  },

  isValidMove(fromIndex, toIndex) {
    // Vérifier si le mouvement est adjacent (horizontal, vertical ou diagonal)
    const fromRow = Math.floor(fromIndex / 5);
    const fromCol = fromIndex % 5;
    const toRow = Math.floor(toIndex / 5);
    const toCol = toIndex % 5;
    
    const rowDiff = Math.abs(fromRow - toRow);
    const colDiff = Math.abs(fromCol - toCol);
    
    return (rowDiff <= 1 && colDiff <= 1) && !(rowDiff === 0 && colDiff === 0);
  },

  switchPlayer() {
    const newPlayer = this.data.currentPlayer === 1 ? 2 : 1;
    this.setData({
      currentPlayer: newPlayer
    });
  },

  checkWin() {
    const { board } = this.data;
    
    // Vérifier les lignes
    for (let row = 0; row < 5; row++) {
      if (this.checkLine(board, row * 5, row * 5 + 4, 1)) {
        return;
      }
    }
    
    // Vérifier les colonnes
    for (let col = 0; col < 5; col++) {
      if (this.checkLine(board, col, col + 20, 5)) {
        return;
      }
    }
    
    // Vérifier les diagonales
    if (this.checkLine(board, 0, 24, 6) || this.checkLine(board, 4, 20, 4)) {
      return;
    }
  },

  checkLine(board, start, end, step) {
    const firstToken = board[start];
    if (firstToken === 0 || firstToken === 3) return false;
    
    for (let i = start; i <= end; i += step) {
      if (board[i] !== firstToken) return false;
    }
    
    this.announceWinner(firstToken);
    return true;
  },

  announceWinner(player) {
    wx.showModal({
      title: 'Victoire!',
      content: `Joueur ${player} a gagné!`,
      showCancel: false,
      success: () => {
        this.initGame();
      }
    });
  },

  onPlace() {
    // Fonction pour le bouton "Sur Place"
    wx.showToast({
      title: 'Tour passé',
      icon: 'success',
      duration: 1500
    });
    this.switchPlayer();
  },

  onAbandon() {
    wx.showModal({
      title: 'Abandonner',
      content: 'Êtes-vous sûr de vouloir abandonner la partie?',
      confirmText: 'Oui',
      cancelText: 'Non',
      success: (res) => {
        if (res.confirm) {
          const winner = this.data.currentPlayer === 1 ? 2 : 1;
          this.announceWinner(winner);
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