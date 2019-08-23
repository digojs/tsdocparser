/** class */
export class Class {

}

export class Field {
    /** field1 */
    field1
    /** field2 */
    field2?: number
    /** field3 */
    field3 = 1
}

export class Accessor {
    /** getter */
    get getter() { return 0 }
    /** setter */
    set setter(value) { }
    /** accessor */
    get accessor() { return 0 }
    /** accessor */
    set accessor(value) { }
}

export class Method {
    /** method */
    method() { }
    /** async */
    async async() { }
    /** async */
    * generator() { }
}

export class Constructor1 {
    constructor() { }
}

export class Constructor2 {
    constructor(p: 1)
    constructor(p: 2)
    constructor(p: number) { }
}

export class Constructor3 {
    /**
     * constructor
     * @param field field
     */
    constructor(readonly field = 0) { }
}

class Base {
    static static_base = 1
    static static_base_child = 1
    method_base() { }
    method_base_child() { }
}

export class Child extends Base implements Class {
    static static_base_child = 2
    static static_child = 2
    method_base_child() { }
    method_child() { }
}
export interface Child {
    method_interface()
}
export namespace Child {
    export function static_interface() { }
}