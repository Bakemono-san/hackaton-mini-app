Component({
 
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
      wx.navigateTo({url})
    }
  }
})
