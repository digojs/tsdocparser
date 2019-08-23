export namespace native {
    export var t_any: any
    export var t_unknown: unknown
    export var t_string: string
    export var t_number: number
    export var t_boolean: boolean
    export var t_bigInt: bigint
    export var t_symbol: symbol
    export const t_unique_symbol: unique symbol = Symbol("")
    export var t_void: void
    export var t_undefined: undefined
    export var t_null: null
    export var t_never: never
    export var t_object: object
}
export namespace literal {
    export var t_string: "string"
    export var t_number: 0
    export var t_literal_true: true
    export var t_literal_false: false
    export var t_bigint: 2n
}
export namespace object {
    export class Class { }
    export interface Interface { }
    export enum Enum { x }
    export const enum ConstEnum { x }
    export var t_object: {}
    export var t_class: Class
    export var t_interface: Interface
    export var t_enum: Enum
    export var t_enumField: Enum.x
    export var t_const_enum: Enum
    export var t_const_enumField: ConstEnum.x
    export var t_function: () => false
}
export namespace expression {
    export var t_intersectioner: 1 & string
    export var t_union: 1 | 0
    export function t_conditional<T>(): T extends (infer K)[] ? K : null { return null }
    export var t_array: readonly 1[]
    export var t_tuple: [0]
    export var t_typeof: typeof expression
    export function t_keyof<T>(): keyof T { return null }
    export function t_index<T>(): T[keyof T] { return null }
}