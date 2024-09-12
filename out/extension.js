// // The module 'vscode' contains the VS Code extensibility API
// // Import the module and reference it with the alias vscode in your code below
// import * as vscode from 'vscode';
// // This method is called when your extension is activated
// // Your extension is activated the very first time the command is executed
// export function activate(context: vscode.ExtensionContext) {
// 	// Use the console to output diagnostic information (console.log) and errors (console.error)
// 	// This line of code will only be executed once when your extension is activated
// 	console.log('Congratulations, your extension "rdp-client" is now active!');
// 	// The command has been defined in the package.json file
// 	// Now provide the implementation of the command with registerCommand
// 	// The commandId parameter must match the command field in package.json
// 	const disposable = vscode.commands.registerCommand('rdp-client.helloWorld', () => {
// 		// The code you place here will be executed every time your command is executed
// 		// Display a message box to the user
// 		vscode.window.showInformationMessage('Hello World from rdp-client!');
// 	});
// 	context.subscriptions.push(disposable);
// }
// // This method is called when your extension is deactivated
// export function deactivate() {}
import * as vscode from 'vscode';
import * as rdp from 'node-rdp'; // Import node-rdp
export function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.connectRDP', async () => {
        const address = await vscode.window.showInputBox({ prompt: 'Enter RDP Address (e.g., 123.45.67.89:1337)' });
        const username = await vscode.window.showInputBox({ prompt: 'Enter Username (e.g., DOMAIN\\username)' });
        const password = await vscode.window.showInputBox({ prompt: 'Enter Password', password: true });
        if (address && username && password) {
            const panel = vscode.window.createWebviewPanel('rdpClient', // Identifies the type of the webview. Used internally
            `RDP Client - ${address}`, // Title of the panel displayed to the user
            vscode.ViewColumn.One, // Editor column to show the new webview panel in.
            {
                enableScripts: true // Enable scripts in the webview
            });
            panel.webview.html = getWebviewContent(address, username);
            panel.webview.onDidReceiveMessage(async (message) => {
                if (message.command === 'connect') {
                    try {
                        const connection = rdp({
                            address, // RDP server address
                            username, // Username with domain
                            password, // Password
                            safeMode: true // Enable safe mode
                        });
                        connection.then(function (deferred) {
                            panel.webview.postMessage({ type: 'success', text: 'Connected to RDP Server' });
                            // Set a timeout for 1 minute and force reject to kill the connection
                            setTimeout(function () {
                                console.error('Timeout expired, force-killing the connection');
                                deferred.reject(); // Force terminate the connection
                            }, 1000 * 60); // 1 minute timeout
                        });
                    }
                    catch (error) {
                        let errorMessage = 'Unknown error occurred';
                        // Check if error is an instance of Error
                        if (error instanceof Error) {
                            errorMessage = error.message;
                        }
                        panel.webview.postMessage({ type: 'error', text: `Failed to connect: ${errorMessage}` });
                    }
                }
            });
        }
        else {
            vscode.window.showErrorMessage('Missing required information');
        }
    });
    context.subscriptions.push(disposable);
}
function getWebviewContent(address, username) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>RDP Client</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-editor-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 20px;
                }
                .input-group {
                    margin-bottom: 10px;
                }
                .input-group label {
                    display: block;
                    margin-bottom: 5px;
                }
                .input-group input {
                    width: 100%;
                    padding: 8px;
                    box-sizing: border-box;
                }
                button {
                    padding: 10px 20px;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    cursor: pointer;
                }
                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .message {
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="input-group">
                <label for="address">Address</label>
                <input type="text" id="address" value="${address}" disabled />
            </div>
            <div class="input-group">
                <label for="username">Username</label>
                <input type="text" id="username" value="${username}" disabled />
            </div>
            <button onclick="connect()">Connect</button>
            <div class="message" id="message"></div>
            <script>
                const vscode = acquireVsCodeApi();

                function connect() {
                    vscode.postMessage({ command: 'connect' });
                }

                window.addEventListener('message', event => {
                    const message = event.data;
                    const messageDiv = document.getElementById('message');
                    if (message.type === 'success') {
                        messageDiv.textContent = message.text;
                        messageDiv.style.color = 'green';
                    } else if (message.type === 'error') {
                        messageDiv.textContent = message.text;
                        messageDiv.style.color = 'red';
                    }
                });
            </script>
        </body>
        </html>
    `;
}
export function deactivate() { }
//# sourceMappingURL=extension.js.map