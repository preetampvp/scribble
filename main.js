"use strict"

var main = (function() {
  const electron = require("electron")
  const { app, globalShortcut, BrowserWindow, ipcMain, Tray } = require("electron")
  const notifier = require("node-notifier")

  let tray = null,
  screen = null,
  scribbleWindow = null


  function setupGlobalShortcuts() {
    globalShortcut.register("Command+Control+S", toggleScribbleWindow)
  } 

  function setupTray() {
   tray = new Tray(`${__dirname}/tray.png`)
   tray.setHighlightMode("never")
  }

  function toggleScribbleWindow() {
    if(scribbleWindow) {
     scribbleWindow.close()
    } else {
      let pointerPosition = screen.getCursorScreenPoint()
      let display = screen.getDisplayNearestPoint(pointerPosition)
      let {width, height} = display.workAreaSize
      notify(width + " " + height)
      let options = {
        frame: false,
        transparent: true,
        width,
        height
      }
      scribbleWindow = new BrowserWindow(options)
      scribbleWindow.on('close', () => scribbleWindow = null)
      scribbleWindow.loadURL(`file://${__dirname}/app/scribble/main.html`)

      if(process.env.debug) scribbleWindow.webContents.openDevTools()
      scribbleWindow.show()
    } 
  }

  function init() {
    app.on("ready", () => {
      //app.dock.hide()
      setupGlobalShortcuts()
      setupTray()
      app.on("window-all-closed", (e) => e.preventDefault()) 
      screen = electron.screen
      toggleScribbleWindow()
    })
  }

  function notify(message) {
    notifier.notify({title: "Scribble", message})
  }

  app.on('will-quit', () => globalShortcut.unregisterAll())

  return {
    init: init
  }

})()

main.init()
