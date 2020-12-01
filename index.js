const path = require('path')
const os = require('os')
const { app, BrowserWindow, Menu, globalShortcut, ipcMain, shell } = require('electron')
const imagemin = require('imagemin')
const imageminMozjpeg = require('imagemin-mozjpeg')
const imageminPngquant = require('imagemin-pngquant')
const slash = require('slash')

process.env.NODE_ENV = 'development'

const isDev = () => process.env.NODE_ENV !== 'production' ? true : false
const isMac = () => process.platform === 'darwin' ? true : false

// Defining the different windows of the app
let mainWindow;
let aboutWindow;

console.log(`${__dirname}/images/favicon.png`)

const createMainWindow = () => {
    mainWindow = new BrowserWindow({
        width: isDev ? 1000 : 500,
        height: 600,
        title: "Chicken What",
        icon: `${__dirname}/images/favicon.png`,
        resizable: isDev(),
        backgroundColor: '#ffffff',
        webPreferences: {
            nodeIntegration: true
        }
    })

    if (isDev) {
        mainWindow.webContents.openDevTools()
    }
    
    mainWindow.loadFile('./index.html')
}

const createAboutWindow = () => {
    aboutWindow = new BrowserWindow({
        width: 300,
        height: 300,
        resizable: false,
        title: "About Chicken Say",
    })
    
    aboutWindow.loadFile('./about.html')
}

// Alternative syntax using promises
// app.whenReady().then(createMainWindow)

app.on('ready', () => {
    createMainWindow()

    // Create the menu
    const mainMenu = Menu.buildFromTemplate(menu)
    Menu.setApplicationMenu(mainMenu)

    // registering shortcuts globally
    // Only needed if you do not have the dev meny down there
    // globalShortcut.register('CmdOrCtrl+R', () => mainWindow.reload())
    // globalShortcut.register(isMac ? 'Cmd+Alt+I' : 'Ctrl+Shift+I', () => mainWindow.toggleDevTools())

    mainWindow.on('closed', () => mainWindow = null)
})

const menu = [
    // very cool syntax; spreading the result of a ternary operator in place inside an array
    // parenthesis grouping syntax is used to make it clear that the ternary needs to be evaluated first!
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Grouping
    // ...(isMac ? [
    //     { role: 'appMenu'}
    // ] : [] ),
    ...(isMac ? [
        { label: app.name,
          submenu: [
              {
                  label: 'About',
                  click: createAboutWindow
              }
          ]
        }
    ] : [] ),
    {
        // It's possible to create menu items 100% by hand a such:
        // label: 'File',
        // submenu: [
        //     {
        //         label: 'Quit',
        //         // accelerator: isMac ? 'Command+W' : 'Ctrl+W',
        //         // alternate shorter syntax:
        //         accelerator: 'CmdOrCtrl+W',
        //         click: () => app.quit()
        //     }
        // ]
        // alternative syntax for the same stuff as above with pre-defined roles
        role: 'fileMenu' 
    },
    // For windows users:
    ...(!isMac ? [
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About',
                    click: createAboutWindow
                }
            ]
        }
    ] : []),
    ...(isDev ? [{
        label: 'Developer',
        submenu: [
            {
                role: 'reload'
            },
            {
                role: 'forcereload'
            },
            {
                type: 'separator'
            },
            {
                role: 'toggledevtools'
            }
        ]
    }] : [])
]

// Workaround for Mac to keep the Electron menu intact + add the custom menu
// But that's hacky; better to have it with the spread syntax directly in the menu array
// if (isMac) {
//     menu.unshift({
//         role: 'appMenu'
//     })
// }


// By convention Mac apps don't fully close when clicking the x button
// This snippet makes it so that the window itself will close but not the app
// app.on('window-all-closed', () => {
//   if (!isMac()) {
//     app.quit()
//   }
// })

const shrinkImage = async ({ imgPath, quality, dest }) => {
    const pngQuality = quality / 100
    try {
        const files = await imagemin([slash(imgPath)], {
            destination: dest,
            plugins: [
                imageminMozjpeg({
                    quality
                }),
                imageminPngquant({
                    quality: [
                        pngQuality, pngQuality
                    ]
                })
            ]
        })
        console.log(files)
        shell.openPath(dest)

        mainWindow.webContents.send('image:done')
    } catch (e) {
        console.log(e.message)
    }
}

ipcMain.on('image:minimize', (e, options) => {
    // console.log(options)
    options.dest = path.join(os.homedir(), 'imageshrink')
    shrinkImage(options)
})



app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})













































