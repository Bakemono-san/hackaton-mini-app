// victoire.js - Page de victoire
Page({
  data: {
    showVictory: true, // Toujours afficher la victoire
    winner: null, // Joueur gagnant
    winnerName: '',
    reason: '', // Raison de la victoire
    player1Points: 0, // Points du joueur 1
    player2Points: 0, // Points du joueur 2
  },

  onLoad(options) {
    // Récupérer les paramètres passés depuis la page jeu
    const winner = parseInt(options.winner) || 1;
    const reason = options.reason || '';
    const player1Points = parseInt(options.player1Points) || 0;
    const player2Points = parseInt(options.player2Points) || 0;

    const winnerName = winner === 1 ? 'Joueur 1' : 'Joueur 2';

    this.setData({
      showVictory: true,
      winner: winner,
      winnerName: winnerName,
      reason: reason,
      player1Points: player1Points,
      player2Points: player2Points
    });
  },

  onReplay() {
    // Rejouer une partie - naviguer vers la page jeu
    wx.redirectTo({
      url: '/pages/jeu/jeu'
    });
  },

  onHome() {
    // Retourner à l'accueil
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
