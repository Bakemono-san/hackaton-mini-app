App({
  onLaunch: function () {
    let logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    wx.login({
      success: res => {
      }
    })
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: res => {
              this.globalData.userInfo = res.userInfo;
            }
          })
        }
      }
    })
  },
  globalData: {
    userInfo: null,
    players: [
      {name: "Moussa",avatar: '/images/icones/lion.svg'},
      {name: "Papa", avatar: '/images/icones/elephant.svg'}
    ]
  }
})