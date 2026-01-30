// connect4.js
Page({
  data: {
    // Initialise une grille 5x5 vide (0 = vide, 1 = Joueur 1 (Vert), 2 = Joueur 2 (Rouge))
    boardRows: [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0]
    ],
    currentPlayer: 1, // Le joueur 1 commence
    gameOver: false,
    player1Pieces: 8,
    player2Pieces: 8,
  },

  // Gère le clic de l'utilisateur sur une colonne
  handleCellTap: function(event) {
    if (this.data.gameOver) return;

    const colIndex = event.currentTarget.dataset.col;
    let board = this.data.boardRows;
    let rowIndex = -1;

    // Trouve la première ligne vide en partant du bas
    for (let i = board.length - 1; i >= 0; i--) {
      if (board[i][colIndex] === 0) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex !== -1) {
      // Place le pion
      board[rowIndex][colIndex] = this.data.currentPlayer;
      
      // Met à jour les données de la page
      this.setData({
        boardRows: board
      });

      // Met à jour le nombre de pions restants pour le joueur actuel
      this.updatePieceCount();

      // Passe au joueur suivant si le jeu continue
      this.switchPlayer();
      
      // Ici, vous devriez appeler une fonction pour vérifier si quelqu'un a gagné
      // Exemple: this.checkWin(rowIndex, colIndex);
    } else {
      wx.showToast({
        title: 'Colonne pleine !',
        icon: 'none',
        duration: 1500
      });
    }
  },

  // Inverse le joueur actuel
  switchPlayer: function() {
    const nextPlayer = this.data.currentPlayer === 1 ? 2 : 1;
    this.setData({
      currentPlayer: nextPlayer
    });
  },

  // Met à jour le compteur de pions restants dans l'interface
  updatePieceCount: function() {
    if (this.data.currentPlayer === 1) {
      this.setData({
        player1Pieces: this.data.player1Pieces - 1
      });
    } else {
      this.setData({
        player2Pieces: this.data.player2Pieces - 1
      });
    }
  },

  // Gère le bouton Retour (exemple d'action simple)
  handleReturn: function() {
    console.log('Action Retour');
    // Logique de navigation ou de réinitialisation ici
  },
  
  // Gère le bouton Abandonner
  handleAbandon: function() {
    wx.showModal({
      title: 'Abandonner',
      content: 'Êtes-vous sûr de vouloir abandonner la partie ?',
      success: (res) => {
        if (res.confirm) {
          this.setData({ gameOver: true });
          console.log(`Le joueur ${this.data.currentPlayer} a abandonné.`);
          // Logique pour déclarer le gagnant ici
        }
      }
    });
  },

  // Gère le bouton Sur Place
  handleSurPlace: function() {
    console.log('Action Sur Place');
    // Logique pour sauvegarder ou mettre en pause la partie
  }
});
