
/**

  Authors: Toni Ruottu, Finland 2010-2018

  This file is part of Dark WebSocket Terminal.

  CC0 1.0 Universal, http://creativecommons.org/publicdomain/zero/1.0/

  To the extent possible under law, Dark WebSocket Terminal developers have waived all
  copyright and related or neighboring rights to Dark WebSocket Terminal.

*/

import DwstFunction from '../types/function.js';

export default class PromptHandler {

  constructor(dwst) {
    this._dwst = dwst;
    this._encoder = new TextEncoder();
  }

  _evalFunction({name, args}) {
    const func = this._dwst.model.variables.getVariable(name);
    if (func === null) {
      throw new this._dwst.lib.errors.UnknownInstruction(name);
    }
    if (func instanceof DwstFunction) {
      return func.run(args);
    }
    throw new this._dwst.lib.errors.InvalidDataType(name, ['FUNCTION']);
  }

  _evalParticle(particle) {
    if (particle.type === 'text') {
      return this._encoder.encode(particle.value);
    }
    if (particle.type === 'byte') {
      const buffer = new Uint8Array([particle.value]);
      return buffer;
    }
    if (particle.type === 'codepoint') {
      const chr = String.fromCodePoint(particle.value);
      return this._encoder.encode(chr);
    }
    if (particle.type === 'variable') {
      const variableName = particle.name;
      const value = this._dwst.model.variables.getVariable(variableName);
      if (value instanceof ArrayBuffer) {
        return new Uint8Array(value);
      }
      if (typeof value  === 'string') {
        return this._encoder.encode(value);
      }
      if (value instanceof this._dwst.lib.types.DwstFunction) {
        throw new this._dwst.lib.errors.InvalidDataType(variableName, ['STRING', 'BINARY']);
      }
      throw new this._dwst.lib.errors.UnknownVariable(variableName);
    }
    if (particle.type === 'function') {
      const output = this._evalFunction(particle);
      if (output.constructor === Uint8Array) {
        return output;
      }
      if (typeof output === 'string') {
        return this._encoder.encode(output);
      }
      throw new Error('unexpected function return type');
    }
    throw new Error('unexpected particle type');
  }

  _evalTemplateExpression(templateExpression) {
    const rootNode = this._dwst.lib.parser.parseTemplateExpression(templateExpression);
    if (rootNode.type !== 'templateExpression') {
      throw new Error('unexpected root node type');
    }
    const chunks = rootNode.particles.map(particle => this._evalParticle(particle));
    const buffer = this._dwst.lib.utils.joinBuffers(chunks).buffer;
    return buffer;
  }

  _runPlugin(pluginName, paramString) {
    const plugin = this._dwst.plugins.getPlugin(pluginName);
    if (plugin === null) {
      throw new this._dwst.lib.errors.UnknownCommand(pluginName);
    }
    if (plugin.functionSupport) {
      const binary = this._evalTemplateExpression(paramString);
      plugin.run(binary);
    } else {
      plugin.run(paramString);
    }
  }

  run(command) {
    const [pluginName, ...params] = command.split(' ');
    const paramString = params.join(' ');
    this._runPlugin(pluginName, paramString);
  }

  silent(line) {
    const noslash = line.substring(1);
    this.run(noslash);
  }

  loud(line) {
    this._dwst.ui.terminal.log(line, 'command');
    this.silent(line);
  }
}
