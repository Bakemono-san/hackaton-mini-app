Page({
  data: {
    item: {
      name: "Règles",
      bg: "bg-green",
      color: "text-white",
      url: "/pages/rules/rules",
      icon: ""
    }
  },

  onLoad() {
    setTimeout(() => {
      wx.navigateTo({
        url: "/pages/home/home"
      })
    }, 1000) // 15 seconds
  }
})
