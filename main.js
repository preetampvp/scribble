"use strict"

var main = (function() {
  const electron = require("electron");
  const { app, globalShortcut, BrowserWindow, ipcMain, Tray, Menu } = require("electron");
  const notifier = require("node-notifier");
  const fs = require("fs")

  let tray = null,
  screen = null,
  scribbleWindow = null;

  function initGlobalShortcuts() {
    globalShortcut.register("Command+Control+S", toggleScribbleWindow);
    globalShortcut.register("Command+Control+C", clear);
    globalShortcut.register("Command+Control+H", toggleScribbleWindowHide);
  } 

  function initIpc() {
    ipcMain.on('clear-done', () => { toggleScribbleWindowHide(), toggleScribbleWindowHide() });
    ipcMain.on('toolbox-changed', (e, config) => { saveToolboxChanges(config) })
    ipcMain.on('get-toolbox-config', (e) => {
      let config = JSON.parse(fs.readFileSync(`${__dirname}/scribble.config`, 'utf8'))
      e.sender.send('toolbox-config', config) 
    })
  }

  function saveToolboxChanges(config) {
    fs.writeFile(`${__dirname}/scribble.config`, JSON.stringify(config), (err) => {
      if(err) {
        notify(err.message)
      } else {
        if(process.env.debug) notify("saved")
      }
    })
  }

  function setupTray() {
   tray = new Tray(`${__dirname}/tray.png`);
   tray.setHighlightMode("never");
   let menuItems = [
    { label: "Clear", click() { clear() } },
    { label: "Quit", click() { quit() } }
   ]
   tray.setContextMenu(Menu.buildFromTemplate(menuItems))
  }

  function clear() {
    if(scribbleWindow) scribbleWindow.webContents.send("clear")
  }

  function quit() {
    app.quit()
  }

  function toggleScribbleWindowHide() {
    if(!scribbleWindow) return;
    if(scribbleWindow.isVisible()) {
      scribbleWindow.hide()
    } else {
      scribbleWindow.show() 
    }
  }

  function toggleScribbleWindow() {
    if(scribbleWindow) {
     scribbleWindow.close();
    } else {
      let pointerPosition = screen.getCursorScreenPoint();
      let display = screen.getDisplayNearestPoint(pointerPosition);
      let {width, height} = display.workAreaSize;
      notify(width + " " + height);
      let options = {
        frame: false,
        transparent: true,
        width,
        height
      }
      scribbleWindow = new BrowserWindow(options);
      scribbleWindow.on('close', () => scribbleWindow = null);
      scribbleWindow.loadURL(`file://${__dirname}/app/scribble/main.html`);

      if(process.env.debug) scribbleWindow.webContents.openDevTools();
      scribbleWindow.show();
    } 
  }

  function init() {
    app.on("ready", () => {
      //app.dock.hide()
      initGlobalShortcuts();
      initIpc()
      setupTray();
      app.on("window-all-closed", (e) => e.preventDefault()) ;
      screen = electron.screen;
      toggleScribbleWindow();
    })
  }

  function notify(message) {
    notifier.notify({title: "Scribble", message});
  }

  app.on('will-quit', () => globalShortcut.unregisterAll());

  return {
    init: init
  }

})()

main.init();
