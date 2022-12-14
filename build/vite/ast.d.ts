import * as recast from 'recast';
declare type Statement = recast.types.namedTypes.Statement;
declare type Program = recast.types.namedTypes.Program;
declare type FunctionDeclaration = recast.types.namedTypes.FunctionDeclaration;
declare type ArrowFunctionExpression = recast.types.namedTypes.ArrowFunctionExpression;
declare type FunctionExpression = recast.types.namedTypes.FunctionExpression;
export declare function find_insert_index(script: Program): number;
export declare function find_exported_fn(body: Statement[], name: string): FunctionDeclaration | FunctionExpression | ArrowFunctionExpression | null;
export declare function find_exported_id(program: Program, name: string): recast.types.namedTypes.ExportNamedDeclaration | undefined;
export {};
