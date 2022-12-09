"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var scalars_exports = {};
__export(scalars_exports, {
  isScalar: () => isScalar,
  marshalInputs: () => marshalInputs,
  marshalSelection: () => marshalSelection,
  unmarshalSelection: () => unmarshalSelection
});
module.exports = __toCommonJS(scalars_exports);
var import_config = require("./config");
var import_selection = require("./selection");
async function marshalSelection({
  selection,
  data
}) {
  const config = await (0, import_config.getCurrentConfig)();
  if (data === null || typeof data === "undefined") {
    return data;
  }
  if (Array.isArray(data)) {
    return await Promise.all(data.map((val) => marshalSelection({ selection, data: val })));
  }
  const targetSelection = (0, import_selection.getFieldsForType)(selection, data["__typename"]);
  return Object.fromEntries(
    await Promise.all(
      Object.entries(data).map(async ([fieldName, value]) => {
        const { type, selection: selection2 } = targetSelection[fieldName];
        if (!type) {
          return [fieldName, value];
        }
        if (selection2) {
          return [fieldName, await marshalSelection({ selection: selection2, data: value })];
        }
        if (config.scalars?.[type]) {
          const marshalFn = config.scalars[type].marshal;
          if (!marshalFn) {
            throw new Error(
              `scalar type ${type} is missing a \`marshal\` function. see https://github.com/AlecAivazis/houdini#%EF%B8%8Fcustom-scalars`
            );
          }
          if (Array.isArray(value)) {
            return [fieldName, value.map(marshalFn)];
          }
          return [fieldName, marshalFn(value)];
        }
        return [fieldName, value];
      })
    )
  );
}
async function marshalInputs({
  artifact,
  input,
  rootType = "@root"
}) {
  const config = await (0, import_config.getCurrentConfig)();
  if (input === null || typeof input === "undefined") {
    return input;
  }
  if (!artifact.input) {
    return input;
  }
  const fields = rootType === "@root" ? artifact.input.fields : artifact.input.types[rootType];
  if (Array.isArray(input)) {
    return await Promise.all(
      input.map(async (val) => await marshalInputs({ artifact, input: val, rootType }))
    );
  }
  return Object.fromEntries(
    await Promise.all(
      Object.entries(input).map(async ([fieldName, value]) => {
        const type = fields?.[fieldName];
        if (!type) {
          return [fieldName, value];
        }
        const marshalFn = config.scalars?.[type]?.marshal;
        if (marshalFn) {
          if (Array.isArray(value)) {
            return [fieldName, value.map(marshalFn)];
          }
          return [fieldName, marshalFn(value)];
        }
        if (isScalar(config, type) || !artifact.input.types[type]) {
          return [fieldName, value];
        }
        return [fieldName, await marshalInputs({ artifact, input: value, rootType: type })];
      })
    )
  );
}
function unmarshalSelection(config, selection, data) {
  if (data === null || typeof data === "undefined") {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((val) => unmarshalSelection(config, selection, val));
  }
  const targetSelection = (0, import_selection.getFieldsForType)(selection, data["__typename"]);
  return Object.fromEntries(
    Object.entries(data).map(([fieldName, value]) => {
      const { type, selection: selection2 } = targetSelection[fieldName];
      if (!type) {
        return [fieldName, value];
      }
      if (selection2) {
        return [
          fieldName,
          unmarshalSelection(config, selection2, value)
        ];
      }
      if (value === null) {
        return [fieldName, value];
      }
      if (config.scalars?.[type]?.marshal) {
        const unmarshalFn = config.scalars[type].unmarshal;
        if (!unmarshalFn) {
          throw new Error(
            `scalar type ${type} is missing an \`unmarshal\` function. see https://github.com/AlecAivazis/houdini#%EF%B8%8Fcustom-scalars`
          );
        }
        if (Array.isArray(value)) {
          return [fieldName, value.map(unmarshalFn)];
        }
        return [fieldName, unmarshalFn(value)];
      }
      return [fieldName, value];
    })
  );
}
function isScalar(config, type) {
  return ["String", "Boolean", "Float", "ID", "Int"].concat(Object.keys(config.scalars || {})).includes(type);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  isScalar,
  marshalInputs,
  marshalSelection,
  unmarshalSelection
});
