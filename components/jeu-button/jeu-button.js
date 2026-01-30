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
    color: {
      type: String,
      value: ''
    },
    width:{
      type:String,
      value: ''
    },
    height:{
      type:String,
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
    padding: {
      type: String,
      value: ''
    },
    borderRadius: {
      type: String,
      value: ''
    },
    boxShadow: {
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
