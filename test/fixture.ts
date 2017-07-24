/**
 * @file asd
 */
/// <reference path="fixture-ref.ts" />
import { a as b } from "./fixture-ref";

/** varField */
var varField1 = 1, varField2 = 2;

/** exportField */
export var exportField1 = 1, exportField2 = 2;

/** constField */
export const constField1 = 1, constField2 = 1;

/** exportFunction1 */
export async function exportFunction(this: number, p: number);

/** exportFunction2 */
export function exportFunction();

/** exportFunction3
 * @example aaa
 */
export function exportFunction(p = 1) {

}

/** exportClass */
export class exportClass {

    /** exportField */
    classField: number;

    constructor() {

    }

    /** classProperty get */
    get classProperty() { return 1; }

    /** classProperty set */
    set classProperty(value) { }

    /** classPropertyReadonly */
    get classPropertyReadonly() { return 1; }

    /** staticMember */
    static staticMember = 1;

}

/** exportClass - interface */
export interface exportClass {

    /** classInterfaceField */
    classInterfaceField: number;

}

/** exportClass - namespace */
export namespace exportClass {

    /** classNamespaceField */
    export var classNamespaceField = 1;

}

export interface exportInterface {

    /** interfaceField */
    interfaceField: number;

}

export interface exportInterface2 extends exportInterface {

    /** interfaceField */
    interfaceField2: number;

}

/** exportClass2 */
export class exportClass2 extends exportClass implements exportInterface {
    exportsFiled2 = 2;
    interfaceField = 3;
}

/** exportNamespace */
export namespace exportNamespace {

    /** namespaceField */
    export var namespaceField = 1;

}

/** exportType */
export type exportType = number;

/** exportEnum */
export enum exportEnum {
    member1,
    member2,
    member3 = 20,
    member4
}

/**
 * @internal
 * @foo foo
 * @remark remark
 * @desc desc
 */
export var internalVaribale = 2;
