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
var subscription_exports = {};
__export(subscription_exports, {
  InMemorySubscriptions: () => InMemorySubscriptions
});
module.exports = __toCommonJS(subscription_exports);
var import_selection = require("../lib/selection");
var import_stuff = require("./stuff");
class InMemorySubscriptions {
  cache;
  constructor(cache) {
    this.cache = cache;
  }
  subscribers = {};
  referenceCounts = {};
  keyVersions = {};
  add({
    parent,
    spec,
    selection,
    variables,
    parentType
  }) {
    const __typename = this.cache._internal_unstable.storage.get(parent, "__typename").value;
    let targetSelection = (0, import_selection.getFieldsForType)(selection, __typename);
    for (const fieldSelection of Object.values(targetSelection || {})) {
      const { keyRaw, selection: innerSelection, type } = fieldSelection;
      const key = (0, import_stuff.evaluateKey)(keyRaw, variables);
      this.addFieldSubscription({
        id: parent,
        key,
        field: fieldSelection,
        spec,
        parentType: parentType || spec.rootType,
        variables
      });
      if (innerSelection) {
        const { value: linkedRecord } = this.cache._internal_unstable.storage.get(
          parent,
          key
        );
        let children = !Array.isArray(linkedRecord) ? [linkedRecord] : (0, import_stuff.flattenList)(linkedRecord) || [];
        for (const child of children) {
          if (!child) {
            continue;
          }
          this.add({
            parent: child,
            spec,
            selection: innerSelection,
            variables,
            parentType: type
          });
        }
      }
    }
  }
  addFieldSubscription({
    id,
    key,
    field,
    spec,
    parentType,
    variables
  }) {
    if (!this.subscribers[id]) {
      this.subscribers[id] = {};
    }
    if (!this.subscribers[id][key]) {
      this.subscribers[id][key] = [];
    }
    if (!this.keyVersions[key]) {
      this.keyVersions[key] = /* @__PURE__ */ new Set();
    }
    this.keyVersions[key].add(key);
    if (!this.subscribers[id][key].map(({ set }) => set).includes(spec.set)) {
      this.subscribers[id][key].push(spec);
    }
    if (!this.referenceCounts[id]) {
      this.referenceCounts[id] = {};
    }
    if (!this.referenceCounts[id][key]) {
      this.referenceCounts[id][key] = /* @__PURE__ */ new Map();
    }
    const counts = this.referenceCounts[id][key];
    counts.set(spec.set, (counts.get(spec.set) || 0) + 1);
    this.cache._internal_unstable.lifetimes.resetLifetime(id, key);
    const { selection, list, filters } = field;
    if (selection && list) {
      this.cache._internal_unstable.lists.add({
        name: list.name,
        connection: list.connection,
        recordID: id,
        recordType: this.cache._internal_unstable.storage.get(id, "__typename")?.value || parentType,
        listType: list.type,
        key,
        selection,
        filters: Object.entries(filters || {}).reduce((acc, [key2, { kind, value }]) => {
          return {
            ...acc,
            [key2]: kind !== "Variable" ? value : variables[value]
          };
        }, {})
      });
    }
  }
  addMany({
    parent,
    selection,
    variables,
    subscribers,
    parentType
  }) {
    let targetSelection = (0, import_selection.getFieldsForType)(selection, parentType);
    for (const fieldSelection of Object.values(targetSelection)) {
      const { type: linkedType, keyRaw, selection: innerSelection } = fieldSelection;
      const key = (0, import_stuff.evaluateKey)(keyRaw, variables);
      for (const spec of subscribers) {
        this.addFieldSubscription({
          id: parent,
          key,
          field: fieldSelection,
          spec,
          parentType,
          variables
        });
      }
      if (innerSelection) {
        const { value: link } = this.cache._internal_unstable.storage.get(parent, key);
        const children = !Array.isArray(link) ? [link] : (0, import_stuff.flattenList)(link);
        for (const linkedRecord of children) {
          if (!linkedRecord) {
            continue;
          }
          this.addMany({
            parent: linkedRecord,
            selection: innerSelection,
            variables,
            subscribers,
            parentType: linkedType
          });
        }
      }
    }
  }
  get(id, field) {
    return this.subscribers[id]?.[field] || [];
  }
  remove(id, selection, targets, variables, visited = []) {
    visited.push(id);
    const linkedIDs = [];
    for (const fieldSelection of Object.values(selection.fields || {})) {
      const key = (0, import_stuff.evaluateKey)(fieldSelection.keyRaw, variables);
      this.removeSubscribers(id, key, targets);
      if (!fieldSelection.selection?.fields) {
        continue;
      }
      const { value: previousValue } = this.cache._internal_unstable.storage.get(id, key);
      const links = !Array.isArray(previousValue) ? [previousValue] : (0, import_stuff.flattenList)(previousValue);
      for (const link of links) {
        if (link !== null) {
          linkedIDs.push([link, fieldSelection.selection || {}]);
        }
      }
    }
    for (const [linkedRecordID, linkFields] of linkedIDs) {
      this.remove(linkedRecordID, linkFields, targets, visited);
    }
  }
  removeSubscribers(id, fieldName, specs) {
    let targets = [];
    for (const spec of specs) {
      if (!this.referenceCounts[id]?.[fieldName]?.has(spec.set)) {
        continue;
      }
      const counts = this.referenceCounts[id][fieldName];
      const newVal = (counts.get(spec.set) || 0) - 1;
      counts.set(spec.set, newVal);
      if (newVal <= 0) {
        targets.push(spec.set);
        counts.delete(spec.set);
      }
    }
    if (this.subscribers[id]) {
      this.subscribers[id][fieldName] = this.get(id, fieldName).filter(
        ({ set }) => !targets.includes(set)
      );
    }
  }
  removeAllSubscribers(id, targets, visited = []) {
    visited.push(id);
    for (const field of Object.keys(this.subscribers[id] || [])) {
      const subscribers = targets || this.subscribers[id][field];
      this.removeSubscribers(id, field, subscribers);
      const { value, kind } = this.cache._internal_unstable.storage.get(id, field);
      if (kind === "scalar") {
        continue;
      }
      const nextTargets = Array.isArray(value) ? (0, import_stuff.flattenList)(value) : [value];
      for (const id2 of nextTargets) {
        if (visited.includes(id2)) {
          continue;
        }
        this.removeAllSubscribers(id2, subscribers, visited);
      }
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  InMemorySubscriptions
});
