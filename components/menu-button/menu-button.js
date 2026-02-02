Component({

  options: {
    addGlobalClass: true
  },
 
  properties: {
    
    title:{
      type: String,
      value: ''
    },
    colorClass: {
      type: String,
      value: ''
    },
    fontSize:{
      type: String,
      value: ''
    },
    background: {
      type: String,
      value: ''
    },
    icon: {
      type: String,
      value: ''
    },
    url: {
      type: String,
      value: ''
    }

  },
  
  methods: {
    navigate(){
      const {url} = this.data
      if (!url || url.trim() === '') {
        // Pas d'URL - laisser le bindtap du parent gérer le clic
        return
      }
      wx.navigateTo({
        url,
        fail: (err) => {
          console.error('Navigation failed:', err, 'URL:', url)
        }
      })
    }
  }
})
