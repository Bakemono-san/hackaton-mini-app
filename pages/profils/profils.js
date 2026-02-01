const app = getApp()

Page({
  data: {
    players: [],
    showAvatarModal: false,
    selectedAvatar: null,
    selectedAvatarId: null,
    playerIndex: null,
    disabledAvatars: [],

    avatars: [
      { id: 'lion', name: 'Gainde', label: 'Lion - Courage', icon: '/images/icones/lion.svg' },
      { id: 'elephant', name: 'Niaye', label: 'Elephant - Sagesse', icon: '/images/icones/elephant.svg' },
      { id: 'tiger', name: 'Mbar', label: 'Panthère - Agilité', icon: '/images/icones/tiger.svg' },
      { id: 'buffalo', name: 'Demm', label: 'Buffle - Endurance', icon: '/images/icones/buffalo.svg' },
      { id: 'crocodile', name: 'Beneg', label: 'Crocodile - Patience', icon: '/images/icones/crocodile.svg' },
      { id: 'eagle', name: 'Xaral', label: 'Aigle - Vision', icon: '/images/icones/eagle.svg' }
    ]
  },

  onLoad() {
    this.setData({
      players: app.globalData.players
    })
  },

  openAvatarModal(e) {
    const playerIndex = e.currentTarget.dataset.index
    const { players } = this.data

    // avatars already used by OTHER players
    const disabledAvatars = players
      .filter((_, i) => i !== playerIndex)
      .map(p => p.avatar)

    console.log(disabledAvatars)

    this.setData({
      showAvatarModal: true,
      playerIndex,
      selectedAvatar: null,
      selectedAvatarId: null,
      disabledAvatars
    })
  },

  selectAvatar(e) {
    const avatar = e.currentTarget.dataset.avatar
    const { disabledAvatars } = this.data

    if (disabledAvatars.includes(avatar.icon)) {
      wx.showToast({
        title: 'Avatar déjà choisi',
        icon: 'none'
      })
      return
    }

    this.setData({
      selectedAvatar: avatar,
      selectedAvatarId: avatar.id
    })
  }
  ,

  confirmAvatar() {
    const { selectedAvatar, playerIndex, players } = this.data
    if (!selectedAvatar) {
      this.setData({
        showAvatarModal: false
      })
      return
    }

    const newPlayers = [...players]
    newPlayers[playerIndex].avatar = selectedAvatar.icon

    this.setData({
      players: newPlayers,
      showAvatarModal: false
    })

    app.globalData.players = newPlayers
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
    wx.navigateBack({ delta: 1 })
  }
})
