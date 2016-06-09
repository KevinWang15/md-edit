function setupElectron() {
    window.electron = {self: require('electron')};
    window.electron.remote = window.electron.self.remote;
    window.electron.dialog = window.electron.self.remote.dialog;
    window.electron.Menu = window.electron.self.remote.Menu;
    window.electron.MenuItem = window.electron.self.remote.MenuItem;
    window.electron.app = window.electron.remote.app;

    function MenuClicked(eventName) {
        return function () {
            angular.element($('html')).scope().$broadcast('MenuEvent', eventName);
        }
    }

    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New',
                    accelerator: 'CmdOrCtrl+N',
                    click: MenuClicked('new')
                },
                {
                    label: 'Open',
                    accelerator: 'CmdOrCtrl+O',
                    click: MenuClicked('open')
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Save',
                    accelerator: 'CmdOrCtrl+S',
                    click: MenuClicked('save')
                },
                {
                    label: 'Save As',
                    accelerator: 'CmdOrCtrl+Shift+S',
                    click: MenuClicked('save_as')
                },
                {
                    label: 'Close',
                    accelerator: 'CmdOrCtrl+W',
                    click: MenuClicked('close')
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Print',
                    accelerator: 'CmdOrCtrl+P',
                    click: MenuClicked('print')
                },
                {
                    label: 'Export As PDF (online)',
                    click: MenuClicked('pdf')
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Exit',
                    click: MenuClicked('exit')
                }]
        },
        {
            label: 'Edit',
            submenu: [
                {
                    label: 'Undo',
                    accelerator: 'CmdOrCtrl+Z',
                    role: 'undo'
                },
                {
                    label: 'Redo',
                    accelerator: 'Shift+CmdOrCtrl+Z',
                    role: 'redo'
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Cut',
                    accelerator: 'CmdOrCtrl+X',
                    role: 'cut'
                },
                {
                    label: 'Copy',
                    accelerator: 'CmdOrCtrl+C',
                    role: 'copy'
                },
                {
                    label: 'Paste',
                    accelerator: 'CmdOrCtrl+V',
                    role: 'paste'
                },
                {
                    label: 'Select All',
                    accelerator: 'CmdOrCtrl+A',
                    role: 'selectall'
                }
            ]
        },
        {
            label: "View",
            submenu: [
                {
                    label: "Presentation Mode",
                    accelerator: 'F11',
                    click: MenuClicked('presentation_mode')
                }
            ]
        }];

    window.electron.Menu.setApplicationMenu(window.electron.Menu.buildFromTemplate(template));
}