// home.js
const Game = require('../../utils/game.js');

Page({

  /**
   * Initial data of the page
   */
  data: {

  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad() {

  },

  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady() {

  },

  /**
   * Lifecycle function--Called when page show
   */
  onShow() {
    // Réinitialiser les victoires quand on revient à l'accueil (fin de session)
    Game.resetVictories();
  },

  /**
   * Lifecycle function--Called when page hide
   */
  onHide() {

  },

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload() {

  },

  /**
   * Redirection vers la page de jeu
   */
  goToGame() {
    wx.navigateTo({
      url: '/pages/jeu/jeu'
    });
  }
})