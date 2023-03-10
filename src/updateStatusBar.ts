/*
Copyright (c) Microsoft Corporation

All rights reserved. 

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation 
files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy,
modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software 
is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/
import * as vscode from 'vscode';
import { myStatusBarItem, getSelectedFunctions } from './extension';


// Updates the status bar item with the number of selected functions
export function updateStatusBarItem(): void {
	const n = getSelectedFunctions(vscode.window.activeTextEditor);
	if (n.length == 1) {
		myStatusBarItem.text = `$(play) ${n} selected`;
	} else if (n.length > 1) {
		myStatusBarItem.text = `$(play) ${n.length} tests selected`;
	} else {
  	myStatusBarItem.text = `$(play) No tests selected`;
  	}
  	myStatusBarItem.show();
}