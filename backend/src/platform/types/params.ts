import { Request } from "express";

export type ParamsDictionary = Request["params"];

export interface IdPathParam {
  id: string;
}
