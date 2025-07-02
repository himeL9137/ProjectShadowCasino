declare module 'currency-converter-lt' {
  export default class CC {
    constructor(options?: {
      from?: string;
      to?: string;
      amount?: number;
    });
    
    from(currency: string): this;
    to(currency: string): this;
    amount(value: number): this;
    convert(): Promise<number>;
    list(): string[];
  }
}