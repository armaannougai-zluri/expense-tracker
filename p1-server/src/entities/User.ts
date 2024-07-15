import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class Users {
  @PrimaryKey()
  id!: string;

  @Property()
  name!: string;

  constructor (id:string , name: string ){
    this.id = id;
    this.name = name;
  }
}
