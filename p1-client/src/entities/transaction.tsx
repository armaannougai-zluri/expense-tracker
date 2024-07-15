export class transaction {
    id!: string
    date!: Date
    original_amount_currency!: string
    original_amount_qty!: number
    converted_amount_qty!: number
    description!: string;
    constructor(id: string, date: Date, original_amount_currency: string, original_amount_qty:number,converted_amount_qty: number, description: string) {
        this.id = id
        this.date = date
        this.original_amount_currency = original_amount_currency
        this.original_amount_qty = original_amount_qty
        this.converted_amount_qty = converted_amount_qty
        this.description = description
    }
}
