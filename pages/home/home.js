const Game = require('../../utils/game.js');

Page({
  data: {

  },

  onLoad() {

  },

  onReady() {

  },

  onShow() {
    Game.resetVictories();
  },

  onHide() {

  },

  onUnload() {

  },

  goToGame() {
    wx.navigateTo({
      url: '/pages/jeu/jeu'
    });
  },

  goToSoloMode() {
    wx.navigateTo({
      url: '/pages/jeu/jeu?mode=solo'
    });
  }
})