/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as assert from 'assert';
import { TextDocument, Hover } from 'vscode-languageserver-types';
import { CSSHover } from '../../services/cssHover';
import { SCSSParser } from '../../parser/scssParser';
import { ClientCapabilities } from '../../cssLanguageTypes';

function assertHover(value: string, expected: Hover, languageId = 'css'): void {
	let offset = value.indexOf('|');
	value = value.substr(0, offset) + value.substr(offset + 1);

	const hover = new CSSHover(ClientCapabilities.LATEST);
	const document = TextDocument.create(`test://foo/bar.${languageId}`, languageId, 1, value);
	const hoverResult = hover.doHover(document, document.positionAt(offset), new SCSSParser().parseStylesheet(document));
	assert(hoverResult);

	if (hoverResult!.range && expected.range) {
		assert.equal(hoverResult!.range, expected.range);
	}
	assert.deepEqual(hoverResult!.contents, expected.contents);
}

suite('CSS Hover', () => {
	test('basic', () => {
		assertHover('.test { |color: blue; }', {
			contents: {
				kind: 'markdown',
				value:
					"Color of an element's text\n\nSyntax: <color>\n\n[MDN Reference](https://developer.mozilla.org/docs/Web/CSS/color)"
			}
		});

		/**
		 * Reenable after converting specificity to use MarkupContent
		 */

		// assertHover('.test:h|over { color: blue; }', {
		// 	contents: `Applies while the user designates an element with a pointing device, but does not necessarily activate it. For example, a visual user agent could apply this pseudo-class when the cursor (mouse pointer) hovers over a box generated by the element.`
		// });

		// assertHover('.test::a|fter { color: blue; }', {
		// 	contents: `Represents a styleable child pseudo-element immediately after the originating element’s actual content.`
		// });
	});

	test('specificity', () => {
		assertHover('.|foo {}', {
			contents: [
				{ language: 'html', value: '<element class="foo">' },
				'[Selector Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity): (0, 1, 0)'
			]
		});
	});
});

suite('SCSS Hover', () => {
	test('nested', () => {
		assertHover(
			'div { d|iv {} }',
			{
				contents: [
					{ language: 'html', value: '<div>\n  …\n    <div>' },
					'[Selector Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity): (0, 0, 1)'
				]
			},
			'scss'
		);
	});

	test('@at-root', () => {
		assertHover(
			'.test { @|at-root { }',
			{
				contents: []
			},
			'scss'
		);
	});
});
