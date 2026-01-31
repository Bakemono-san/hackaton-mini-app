const app = getApp()

Page({
  data: {
    players: []
  },

  onLoad() {
    // Load global players into page state
    this.setData({
      players: app.globalData.players
    })
  },

  onPlayerInput(e) {
    const index = e.currentTarget.dataset.index
    const value = e.detail.value

    const players = [...this.data.players]
    players[index].name = value

    this.setData({ players })

    app.globalData.players = players
  },

  onBack() {
    wx.navigateBack({
      delta: 1
    });
  }
})
