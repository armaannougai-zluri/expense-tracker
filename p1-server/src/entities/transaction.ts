import { Entity, PrimaryKey, Property, Formula } from '@mikro-orm/core';

@Entity()
export class transactions {
    @PrimaryKey()
    id!: number
    @Property()
    date!: Date
    @Property()
    original_amount_currency!: string
    @Property()
    original_amount_qty!: number

    @Property()
    converted_amount_qty!: number
    @Property()
    description!: string;

    // @Formula('(to_tsvector(\'english\', content))')
    // tsvector!: string;

    constructor( date: Date, currency: string, qty: number, converted_qty: number, description: string) {
        this.date = date
        this.original_amount_currency = currency
        this.original_amount_qty = qty
        this.converted_amount_qty = converted_qty
        this.description = description
    }
    
}
