var WS = {
  getAPI() : any{
    return window.WebSocket || window.MozWebSocket
  }
}

export default WS;
