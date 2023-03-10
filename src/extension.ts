/* 
Copyright © 2023 WISI America. 

VS Code Extension to greatly simplify the running of QA python regression tests.
*/
import * as vscode from 'vscode';
import * as path from 'path';
import { updateStatusBarItem } from './updateStatusBar';

export let myStatusBarItem: vscode.StatusBarItem;
let notificationMode: boolean = true; // true = popup, false = status bar

// Displays notifications to user based on notificationMode
function displayNotification(message: string) {
	const viewTime = 7000; // uptime of status bar message in ms
	if (notificationMode) {
		vscode.window.showInformationMessage(message);
	} else {
		vscode.window.setStatusBarMessage(message, viewTime);
	}
}

export function activate({ subscriptions }: vscode.ExtensionContext) {

	// Toggle the way test running notifications are displayed
	let notiDisposable = vscode.commands.registerCommand('inca-qa-test-wizard.toggleNotifications', () => {
		notificationMode = !notificationMode;
		if (notificationMode) {
			vscode.window.showInformationMessage('Notifications set to appear as popups.');
		} else {
			vscode.window.showInformationMessage('Notifications set to appear on status bar.');
		}
	});

	// register a command to run tests via keyword search
	let keyDisposable = vscode.commands.registerCommand('inca-qa-test-wizard.keySearch', () => {
		doKeySearch();
	});	

	// register a command that runs when status bar item is clicked
	const runCommand = 'inca-qa-test-wizard.runTests';
	let runDisposable = vscode.commands.registerCommand(runCommand, () => {
		const tests = getSelectedFunctions(vscode.window.activeTextEditor);
		if (tests.length > 0) {
			runTests(tests);
			displayNotification(`Running test(s): ${tests.join(', ')}`);
		} else {
			vscode.window.showErrorMessage('No tests selected. Please highlight test function(s) or set your cursor on a function definition.');
		}
	});

	// create a new status bar item
	myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 300);
	myStatusBarItem.command = runCommand;
	myStatusBarItem.tooltip = 'Click to run selected tests';

	// register some listeners to ensure all attributes are up to date
	subscriptions.push(myStatusBarItem, runDisposable, notiDisposable, keyDisposable);
	subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBarItem));
	subscriptions.push(vscode.window.onDidChangeTextEditorSelection(updateStatusBarItem));

	// update the status bar item once at start
	updateStatusBarItem();
}

// Sets up a terminal, and runs pytest on selected functions
function runTests(tests: string[]) {
	// create a terminal if none exists
	const terminal = vscode.window.activeTerminal || vscode.window.createTerminal();
	terminal.show();
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
	  	vscode.window.showErrorMessage('No active text editor.');
	  	return;
	}
	
	const fileDir = editor.document.fileName;
	const fileName = path.basename(fileDir);
	const dirName = path.dirname(fileDir);
	const parentDir = path.basename(dirName);
	
	terminal.sendText(`pytest --capture=no --log-cli-level=INFO ${parentDir}/${fileName} -k '${tests.join(' or ')}'`);
}

// Prompts user for keyword to search for tests, then runs tests by keyword
async function doKeySearch() {
	const result = await vscode.window.showInputBox({
		value: '',
		placeHolder: 'Enter keyword to parse tests...',
		validateInput: text => {
			return text === '' ? 'Please enter a valid keyword!' : null;
		}
	});
	if (result !== undefined) {
		displayNotification(`Running tests with "${result}"`);
		runTests([result]);
	}
}

// Returns an array of selected function names
export function getSelectedFunctions(editor: vscode.TextEditor | undefined): Array<string> {
	let functions: Array<string> = [];

	// if there is no selection, select the current line
	if (editor && editor.selection.isEmpty) {
		const position = editor.selection.active;
		const line = editor.document.lineAt(position).range;
		functions = parseFunctionNames(editor.document.getText(line));
	} else if (editor) {
		functions = parseFunctionNames(editor.document.getText(editor.selection));
		}
		return functions;
}

// Parse function names from given string and return them as array
function parseFunctionNames(str: string): string[] {
	const lines = str.split(/\r?\n/g);
	const functionNames = [];
	for (const line of lines) {
		const match = line.match(/^def (test\w+)/);
		if (match) {
		functionNames.push(match[1]);
		}
	}
	return functionNames;
}

// This method is called when your extension is deactivated
export function deactivate() {}