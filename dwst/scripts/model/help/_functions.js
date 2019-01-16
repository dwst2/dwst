
/**

  Authors: Toni Ruottu, Finland 2010-2018

  This file is part of Dark WebSocket Terminal.

  CC0 1.0 Universal, http://creativecommons.org/publicdomain/zero/1.0/

  To the extent possible under law, Dark WebSocket Terminal developers have waived all
  copyright and related or neighboring rights to Dark WebSocket Terminal.

*/

import m from '../../types/m.js';

export default function functionsPage(functions) {

  const sections = functions.map(funcName => `${funcName}()`);

  return ([
    m.h1('Alphabetical List of Functions'),
    '',
    m.sectionList(sections),
    m.line`Type ${m.syntax('/help <function>')} for usage`,
    '',
  ]);
}
