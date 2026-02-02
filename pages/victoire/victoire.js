Page({
  data: {
    showVictory: true,
    winner: null,
    winnerName: '',
    reason: '',
    player1Points: 0,
    player2Points: 0,
    sessionVictories1: 0,
    sessionVictories2: 0,
    isDraw: false,
  },

  onLoad(options) {
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
    wx.redirectTo({
      url: '/pages/jeu/jeu'
    });
  },

  onHome() {
    const Game = require('../../utils/game.js');
    Game.resetVictories();
    
    wx.reLaunch({
      url: '/pages/home/home'
    });
  },

  onBack() {
    wx.reLaunch({
      url: '/pages/home/home'
    });
  }
});
