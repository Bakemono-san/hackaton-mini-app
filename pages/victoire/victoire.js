// victoire.js - Page de victoire
Page({
  data: {
    showVictory: true, // Toujours afficher la victoire
    winner: null, // Joueur gagnant (null pour match nul)
    winnerName: '',
    reason: '', // Raison de la victoire
    player1Points: 0, // Points du joueur 1
    player2Points: 0, // Points du joueur 2
    sessionVictories1: 0, // Victoires cumulées joueur 1
    sessionVictories2: 0, // Victoires cumulées joueur 2
    isDraw: false, // Si c'est un match nul
  },

  onLoad(options) {
    // Récupérer les paramètres passés depuis la page jeu
    const winnerParam = options.winner;
    const winner = winnerParam === 'null' ? null : parseInt(winnerParam);
    const reason = options.reason || '';
    const player1Points = parseInt(options.player1Points) || 0;
    const player2Points = parseInt(options.player2Points) || 0;
    const sessionVictories1 = parseInt(options.sessionVictories1) || 0;
    const sessionVictories2 = parseInt(options.sessionVictories2) || 0;

    const isDraw = winner === null;
    const winnerName = isDraw ? 'Match nul' : (winner === 1 ? 'Joueur 1' : 'Joueur 2');

    this.setData({
      showVictory: true,
      winner: winner,
      winnerName: winnerName,
      reason: reason,
      player1Points: player1Points,
      player2Points: player2Points,
      sessionVictories1: sessionVictories1,
      sessionVictories2: sessionVictories2,
      isDraw: isDraw
    });
  },

  onReplay() {
    // Rejouer une partie - naviguer vers la page jeu
    wx.redirectTo({
      url: '/pages/jeu/jeu'
    });
  },

  onHome() {
    // Retourner à l'accueil et réinitialiser les victoires (fin de session)
    const Game = require('../../utils/game.js');
    Game.resetVictories();
    
    wx.reLaunch({
      url: '/pages/home/home'
    });
  },

  onBack() {
    // Retourner à l'accueil
    wx.reLaunch({
      url: '/pages/home/home'
    });
  }
});
